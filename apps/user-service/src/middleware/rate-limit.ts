import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

export const authenticatedRouteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 10_000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests' },
});

// The document-download route is deliberately NOT behind verifyJwt (see
// object-storage.ts) - it authorizes via a short-lived signed token in the
// query string instead, since a `window.open()`/`<a href>` can't attach an
// Authorization header. Still worth its own IP-keyed limit as routine
// hygiene for an unauthenticated route, independent of the token itself
// (which isn't practically guessable/brute-forceable).
export const documentDownloadRouteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 10_000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests' },
});
