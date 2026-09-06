# Changelog

Notable backend changes, newest first. This is a working log for the team, not
a public release changelog — entries describe what changed and why.

## 2026-09-06 (QA pass, part 3 — remaining findings closed out, production wiring)

### Fixed — chat messages were never actually encrypted at rest

`utils/encryption.ts` had a working `encryptContent`/`decryptContent` pair
and a `MESSAGE_ENCRYPTION_KEY` env var, and `conversations.routes.ts`
already called `decryptContent` on read — but nothing ever called
`encryptContent` on write. Every message ever sent through `socket.ts`'s
`send_message` (the only place messages are created) was stored as plain
text in MongoDB; `decryptContent`'s graceful pass-through on non-ciphertext
input (returns input unchanged if it's not the 3-part `iv:tag:data` format)
is exactly why this went unnoticed — reads never broke, they just silently
decrypted nothing. Fixed both write sites (`Message.create`,
`Conversation.lastMessage`) and both read sites that hadn't been updated to
match (`join_conversation`'s `message_history` emit, and
`conversations.routes.ts`'s list endpoint's `lastMessage` field — the
message-by-id REST endpoint already decrypted correctly). Live-verified:
sent a real message through a real socket connection, confirmed the client
receives plaintext but the row actually stored in MongoDB is ciphertext.
No migration needed — old plaintext rows keep displaying correctly via the
same pass-through behavior.

### Added — `messages_delivered` (delivery receipts) was silently a no-op

The frontend already had full UI for this (`MessagesView.tsx`'s
`MessageTicks`: single check → sent, double gray → delivered, double blue →
read) and its own comment spelling out exact semantics ("set once the
recipient actually opened the conversation... never regresses") — but
nothing on the backend ever emitted `messages_delivered` or set a
`deliveredAt` field, because the field didn't exist on the `Message` model
at all. Added the field and the logic: `join_conversation` now marks the
other participant's undelivered messages delivered and broadcasts the
event, matching the frontend's own documented semantics exactly.

### Implemented — `GET`/`DELETE /api/v1/ai/history` were 501 stubs the frontend already called

`ai-api.ts`'s `fetchAiHistory`/`deleteAiHistory` and their exact response
types (`AiHistoryResponse`, `DeleteAiHistoryResponse`) were already fully
specified frontend-side, including the nuance that `message`/`response` are
independently-nullable per row (an undecryptable row shouldn't break the
whole page) and that `remoteConversationDeleted: false` must be surfaced
honestly rather than reported as success. Implemented both against the
existing `AiInteraction` table; `DELETE` also best-effort deletes the
patient's conversation on the external chatbot vendor
(`chatbotClient.deleteRemoteConversation`, using the `/auth/conversations/{id}`
endpoint from the vendor's integration guide) and clears the cached
`conversation_id` so the next chat starts fresh, without letting a vendor-side
failure block deleting our own audit rows.

### Fixed — the same strip_path/CORS bugs found and fixed in kong.yml were still live in kong.railway.yml (production)

Never propagated across after the local-dev pass earlier in this file:
- `messaging-api` and `notification-api` had the same `strip_path: true`
  mismatch (both routes' target service mounts its router at the full
  path, not the stripped remainder) — same 404-through-the-gateway bug,
  now fixed in both files.
- Global CORS still had `origins: ['*']` with `credentials: true` directly
  (not hidden behind a duplicate-key bug like the local file — just
  configured that way outright). Restricted to the real frontend origin,
  `https://app.mindora.rw`.

### Added — messaging-service's Socket.io endpoint had no way to be reached publicly at all in production

Found while making sure the frontend's production config was actually
correct, not just copied from local dev. `DP.md` step 8 gives only **Kong**
a public domain — the bundle (all 11 services, including messaging-service)
gets none. Kong had no route for `/socket.io` in either config file. Net
result: real-time chat had no public path to the backend in the documented
production deployment at all; the frontend's own `.env.example` even
flagged its `NEXT_PUBLIC_SOCKET_URL` as an unresolved "placeholder... get
the real deployed host from the backend team before shipping" — this was
that missing piece. Added a `messaging-socket` route (proxies `/socket.io`,
deliberately no `jwt` plugin — the token travels inside the Engine.io
connect payload, which Kong's jwt plugin can't see; `socket.ts`'s own
handshake auth is what actually verifies it) to both `kong.yml` and
`kong.railway.yml`, updated the frontend's `.env.example` and
`messaging-socket.ts` comment (both previously said Kong could not do this
at all), and added a step to `DP.md`. Live-verified end to end locally: a
real `socket.io-client`, given a valid JWT, connects and authenticates
successfully through Kong's proxy port (8000), not just messaging-service's
own port (3006).

## 2026-09-06 (QA pass, part 2 — driving Mindora_III-frontend in a real browser)

Ran the actual Next.js frontend against this local stack (signup, login, home,
check-in, messages, therapy/appointments, reflect/AI chat, the admin-route
guard) with a headless-Chromium driver, not just unit tests.

### Fixed — messaging-service's Socket.io connection was CORS-blocked for every frontend origin

`corsOriginCallback` (`apps/messaging-service/src/lib/cors-origin.ts`) is
permissive unless `NODE_ENV === 'production'` — but the Docker image sets
`NODE_ENV=production`, and `docker-compose.yml` never set
`CORS_ALLOWED_ORIGINS`, so the strict branch ran with an empty allowlist.
Confirmed live: the browser's own socket.io polling handshake was blocked
with "blocked by CORS policy", independent of Kong (this connection bypasses
Kong entirely — see `messaging-socket.ts`'s own comment). Added a sane local
dev default (`http://localhost:3000,http://localhost:3010`) to
`docker-compose.yml`, same origins Kong already allows.

### Fixed — Kong's CORS allowlist didn't include the port Next.js actually used

Port 3000 was already taken by an unrelated process on this machine, so
Next.js fell back to 3010 — outside Kong's allowlist from the same-day CORS
fix above. Added `http://localhost:3010` alongside 3000. (Not a code bug,
but worth knowing: whichever port your frontend actually lands on needs to
be in both this list and the messaging one above, or every API call from
the browser silently fails CORS.)

### Investigated and ruled out (false leads, not bugs)

- **401 on `POST /auth/refresh` on first page load** — `AuthContext`'s
  mount-time "am I already logged in?" check, expected to fail before any
  session exists. Working as designed.
- **Two mood/feeling icons rendered as broken glyph boxes** on `/check-in`
  ("Good" 🙂, "Alive" 🌞) — these are plain Unicode emoji characters
  (`MoodEntryFields.tsx`), and this headless-Chromium sandbox has zero emoji
  fonts installed (`fc-list | grep emoji` → nothing). A real user's OS ships
  one. Not an app bug.
- **Next.js dev overlay's "N Issues" badge** — dev-mode tooling surfacing the
  app's own intentional `console.error` calls in `apiFetch` (e.g. the
  correctly-returned 403 from the admin-route-guard test) as a "Console
  Error" entry. Confirmed by clicking through to the actual entry. Doesn't
  appear in a production build; the underlying behavior is correct.
- **Empty "No therapists found" / empty "No conversations yet"** — the local
  Postgres has zero seeded `therapist_profiles` rows in this environment
  (`SELECT count(*)` confirmed 0); this is a missing-seed-data gap, not a
  code bug. `apps/auth-service/src/seed.ts` / `apps/user-service` seed
  scripts would populate it.
- **`/reflect` (AI chat) and its "Delete history" button** both surface
  backend responses gracefully (a red "AI companion is temporarily
  unavailable" banner for the `POST /chat` 502 — expected, `ai-integration-service`
  still has no real `MINDORA_INTEGRATION_KEY` in this environment per the
  earlier pass — and the dialog literally shows "Not implemented yet" for
  `GET`/`DELETE /history`, which really are unimplemented 501 stubs in
  `ai.routes.ts`, not something this pass built). No crash, no silent
  failure either way. Worth a product decision on friendlier wording for
  that raw "Not implemented yet" string if/when history read/delete gets
  built, but that's a feature gap, not a bug.
- **Admin route guard**, tested end-to-end as a real PATIENT account hitting
  `/admin/users`: redirects away from the page and the underlying API call
  correctly gets 403 (not a crash) — this is the admin-service Redis fix
  from earlier in this pass paying off.

## 2026-09-06 (QA pass)

A full test-and-fix pass across every service, run against the live local
docker-compose stack (not just unit tests) — registering real users, calling
every route through Kong, and reading container logs. Ordered roughly by
severity.

### Fixed — critical: public `/register` let any caller self-assign ADMIN

`POST /register` is public and unauthenticated (it has to be — you can't
present a token you don't have yet). It accepted a client-supplied `role`
field with **zero authorization check**, so `{"role": "ADMIN"}` in the
request body created a real admin account — live-confirmed: a plain `curl`
call with no credentials produced a working ADMIN JWT that passed `admin-api`'s
role gate. `apps/auth-service/src/routes/auth.routes.ts`'s `/register` now
hardcodes `role: 'PATIENT'`, full stop — the frontend already only ever sends
`PATIENT` (`SignupForm.tsx`), so this changes nothing for real users.
THERAPIST accounts are (and were already) provisioned by `seed.ts`; there is
no self-service path to ADMIN at all now. Two regression tests added
(`auth.routes.test.ts`).

### Fixed — critical: any THERAPIST could pull any patient's mood/mental-health report

`GET /report/:userId` in mood-tracking-service checked only that the caller's
JWT *role* was THERAPIST — never that the caller was *this patient's*
therapist. Any THERAPIST-role token could enumerate `userId`s and read 30
days of anyone's mood scores, sleep, stress and energy levels. Fixed by
adding `GET /internal/appointments/relationship/:therapistId/:patientId` to
appointment-service (the only service that knows who's treated whom) and
having mood-tracking-service check it before returning a report — same
cross-service pattern appointment-service's own `isTherapist()` already uses
against auth-service. Fails closed (403) if the check itself fails. Tests
added in both services.

### Fixed — critical: messaging-service's Socket.IO layer had no authentication at all

The REST side of messaging-service was properly JWT-gated; the real-time
side (`socket.ts`) was not — anyone could connect with zero credentials and:
join any conversation by ID (a guessable/enumerable Mongo ObjectId) and read
its history and every future message; send a message with a client-supplied
`senderId` impersonating any other user; spoof anyone's typing indicator or
online/offline presence. Fixed with a Socket.IO handshake middleware
(`io.use`) that verifies a JWT the same way the REST layer does (signature,
blacklist, suspension) and sets `socket.data.userId` from it; every handler
now derives identity from that instead of the client payload, and
`join_conversation`/`send_message`/`mark_read` now check the caller is
actually a participant before doing anything. The frontend's
`messaging-socket.ts` already assumed this contract (its own comment says
so, and it already omits `senderId`/`userId` from its emitted payloads) —
this was a backend gap, not a frontend one. 18 tests in `socket.test.ts`
(rewritten to authenticate every test connection).

### Added — `mark_conversation_read` (batched read receipts) was missing entirely

While fixing the above, found the frontend already calls
`markConversationRead()` (emits `mark_conversation_read`) and listens for a
`conversation_read` broadcast — neither existed anywhere in `socket.ts`, so
that call silently did nothing (no handler, no error). Implemented as the
batched sibling of the existing single-message `mark_read`: marks every
message not sent by the caller as read in one write, zeroes the
conversation's unread counter, and broadcasts one `conversation_read` event
instead of one `message_read` per message. `messages_delivered` (a separate
event the frontend also listens for) is still unimplemented — its semantics
("delivered to device" vs "read") need a product decision this pass didn't
make; flagging rather than guessing.

### Fixed — 4 services silently couldn't reach RabbitMQ or Redis in docker-compose

`auth-service`, `user-service`, `community-service`, and `messaging-service`
all use `@mindora/queue` and/or the shared JWT blacklist/suspension check,
both of which default to `localhost` when their env var isn't set — fine on
a host machine, silently wrong inside a container. None of the four had
`RABBITMQ_URL` set in `docker-compose.yml`; `admin-service` and
`community-service` were additionally missing `REDIS_URL`. Live impact,
confirmed by reproducing each one:
- **auth-service → user-service, `user.registered` event:** never delivered.
  New registrations got no `PatientProfile` row at all — `GET /users/me`
  404'd forever for every new signup. Fixed and re-verified end-to-end
  (register → event → profile auto-created → 200).
- **admin-service:** any request crashed with a raw `ioredis`
  `ECONNREFUSED`/"Connection is closed" error surfaced as a 500, including
  to a legitimately-authorized ADMIN — not just the 403 a non-admin should
  see. Now correctly returns 403 for non-admins and works for admins.
- **community-service, messaging-service:** their own event-driven features
  (moderation/notification fan-out, message-received events) were silently
  no-ops the same way. Fixed.

### Fixed — Kong `strip_path` mismatches on `messaging-api` and `notification-api` (two more of the same bug class already partially fixed here before)

`kong.yml` already had comments documenting this exact bug for
`community-api`/`ai-api` (routes that mount their Express router at the full
`/api/v1/...` path, not the stripped remainder) — the same bug existed,
unfixed, on two more routes:
- `messaging-api`: `GET /api/v1/messaging/conversations` 404'd
  (`Cannot GET /conversations`) through Kong; worked only when called
  directly against the service, which is how it evaded detection.
- `notification-api`: `GET /api/v1/notifications/logs` 404'd the same way
  (`Cannot GET /logs`).
Both now `strip_path: false`, matching the existing fixed routes.

### Fixed — ai-integration-service's own health check couldn't pass — no Docker healthcheck at all as a result

`GET /health` was registered *after* `app.use(authenticate)`, so an
unauthenticated request (which is what both Kong's health route and a Docker
healthcheck send) always got 401. `docker-compose.yml` had a comment
explaining why this service was the only one with **no** `healthcheck:`
block at all, as a workaround. Moved both health routes before the auth
middleware (same position every other service uses) and added the missing
healthcheck block — container now correctly reports `(healthy)`.

### Fixed — duplicate top-level `plugins:` key in `kong.yml` silently disabled the real CORS policy

YAML doesn't error on a repeated map key — it just keeps one. `kong.yml` had
**two** top-level `plugins:` blocks: an old one (`origins: ['*']`,
`credentials: true`, intended for a mobile app's web build) and a newer one
(`origins: ['http://localhost:3000']`, the actual frontend's origin, with a
comment explicitly explaining "must never be `*` when credentials is true").
Confirmed via Kong's own `/plugins` admin API that only the wildcard block
was ever actually loaded — the origin-restricted policy the comment
describes had never been in effect. Net effect: Kong was reflecting *any*
request's `Origin` header with `Access-Control-Allow-Credentials: true`,
not enforcing the intended allowlist. Merged into one block (kept the
restrictive policy, merged in the first block's extra headers); verified via
`/plugins` that exactly one `cors` plugin now loads, and via a live preflight
that a disallowed origin no longer gets reflected.

### Fixed — Kong container's bind mount broke after this repo was relocated on disk

Unrelated to the above: `docker compose restart kong` failed outright
(`mount ... not a directory`) because the running container's bind mount for
`kong.yml` still pointed at this repo's *previous* path (it was moved to a
new parent directory earlier in this working session). `docker compose up -d
--force-recreate kong` re-resolves the mount from the compose file's current
location and fixed it. Only `postgres` and `kong` bind-mount a host path in
this compose file; postgres had already self-healed via an earlier
unrelated restart, kong hadn't.

### Fixed — 7 services would fail to build on a truly fresh install

`admin-service`, `ai-integration-service`, `appointment-service`,
`auth-service`, `mood-tracking-service`, `notification-service`, and
`user-service` each own a Prisma schema but had no `postinstall: prisma
generate` — a fresh `npm install` (fresh clone, CI, a new machine) left the
generated client missing entirely, so `npm run build` failed until someone
remembered to run `prisma generate` by hand in each of the 7 directories.
Added the missing script to all 7.

### Fixed — both repos' `node_modules` were corrupted

Backend: `eslint` had no `package.json`/bin in `node_modules` at all despite
being listed in the lockfile (breaking `npm run lint` across most packages
with an unrelated-looking "ESLint couldn't find a configuration file"
error), and `debug` (a transitive dependency vitest's runtime needs) was
missing too (breaking `npm run test` for at least one package with
`ERR_MODULE_NOT_FOUND`). Frontend: `framer-motion` was listed in the
lockfile but not present on disk, breaking the Next.js build. Clean
reinstall (`rm -rf node_modules && npm install`) fixed both; `package-lock.json`
diff after the reinstall is minimal (just `hasInstallScript` flags from the
postinstall additions above).

### Fixed — stale `.next` build cache caused a false type-check failure (frontend)

`tsc --noEmit` failed on a generated route-types file referencing a page
(`(app)/circle`) that no longer exists in `src/app` — a leftover from an
older `.next` build. `.next` is gitignored as expected; clearing it and
rebuilding resolved it with no source change needed.

### Removed — dead code: duplicate, unused `verifyAccessToken` in auth-service

`apps/auth-service/src/lib/tokens.ts` exported its own `verifyAccessToken`
that nothing imported — `auth.routes.ts` uses the one from
`@mindora/auth-middleware` instead, under the same name. Removed the dead
one to avoid future confusion between two functions with the same name and
different signatures.

## 2026-09-06

### Changed — ai-integration-service: switched to the chatbot vendor's new `/integration/session` auth

The external Therapy Chatbot API (`THERAPY_CHATBOT_BASE_URL`) retired its
per-patient signup/login flow in favor of a server-to-server session
exchange: `POST /integration/session` with a shared `X-Integration-Key`,
`external_id` (our stable Mindora user id) and the patient's real email,
returning a short-lived bearer token. `src/chatbotClient.ts` now calls this
instead of `/auth/signup` + `/auth/login`, so there's no per-patient password
to generate, encrypt, or use to re-login on expiry — a stale cached token is
simply re-requested (the vendor says this is safe and idempotent).

- **`chatbot_accounts.chatbot_password` column dropped** (migration
  `20260906120000_drop_chatbot_password`) — nothing reads or writes it
  anymore.
- **New required env var: `MINDORA_INTEGRATION_KEY`.** Server-side only,
  never sent to a browser. Get the real value from the chatbot vendor via a
  password manager.
- **`THERAPY_CHATBOT_BASE_URL` default corrected** from a dead Railway URL
  (`mindoraversiontwo-production.up.railway.app`, now 404s) to the vendor's
  current production domain, `https://chatbot.mindora.rw`. This was live in
  `docker-compose.yml`'s default — every chat request was failing in the
  running dev stack until this was fixed.
- **`chatWithBot()` now takes the patient's real email**, not the synthetic
  `${mindoraUserId}@mindora-patients.internal` address the old signup flow
  needed — the vendor uses the real address to match/link pre-existing
  accounts by email.
- Also fixed while touching this stack: every service with its own Prisma
  schema (`admin-service`, `ai-integration-service`, `appointment-service`,
  `auth-service`, `mood-tracking-service`, `notification-service`,
  `user-service`) was missing a `postinstall: prisma generate` — a fresh
  `npm install` left the generated client missing and `npm run build` failing
  until someone remembered to run `prisma generate` by hand in each service.

## 2026-08-07

### Added — Mood check-in: today-status, editing, backdating, dashboard summary

`apps/mood-tracking-service`, filling gaps that made a proper check-in screen
un-buildable.

- **`GET /today`** — answers "has the user already checked in today?" directly,
  returning `{ hasCheckedIn, localDate, timezone, entriesToday, remainingToday,
entry }`. Previously the client had to fetch `/history` and do date maths it
  couldn't do correctly. Takes an optional `?timezone=` IANA name; new
  DST-correct day-boundary helper at `src/lib/local-day.ts`.
- **`POST /log` accepts an optional `recordedAt`** so a user can backfill a
  missed day. Bounded: not in the future (5 min clock-skew tolerance), not more
  than 365 days ago. The 10/day cap still counts writes made _today_ regardless
  of the day recorded for — it's a write-rate limit, so backfilling a batch
  still draws down the same allowance.
- **`PUT /:id` and `DELETE /:id`** — entries were previously immutable. Scoped
  to the caller's own entries; a 404 deliberately doesn't distinguish "no such
  entry" from "someone else's", so entry existence isn't leaked. `PUT` re-runs
  the `mood.concern` safety check, since revising a score downward is the same
  signal as logging it low initially.
- **`GET /summary`** — bucketed aggregates over an arbitrary range and
  granularity (`day`/`week`/`month`) for the dashboard chart. Distinct from
  `/history` (raw paginated rows) and `/insights` (fixed 3-month weekly window,
  Redis-cached). `avgMood` is entry-count-weighted, so it matches a plain
  average over the underlying entries rather than an average of averages.

**Two storage constraints worth knowing, both verified against the live
database rather than assumed:**

1. **`recordedAt` cannot be edited.** `mood_entries` is a TimescaleDB
   hypertable partitioned on `recorded_at`; an `UPDATE` that would move a row
   into another chunk is rejected outright (`new row for relation
"_hyper_1_2_chunk" violates check constraint`). Correcting a date means
   delete + re-log. `updateMoodSchema` therefore has no `recordedAt` field.
2. **`PUT`/`DELETE` use `updateMany`/`deleteMany`, not `update`/`delete`.** The
   composite primary key `[id, recordedAt]` (required by the hypertable
   partitioning) means `id` alone isn't a unique selector Prisma accepts. The
   many-variants take an arbitrary filter, which also lets ownership be
   enforced in the same statement instead of a racy read-then-write.

Verified with `tsc --noEmit`, the existing 13-test suite, and a 24-check
end-to-end run against the real hypertable covering create, backdate,
future-date rejection, today-status, edit, null-clearing, ownership 404s,
summary bucketing, and delete.

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
