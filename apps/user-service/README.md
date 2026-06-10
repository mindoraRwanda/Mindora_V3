# User Service

Profile management for Mindora patients and therapists.

## Port

**3002** (direct) · **8000** via Kong (`/api/v1/users/*`)

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check |
| GET | `/me` | JWT | Current user's profile (patient or therapist) |
| PUT | `/me` | JWT | Update profile fields |
| GET | `/therapists` | JWT | Paginated therapist directory |

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
