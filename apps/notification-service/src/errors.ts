export class FatalNotificationError extends Error {
  constructor(
    message: string,
    /** Provider-specific error code (FCM error string, AT status code, etc.) */
    public readonly providerCode: string,
    public readonly userId: string
  ) {
    super(message);
    this.name = 'FatalNotificationError';
  }
}

/**
 * A consumed event failed schema validation. Never retried — a malformed
 * payload won't become valid on redelivery, so this routes straight to the
 * DLQ via the same fatal-error path as FatalNotificationError.
 */
export class InvalidEventPayloadError extends Error {
  constructor(
    message: string,
    public readonly exchange: string
  ) {
    super(message);
    this.name = 'InvalidEventPayloadError';
  }
}
