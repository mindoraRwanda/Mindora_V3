# Auth Service

Authentication microservice for Mindora V3.

## Prerequisites

- **Node.js 24+** (see root `.nvmrc`)

## Port

**3001** (direct) · **8000** via Kong (`/api/v1/auth/*`)

## Environment

See root `.env.example`. Key vars:

| Variable               | Purpose                                       |
| ---------------------- | --------------------------------------------- |
| `DATABASE_URL`         | PostgreSQL (Prisma)                           |
| `REDIS_URL`            | JWT blacklist / password reset tokens         |
| `JWT_SECRET`           | Access token signing (must match Kong secret) |
| `REFRESH_SECRET`       | Refresh token signing                         |
| `GOOGLE_CLIENT_ID`     | Google OAuth (optional)                       |
| `GOOGLE_CLIENT_SECRET` | Google OAuth (optional)                       |
| `PORT`                 | Optional, default `3001`                      |

## Endpoints (Sprint 1 + 2)

| Method | Path                     | Auth       | Description                                |
| ------ | ------------------------ | ---------- | ------------------------------------------ |
| GET    | `/health`                | No         | Health check                               |
| GET    | `/api/v1/auth/health`    | No         | Kong health path                           |
| POST   | `/register`              | No         | Create account                             |
| POST   | `/login`                 | No         | Login → `accessToken` + refresh cookie     |
| POST   | `/logout`                | JWT        | Revoke refresh token, blacklist JWT jti    |
| POST   | `/refresh`               | Cookie     | Rotate refresh token, new accessToken      |
| POST   | `/forgot-password`       | No         | Store reset token in Redis (logs URL)      |
| POST   | `/reset-password`        | No         | Reset password via token                   |
| GET    | `/me`                    | Bearer JWT | Current user → `{ userId, email, role }`   |
| GET    | `/oauth/google`          | No         | Start Google OAuth (needs env credentials) |
| GET    | `/oauth/google/callback` | No         | OAuth callback → tokens                    |

## Seed users

> **⚠️ Broken as of 2026-07-30.** `npm run db:seed` (root) migrates/seeds the
> orphaned `@mindora/database` package, not the `mindora_auth` database this
> service actually reads from (`AUTH_DATABASE_URL`). Confirmed by direct
> query: **none of the 4 accounts below currently exist in `mindora_auth` (or
> anywhere else).** There is no working seed path for them right now — this
> table describes the intended dev accounts, not something you can currently
> get by running a command. See the root `README.md`'s Known Issues section.
>
> What **does** work:
>
> ```bash
> npm run seed -w @mindora/auth-service
> ```
>
> This seeds 30 fixed-UUID `THERAPIST` accounts with a shared dummy password
> (`Seeded-Therapist-Not-A-Real-Login-1!`) — not real logins, they exist only
> so `appointment-service`'s cross-service therapist check resolves. Pair
> with `npm run db:seed:profiles -w` in user-service for the matching
> profile data (8 of the 30 have a seeded photo — see root `CHANGELOG.md`).

| Role      | Email                           | Password         |
| --------- | ------------------------------- | ---------------- |
| PATIENT   | `patient@test.mindora.local`    | `Patient123!`    |
| THERAPIST | `therapist@test.mindora.local`  | `Therapist123!`  |
| THERAPIST | `therapist2@test.mindora.local` | `Therapist2123!` |
| ADMIN     | `admin@test.mindora.local`      | `Admin123!`      |

## Manual testing

See sprint docs for curl examples. OAuth requires Google Cloud Console credentials in `.env`.

## Docker

Build from the **repository root** (Node.js 24 Alpine):

```bash
docker build -f apps/auth-service/Dockerfile -t mindora/auth-service .
docker run --rm -p 3001:3001 --env-file .env mindora/auth-service
```
