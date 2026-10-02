import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

export const authenticatedRouteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 10_000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests' },
});

export const publicAuthRouteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 10_000 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests' },
});

// POST /login specifically (not shared with /register, /forgot-password,
// etc, which is what publicAuthRouteLimiter above is for) — 60/min/IP is
// reasonable for registration or a password-reset request, but far too
// permissive for the one endpoint that's actually a credential-guessing
// target on a platform holding mental-health data. This is still
// IP-keyed, not account-keyed — it slows a single-source brute force, not
// a distributed one; that would need per-account lockout/backoff, a
// bigger change than this security-hardening pass's scope.
export const loginRouteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 10_000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts — please wait a moment and try again' },
});
