# Backend — Known Security Limitations

## Internal Service Authentication

Community Service authenticates to User Service using a non-expiring JWT
stored in environment variables. This is an interim solution. Before
production: replace with rotating service credentials managed via AWS
Secrets Manager, with automatic rotation on a 30-day cycle.

If the token is ever compromised: regenerate via
`apps/auth-service/scripts/generate-service-token.ts`, update
`INTERNAL_SERVICE_TOKEN` in all consuming services, and redeploy.

# Known Limitations and Future Improvements

## User/Therapist Profiles

User/Therapist Profiles: notificationPreferences column has been removed from
patient_profiles and therapist_profiles. Notification preference enforcement
(e.g. allowing users to disable push, email, or SMS per channel) is a planned
feature but was deferred due to sprint timeline constraints. When implemented,
the column should be added back as a JSONB field with a defined schema, and
the Notification Service preference enforcement logic (currently a stub) should
be completed to read from it.

Update: notificationPreferences column re-added as a properly typed Json
field with default {push: true, email: true, sms: true}. All channels
enabled by default — users must explicitly opt out.

**Channel toggles are fully independent — `push` is not a master switch.**
Disabling `push` only stops push notifications; `email` and `sms` deliveries
for the same event are unaffected, and vice versa for either of the other
two. Each channel is checked separately in
`apps/notification-service/src/consumers.ts` via `sendPushIfEnabled` /
`sendEmailIfEnabled` / `sendSmsIfEnabled` — three independent lookups against
the same `notificationPreferences` object, with no cross-channel logic
between them. Verified live (2026-07-10): setting `push: false` for a test
patient and publishing `appointment.booked` produced `push: skipped` +
`email: delivered` in `notification_logs` — email went through normally.

## Push Notifications (FCM) — Dev Account Usage

FCM token registration and delivery are currently tested end-to-end using a
personal developer's Google/Firebase account (Firebase project
`mindora-v3-dev`, service account credential and web app config owned by an
individual, not Mindora). This is expected and fine for now: FCM tokens are
bound to the specific browser/device that generated them, not to an email
address — each end user's own device will generate its own token through the
React Native app once that's built, the same way `front-end-test-files/fcm-test.html`
does for manual testing today. The personal test token seeded into
`patient_profiles`/`therapist_profiles.fcm_token` during development is not
tied to any real user's identity.

**Before production deployment:** the Firebase project itself must move to a
company-owned Google account (project ownership/billing, not per-device
tokens — those remain per-device regardless). Re-point
`FIREBASE_SERVICE_ACCOUNT_JSON` (and the `firebaseConfig` in any client code)
at the company's Firebase project once it exists.

**`front-end-test-files/` must be deleted before production.** It's a manual
dev-only harness (`fcm-test.html` + `firebase-messaging-sw.js`) for generating
a browser FCM token and observing push delivery outside the real app — it
embeds the personal dev Firebase project's public web config (`apiKey`,
`vapidKey`, etc.) directly in a static HTML file with no auth in front of it.
Fine for local testing; not something to ship. Delete the whole directory once
the real React Native app handles token registration, or at the latest before
any production deploy.

**FCM messages are sent as `data`, not `notification` — this needs revisiting
for the real mobile app.** `sendPushNotification()` in
`apps/notification-service/src/fcm.ts` sends `{ token, data: { title, body } }`
rather than `{ token, notification: { title, body } }`. This was a deliberate
fix (2026-07-10): a `notification` payload makes the browser auto-display it
while backgrounded, *in addition to* our own service worker's
`onBackgroundMessage` also calling `showNotification()` with the same
content — two independent triggers, same popup, appearing as a duplicate
notification regardless of tab focus. Switching to `data` means only our own
code ever calls `showNotification()`, so this is fixed for the web test
harness (`front-end-test-files/`), and the notification the user sees still
contains the full title and body — nothing is lost, since our SW code passes
both into `showNotification()` itself.

**Caveat for the eventual React Native app:** this data-only approach needs to
be re-validated once real mobile push is built. Android generally wakes a
killed (not just backgrounded) app for data messages without extra config;
iOS is stricter and often needs either a `notification` field, or
`content-available` plus proper background-mode capabilities configured, to
reliably wake a fully-killed app and construct a local notification. If a
killed-app notification isn't showing up on iOS with the current data-only
approach, this is the first thing to check — likely needs either an APNs
background-mode entitlement or a hybrid payload shape (data primarily, with a
minimal notification field the native SDK is told to suppress from
auto-display) rather than reverting to a pure notification payload, which
would reintroduce the double-notification bug this fixed.

**Flagged for later, not FCM-related, do not action yet:** Resend (email) and
Africa's Talking (SMS) both currently use personal/sandbox credentials
(`RESEND_EMAIL_API_KEY`, `AT_API_KEY`/`AT_USERNAME=sandbox` in `.env`).
Unlike FCM, these two *do* require a company identity before production —
Resend needs a verified sending domain, Africa's Talking needs a registered
sender ID. Out of scope for the current task; raised here so it isn't lost.

## Notification Delivery Log — Timezone Convention

`notification_logs` (in its own `mindora_notifications` database, not the
shared `mindora` one) stores `createdAt`/`deliveredAt` as
`timestamp without time zone`, always written in **UTC** via Prisma's
`@default(now())`. This is the correct way to store timestamps — always
UTC, convert only for display — and should **not** be changed to store
local time directly.

`GET /api/v1/notifications/logs` ([notifications.routes.ts](apps/notification-service/src/routes/notifications.routes.ts))
adds `createdAtKigali`/`deliveredAtKigali` alongside the raw UTC
`createdAt`/`deliveredAt` fields, converted to `Africa/Kigali` (UTC+3) and
formatted as ISO 8601 with the `+03:00` offset baked into the string itself —
e.g. `2026-07-10T20:02:53.958+03:00` — so the timezone is unambiguous from
the value alone, no separate label needed. The raw UTC fields are kept
untouched for anyone consuming the API programmatically.

**Why this matters / what tripped us up during testing (2026-07-10):** Rwanda
is UTC+3 with no DST, so a flat 3-hour offset is always correct — but it's
easy to misread a raw UTC `createdAt` against a local wall clock and wrongly
conclude a log entry is missing or stale when it's actually just displayed 3
hours "behind." If a future timezone needs supporting (a region observing
DST), the flat-offset approach in `toKigaliIso()` will need replacing with a
proper timezone-aware conversion (e.g. `Intl.DateTimeFormat` with `timeZone`)
— the current fixed `+3h` shift is only correct for Kigali specifically.

## Future Improvements — V4

**SMS Notifications:** Africa's Talking SMS delivery is implemented but disabled
by default (`SMS_ENABLED=false`). The `sendSms()` helper and Africa's Talking
SDK integration are complete. Consumer wiring currently covers the `ai.crisis`
event only (`handleAi` in `apps/notification-service/src/consumers.ts`) —
**`appointment.reminder` is not implemented anywhere in this codebase**; there
is no reminder-scheduling logic or consumer for it yet, despite being a
planned event name. To enable SMS for production:
1. Set `SMS_ENABLED=true` in environment variables
2. Configure `AT_API_KEY`, `AT_USERNAME`, `AT_SENDER_ID` with live credentials
3. Register a sender ID with Africa's Talking for Rwanda
4. Build the `appointment.reminder` event + consumer if that reminder feature is still wanted
5. Test with real phone numbers before launch

## Community Service — Known Issues and Deferred Items

**Deployment status:** Not included in initial deployment per CEO decision.

**What works:**
- Community group creation, listing, pagination
- Anonymous and non-anonymous post creation with AES-256-GCM author encryption
- Comments with atomic commentCount increments
- Reactions (LIKE, HEART, SUPPORT)
- Content reporting with RabbitMQ event publishing to mindora.community
- JWT authentication on all protected routes
- Seed script and Vitest test suite (14/14 passing)

**Known gaps:**
- Author name resolution: GET /groups/:id/posts returns userName: "Unknown" 
  for all non-anonymous posts. Root cause: inter-service call to User Service
  via @mindora/http-client is implemented but userName is returning null from
  User Service because patient_profiles table population via RabbitMQ consumer
  is not yet confirmed working end-to-end. Fix: confirm user.registered event
  consumer in User Service is creating profiles correctly, then re-test.

- avatarUrl: always returns null — PatientProfile and TherapistProfile schemas
  do not include an avatar_url column. Deferred feature.

- Internal service JWT auth: implemented via Kong /internal/users route with
  INTERNAL_SERVICE_TOKEN. Confirmed working (200 on Test 1). End-to-end author
  resolution still returning Unknown — likely profile table population issue,
  not auth issue.
