import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const role = process.argv[2] || 'PATIENT';

const token = jwt.sign(
  {
    sub: 'patient-karimi-123',
    email: 'karimi@mindora.com',
    role,
  },
  process.env.JWT_SECRET as string,
  {
    expiresIn: '7d',
    issuer: 'mindora-auth',
    jwtid: 'test-jti-123',
  }
);

console.log('Generated JWT Token:');
console.log(token);
console.log('\nUse this token in your requests:');
console.log(`Authorization: Bearer ${token}`);
