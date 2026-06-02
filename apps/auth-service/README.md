# Auth Service

Authentication microservice for Mindora V3 — register, login, JWT access tokens, refresh cookies, and `/me`.

## Port

**3001** (direct) · **8000** via Kong (`/api/v1/auth/*`)

## Environment

Loads from repo root `.env` and `packages/database/.env`:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL (Prisma) |
| `REDIS_URL` | JWT blacklist (logout in Sprint 2) |
| `JWT_SECRET` | Access token signing (must match Kong dev secret) |
| `PORT` | Optional, default `3001` |

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check |
| GET | `/api/v1/auth/health` | No | Kong health path |
| POST | `/register` | No | Create user → `201 { userId }` |
| POST | `/login` | No | Login → `200 { accessToken }` + refresh cookie |
| GET | `/me` | Bearer JWT | Current user → `{ userId, email, role }` |

Kong strips `/api/v1/auth` prefix, so gateway paths are e.g. `/api/v1/auth/register`.

## Security

- Passwords: **Argon2id** (64MB memory, 3 iterations, parallelism 4)
- Access token: **15 minutes**, JWT in response body
- Refresh token: **7 days**, HttpOnly cookie, stored hashed in `refresh_tokens`
- Redis key pattern ready: `auth:blacklist:{jti}`

## Seed users

From repo root (Postgres + migrate required):

```bash
npm run db:seed
```

| Role | Email | Password |
|------|-------|----------|
| PATIENT | `patient@test.mindora.local` | `Patient123!` |
| THERAPIST | `therapist@test.mindora.local` | `Therapist123!` |
| ADMIN | `admin@test.mindora.local` | `Admin123!` |

## Manual test (curl)

```bash
# Register
curl -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"MyPass123!","role":"PATIENT"}'

# Login
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"MyPass123!"}' \
  -c cookies.txt

# Me (paste accessToken from login response)
curl http://localhost:3001/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Scripts

```bash
npm run dev -w @mindora/auth-service
npm run test -w @mindora/auth-service
```
