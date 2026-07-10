import { prisma, Prisma } from '@mindora/database';
import {
  therapistListQuerySchema,
  updateFcmTokenSchema,
  updateNotificationPreferencesSchema,
  updateProfileSchema,
} from '@mindora/validation';
import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.js';
import {
  verifyJwt,
  type AuthenticatedRequest,
} from '../middleware/authenticate.js';
import { authenticatedRouteLimiter } from '../middleware/rate-limit.js';

export const userRouter = Router();

const SERVICE_NAME = 'user-service';
const GATEWAY_HEALTH_PATH = '/api/v1/users/health';

// Opt-out model — matches the column default in schema.prisma. Used when a
// profile's notificationPreferences is somehow null/absent.
const DEFAULT_NOTIFICATION_PREFERENCES = { push: true, email: true, sms: true };

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

// INTERNAL SERVICE ENDPOINT — not exposed through the public Kong user-api route.
// Requires SERVICE role JWT in Authorization header.
// SECURITY TODO: non-expiring token in use — replace with rotating credentials
// via AWS Secrets Manager before production deployment.
// See: BACKEND_COMPLETE.md → "Known Security Limitations"
userRouter.get('/internal/users/:id', verifyJwt, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  if (authReq.user?.role !== 'SERVICE') {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const id = req.params.id as string;

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    let userName: string | null = null;
    if (user.role === 'PATIENT') {
      const profile = await prisma.patientProfile.findUnique({
        where: { userId: id },
      });
      userName = profile?.userName ?? null;
    } else if (user.role === 'THERAPIST') {
      const profile = await prisma.therapistProfile.findUnique({
        where: { userId: id },
      });
      userName = profile?.userName ?? null;
    }

    res.status(200).json({ id: user.id, userName });
  } catch {
    // Malformed id (not a UUID) or lookup failure — treat as not found
    res.status(404).json({ message: 'User not found' });
  }
});

// Called by Notification Service directly on USER_SERVICE_URL, bypassing
// Kong — so it needs the full '/api/v1/users/...' path since there's no
// Kong route in front of it to strip the prefix. Also mounted at the
// stripped path so the user themselves can reach it through Kong's public
// user-api route (which does strip '/api/v1/users'). Requires either a
// SERVICE-role JWT or the caller's own userId to match the requested :userId.
userRouter.get(
  ['/api/v1/users/:userId/preferences', '/:userId/preferences'],
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = req.params.userId as string;

    if (
      authReq.user?.role !== 'SERVICE' &&
      authReq.user?.userId !== userId
    ) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      let fcmToken: string | null = null;
      let userName: string | null = null;
      let notificationPreferences: unknown = DEFAULT_NOTIFICATION_PREFERENCES;
      if (user.role === 'PATIENT') {
        const profile = await prisma.patientProfile.findUnique({
          where: { userId },
        });
        fcmToken = profile?.fcmToken ?? null;
        userName = profile?.userName ?? null;
        notificationPreferences =
          profile?.notificationPreferences ?? DEFAULT_NOTIFICATION_PREFERENCES;
      } else if (user.role === 'THERAPIST') {
        const profile = await prisma.therapistProfile.findUnique({
          where: { userId },
        });
        fcmToken = profile?.fcmToken ?? null;
        userName = profile?.userName ?? null;
        notificationPreferences =
          profile?.notificationPreferences ?? DEFAULT_NOTIFICATION_PREFERENCES;
      }

      res.status(200).json({
        fcmToken,
        email: user.email,
        phoneNumber: null,
        userName,
        notificationPreferences,
      });
    } catch {
      // Malformed id (not a UUID) or lookup failure — treat as not found,
      // matching /internal/users/:id's convention.
      res.status(404).json({ message: 'User not found' });
    }
  })
);

userRouter.put(
  '/me/fcm-token',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const parsed = updateFcmTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { userId, role } = authReq.user;
    const { fcmToken } = parsed.data;

    if (role === 'PATIENT') {
      await prisma.patientProfile.update({
        where: { userId },
        data: { fcmToken },
      });
    } else if (role === 'THERAPIST') {
      await prisma.therapistProfile.update({
        where: { userId },
        data: { fcmToken },
      });
    } else {
      res
        .status(400)
        .json({ message: 'FCM token registration not supported for this role' });
      return;
    }

    res.status(200).json({ message: 'FCM token updated' });
  })
);

userRouter.put(
  '/me/notification-preferences',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const parsed = updateNotificationPreferencesSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { userId, role } = authReq.user;

    // Partial update — merge onto the current stored value (or defaults if
    // null/absent) so e.g. {push: false} doesn't wipe out email/sms settings.
    if (role === 'PATIENT') {
      const existing = await prisma.patientProfile.findUnique({
        where: { userId },
      });
      const current = {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...(existing?.notificationPreferences as Record<string, boolean>),
      };
      const notificationPreferences = { ...current, ...parsed.data };
      const profile = await prisma.patientProfile.update({
        where: { userId },
        data: { notificationPreferences },
      });
      res
        .status(200)
        .json({ notificationPreferences: profile.notificationPreferences });
      return;
    }

    if (role === 'THERAPIST') {
      const existing = await prisma.therapistProfile.findUnique({
        where: { userId },
      });
      const current = {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...(existing?.notificationPreferences as Record<string, boolean>),
      };
      const notificationPreferences = { ...current, ...parsed.data };
      const profile = await prisma.therapistProfile.update({
        where: { userId },
        data: { notificationPreferences },
      });
      res
        .status(200)
        .json({ notificationPreferences: profile.notificationPreferences });
      return;
    }

    res.status(400).json({
      message: 'Notification preferences not supported for this role',
    });
  })
);

userRouter.get(
  '/me',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { userId, role } = authReq.user;

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
  })
);

userRouter.put(
  '/me',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
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
    const { userId, role } = authReq.user;

    if (role === 'PATIENT') {
      const profile = await prisma.patientProfile.update({
        where: { userId },
        data: {
          userName: data.userName,
          bio: data.bio,
          timezone: data.timezone,
          languagePreference: data.languagePreference,
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
        },
      });
      res.status(200).json({ role, profile });
      return;
    }

    res
      .status(400)
      .json({ message: 'Profile updates not supported for this role' });
  })
);

userRouter.get(
  '/therapists',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
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
  })
);
