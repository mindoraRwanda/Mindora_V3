import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from './auth.js';

describe('registerSchema', () => {
  it('accepts valid registration input', () => {
    const result = registerSchema.safeParse({
      email: 'patient@example.com',
      password: 'securePass1',
      role: 'PATIENT',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'not-an-email',
      password: 'securePass1',
      role: 'PATIENT',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = registerSchema.safeParse({
      email: 'patient@example.com',
      password: 'short',
      role: 'PATIENT',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts valid login input', () => {
    const result = loginSchema.safeParse({
      email: 'patient@example.com',
      password: 'any',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'patient@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});
