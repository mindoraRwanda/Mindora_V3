# User Service

Profile management for Mindora patients and therapists.

## Prerequisites

- **Node.js 24+** (see root `.nvmrc`)

## Port

**3002** (direct) · **8000** via Kong (`/api/v1/users/*`)

## Endpoints

| Method | Path                          | Auth | Description                                    |
| ------ | ------------------------------ | ---- | ------------------------------------------------ |
| GET    | `/health`                      | No   | Health check                                   |
| GET    | `/me`                           | JWT  | Current user's profile (patient or therapist)  |
| PUT    | `/me`                           | JWT  | Update profile fields (bio, timezone, language)|
| PUT    | `/me/fcm-token`                 | JWT  | Register/update FCM push token                 |
| PUT    | `/me/notification-preferences`  | JWT  | Partial update of push/email/sms prefs         |
| GET    | `/{userId}/preferences`         | JWT  | Contact info + prefs (self, or SERVICE caller) |
| GET    | `/therapists`                   | JWT  | Paginated therapist directory                  |
| GET    | `/photos/*`                     | No   | Public — serves therapist profile photos       |

`TherapistProfile.photoUrl` (nullable) — seed-only for now, not yet settable
through `PUT /me`. Served as a static file from `public/therapist-photos/`
via the public `/photos` route above, deliberately outside JWT auth since an
`<img>` tag can't send one.

## Seed profiles

There's no root shortcut for auth-service's seed yet, so seed both directly:

```bash
npm run seed -w @mindora/auth-service   # 30 therapist AUTH accounts (dummy password —
                                         # NOT the patient@test.mindora.local-style logins,
                                         # see root README's Known Issues)
npm run db:seed:profiles                # 30 therapist profiles, 8 with a photoUrl
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
