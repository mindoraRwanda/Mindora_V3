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
