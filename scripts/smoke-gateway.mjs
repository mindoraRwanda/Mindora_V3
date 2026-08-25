#!/usr/bin/env node
/**
 * Gateway smoke test — proves every service is actually reachable *through Kong*.
 *
 * Why this exists as its own thing: every service's test suite drives Express
 * directly via supertest, so nothing in `turbo run test` ever crosses the
 * gateway. That leaves Kong's path handling completely untested, and the same
 * bug has now shipped four times — community-api, ai-api, messaging-api and
 * notification-api each had `strip_path: true` while the service expected the
 * full `/api/v1/<name>/...` path. Every route 404s, the service looks healthy,
 * and it is only ever caught by a person clicking through the UI.
 *
 * What it checks: one real route per service, requested through Kong. It does
 * not assert on business responses — 200, 401, 403, 400 and 429 all prove the
 * request reached the service and was routed correctly. The failures it looks
 * for are the two shapes that mean routing is broken:
 *
 *   - Express's `Cannot GET /x` HTML — Kong forwarded a path the service does
 *     not serve. This is the strip_path mismatch.
 *   - Kong's own `no Route matched` — no route is configured for the prefix.
 *   - 502/503 — the route exists but the upstream is not running.
 *
 * Usage:
 *   npm run smoke:gateway                 # expects the stack to be up
 *   GATEWAY_URL=http://host:8000 npm run smoke:gateway
 *
 * Exits non-zero if any check fails, so CI can run it against a compose stack.
 */
import { createHmac } from 'node:crypto';

const GATEWAY = process.env.GATEWAY_URL ?? 'http://localhost:8000';
const JWT_SECRET =
  process.env.JWT_SECRET ?? 'mindora-dev-jwt-secret-change-in-production';
const JWT_ISSUER = process.env.JWT_ISSUER ?? 'mindora-auth';
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS ?? 10_000);

// A real, existing route per service. Kept to GETs with no side effects — this
// runs against live environments, so it must never write anything.
//
// Each path must also be one that cannot 404 for *data* reasons, since a 404 is
// how this test recognises a routing failure. '/api/v1/users/me' is the trap
// here: it answers `{"message":"Profile not found"}` with a 404 for the
// synthetic token below, which looks identical to a broken route at the status
// level. '/therapists' is a list endpoint — empty is still 200.
//
// When adding a service, add it here too: a service absent from this list is a
// service whose gateway wiring nothing verifies.
const CHECKS = [
  { service: 'auth', path: '/api/v1/auth/health', auth: false },
  { service: 'users', path: '/api/v1/users/therapists?limit=1' },
  { service: 'appointments', path: '/api/v1/appointments/mine' },
  { service: 'mood', path: '/api/v1/mood/streak' },
  { service: 'community', path: '/api/v1/community/groups' },
  { service: 'messaging', path: '/api/v1/messaging/conversations?limit=1' },
  { service: 'ai', path: '/api/v1/ai/usage' },
  { service: 'notifications', path: '/api/v1/notifications/logs?limit=1' },
  { service: 'admin', path: '/api/v1/admin/users?limit=1' },
  { service: 'docs-gateway', path: '/docs', auth: false },
];

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Mints an access token locally rather than calling POST /login, so the smoke
 * test needs no seeded credentials and stays read-only. Kong's jwt plugin and
 * the services verify with the same shared secret.
 */
function mintToken() {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(
    JSON.stringify({
      sub: '00000000-0000-4000-8000-000000000000',
      email: 'smoke@mindora.local',
      role: 'PATIENT',
      iss: JWT_ISSUER,
      iat: now,
      exp: now + 300,
    })
  );
  const signature = createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${header}.${payload}.${signature}`;
}

/**
 * Classifies a response as routed-correctly or not.
 *
 * A 401/403 counts as a pass on purpose: the smoke test's job is to prove the
 * request reached the right service, not to prove this synthetic user has
 * access. Tightening it to expect 200 would make the check depend on seeded
 * data and start failing for reasons that have nothing to do with routing.
 */
function classify(status, body) {
  if (status === 502 || status === 503) {
    return { ok: false, reason: `upstream unreachable (${status})` };
  }
  if (/Cannot (GET|POST|PUT|PATCH|DELETE) /.test(body)) {
    const received = body.match(/Cannot \w+ ([^<\s]*)/)?.[1] ?? '?';
    return {
      ok: false,
      reason: `service received '${received}' — Kong forwarded a path it does not serve (check strip_path)`,
    };
  }
  if (/no Route matched/i.test(body)) {
    return { ok: false, reason: 'no Kong route configured for this prefix' };
  }
  if (status === 404) {
    return {
      ok: false,
      reason:
        '404 — route missing at the gateway or service (or this probe path 404s on missing data; see CHECKS)',
    };
  }
  return { ok: true, reason: `${status}` };
}

/**
 * One retry on transport errors only.
 *
 * Immediately after `docker restart mindora-kong`, the first request to a given
 * upstream can exceed the timeout while the connection is established — which
 * showed up here as two services "failing" with no routing problem at all. A
 * smoke test that cries wolf gets ignored, so a transport error is retried once
 * before being reported. Routing verdicts are never retried: those are
 * deterministic, and retrying them would only hide real breakage.
 */
async function check({ service, path, auth = true }, token) {
  const url = `${GATEWAY}${path}`;
  let lastError;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: auth ? { Authorization: `Bearer ${token}` } : {},
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const body = await response.text();
      return { service, path, ...classify(response.status, body) };
    } catch (error) {
      lastError = error;
    }
  }

  return {
    service,
    path,
    ok: false,
    reason: `request failed twice: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  };
}

const token = mintToken();
console.log(`Gateway smoke test → ${GATEWAY}\n`);

const results = [];
for (const entry of CHECKS) {
  const result = await check(entry, token);
  results.push(result);
  const mark = result.ok ? 'PASS' : 'FAIL';
  console.log(
    `  ${mark}  ${entry.service.padEnd(14)} ${entry.path.padEnd(46)} ${result.reason}`
  );
}

const failures = results.filter((r) => !r.ok);
console.log('');
if (failures.length === 0) {
  console.log(`All ${results.length} services routed correctly through Kong.`);
  process.exit(0);
}
console.error(
  `${failures.length} of ${results.length} failed: ${failures.map((f) => f.service).join(', ')}`
);
process.exit(1);
