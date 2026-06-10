# Auth Service

Authentication microservice for Mindora V3.

## Port

**3001** (direct) · **8000** via Kong (`/api/v1/auth/*`)

## Endpoints (Sprint 1 + 2)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check |
| POST | `/register` | No | Create account |
| POST | `/login` | No | Login → accessToken + refresh cookie |
| POST | `/logout` | JWT | Revoke refresh token, blacklist JWT jti |
| POST | `/refresh` | Cookie | Rotate refresh token, new accessToken |
| POST | `/forgot-password` | No | Store reset token in Redis (logs URL) |
| POST | `/reset-password` | No | Reset password via token |
| GET | `/me` | JWT | Current user from token |
| GET | `/oauth/google` | No | Start Google OAuth (needs env credentials) |
| GET | `/oauth/google/callback` | No | OAuth callback → tokens |

## Environment

See root `.env.example`. Key vars: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

## Seed users

```bash
npm run db:seed
```

| Role | Email | Password |
|------|-------|----------|
| PATIENT | `patient@test.mindora.local` | `Patient123!` |
| THERAPIST | `therapist@test.mindora.local` | `Therapist123!` |
| THERAPIST | `therapist2@test.mindora.local` | `Therapist2123!` |
| ADMIN | `admin@test.mindora.local` | `Admin123!` |

## Manual testing

See sprint docs for curl examples. OAuth requires Google Cloud Console credentials in `.env`.
