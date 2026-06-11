import { prisma, Prisma } from '@mindora/database';
import {
  therapistListQuerySchema,
  updateProfileSchema,
} from '@mindora/validation';
import { Router } from 'express';
import {
  verifyJwt,
  type AuthenticatedRequest,
} from '../middleware/authenticate.js';

export const userRouter = Router();

const SERVICE_NAME = 'user-service';
const GATEWAY_HEALTH_PATH = '/api/v1/users/health';

const healthResponse = () => ({
  status: 'ok',
  service: SERVICE_NAME,
});

userRouter.get('/health', (_req, res) => {
  res.status(200).json(healthResponse());
});

userRouter.get(GATEWAY_HEALTH_PATH, (_req, res) => {
  res.status(200).json(healthResponse());
});

userRouter.get('/me', verifyJwt, async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { userId, role } = req.user;

  if (role === 'PATIENT') {
    const profile = await prisma.patientProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }
    res.status(200).json({ role, profile });
    return;
  }

  if (role === 'THERAPIST') {
    const profile = await prisma.therapistProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }
    res.status(200).json({ role, profile });
    return;
  }

  res.status(200).json({
    role,
    message: 'No extended profile for this role',
    userId,
  });
});

userRouter.put('/me', verifyJwt, async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: 'Validation failed',
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const data = parsed.data;
  const { userId, role } = req.user;

  if (role === 'PATIENT') {
    const profile = await prisma.patientProfile.update({
      where: { userId },
      data: {
        userName: data.userName,
        bio: data.bio,
        timezone: data.timezone,
        languagePreference: data.languagePreference,
        notificationPreferences: data.notificationPreferences as
          | Prisma.InputJsonValue
          | undefined,
      },
    });
    res.status(200).json({ role, profile });
    return;
  }

  if (role === 'THERAPIST') {
    const profile = await prisma.therapistProfile.update({
      where: { userId },
      data: {
        userName: data.userName,
        bio: data.bio,
        timezone: data.timezone,
        languagePreference: data.languagePreference,
        notificationPreferences: data.notificationPreferences as
          | Prisma.InputJsonValue
          | undefined,
      },
    });
    res.status(200).json({ role, profile });
    return;
  }

  res
    .status(400)
    .json({ message: 'Profile updates not supported for this role' });
});

userRouter.get('/therapists', verifyJwt, async (req, res) => {
  const parsed = therapistListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      message: 'Validation failed',
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { page, limit, specialisation, language } = parsed.data;
  const skip = (page - 1) * limit;

  const where: Prisma.TherapistProfileWhereInput = {
    isAcceptingPatients: true,
    ...(specialisation
      ? { specialisation: { contains: specialisation, mode: 'insensitive' } }
      : {}),
    ...(language ? { languages: { has: language } } : {}),
  };

  const [therapists, total] = await Promise.all([
    prisma.therapistProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.therapistProfile.count({ where }),
  ]);

  res.status(200).json({
    therapists,
    total,
    page,
    limit,
  });
});
