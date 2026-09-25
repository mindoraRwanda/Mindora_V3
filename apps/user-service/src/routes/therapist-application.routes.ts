import { Router } from 'express';
import multer from 'multer';
import {
  createTherapistApplicationApprovedEvent,
  createTherapistApplicationMoreInfoRequestedEvent,
  createTherapistApplicationRejectedEvent,
  createTherapistApplicationReactivatedEvent,
  createTherapistApplicationSubmittedEvent,
  createTherapistApplicationSuspendedEvent,
} from '@mindora/events';
import {
  addApplicationNoteSchema,
  internalUpdateApplicationStatusSchema,
  listTherapistApplicationsQuerySchema,
  submitTherapistApplicationSchema,
  therapistSuspensionSchema,
  updateTherapistApplicationSchema,
  uploadDocumentTypeSchema,
} from '@mindora/validation';
import { prisma } from '../lib/prisma.js';
import {
  buildDocumentStorageKey,
  getDocumentDownloadUrl,
  uploadDocument,
} from '../lib/object-storage.js';
import { publishTherapistApplicationEvent } from '../lib/publish-therapist-application-event.js';
import { upsertTherapistProfileFromApplication } from '../lib/profile-provisioning.js';
import { asyncHandler } from '../middleware/async-handler.js';
import {
  verifyJwt,
  type AuthenticatedRequest,
} from '../middleware/authenticate.js';
import { authenticatedRouteLimiter } from '../middleware/rate-limit.js';
import {
  Prisma,
  type TherapistApplicationStatus,
} from '../generated/prisma/index.js';

export const therapistApplicationRouter = Router();

// Non-terminal = still somewhere in the review pipeline. A user with one of
// these can't start a second application; REJECTED/APPROVED are terminal
// (rejected can reapply via a new DRAFT, approved has no reason to).
const NON_TERMINAL_STATUSES: TherapistApplicationStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'MORE_INFORMATION_REQUIRED',
];

const EDITABLE_STATUSES: TherapistApplicationStatus[] = [
  'DRAFT',
  'MORE_INFORMATION_REQUIRED',
];

// Which status transitions an admin decision may make, keyed by the
// application's current status. DRAFT->SUBMITTED is the applicant's own
// /submit action (below), not an admin decision, so it has no entry here.
const ALLOWED_REVIEW_TRANSITIONS: Record<
  TherapistApplicationStatus,
  TherapistApplicationStatus[]
> = {
  DRAFT: [],
  SUBMITTED: ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'MORE_INFORMATION_REQUIRED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED', 'MORE_INFORMATION_REQUIRED'],
  APPROVED: [],
  REJECTED: [],
  MORE_INFORMATION_REQUIRED: [],
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error('Unsupported file type'));
      return;
    }
    cb(null, true);
  },
});

function requireService(authReq: AuthenticatedRequest): boolean {
  return authReq.user?.role === 'SERVICE';
}

// ---------------------------------------------------------------------------
// Applicant-facing routes — authenticated user acting on their own
// application(s). Reached through Kong's user-api route
// (/api/v1/users -> strip_path: true), same as /me, /therapists etc.
// ---------------------------------------------------------------------------

therapistApplicationRouter.post(
  '/therapist-applications',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const { userId } = authReq.user;

    const existing = await prisma.therapistApplication.findFirst({
      where: { userId, status: { in: NON_TERMINAL_STATUSES } },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      // DRAFT/MORE_INFORMATION_REQUIRED — resume it rather than creating a
      // duplicate. SUBMITTED/UNDER_REVIEW — nothing to create, it's already
      // pending review.
      if (EDITABLE_STATUSES.includes(existing.status)) {
        res.status(200).json({ application: existing });
        return;
      }
      res.status(409).json({
        message: 'An application is already pending review',
        application: existing,
      });
      return;
    }

    const application = await prisma.therapistApplication.create({
      data: {
        userId,
        status: 'DRAFT',
        fullName: '',
        phoneNumber: '',
        contactEmail: '',
        professionalBio: '',
        licenseNumber: '',
        licenseIssuingBody: '',
        location: '',
        yearsOfExperience: 0,
      },
    });

    res.status(201).json({ application });
  })
);

therapistApplicationRouter.get(
  '/therapist-applications/me',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const applications = await prisma.therapistApplication.findMany({
      where: { userId: authReq.user.userId },
      orderBy: { createdAt: 'desc' },
      include: { documents: true },
    });

    res.status(200).json({ applications });
  })
);

therapistApplicationRouter.put(
  '/therapist-applications/:id',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const parsed = updateTherapistApplicationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const id = req.params.id as string;
    const application = await prisma.therapistApplication.findUnique({
      where: { id },
    });
    if (!application || application.userId !== authReq.user.userId) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }
    if (!EDITABLE_STATUSES.includes(application.status)) {
      res.status(409).json({
        message: `Application cannot be edited while status is ${application.status}`,
      });
      return;
    }

    const updated = await prisma.therapistApplication.update({
      where: { id },
      data: parsed.data,
    });

    res.status(200).json({ application: updated });
  })
);

therapistApplicationRouter.post(
  '/therapist-applications/:id/submit',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const id = req.params.id as string;
    const application = await prisma.therapistApplication.findUnique({
      where: { id },
    });
    if (!application || application.userId !== authReq.user.userId) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }
    if (!EDITABLE_STATUSES.includes(application.status)) {
      res.status(409).json({
        message: `Application cannot be submitted while status is ${application.status}`,
      });
      return;
    }

    // Full-record validation — every field the review workflow depends on
    // must be present, even though saving a draft along the way is
    // all-optional (updateTherapistApplicationSchema above).
    const parsed = submitTherapistApplicationSchema.safeParse(application);
    if (!parsed.success) {
      res.status(400).json({
        message: 'Application is incomplete',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const updated = await prisma.therapistApplication.update({
      where: { id },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
    });

    try {
      await publishTherapistApplicationEvent(
        createTherapistApplicationSubmittedEvent({
          applicationId: updated.id,
          userId: updated.userId,
        })
      );
    } catch (err) {
      console.error(
        '[therapist_application.submitted] Failed to publish event:',
        err
      );
    }

    res.status(200).json({ application: updated });
  })
);

therapistApplicationRouter.post(
  '/therapist-applications/:id/documents',
  authenticatedRouteLimiter,
  verifyJwt,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const id = req.params.id as string;
    const application = await prisma.therapistApplication.findUnique({
      where: { id },
    });
    if (!application || application.userId !== authReq.user.userId) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }
    if (application.status === 'APPROVED' || application.status === 'REJECTED') {
      res.status(409).json({
        message: `Documents cannot be added while status is ${application.status}`,
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: 'file is required' });
      return;
    }

    const documentTypeParsed = uploadDocumentTypeSchema.safeParse(
      req.body.documentType
    );
    if (!documentTypeParsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: documentTypeParsed.error.flatten().fieldErrors,
      });
      return;
    }

    const storageKey = buildDocumentStorageKey(id, req.file.originalname);
    await uploadDocument(storageKey, req.file.buffer, req.file.mimetype);

    const document = await prisma.therapistDocument.create({
      data: {
        applicationId: id,
        documentType: documentTypeParsed.data,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        storageKey,
      },
    });

    res.status(201).json({ document });
  })
);

therapistApplicationRouter.get(
  '/therapist-applications/:id/documents/:docId',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { id, docId } = req.params as { id: string; docId: string };
    const document = await prisma.therapistDocument.findUnique({
      where: { id: docId },
      include: { application: true },
    });

    if (!document || document.applicationId !== id) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }
    if (
      !requireService(authReq) &&
      document.application.userId !== authReq.user.userId
    ) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const url = await getDocumentDownloadUrl(document.storageKey);
    res.status(200).json({
      url,
      fileName: document.fileName,
      mimeType: document.mimeType,
      expiresIn: 300,
    });
  })
);

// ---------------------------------------------------------------------------
// Internal (SERVICE-role) routes — called by admin-service. Registered on
// this router, which app.ts mounts BEFORE userRouter, so these more-specific
// /internal/users/therapist-applications... paths are matched before
// userRouter's generic GET /internal/users/:id (same ordering fix already
// applied there for /internal/users/analytics — see its comment).
// ---------------------------------------------------------------------------

therapistApplicationRouter.get(
  '/internal/users/therapist-applications',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!requireService(authReq)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const parsed = listTherapistApplicationsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { status, search, page, limit, sortBy, sortOrder } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Prisma.TherapistApplicationWhereInput = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { contactEmail: { contains: search, mode: 'insensitive' } },
              { licenseNumber: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [applications, total] = await Promise.all([
      prisma.therapistApplication.findMany({
        where,
        skip,
        take: limit,
        // nulls: 'last' regardless of sortOrder — found live at seed scale:
        // submittedAt/reviewedAt are null for DRAFT applications (never
        // submitted) and not-yet-reviewed ones, and Postgres's default
        // NULLS FIRST on a DESC sort was burying every real SUBMITTED
        // application under a wall of drafts on the default view.
        orderBy: { [sortBy]: { sort: sortOrder, nulls: 'last' } },
      }),
      prisma.therapistApplication.count({ where }),
    ]);

    res.status(200).json({ applications, total, page, limit });
  })
);

therapistApplicationRouter.get(
  '/internal/users/therapist-applications/:id',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!requireService(authReq)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const id = req.params.id as string;
    const application = await prisma.therapistApplication.findUnique({
      where: { id },
      include: {
        documents: true,
        notes: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    const documentsWithUrls = await Promise.all(
      application.documents.map(async (doc) => ({
        ...doc,
        url: await getDocumentDownloadUrl(doc.storageKey),
      }))
    );

    res.status(200).json({
      application: { ...application, documents: documentsWithUrls },
    });
  })
);

therapistApplicationRouter.patch(
  '/internal/users/therapist-applications/:id/status',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!requireService(authReq)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const parsed = internalUpdateApplicationStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }
    const { status, reviewedBy, reason, note } = parsed.data;

    if (status === 'REJECTED' && !reason) {
      res.status(400).json({ message: 'reason is required to reject' });
      return;
    }
    if (status === 'MORE_INFORMATION_REQUIRED' && !note) {
      res
        .status(400)
        .json({ message: 'note is required to request more information' });
      return;
    }

    const id = req.params.id as string;
    const application = await prisma.therapistApplication.findUnique({
      where: { id },
    });
    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    const allowed = ALLOWED_REVIEW_TRANSITIONS[application.status];
    if (!allowed.includes(status)) {
      res.status(409).json({
        message: `Cannot transition from ${application.status} to ${status}`,
      });
      return;
    }

    const updated = await prisma.therapistApplication.update({
      where: { id },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy,
        // Persisted (not just emailed via the notification event below) so
        // the applicant can still see why on a later visit to the
        // application page, not only in a one-off email they may have missed.
        ...(status === 'REJECTED' ? { rejectionReason: reason } : {}),
        ...(status === 'MORE_INFORMATION_REQUIRED' ? { infoRequestNote: note } : {}),
      },
    });

    if (status === 'APPROVED') {
      await upsertTherapistProfileFromApplication(updated.userId, updated.id, {
        fullName: updated.fullName,
        professionalBio: updated.professionalBio,
        specialisations: updated.specialisations,
        languages: updated.languages,
        timezone: updated.timezone,
        contactEmail: updated.contactEmail,
      });
    }

    try {
      if (status === 'APPROVED') {
        await publishTherapistApplicationEvent(
          createTherapistApplicationApprovedEvent({
            applicationId: updated.id,
            userId: updated.userId,
          })
        );
      } else if (status === 'REJECTED' && reason) {
        await publishTherapistApplicationEvent(
          createTherapistApplicationRejectedEvent({
            applicationId: updated.id,
            userId: updated.userId,
            reason,
          })
        );
      } else if (status === 'MORE_INFORMATION_REQUIRED' && note) {
        await publishTherapistApplicationEvent(
          createTherapistApplicationMoreInfoRequestedEvent({
            applicationId: updated.id,
            userId: updated.userId,
            note,
          })
        );
      }
    } catch (err) {
      console.error(
        `[therapist_application.${status}] Failed to publish event:`,
        err
      );
    }

    res.status(200).json({ application: updated });
  })
);

therapistApplicationRouter.post(
  '/internal/users/therapist-applications/:id/notes',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!requireService(authReq)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const parsed = addApplicationNoteSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const id = req.params.id as string;
    const application = await prisma.therapistApplication.findUnique({
      where: { id },
    });
    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    const note = await prisma.therapistApplicationNote.create({
      data: {
        applicationId: id,
        authorId: parsed.data.authorId,
        note: parsed.data.note,
      },
    });

    res.status(201).json({ note });
  })
);

// Flips only the discovery-visibility flag on TherapistProfile. The real
// access revocation is Auth Service's isActive/Redis suspension — see
// admin-service's therapist suspend/reactivate routes, which call that
// FIRST and only call this once it has succeeded (fail-closed: a therapist
// must never end up hidden from search but still usable via a live token,
// or the reverse).
therapistApplicationRouter.patch(
  '/internal/users/:userId/therapist-suspension',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!requireService(authReq)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const parsed = therapistSuspensionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const userId = req.params.userId as string;
    try {
      const profile = await prisma.therapistProfile.update({
        where: { userId },
        data: { isSuspended: parsed.data.isSuspended },
      });

      try {
        const event = parsed.data.isSuspended
          ? createTherapistApplicationSuspendedEvent({ userId })
          : createTherapistApplicationReactivatedEvent({ userId });
        await publishTherapistApplicationEvent(event);
      } catch (err) {
        console.error(
          '[therapist_application.suspension] Failed to publish event:',
          err
        );
      }

      res
        .status(200)
        .json({ userId, isSuspended: profile.isSuspended });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        res.status(404).json({ message: 'Therapist profile not found' });
        return;
      }
      throw error;
    }
  })
);
