# Changelog

Notable backend changes, newest first. This is a working log for the team, not
a public release changelog — entries describe what changed and why.

## 2026-07-29 — 2026-07-30

### Added — Therapist profile photos

- `TherapistProfile.photoUrl` (nullable string) added to `apps/user-service/prisma/schema.prisma`
  via a new migration. Automatically included in `GET /me` and `GET /therapists`
  responses — no route code changes needed there.
- New public, unauthenticated static route for serving photo files — an
  `<img>` tag can't send a JWT, so this can't sit behind user-service's
  JWT-protected routes:
  - `apps/user-service/src/app.ts` — `express.static` mounted at both `/photos`
    (direct dev access) and `/api/v1/users/photos` (full gateway path).
  - `infrastructure/kong/kong.yml` — new `user-photos` route
    (`/api/v1/users/photos`, `strip_path: false`, no `jwt` plugin), same
    pattern as the existing health-check routes.
  - Photo files live in `apps/user-service/public/therapist-photos/` (not
    committed via a package, just static assets served directly).
- `apps/user-service/src/seed.ts` — 8 of the 30 seeded therapists (the ones
  shown first by the default `isAcceptingPatients: true, createdAt desc`
  listing) now carry a `photoUrl` pointing at the new route. The upsert's
  `update` clause now syncs `photoUrl` on reseed without touching any other
  field, so re-running the seed script is still safe against hand-edited dev
  data.
- Swagger: `TherapistProfile` schema and a new `/photos/{filename}` path added
  to `apps/user-service/src/docs/openapi.ts`.

**Not done / explicitly deferred:** no real upload endpoint exists yet — today's
photos are static files seeded onto disk, not something a therapist can
upload through the app. `PUT /me` doesn't accept `photoUrl` yet either. Both
are natural next steps if self-service photo upload at signup is wanted.

**Operational note:** the source photos were full camera-resolution JPEGs (up
to 5472×6511px, 4.8MB each). Proxying files that large through Kong triggers
nginx's disk-buffering path and is dramatically slower under concurrent
load — enough to look like a hang from the frontend (up to ~8s per image
during testing). All 8 were resized (longest edge capped at 800px, no forced
crop) and re-compressed before being committed; total size dropped from
~15MB to ~290KB. If more photos are added later, resize them first.

### Fixed — Async-crash safety audit (all 9 backend services)

Root cause: Express 4.x does not forward a rejected promise from an
`async (req, res) => {}` route handler to `next()` automatically. An
unhandled rejection there is a process-level crash, not a 500 for the one
bad request — one failing request could take the whole service down for
every user. Found while fixing a specific appointment-service crash (see
below) and then audited across every service.

- **`appointment-service`** — the actual bug: `book-appointment.ts` used
  `tx.$queryRaw` for `pg_advisory_xact_lock(...)`, a function that returns
  `void`. Prisma can't deserialize a `void` result set, so this was a
  100%-reproducible crash on every booking attempt (`P2010`). Fixed by
  switching to `tx.$executeRaw` (correct for a side-effect-only statement).
  Also added the `asyncHandler` wrapper + global error middleware described
  below, since the crash-safety gap was the reason one bad query took the
  whole process down instead of just failing one request.
- **`admin-service`** — had a global error middleware already, but it was
  dead code: nothing ever called `next(err)`, so it never ran. Added
  `asyncHandler`, wrapped all 11 handlers.
- **`ai-integration-service`**, **`auth-service`**, **`community-service`**,
  **`messaging-service`**, **`mood-tracking-service`** — none had either
  piece. Added `middleware/async-handler.ts` + global error middleware to
  each, wrapped every async route handler (auth-service's Passport OAuth
  callback needed a special IIFE + `.catch(next)` wrapper since it doesn't
  fit the standard `(req, res, next)` shape).
- **`user-service`**, **`notification-service`** — already had this pattern
  before this pass; used as the reference implementation for the rest.

**Bonus fix, found via `tsc` while wrapping admin-service, unrelated to the
crash-safety work:** `apps/admin-service/src/routes/admin.routes.ts`'s
`/alerts/:id/resolve` passed `req.params.id` (typed `string | string[]`)
directly to `prisma.system_alerts.findUnique` (expects `string`) with no
cast. Fixed to match the cast pattern already used by the neighboring
`/moderation/decrypt/:postId` route.

Every service verified individually (`tsc --noEmit` + full test suite) and
then together via `turbo run test` — 15/15 tasks passing.

### Fixed — Local dev environment

Not a code change, but worth recording since it'll recur: `npm run dev` was
failing across the board. Two independent causes:

1. Stale `node.exe` processes from earlier manual testing were still bound to
   ports 3001–3007, so every fresh service instance died with `EADDRINUSE`
   immediately on start.
2. The RabbitMQ and Kong containers had been killed (`Exited (137)`, from an
   earlier Docker Desktop restart) and were never brought back up.
   `admin-service` and `notification-service` both hard-`exit(1)` on any
   RabbitMQ connection failure at startup, with no retry — and `tsx watch`
   does not restart a process that has fully exited (only on file changes),
   so once RabbitMQ came back up those two still needed a manual restart.

No retry/backoff exists today for that RabbitMQ startup race — noted as a
possible follow-up, not yet done.
