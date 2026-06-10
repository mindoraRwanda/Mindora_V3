import { prisma } from '@mindora/database';
import {
  blacklistToken,
  verifyAccessToken,
} from '@mindora/auth-middleware';
import {
  forgotPasswordSchema,
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
import { configureGoogleOAuth } from '../lib/google-oauth.js';
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

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: 'Validation failed',
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { email, password, role } = parsed.data;
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

  res.status(201).json({ userId: user.id });
});

authRouter.post('/login', async (req, res) => {
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

  const { accessToken } = await issueAuthSession(res, user);
  res.status(200).json({ accessToken });
});

authRouter.post('/logout', authenticate, async (req: AuthenticatedRequest, res) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : '';

  try {
    const payload = verifyAccessToken(token, config.jwtSecret, config.jwtIssuer);
    if (payload.jti) {
      const decoded = jwt.decode(token) as jwt.JwtPayload | null;
      const exp = decoded?.exp ?? 0;
      const ttlSeconds = Math.max(0, exp - Math.floor(Date.now() / 1000));
      await blacklistToken(config.redisUrl, payload.jti, ttlSeconds);
    }
  } catch {
    // Token already invalid — still clear refresh cookie and return 200
  }

  const refreshToken = req.cookies?.[config.cookieName] as string | undefined;
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
});

authRouter.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.[config.cookieName] as string | undefined;
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
});

authRouter.post('/forgot-password', async (req, res) => {
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
});

authRouter.post('/reset-password', async (req, res) => {
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
});

authRouter.get(
  '/me',
  authenticate,
  (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    res.status(200).json({
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
    });
  }
);

authRouter.get('/oauth/google', (req, res, next) => {
  if (!isGoogleOAuthConfigured()) {
    res.status(503).json({
      message: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
    });
    return;
  }
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(
    req,
    res,
    next
  );
});

authRouter.get('/oauth/google/callback', (req, res, next) => {
  if (!isGoogleOAuthConfigured()) {
    res.status(503).json({ message: 'Google OAuth is not configured.' });
    return;
  }

  passport.authenticate('google', { session: false }, async (err, user) => {
    if (err || !user) {
      res.status(401).json({ message: 'OAuth authentication failed' });
      return;
    }

    const { accessToken } = await issueAuthSession(res, user);
    res.status(200).json({
      accessToken,
      userId: user.id,
      email: user.email,
      role: user.role,
    });
  })(req, res, next);
});
