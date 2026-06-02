import { prisma } from '@mindora/database';
import { loginSchema, registerSchema } from '@mindora/validation';
import { Router, type Response } from 'express';
import { config } from '../config.js';
import {
  authenticate,
  type AuthenticatedRequest,
} from '../middleware/authenticate.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import {
  createRefreshToken,
  getRefreshTokenExpiry,
  hashToken,
  signAccessToken,
} from '../lib/tokens.js';

export const authRouter = Router();

const SERVICE_NAME = 'auth-service';
const GATEWAY_HEALTH_PATH = '/api/v1/auth/health';

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

  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = createRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  res.cookie(config.cookieName, refreshToken, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    maxAge: config.refreshTokenDays * 24 * 60 * 60 * 1000,
    path: '/',
  });

  res.status(200).json({ accessToken });
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
