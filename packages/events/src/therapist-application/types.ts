import { z } from 'zod';
import { eventMetadataSchema, type UuidString, type WithMetadata } from '../common.js';
import type { THERAPIST_APPLICATION_ROUTING_KEYS } from './constants.js';

export type TherapistApplicationSubmittedEvent = WithMetadata<{
  eventType: typeof THERAPIST_APPLICATION_ROUTING_KEYS.SUBMITTED;
  applicationId: UuidString;
  userId: UuidString;
}>;

export type TherapistApplicationApprovedEvent = WithMetadata<{
  eventType: typeof THERAPIST_APPLICATION_ROUTING_KEYS.APPROVED;
  applicationId: UuidString;
  userId: UuidString;
}>;

export type TherapistApplicationRejectedEvent = WithMetadata<{
  eventType: typeof THERAPIST_APPLICATION_ROUTING_KEYS.REJECTED;
  applicationId: UuidString;
  userId: UuidString;
  reason: string;
}>;

export type TherapistApplicationMoreInfoRequestedEvent = WithMetadata<{
  eventType: typeof THERAPIST_APPLICATION_ROUTING_KEYS.MORE_INFO_REQUESTED;
  applicationId: UuidString;
  userId: UuidString;
  note: string;
}>;

export type TherapistApplicationSuspendedEvent = WithMetadata<{
  eventType: typeof THERAPIST_APPLICATION_ROUTING_KEYS.SUSPENDED;
  userId: UuidString;
}>;

export type TherapistApplicationReactivatedEvent = WithMetadata<{
  eventType: typeof THERAPIST_APPLICATION_ROUTING_KEYS.REACTIVATED;
  userId: UuidString;
}>;

export type TherapistApplicationDomainEvent =
  | TherapistApplicationSubmittedEvent
  | TherapistApplicationApprovedEvent
  | TherapistApplicationRejectedEvent
  | TherapistApplicationMoreInfoRequestedEvent
  | TherapistApplicationSuspendedEvent
  | TherapistApplicationReactivatedEvent;

export const therapistApplicationSubmittedEventSchema = eventMetadataSchema.extend({
  eventType: z.literal('therapist_application.submitted'),
  applicationId: z.string().uuid(),
  userId: z.string().uuid(),
});

export const therapistApplicationApprovedEventSchema = eventMetadataSchema.extend({
  eventType: z.literal('therapist_application.approved'),
  applicationId: z.string().uuid(),
  userId: z.string().uuid(),
});

export const therapistApplicationRejectedEventSchema = eventMetadataSchema.extend({
  eventType: z.literal('therapist_application.rejected'),
  applicationId: z.string().uuid(),
  userId: z.string().uuid(),
  reason: z.string(),
});

export const therapistApplicationMoreInfoRequestedEventSchema =
  eventMetadataSchema.extend({
    eventType: z.literal('therapist_application.more_info_requested'),
    applicationId: z.string().uuid(),
    userId: z.string().uuid(),
    note: z.string(),
  });

export const therapistApplicationSuspendedEventSchema = eventMetadataSchema.extend({
  eventType: z.literal('therapist_application.suspended'),
  userId: z.string().uuid(),
});

export const therapistApplicationReactivatedEventSchema = eventMetadataSchema.extend({
  eventType: z.literal('therapist_application.reactivated'),
  userId: z.string().uuid(),
});

/** Matches any event published to the mindora.therapist-applications exchange. */
export const therapistApplicationDomainEventSchema = z.union([
  therapistApplicationSubmittedEventSchema,
  therapistApplicationApprovedEventSchema,
  therapistApplicationRejectedEventSchema,
  therapistApplicationMoreInfoRequestedEventSchema,
  therapistApplicationSuspendedEventSchema,
  therapistApplicationReactivatedEventSchema,
]);
