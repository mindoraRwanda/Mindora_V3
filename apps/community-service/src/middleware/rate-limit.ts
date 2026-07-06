import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

export const authenticatedRouteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 10_000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests' },
});

export const publicRouteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 10_000 : 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests' },
});
