const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Permissive outside production so local dev tooling (file:// test
// harnesses, Postman, localhost frontends on any port) keeps working with
// zero setup. In production, only origins explicitly listed in
// CORS_ALLOWED_ORIGINS are allowed — nothing is served without that being
// configured. Shared by both the REST app (cors package) and the Socket.io
// layer, whose `cors.origin` option accepts the same (origin, callback) shape.
export function corsOriginCallback(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
): void {
  if (!isProduction) {
    callback(null, true);
    return;
  }
  // callback(null, false) — not an Error — so a disallowed origin gets a
  // normal response with no Access-Control-Allow-Origin header (the browser
  // then blocks the calling page's JS from reading it) rather than a 500,
  // which would misrepresent a routine cross-origin denial as a server fault.
  callback(null, !!origin && allowedOrigins.includes(origin));
}
