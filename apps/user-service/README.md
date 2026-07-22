# User Service

Profile management for Mindora patients and therapists.

## Prerequisites

- **Node.js 24+** (see root `.nvmrc`)

## Port

**3002** (direct) · **8000** via Kong (`/api/v1/users/*`)

## Endpoints

| Method | Path          | Auth | Description                                   |
| ------ | ------------- | ---- | --------------------------------------------- |
| GET    | `/health`     | No   | Health check                                  |
| GET    | `/me`         | JWT  | Current user's profile (patient or therapist) |
| PUT    | `/me`         | JWT  | Update profile fields                         |
| GET    | `/therapists` | JWT  | Paginated therapist directory                 |

## Seed profiles

After auth users are seeded:

```bash
npm run db:seed
npm run db:seed:profiles
```

## Test credentials

See `apps/auth-service/README.md` for login users. Profiles are created for:

- `patient@test.mindora.local`
- `therapist@test.mindora.local`
- `therapist2@test.mindora.local`

## Docker

Build from the **repository root** (Node.js 24 Alpine):

```bash
docker build -f apps/user-service/Dockerfile -t mindora/user-service .
docker run --rm -p 3002:3002 --env-file .env mindora/user-service
```
