import { randomUUID } from 'node:crypto';
import type { IsoDateTimeString } from '../common.js';
import { THERAPIST_APPLICATION_ROUTING_KEYS } from './constants.js';
import type {
  TherapistApplicationApprovedEvent,
  TherapistApplicationMoreInfoRequestedEvent,
  TherapistApplicationReactivatedEvent,
  TherapistApplicationRejectedEvent,
  TherapistApplicationSubmittedEvent,
  TherapistApplicationSuspendedEvent,
} from './types.js';

function baseMetadata() {
  return {
    eventId: randomUUID(),
    occurredAt: new Date().toISOString() as IsoDateTimeString,
    schemaVersion: 1 as const,
  };
}

export function createTherapistApplicationSubmittedEvent(input: {
  applicationId: string;
  userId: string;
}): TherapistApplicationSubmittedEvent {
  return {
    ...baseMetadata(),
    eventType: THERAPIST_APPLICATION_ROUTING_KEYS.SUBMITTED,
    ...input,
  };
}

export function createTherapistApplicationApprovedEvent(input: {
  applicationId: string;
  userId: string;
}): TherapistApplicationApprovedEvent {
  return {
    ...baseMetadata(),
    eventType: THERAPIST_APPLICATION_ROUTING_KEYS.APPROVED,
    ...input,
  };
}

export function createTherapistApplicationRejectedEvent(input: {
  applicationId: string;
  userId: string;
  reason: string;
}): TherapistApplicationRejectedEvent {
  return {
    ...baseMetadata(),
    eventType: THERAPIST_APPLICATION_ROUTING_KEYS.REJECTED,
    ...input,
  };
}

export function createTherapistApplicationMoreInfoRequestedEvent(input: {
  applicationId: string;
  userId: string;
  note: string;
}): TherapistApplicationMoreInfoRequestedEvent {
  return {
    ...baseMetadata(),
    eventType: THERAPIST_APPLICATION_ROUTING_KEYS.MORE_INFO_REQUESTED,
    ...input,
  };
}

export function createTherapistApplicationSuspendedEvent(input: {
  userId: string;
}): TherapistApplicationSuspendedEvent {
  return {
    ...baseMetadata(),
    eventType: THERAPIST_APPLICATION_ROUTING_KEYS.SUSPENDED,
    ...input,
  };
}

export function createTherapistApplicationReactivatedEvent(input: {
  userId: string;
}): TherapistApplicationReactivatedEvent {
  return {
    ...baseMetadata(),
    eventType: THERAPIST_APPLICATION_ROUTING_KEYS.REACTIVATED,
    ...input,
  };
}
