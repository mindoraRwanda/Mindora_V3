## What changed and why
<!-- One paragraph: what this PR does and the reason behind it. Link the issue if one exists. -->

Closes #<!-- issue number -->

---

## Type of change
<!-- Check all that apply -->
- [ ] Bug fix
- [ ] New feature
- [ ] Refactor (no behaviour change)
- [ ] Performance improvement
- [ ] Tests only
- [ ] CI / infrastructure
- [ ] Documentation
- [ ] Breaking change ← fill in the section below

---

## Affected service(s)
<!-- Check every service whose code, tests, or config changed -->
- [ ] `auth-service`
- [ ] `user-service`
- [ ] `admin-service`
- [ ] `appointment-service`
- [ ] `mood-tracking-service`
- [ ] `messaging-service`
- [ ] `community-service`
- [ ] `notification-service`
- [ ] `ai-integration-service`
- [ ] `packages/database` (schema / migrations)
- [ ] `packages/shared-types`
- [ ] `packages/validation`
- [ ] `packages/queue`
- [ ] Infrastructure / CI

---

## Testing
<!-- Describe what you tested and how. "CI passed" alone is not enough. -->

**Manual steps to verify:**
1.
2.

**Test coverage:**
- [ ] Unit tests added / updated
- [ ] Integration tests added / updated
- [ ] Existing tests still pass locally (`npm run test`)

---

## Database migrations
<!-- Skip if no schema changes -->
- [ ] No database changes
- [ ] Migration added and applied locally (`npm run db:migrate`)
- [ ] Migration is backwards-compatible (no destructive column drops in this PR)
- [ ] Seed data updated if required

---

## Security
<!-- This platform handles sensitive mental health data. Answer honestly. -->
- [ ] No secrets, tokens, or credentials added to code or config files
- [ ] User input is validated before use (schema validation / parameterised queries)
- [ ] No new endpoints bypass authentication / authorisation
- [ ] Sensitive data is not logged

---

## Breaking changes
<!-- Complete this section only if "Breaking change" is checked above -->
**What breaks:**

**Migration path for consumers:**

---

## Reviewer notes
<!-- Anything the reviewer should know: tricky logic, known limitations, follow-up tickets -->
