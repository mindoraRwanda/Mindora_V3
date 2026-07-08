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
