import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const token = jwt.sign(
  {
    sub: 'test-karimi-123',
    email: 'karimi@mindora.com',
    role: 'PATIENT',
  },
  process.env.JWT_SECRET as string,
  {
    expiresIn: '7d',
    issuer: 'mindora',
    jwtid: 'test-jti-123'
  }
);

console.log('Generated JWT Token:');
console.log(token);
console.log('\nUse this token in your requests:');
console.log(`Authorization: Bearer ${token}`);