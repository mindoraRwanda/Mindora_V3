import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

// POST /chat proxies to an external LLM and writes a DB row per call —
// meaningfully more expensive per request than the read-only routes below,
// so it gets a tighter limit. 20/min matches the vendor's own documented
// rate limit for the chatbot it proxies to (see the vendor integration
// guide's 429 error table) — a caller hitting this app-level limit would
// have hit the vendor's anyway, so this just fails fast instead of
// forwarding a request that was always going to be rejected upstream.
export const chatRouteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 10_000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests' },
});

// Same budget as the equivalent authenticated-route limiter in every other
// service (auth-service, mood-tracking-service, etc.) — for the read/delete
// routes here (/history, /usage) that aren't proxying an LLM call per
// request.
export const authenticatedRouteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 10_000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests' },
});
