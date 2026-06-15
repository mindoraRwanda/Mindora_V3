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
