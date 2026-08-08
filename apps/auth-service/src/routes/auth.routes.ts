import { prisma } from '../lib/prisma.js';
import {
  blacklistToken,
  setUserSuspended,
  verifyAccessToken,
} from '@mindora/auth-middleware';
import { publish } from '@mindora/queue';
import {
  forgotPasswordSchema,
  listUsersQuerySchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '@mindora/validation';
import { Router, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import passport from 'passport';
import { config, isGoogleOAuthConfigured } from '../config.js';
import {
  authenticate,
  type AuthenticatedRequest,
} from '../middleware/authenticate.js';
import {
  authenticatedRouteLimiter,
  publicAuthRouteLimiter,
} from '../middleware/rate-limit.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { configureGoogleOAuth } from '../lib/google-oauth.js';
import { getRequestCookie } from '../lib/cookies.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import {
  deletePasswordResetToken,
  getPasswordResetUserId,
  storePasswordResetToken,
} from '../lib/redis.js';
import { clearRefreshCookie, issueAuthSession } from '../lib/session.js';
import {
  createRefreshToken,
  getRefreshTokenExpiry,
  hashToken,
  signAccessToken,
} from '../lib/tokens.js';

export const authRouter = Router();

const SERVICE_NAME = 'auth-service';
const GATEWAY_HEALTH_PATH = '/api/v1/auth/health';

configureGoogleOAuth();

const healthResponse = () => ({
  status: 'ok',
  service: SERVICE_NAME,
});

authRouter.get('/health', (_req, res) => {
  res.status(200).json(healthResponse());
});

authRouter.get(GATEWAY_HEALTH_PATH, (_req, res) => {
  res.status(200).json(healthResponse());
});

authRouter.post(
  '/register',
  publicAuthRouteLimiter,
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password, role, userName } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ message: 'Email already exists' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, role },
      select: { id: true },
    });

    try {
      await publish('mindora.auth', {
        event: 'user.registered',
        userId: user.id,
        email,
        role,
        userName,
        registeredAt: new Date().toISOString(),
      });
      console.log(`Published user.registered event for userId=${user.id}`);
    } catch (queueError) {
      // Don't fail the request if RabbitMQ is down — the user record is
      // already saved. Profile creation is eventually consistent, not
      // synchronous with registration; the backfill script covers the gap.
      console.error('Failed to publish user.registered event:', queueError);
    }

    res.status(201).json({ userId: user.id });
  })
);

authRouter.post(
  '/login',
  publicAuthRouteLimiter,
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await verifyPassword(user.passwordHash, password))) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    if (user.isActive === false) {
      res.status(403).json({ message: 'Account suspended' });
      return;
    }

    const { accessToken } = await issueAuthSession(res, user);
    res.status(200).json({ accessToken });
  })
);

authRouter.post(
  '/logout',
  authenticatedRouteLimiter,
  authenticate,
  asyncHandler(async (req, res) => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : '';

    try {
      const payload = verifyAccessToken(
        token,
        config.jwtSecret,
        config.jwtIssuer
      );
      if (payload.jti) {
        const decoded = jwt.decode(token) as jwt.JwtPayload | null;
        const exp = decoded?.exp ?? 0;
        const ttlSeconds = Math.max(0, exp - Math.floor(Date.now() / 1000));
        await blacklistToken(config.redisUrl, payload.jti, ttlSeconds);
      }
    } catch {
      // Token already invalid — still clear refresh cookie and return 200
    }

    const refreshToken = getRequestCookie(req, config.cookieName);
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: {
          tokenHash: hashToken(refreshToken),
          revoked: false,
        },
        data: { revoked: true },
      });
    }

    clearRefreshCookie(res);
    res.status(200).json({ message: 'Logged out' });
  })
);

authRouter.post(
  '/refresh',
  publicAuthRouteLimiter,
  asyncHandler(async (req, res) => {
    const refreshToken = getRequestCookie(req, config.cookieName);
    if (!refreshToken) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const tokenHash = hashToken(refreshToken);
    const stored = await prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revoked: false,
        replacedByTokenId: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!stored) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (stored.user.isActive === false) {
      res.status(403).json({ message: 'Account suspended' });
      return;
    }

    const newRefreshToken = createRefreshToken();
    const newRecord = await prisma.refreshToken.create({
      data: {
        userId: stored.userId,
        tokenHash: hashToken(newRefreshToken),
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: {
        revoked: true,
        replacedByTokenId: newRecord.id,
      },
    });

    const accessToken = signAccessToken({
      userId: stored.user.id,
      email: stored.user.email,
      role: stored.user.role,
    });

    res.cookie(config.cookieName, newRefreshToken, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      maxAge: config.refreshTokenDays * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.status(200).json({ accessToken });
  })
);

authRouter.post(
  '/forgot-password',
  publicAuthRouteLimiter,
  asyncHandler(async (req, res) => {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { email } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const resetToken = randomBytes(32).toString('base64url');
      const tokenHash = hashToken(resetToken);
      await storePasswordResetToken(tokenHash, user.id);
      const resetUrl = `${config.appBaseUrl}/reset-password?token=${resetToken}`;
      console.log(`[password-reset] Reset URL for ${email}: ${resetUrl}`);
    }

    res.status(200).json({
      message: 'If that email exists, a reset link has been sent.',
    });
  })
);

authRouter.post(
  '/reset-password',
  publicAuthRouteLimiter,
  asyncHandler(async (req, res) => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { token, newPassword } = parsed.data;
    const tokenHash = hashToken(token);
    const userId = await getPasswordResetUserId(tokenHash);

    if (!userId) {
      res.status(400).json({ message: 'Invalid or expired reset token' });
      return;
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await deletePasswordResetToken(tokenHash);
    await prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });

    res.status(200).json({ message: 'Password updated successfully' });
  })
);

authRouter.get(
  '/me',
  authenticatedRouteLimiter,
  authenticate,
  (req, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    res.status(200).json({
      userId: authReq.user.userId,
      email: authReq.user.email,
      role: authReq.user.role,
    });
  }
);

// INTERNAL SERVICE ENDPOINT — not exposed through a public Kong auth-api
// route. Requires SERVICE role JWT in Authorization header. Same pattern as
// User Service's GET /internal/users/:id: returns 404 rather than 500 for a
// malformed (non-UUID) id, since that's an unauthenticated-shaped input
// error, not a server fault.
// SECURITY TODO: non-expiring service token in use — replace with rotating
// credentials via AWS Secrets Manager before production deployment.
// See: BACKEND_COMPLETE.md → "Known Security Limitations"
authRouter.get(
  '/internal/auth/users/:id',
  authenticatedRouteLimiter,
  authenticate,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (authReq.user?.role !== 'SERVICE') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const id = req.params.id as string;

    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true, role: true },
      });
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      res.status(200).json(user);
    } catch {
      // Malformed id (not a UUID) or lookup failure — treat as not found
      res.status(404).json({ message: 'User not found' });
    }
  })
);

// INTERNAL SERVICE ENDPOINT — same SERVICE-role convention as
// GET /internal/auth/users/:id above. Backs Admin Service's user list via
// User Service's GET /internal/users proxy.
authRouter.get(
  '/internal/auth/users',
  authenticatedRouteLimiter,
  authenticate,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (authReq.user?.role !== 'SERVICE') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const parsed = listUsersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { role, isActive, page, limit } = parsed.data;
    const where = {
      ...(role ? { role } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    };
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.status(200).json({ users, total, page, limit });
  })
);

// INTERNAL SERVICE ENDPOINT — same SERVICE-role convention as above.
// Currently only used to flip isActive when Admin Service suspends a user.
authRouter.patch(
  '/internal/auth/users/:id',
  authenticatedRouteLimiter,
  authenticate,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (authReq.user?.role !== 'SERVICE') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const id = req.params.id as string;
    const { isActive } = req.body as { isActive?: unknown };
    if (typeof isActive !== 'boolean') {
      res.status(400).json({ message: 'isActive must be a boolean' });
      return;
    }

    try {
      const user = await prisma.user.update({
        where: { id },
        data: { isActive },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      // Redis is the fast-path every authenticated request checks (see
      // createVerifyJwt) — without this, a still-valid access token would
      // keep working until it naturally expires, even though isActive
      // (the source of truth, just written above) already says otherwise.
      await setUserSuspended(config.redisUrl, id, !isActive);

      // Revoking refresh tokens closes the other loophole: without this, a
      // suspended user whose access token has expired could still silently
      // mint a new one via POST /refresh.
      if (!isActive) {
        await prisma.refreshToken.updateMany({
          where: { userId: id, revoked: false },
          data: { revoked: true },
        });
      }

      res.status(200).json(user);
    } catch {
      // Prisma throws on update-not-found (P2025) as well as malformed ids
      res.status(404).json({ message: 'User not found' });
    }
  })
);

// INTERNAL SERVICE ENDPOINT — same SERVICE-role convention as above.
// Backs Admin Service's platform-wide analytics aggregation.
authRouter.get(
  '/internal/auth/analytics',
  authenticatedRouteLimiter,
  authenticate,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (authReq.user?.role !== 'SERVICE') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalUsers, activeUsersLast30Days] = await Promise.all([
      prisma.user.count(),
      // "Active" = registered in the last 30 days, OR refreshed a session in
      // the last 30 days (i.e. actually used the app, not just created once).
      prisma.user.count({
        where: {
          OR: [
            { createdAt: { gte: thirtyDaysAgo } },
            { refreshTokens: { some: { createdAt: { gte: thirtyDaysAgo } } } },
          ],
        },
      }),
    ]);

    res.status(200).json({ totalUsers, activeUsersLast30Days });
  })
);

authRouter.get('/oauth/google', publicAuthRouteLimiter, (req, res, next) => {
  if (!isGoogleOAuthConfigured()) {
    res.status(503).json({
      message:
        'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
    });
    return;
  }
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })(req, res, next);
});

authRouter.get(
  '/oauth/google/callback',
  publicAuthRouteLimiter,
  (req, res, next) => {
    // This endpoint is only ever hit by a real browser navigation (Google's
    // own redirect back to us), never fetch/XHR — every exit path below must
    // be a redirect, not a JSON response, or the user's browser is left
    // stranded on this API origin instead of landing back on the frontend.
    // The frontend's /oauth/success route does no token parsing; it just
    // waits on its own mount-time POST /refresh to pick up the refreshToken
    // cookie issueAuthSession sets below (same mechanism as normal login),
    // then routes by role, or back to /login if no session was established
    // — so redirecting there unconditionally on both success and failure is
    // correct, not just a shortcut.
    if (!isGoogleOAuthConfigured()) {
      res.redirect(config.oauthSuccessRedirectUrl);
      return;
    }

    passport.authenticate('google', { session: false }, (err, user) => {
      // Not routed through asyncHandler — this is passport's own callback
      // shape (err, user), not an Express (req, res) handler — so a rejected
      // promise here needs its own explicit catch to reach next(), same
      // reasoning as asyncHandler elsewhere in this file.
      (async () => {
        if (err || !user) {
          res.redirect(config.oauthSuccessRedirectUrl);
          return;
        }

        await issueAuthSession(res, user);
        res.redirect(config.oauthSuccessRedirectUrl);
      })().catch(next);
    })(req, res, next);
  }
);
