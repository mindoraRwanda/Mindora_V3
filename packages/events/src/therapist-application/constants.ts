/** Topic exchange for therapist application domain events. */
export const THERAPIST_APPLICATION_EXCHANGE = 'mindora.therapist-applications';

export const THERAPIST_APPLICATION_ROUTING_KEYS = {
  SUBMITTED: 'therapist_application.submitted',
  APPROVED: 'therapist_application.approved',
  REJECTED: 'therapist_application.rejected',
  MORE_INFO_REQUESTED: 'therapist_application.more_info_requested',
  SUSPENDED: 'therapist_application.suspended',
  REACTIVATED: 'therapist_application.reactivated',
} as const;

export type TherapistApplicationRoutingKey =
  (typeof THERAPIST_APPLICATION_ROUTING_KEYS)[keyof typeof THERAPIST_APPLICATION_ROUTING_KEYS];
