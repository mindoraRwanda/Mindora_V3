#!/usr/bin/env node
// Platform-wide seed: generates an interconnected, configurable-scale
// synthetic dataset across every database this build-out has touched
// (mindora_auth, mindora_user, mindora_appointment, mindora_admin,
// mindora_notifications) — Users -> Profiles -> Therapist Applications ->
// Therapists -> Availability -> Appointments -> Notifications -> Audit Logs,
// using each real table/relationship this codebase already has, not a
// separate "demo data" shape.
//
// Deliberately out of scope: mood-tracking-service, community-service,
// messaging-service, ai-integration-service — none of this build-out's
// milestones have touched those services' schemas, and mood/AI journal
// entries are app-layer-encrypted (a fake seed would need to encrypt with
// the real per-service key, adding risk for no real benefit here). Each
// already has its own small dev seed script if needed.
//
// Run: npm run seed  (from the repo root)
// Configure: TOTAL_USERS, PATIENT_RATIO, THERAPIST_RATIO, ADMIN_COUNT, SEED
// (see .env.example for the full list and defaults).

import { randomInt, randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import { createRng } from './rng.mjs';
import {
  FIRST_NAMES_FEMALE,
  FIRST_NAMES_MALE,
  LAST_NAMES,
  LOCATIONS,
  LANGUAGE_WEIGHTS,
  SPECIALISATIONS,
  QUALIFICATIONS,
  CERTIFICATIONS,
  LICENSE_ISSUING_BODIES,
  buildBio,
  randomPhoneNumber,
  randomLicenseNumber,
  pickLanguages,
} from './rwanda-data.mjs';

import { PrismaClient as AuthClient } from '../../apps/auth-service/src/generated/prisma/index.js';
import { PrismaClient as UserClient } from '../../apps/user-service/src/generated/prisma/index.js';
import { PrismaClient as AppointmentClient } from '../../apps/appointment-service/src/generated/prisma/index.js';
import { PrismaClient as AdminClient } from '../../apps/admin-service/src/generated/prisma/index.js';
import { PrismaClient as NotificationClient } from '../../apps/notification-service/src/generated/prisma/index.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const TOTAL_USERS = Number(process.env.TOTAL_USERS ?? 10000);
const PATIENT_RATIO = Number(process.env.PATIENT_RATIO ?? 0.85);
const THERAPIST_RATIO = Number(process.env.THERAPIST_RATIO ?? 0.1);
const ADMIN_COUNT = Number(process.env.ADMIN_COUNT ?? 5);
const SEED = process.env.SEED ? Number(process.env.SEED) : randomInt(2 ** 31);
const SEED_PASSWORD =
  process.env.SEED_PASSWORD ?? 'Seeded-User-Not-A-Real-Login-1!';
const BATCH_SIZE = 2000;

const AUTH_DATABASE_URL =
  process.env.AUTH_DATABASE_URL ??
  'postgresql://mindora:mindora@localhost:5434/mindora_auth';
const USER_DATABASE_URL =
  process.env.USER_DATABASE_URL ??
  'postgresql://mindora:mindora@localhost:5434/mindora_user';
const APPOINTMENT_DATABASE_URL =
  process.env.APPOINTMENT_DATABASE_URL ??
  'postgresql://mindora:mindora@localhost:5434/mindora_appointment';
const ADMIN_DATABASE_URL =
  process.env.ADMIN_DATABASE_URL ??
  'postgresql://mindora:mindora@localhost:5434/mindora_admin';
const NOTIFICATION_DATABASE_URL =
  process.env.NOTIFICATION_DATABASE_URL ??
  'postgresql://mindora:mindora@localhost:5434/mindora_notifications';

// Production safety (spec requirement: this must never run against a real
// database by accident) — refuse unless every target looks like a local
// dev database, or the operator explicitly overrides.
const dbUrls = [
  AUTH_DATABASE_URL,
  USER_DATABASE_URL,
  APPOINTMENT_DATABASE_URL,
  ADMIN_DATABASE_URL,
  NOTIFICATION_DATABASE_URL,
];
const looksLocal = (url) => /localhost|127\.0\.0\.1/.test(url);
if (
  !dbUrls.every(looksLocal) &&
  process.env.SEED_CONFIRM_NON_LOCAL !== 'yes-i-am-sure'
) {
  console.error(
    '\nRefusing to seed: at least one target database URL is not localhost/127.0.0.1.\n' +
      'This generates synthetic data at scale and must never run against a real\n' +
      'deployment by accident. If you really mean to seed this target (e.g. a\n' +
      'dedicated staging environment), set SEED_CONFIRM_NON_LOCAL=yes-i-am-sure.\n'
  );
  process.exit(1);
}

const rng = createRng(SEED);
const now = new Date();

function log(msg) {
  console.log(`[seed] ${msg}`);
}

// ---------------------------------------------------------------------------
// Prisma clients — one per service database, each service's own generated
// client so field names/enums match that service's schema exactly.
// ---------------------------------------------------------------------------

const authDb = new AuthClient({
  datasources: { db: { url: AUTH_DATABASE_URL } },
});
const userDb = new UserClient({
  datasources: { db: { url: USER_DATABASE_URL } },
});
const appointmentDb = new AppointmentClient({
  datasources: { db: { url: APPOINTMENT_DATABASE_URL } },
});
const adminDb = new AdminClient({
  datasources: { db: { url: ADMIN_DATABASE_URL } },
});
const notificationDb = new NotificationClient({
  datasources: { db: { url: NOTIFICATION_DATABASE_URL } },
});

async function createManyBatched(model, rows, label) {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await model.createMany({ data: batch, skipDuplicates: true });
  }
  log(`  ${label}: ${rows.length} rows`);
}

// ---------------------------------------------------------------------------
// Small generators shared across phases
// ---------------------------------------------------------------------------

let emailCounter = 0;
function makeUser(role) {
  const isFemale = rng.chance(0.5);
  const firstName = rng.pick(isFemale ? FIRST_NAMES_FEMALE : FIRST_NAMES_MALE);
  const lastName = rng.pick(LAST_NAMES);
  const fullName = `${firstName} ${lastName}`;
  const domain =
    role === 'ADMIN'
      ? 'admin.seed.mindora.local'
      : role === 'THERAPIST'
        ? 'therapist.seed.mindora.local'
        : 'patient.seed.mindora.local';
  emailCounter += 1;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${emailCounter}@${domain}`;
  const location = rng.weighted(LOCATIONS);
  const languagePreference = rng.weighted(LANGUAGE_WEIGHTS);

  // Registration spread across the last ~12 months, mildly weighted toward
  // more-recent months (platform growth), never in the future.
  const daysAgo = Math.floor(365 * Math.pow(rng.float(), 1.4));
  const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

  const activityLevel = rng.weighted({
    highlyActive: 10,
    regular: 30,
    occasional: 35,
    inactive: 25,
  });

  return {
    id: randomUUID(),
    role,
    email,
    fullName,
    location,
    languagePreference,
    createdAt,
    activityLevel,
    isActive: rng.chance(0.985), // ~1.5% suspended, matches "suspended users" being a real minority
  };
}

// RefreshToken rows approximate login/session activity for DAU/WAU/MAU —
// see auth-service's GET /internal/auth/analytics, which uses exactly this
// signal. More rows, more recent, for more "active" users.
function activityWindowDays(level) {
  switch (level) {
    case 'highlyActive':
      return { count: rng.int(15, 30), spanDays: 30 };
    case 'regular':
      return { count: rng.int(5, 12), spanDays: 45 };
    case 'occasional':
      return { count: rng.int(1, 4), spanDays: 90 };
    default:
      return { count: rng.chance(0.3) ? 1 : 0, spanDays: 180 };
  }
}

function buildRefreshTokens(user) {
  if (!user.isActive) return []; // suspended users don't get fresh sessions
  const { count, spanDays } = activityWindowDays(user.activityLevel);
  const rows = [];
  const earliestPossible = user.createdAt.getTime();
  for (let i = 0; i < count; i++) {
    const daysAgo = rng.int(0, spanDays);
    let createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    if (createdAt.getTime() < earliestPossible)
      createdAt = new Date(earliestPossible);
    rows.push({
      id: randomUUID(),
      userId: user.id,
      tokenHash: randomUUID(), // placeholder hash - never a real usable token
      expiresAt: new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000),
      revoked: false,
      createdAt,
    });
  }
  return rows;
}

export async function main() {
  log(
    `Starting seed — TOTAL_USERS=${TOTAL_USERS} PATIENT_RATIO=${PATIENT_RATIO} ` +
      `THERAPIST_RATIO=${THERAPIST_RATIO} ADMIN_COUNT=${ADMIN_COUNT} SEED=${SEED}`
  );
  log(
    '(reproduce this exact dataset later with: SEED=' + SEED + ' npm run seed)'
  );
  const startedAt = Date.now();

  // -------------------------------------------------------------------------
  // Phase 1: generate user records in memory
  // -------------------------------------------------------------------------
  log('Phase 1/8: generating user records...');

  const remaining = TOTAL_USERS - ADMIN_COUNT;
  const approvedTherapistCount = Math.round(remaining * THERAPIST_RATIO);
  // A smaller pool of PATIENT-role users with a non-approved application in
  // flight (DRAFT/SUBMITTED/UNDER_REVIEW/REJECTED/MORE_INFORMATION_REQUIRED)
  // - populates the admin review queue and funnel analytics without
  // inflating the actual therapist count. Role stays PATIENT throughout,
  // exactly matching the real state machine (role only flips on approval).
  const prospectiveTherapistCount = Math.round(remaining * 0.05);
  const plainPatientCount = Math.max(
    0,
    remaining - approvedTherapistCount - prospectiveTherapistCount
  );

  const admins = Array.from({ length: ADMIN_COUNT }, () => makeUser('ADMIN'));
  const approvedTherapists = Array.from(
    { length: approvedTherapistCount },
    () => makeUser('THERAPIST')
  );
  const prospectiveTherapists = Array.from(
    { length: prospectiveTherapistCount },
    () => makeUser('PATIENT')
  );
  const plainPatients = Array.from({ length: plainPatientCount }, () =>
    makeUser('PATIENT')
  );
  const allPatientRoleUsers = [...prospectiveTherapists, ...plainPatients];
  const allUsers = [...admins, ...approvedTherapists, ...allPatientRoleUsers];

  log(
    `  ${admins.length} admins, ${approvedTherapists.length} approved therapists, ` +
      `${prospectiveTherapists.length} prospective (non-approved) therapist applicants, ` +
      `${plainPatients.length} plain patients`
  );

  // -------------------------------------------------------------------------
  // Phase 2: auth-service — User rows
  // -------------------------------------------------------------------------
  log('Phase 2/8: auth-service (users, refresh tokens)...');

  const sharedPasswordHash = await argon2.hash(SEED_PASSWORD, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  await createManyBatched(
    authDb.user,
    allUsers.map((u) => ({
      id: u.id,
      email: u.email,
      passwordHash: sharedPasswordHash,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      updatedAt: u.createdAt,
    })),
    'users'
  );

  const refreshTokens = allUsers.flatMap(buildRefreshTokens);
  await createManyBatched(authDb.refreshToken, refreshTokens, 'refresh_tokens');

  // -------------------------------------------------------------------------
  // Phase 3: user-service — profiles + therapist applications
  // -------------------------------------------------------------------------
  log('Phase 3/8: user-service (profiles, therapist applications)...');

  await createManyBatched(
    userDb.patientProfile,
    allPatientRoleUsers.map((u) => ({
      id: randomUUID(),
      userId: u.id,
      userName: u.fullName,
      timezone: 'Africa/Kigali',
      languagePreference: u.languagePreference,
      notificationPreferences: { push: true, email: true, sms: true },
      role: 'PATIENT',
      email: u.email,
      createdAt: u.createdAt,
      updatedAt: u.createdAt,
    })),
    'patient_profiles'
  );

  const nonApprovedStatusWeights = {
    DRAFT: 30,
    SUBMITTED: 25,
    UNDER_REVIEW: 10,
    REJECTED: 20,
    MORE_INFORMATION_REQUIRED: 15,
  };
  const rejectionReasons = [
    'Unable to verify professional license with the issuing body.',
    "Submitted qualifications don't meet the minimum experience requirement.",
    'Incomplete application - required documents were never provided.',
  ];
  const infoRequestNotes = [
    'Please upload a clearer scan of your license certificate.',
    'Could you clarify your years of direct clinical experience?',
    'We need your professional registration number to continue.',
  ];

  function buildApplication(user, { approved }) {
    const specialisations = rng.pickMany(SPECIALISATIONS, rng.int(1, 3));
    const languages = pickLanguages(rng);
    const submittedAt = new Date(
      user.createdAt.getTime() + rng.int(1, 14) * 24 * 60 * 60 * 1000
    );
    const application = {
      id: randomUUID(),
      userId: user.id,
      fullName: user.fullName,
      phoneNumber: randomPhoneNumber(rng),
      contactEmail: user.email,
      professionalBio: buildBio(rng, specialisations),
      qualifications: rng.pickMany(QUALIFICATIONS, rng.int(1, 2)),
      certifications: rng.chance(0.5)
        ? rng.pickMany(CERTIFICATIONS, rng.int(1, 2))
        : [],
      licenseNumber: randomLicenseNumber(rng),
      licenseIssuingBody: rng.pick(LICENSE_ISSUING_BODIES),
      professionalRegistrationNumber: rng.chance(0.6)
        ? `REG-${rng.int(1000, 9999)}`
        : null,
      specialisations,
      yearsOfExperience: rng.int(1, 25),
      languages,
      availabilitySummary: rng.chance(0.5)
        ? 'Weekday evenings, Kigali time'
        : null,
      location: user.location,
      timezone: 'Africa/Kigali',
      submittedAt,
      createdAt: user.createdAt,
      updatedAt: submittedAt,
      status: 'SUBMITTED',
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null,
      infoRequestNote: null,
    };

    if (approved) {
      const reviewedAt = new Date(
        submittedAt.getTime() + rng.int(1, 10) * 24 * 60 * 60 * 1000
      );
      application.status = 'APPROVED';
      application.reviewedAt = reviewedAt;
      application.reviewedBy = rng.pick(admins).id;
      application.updatedAt = reviewedAt;
    } else {
      const status = rng.weighted(nonApprovedStatusWeights);
      application.status = status;
      if (status === 'DRAFT') {
        // Never actually submitted - matches the real create-a-draft flow.
        application.submittedAt = null;
        application.updatedAt = user.createdAt;
      } else if (
        status === 'REJECTED' ||
        status === 'MORE_INFORMATION_REQUIRED'
      ) {
        const reviewedAt = new Date(
          submittedAt.getTime() + rng.int(1, 10) * 24 * 60 * 60 * 1000
        );
        application.reviewedAt = reviewedAt;
        application.reviewedBy = rng.pick(admins).id;
        application.updatedAt = reviewedAt;
        if (status === 'REJECTED') {
          application.rejectionReason = rng.pick(rejectionReasons);
        } else {
          application.infoRequestNote = rng.pick(infoRequestNotes);
        }
      }
      // SUBMITTED/UNDER_REVIEW: left pending, no reviewedAt yet - a real
      // item sitting in the admin queue.
    }

    return application;
  }

  const approvedApplications = approvedTherapists.map((u) =>
    buildApplication(u, { approved: true })
  );
  const prospectiveApplications = prospectiveTherapists.map((u) =>
    buildApplication(u, { approved: false })
  );
  const allApplications = [...approvedApplications, ...prospectiveApplications];

  await createManyBatched(
    userDb.therapistApplication,
    allApplications,
    'therapist_applications'
  );

  const applicationByUserId = new Map(
    allApplications.map((a) => [a.userId, a])
  );

  await createManyBatched(
    userDb.therapistProfile,
    approvedTherapists.map((u) => {
      const application = applicationByUserId.get(u.id);
      const isSuspended = rng.chance(0.03);
      return {
        id: randomUUID(),
        userId: u.id,
        userName: u.fullName,
        bio: application.professionalBio,
        timezone: 'Africa/Kigali',
        languagePreference: u.languagePreference,
        specialisation: application.specialisations.join(', '),
        languages: application.languages,
        isAcceptingPatients: !isSuspended && rng.chance(0.85),
        notificationPreferences: { push: true, email: true, sms: true },
        role: 'THERAPIST',
        email: u.email,
        applicationStatus: 'APPROVED',
        applicationId: application.id,
        isSuspended,
        createdAt: application.reviewedAt,
        updatedAt: application.reviewedAt,
      };
    }),
    'therapist_profiles'
  );

  // -------------------------------------------------------------------------
  // Phase 4: admin-service — audit log of every seeded review decision
  // -------------------------------------------------------------------------
  log('Phase 4/8: admin-service (audit logs)...');

  const auditActionForStatus = {
    APPROVED: 'THERAPIST_APPLICATION_APPROVED',
    REJECTED: 'THERAPIST_APPLICATION_REJECTED',
    MORE_INFORMATION_REQUIRED: 'THERAPIST_APPLICATION_MORE_INFO_REQUESTED',
  };

  const auditLogs = [];
  for (const application of allApplications) {
    const actionType = auditActionForStatus[application.status];
    if (!actionType || !application.reviewedAt) continue;
    auditLogs.push({
      id: randomUUID(),
      adminId: application.reviewedBy,
      actionType,
      targetId: application.id,
      metadata: {
        userId: application.userId,
        ...(application.rejectionReason
          ? { reason: application.rejectionReason }
          : {}),
        ...(application.infoRequestNote
          ? { note: application.infoRequestNote }
          : {}),
      },
      createdAt: application.reviewedAt,
    });
  }
  for (const u of [...approvedTherapists, ...allPatientRoleUsers]) {
    if (u.isActive) continue;
    const suspendedAt = new Date(
      u.createdAt.getTime() + rng.int(7, 180) * 24 * 60 * 60 * 1000
    );
    auditLogs.push({
      id: randomUUID(),
      adminId: rng.pick(admins).id,
      actionType:
        u.role === 'THERAPIST' ? 'THERAPIST_SUSPENDED' : 'USER_SUSPENDED',
      targetId: u.id,
      metadata: { reason: 'Policy violation (seeded)' },
      createdAt: suspendedAt > now ? now : suspendedAt,
    });
  }

  await createManyBatched(adminDb.audit_logs, auditLogs, 'audit_logs');

  // -------------------------------------------------------------------------
  // Phase 5: appointment-service — availability
  // -------------------------------------------------------------------------
  log('Phase 5/8: appointment-service (availability)...');

  const activeTherapists = approvedTherapists.filter((u) => u.isActive);
  const schedules = [];
  const workingHoursRows = [];
  for (const t of activeTherapists) {
    if (!rng.chance(0.9)) continue; // ~10% never configured availability - exercises the fallback default
    schedules.push({
      therapistId: t.id,
      timezone: 'Africa/Kigali',
      updatedAt: t.createdAt,
    });
    const workDays = rng.chance(0.75)
      ? [1, 2, 3, 4, 5] // Mon-Fri full time
      : rng.pickMany([1, 2, 3, 4, 5, 6], rng.int(2, 4)); // part-time subset
    const startMinute = rng.pick([480, 540, 600]); // 8am/9am/10am
    const endMinute = startMinute + rng.pick([360, 420, 480]); // 6-8hr day
    for (const dayOfWeek of workDays) {
      workingHoursRows.push({
        id: randomUUID(),
        therapistId: t.id,
        dayOfWeek,
        startMinute,
        endMinute,
      });
    }
  }
  await createManyBatched(
    appointmentDb.therapistSchedule,
    schedules,
    'therapist_schedules'
  );
  await createManyBatched(
    appointmentDb.therapistWorkingHours,
    workingHoursRows,
    'therapist_working_hours'
  );

  // -------------------------------------------------------------------------
  // Phase 6: appointment-service — appointments
  // -------------------------------------------------------------------------
  log('Phase 6/8: appointment-service (appointments, ~12 months)...');

  const bookableTherapists = activeTherapists; // any approved+active therapist can be booked in seed data, regardless of isAcceptingPatients (mirrors that a completed appointment can predate a therapist closing their books)
  const appointments = [];
  const therapistBookedStarts = new Map(); // therapistId -> Set<ms>

  function isSlotFree(therapistId, slotStartMs) {
    const set = therapistBookedStarts.get(therapistId);
    return !set || !set.has(slotStartMs);
  }
  function markSlotBooked(therapistId, slotStartMs) {
    if (!therapistBookedStarts.has(therapistId)) {
      therapistBookedStarts.set(therapistId, new Set());
    }
    therapistBookedStarts.get(therapistId).add(slotStartMs);
  }

  if (bookableTherapists.length > 0) {
    for (const patient of allPatientRoleUsers) {
      // Not every patient has therapy activity - only "engaged" ones do,
      // proportional to their activity level, matching "total users !=
      // active users" and giving DAU/WAU/MAU-adjacent metrics real texture.
      const engagementChance = {
        highlyActive: 0.85,
        regular: 0.6,
        occasional: 0.25,
        inactive: 0.03,
      }[patient.activityLevel];
      if (!rng.chance(engagementChance)) continue;

      const appointmentCount = rng.int(
        1,
        patient.activityLevel === 'highlyActive' ? 8 : 4
      );
      for (let i = 0; i < appointmentCount; i++) {
        const therapist = rng.pick(bookableTherapists);
        // Spread across ~9 months in the past to ~2 months in the future.
        const dayOffset = rng.int(-270, 60);
        const slotStart = new Date(now);
        slotStart.setUTCDate(slotStart.getUTCDate() + dayOffset);
        slotStart.setUTCHours(rng.int(7, 15), 0, 0, 0); // matches the 9-5 Kigali (UTC+2) -> 07:00-15:00 UTC default window
        if (slotStart.getTime() < patient.createdAt.getTime()) continue; // can't book before the account existed
        if (!isSlotFree(therapist.id, slotStart.getTime())) continue;
        markSlotBooked(therapist.id, slotStart.getTime());

        const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
        const isFuture = slotStart.getTime() > now.getTime();
        let status, cancellationReason, rating;
        if (isFuture) {
          status = rng.chance(0.6) ? 'CONFIRMED' : 'PENDING';
        } else {
          const outcome = rng.weighted({
            completed: 65,
            cancelled: 20,
            noShow: 15,
          });
          if (outcome === 'completed') {
            status = 'COMPLETED';
            rating = rng.chance(0.8) ? rng.int(4, 5) : rng.int(1, 5);
          } else if (outcome === 'cancelled') {
            status = 'CANCELLED';
            cancellationReason = rng.pick([
              'Schedule conflict',
              'Feeling better, no longer needed',
              'Requested a different time',
            ]);
          } else {
            // No-show - modeled as CANCELLED with a distinct reason, since
            // AppointmentStatus has no separate NO_SHOW value; see the
            // schema, not something this seed script should be changing.
            status = 'CANCELLED';
            cancellationReason = 'Patient did not attend (no-show)';
          }
        }

        appointments.push({
          id: randomUUID(),
          patientId: patient.id,
          therapistId: therapist.id,
          slotStart,
          slotEnd,
          sessionType: rng.pick(['VIDEO', 'IN_PERSON', 'CHAT']),
          status,
          cancellationReason: cancellationReason ?? null,
          rating: rating ?? null,
          createdAt: new Date(
            slotStart.getTime() - rng.int(1, 10) * 24 * 60 * 60 * 1000
          ),
          updatedAt: slotStart,
        });
      }
    }
  }

  await createManyBatched(
    appointmentDb.appointment,
    appointments,
    'appointments'
  );

  // -------------------------------------------------------------------------
  // Phase 7: notification-service — delivery log for real seeded events
  // -------------------------------------------------------------------------
  log('Phase 7/8: notification-service (notification logs)...');

  function deliveryStatus() {
    return rng.weighted({ delivered: 85, skipped: 10, failed: 5 });
  }

  const notificationLogs = [];
  for (const application of allApplications) {
    if (application.submittedAt) {
      notificationLogs.push({
        id: randomUUID(),
        userId: application.userId,
        eventType: 'therapist_application.submitted',
        channel: 'email',
        status: deliveryStatus(),
        createdAt: application.submittedAt,
      });
    }
    if (application.reviewedAt) {
      const eventType =
        application.status === 'APPROVED'
          ? 'therapist_application.approved'
          : application.status === 'REJECTED'
            ? 'therapist_application.rejected'
            : 'therapist_application.more_info_requested';
      notificationLogs.push({
        id: randomUUID(),
        userId: application.userId,
        eventType,
        channel: 'email',
        status: deliveryStatus(),
        createdAt: application.reviewedAt,
      });
    }
  }
  // Sample of appointment-lifecycle notifications, not one per appointment
  // per channel - keeps volume proportional, not "millions of meaningless
  // logs" (explicit spec guidance).
  for (const appt of appointments) {
    if (rng.chance(0.4)) {
      notificationLogs.push({
        id: randomUUID(),
        userId: appt.patientId,
        eventType: 'appointment.booked',
        channel: rng.chance(0.7) ? 'push' : 'email',
        status: deliveryStatus(),
        createdAt: appt.createdAt,
      });
    }
    if (appt.status === 'CANCELLED' && rng.chance(0.5)) {
      notificationLogs.push({
        id: randomUUID(),
        userId: appt.patientId,
        eventType: 'appointment.cancelled',
        channel: 'push',
        status: deliveryStatus(),
        createdAt: appt.updatedAt,
      });
    }
  }

  await createManyBatched(
    notificationDb.notification_logs,
    notificationLogs,
    'notification_logs'
  );

  // -------------------------------------------------------------------------
  // Phase 8: summary
  // -------------------------------------------------------------------------
  const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  log('Phase 8/8: done.');
  log('');
  log('Summary:');
  log(`  users:                    ${allUsers.length}`);
  log(`  refresh_tokens:           ${refreshTokens.length}`);
  log(`  patient_profiles:         ${allPatientRoleUsers.length}`);
  log(`  therapist_applications:   ${allApplications.length}`);
  log(`  therapist_profiles:       ${approvedTherapists.length}`);
  log(`  therapist_schedules:      ${schedules.length}`);
  log(`  therapist_working_hours:  ${workingHoursRows.length}`);
  log(`  appointments:             ${appointments.length}`);
  log(`  audit_logs:               ${auditLogs.length}`);
  log(`  notification_logs:        ${notificationLogs.length}`);
  log('');
  log(`Finished in ${elapsedSeconds}s. SEED=${SEED}`);
  log('All seeded accounts share one password (set via SEED_PASSWORD).');
}

main()
  .catch((error) => {
    console.error('[seed] FAILED:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.all([
      authDb.$disconnect(),
      userDb.$disconnect(),
      appointmentDb.$disconnect(),
      adminDb.$disconnect(),
      notificationDb.$disconnect(),
    ]);
  });
