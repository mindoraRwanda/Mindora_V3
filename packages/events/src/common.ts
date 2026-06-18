/** ISO-8601 UTC timestamp string (e.g. 2026-06-15T12:00:00.000Z). */
export type IsoDateTimeString = string;

/** UUID v4 string. */
export type UuidString = string;

/**
 * Metadata included on every domain event published to RabbitMQ.
 */
export interface EventMetadata {
  /** Unique id for idempotent consumers / tracing. */
  eventId: UuidString;
  /** When the event occurred (UTC). */
  occurredAt: IsoDateTimeString;
  /** Monotonic schema version for payload evolution. */
  schemaVersion: 1;
}

export type WithMetadata<TPayload> = TPayload & EventMetadata;
