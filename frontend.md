# Frontend — `apps/patient-app`

Documentation of the patient-facing Next.js frontend added to the Mindora V3 monorepo, and everything done to it so far. Written to be accurate as of the work completed in this session — update it as the app evolves.

## Stack

- **Next.js 16.2.10** — App Router only (no Pages Router), TypeScript, `src/` directory, `@/*` import alias, Turbopack by default for `dev`/`build`.
- **React 19.2.7** / **react-dom 19.2.7**.
- **Tailwind CSS v4** (`4.3.3`) — CSS-first configuration, no `tailwind.config.ts`.
- **shadcn/ui** (`base-nova` style, Base UI primitives, not Radix) — `components.json` at `apps/patient-app/components.json`.
- **TanStack React Query v5** (`@tanstack/react-query` + `-devtools`) for server state.
- **Custom auth scaffolding** — in-memory access token + HttpOnly refresh-token cookie, matching the backend Auth Service's design.
- **ESLint 9.39.5**, native flat config (`eslint.config.mjs`), via `eslint-config-next@16.2.10`. Linting is now a standalone `npm run lint` step (`eslint .`) — `next build` no longer runs lint internally as of Next 16. See [Next.js 14 → 16 upgrade](#nextjs-14--16-upgrade) below for how this got here.

## Folder structure

```
apps/patient-app/
├── .env.local, .env.example          # NEXT_PUBLIC_API_URL=http://localhost:8000
├── eslint.config.mjs                 # native flat config: eslint-config-next/core-web-vitals + /typescript
├── components.json                   # shadcn/ui config
├── next.config.mjs
├── postcss.config.mjs                # @tailwindcss/postcss plugin only
├── package.json
└── src/
    ├── app/
    │   ├── globals.css               # Mindora design tokens (Tailwind v4 @theme block)
    │   ├── layout.tsx                # Inter font + <Providers> wrapper
    │   ├── page.tsx                  # redirects to /login
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   └── register/page.tsx
    │   ├── (app)/
    │   │   ├── layout.tsx            # wraps children in <AppLayout>
    │   │   ├── home/page.tsx
    │   │   ├── check-in/page.tsx
    │   │   ├── therapy/page.tsx
    │   │   ├── reflect/page.tsx
    │   │   └── circle/page.tsx
    │   └── admin/page.tsx
    ├── components/
    │   ├── auth/RouteGuard.tsx       # redirects unauthenticated users to /login
    │   ├── layout/Sidebar.tsx        # nav, crisis block, user/logout
    │   ├── layout/AppLayout.tsx      # RouteGuard + Sidebar wrapper
    │   └── ui/                       # shadcn: button, input, label, card, badge, avatar, separator, sonner
    ├── contexts/AuthContext.tsx      # AuthProvider + useAuth()
    └── lib/
        ├── api.ts                   # in-memory token store + apiFetch() with silent refresh
        ├── providers.tsx            # QueryClientProvider + AuthProvider
        └── utils.ts                 # shadcn's cn() helper
```

All pages under `(auth)`/`(app)`/`admin` currently render placeholder text only — no real page content has been built yet. `(auth)` routes have no sidebar; `(app)` routes are wrapped in `AppLayout` (sidebar + `RouteGuard`).

## Auth architecture

- **Access token**: held only in a module-level in-memory variable in `src/lib/api.ts` (`setAccessToken`/`getAccessToken`), never written to `localStorage` or a regular cookie. React state in `AuthContext` mirrors it for re-renders.
- **Refresh token**: an HttpOnly cookie set by the backend Auth Service. Never touched by frontend JS — sent automatically via `credentials: 'include'` on every `apiFetch` call.
- **Silent refresh flow**: on mount, `AuthProvider` calls `POST /api/v1/auth/refresh`; if it succeeds the user is considered logged in. `apiFetch` also retries once on a 401 by calling the same refresh endpoint before giving up and throwing `'UNAUTHORIZED'`.
- **`RouteGuard`**: wraps `(app)` routes, redirects to `/login` if unauthenticated, or to `/home` if `requiredRole` doesn't match the logged-in user's role.

## Design tokens

`src/app/globals.css` defines all Mindora tokens in a Tailwind v4 `@theme` block, using `oklch()` colour values (never hex, per the v4 migration). Key groups:

- Primary purple (`--color-primary`, `-dark`, `-light`), dark canvas (`--color-bg-dark/card/elevated`), auth-page tokens, text tokens, border tokens, status tokens (success/warning/error/crisis).
- A **shadcn-compatibility block** — `--color-background`, `-foreground`, `-primary`, `-secondary`, `-muted`, `-accent`, `-destructive`, `-popover`, `-card`, etc. — so shadcn/ui's own components (which reference `bg-primary`, `text-muted-foreground`, etc.) resolve against Mindora's palette instead of shadcn's own neutral defaults.
- `--radius`, `--radius-sm/md/lg/xl/2xl` — `sm`/`md`/`lg` were added during the v4 migration specifically because `button.tsx` references `var(--radius-md)` directly and nothing in the original spec defined it.

Custom colours are accessed **without** a `mindora-` prefix in class names (e.g. `bg-bg-dark`, `text-text-muted`, `border-border`) — this was a deliberate change made during the v4 migration; see below.

## Tailwind v3 → v4 migration

The app was originally scaffolded with Tailwind v3 (hex tokens, `tailwind.config.ts`). It was migrated to v4 in full:

- Uninstalled `tailwindcss` v3; installed `tailwindcss@4.3.3` + `@tailwindcss/postcss@4.3.3` (**pinned to matching exact versions** — see bug below).
- `postcss.config.mjs` now only has the `@tailwindcss/postcss` plugin (autoprefixer is bundled in v4, no longer a separate plugin).
- `tailwind.config.ts` **deleted** — all configuration lives in `globals.css`'s `@theme` block now.
- `Sidebar.tsx`, `RouteGuard.tsx`, `AppLayout.tsx` — every `mindora-`-prefixed class name (`bg-mindora-bg-card`, `border-mindora-border`, etc.) was updated to the v4-native form (`bg-bg-card`, `border-border`, ...). Confirmed via `grep -r "mindora-" src` returning zero matches.

**Bug hit — version skew:** `tailwindcss@next`/`@tailwindcss/postcss@next` initially resolved to mismatched internal versions (`4.0.0` at the top level vs. `4.3.3` in `@tailwindcss/postcss`'s own `@tailwindcss/node` dependency). This crashed `npm run build` with `Error: Missing field 'negated' on ScannerOptions.sources` inside the native Tailwind scanner. Fixed by explicitly pinning both `tailwindcss` and `@tailwindcss/postcss` to the same exact version, `4.3.3`.

**shadcn re-init conflicts:** re-running `shadcn@latest init` (required to move shadcn itself onto the v4/Base-UI toolchain) repeatedly overwrote hand-authored files with its own defaults:

- `globals.css` — shadcn appended its own `:root`/`.dark` variable set and a `@theme inline` remap that redirected the Mindora "shadcn-compatibility" tokens (`--color-primary`, `--color-background`, etc.) to shadcn's own neutral/violet defaults, plus a `@import "shadcn/tailwind.css"` line. **Reverted** — the Mindora `@theme` block is authoritative; only the genuinely-missing `--radius-md`/`sm`/`lg` tokens were added on top of it.
- `layout.tsx` — shadcn's "Updating fonts" step injected an unwanted Geist font import alongside Inter. **Reverted** to Inter-only.

The current `components.json` reflects the final, correct v4 state: `"tailwind": {"config": "", ...}` (empty config path — expected in v4).

## `@mindora/database` cleanup (monorepo-wide, not patient-app-specific)

Unrelated to the frontend directly, but done in the same session and affects the monorepo `npm install` health that the frontend depends on: `@mindora/database` (a package deleted earlier during a DB-per-service migration) was still listed as a dependency in `auth-service`, `user-service`, `appointment-service`, and `mood-tracking-service`'s `package.json` files, breaking `npm install` at the root. Removed from all four. Root `package.json` has no such dependency entry — only three `db:*` npm scripts (`db:generate`, `db:migrate`, `db:seed`) reference `-w @mindora/database` as a workspace filter; those were **left as-is** (flagged, not deleted, since removing them deletes functioning scripts rather than a dependency). Also cleaned up in the same pass: extraneous `@types/js-yaml` removed, `vitest` in `packages/auth-middleware` bumped from a stale locked `3.2.6` to `^4.1.10` to match root.

## ESLint 8 vs 9

`npm run build` originally crashed during the lint phase:

```
⨯ ESLint: Error while loading rule '@typescript-eslint/no-unused-expressions':
  Cannot read properties of undefined (reading 'allowShortCircuit')
```

Root cause: `eslint-config-next@14.2.35` pulls in `@typescript-eslint/eslint-plugin@8.60.1`, which targets ESLint 9's rule API, while patient-app's own `eslint` was pinned to `^8` (from the `create-next-app@14` scaffold). The mismatch crashed rule loading.

**First attempt (reverted): upgrade to ESLint 9 + flat config.** Bumped `eslint` to `^9`, added `@eslint/eslintrc`, replaced `.eslintrc.json` with a `FlatCompat`-wrapped `eslint.config.mjs`. This turned out **not to work**: Next.js 14.2.35's build-integrated linter doesn't recognize flat config at all — `npm run build` stopped crashing, but it also stopped linting _at all_, silently reporting success with zero lint signal (confirmed by planting a deliberate unused-variable violation that went uncaught). Native flat-config support in `next build`/`next lint` didn't land until Next.js 15.

Mid-upgrade, a forced `npm install eslint@^9 ... ` (needed to override `eslint-config-next`'s `eslint@"^7.23.0 || ^8.0.0"` peer constraint) corrupted `node_modules/.bin` across the **entire workspace** — even `next` itself stopped resolving (`'next' is not recognized as an internal or external command`). Fixed with a full `npm install` from the repo root (~16 minutes, 738 packages touched) followed by an explicit `npm install next@14.2.35` in patient-app, since `next` had gone missing from `node_modules` entirely and needed to be pulled back in by hand (it re-resolved hoisted to the root `node_modules`, which is normal for npm workspaces).

**Final fix: stayed on ESLint 8, pinned `@typescript-eslint` to a compatible version.** `.eslintrc.json` restored, `eslint.config.mjs` removed, `eslint` back to `^8`. Added `@typescript-eslint/eslint-plugin@^7.18.0` and `@typescript-eslint/parser@^7.18.0` as **direct devDependencies of patient-app** (a root-level nested `overrides` entry was tried first but npm deduped it away against the root's own `typescript-eslint@8.60.1`; a direct devDependency pin in patient-app's own `package.json` was what actually stuck). This keeps patient-app's whole ESLint chain on 8.x-compatible versions without touching the root monorepo's own ESLint 9 flat-config setup (`eslint.config.js`, `typescript-eslint@^8.26.1`), which remains untouched and still correct for the backend services.

Verified for real this time: replanted the same unused-variable violation, ran `npm run build`, and got a correctly attributed error (`'unusedLintTestVar' is assigned a value but never used. @typescript-eslint/no-unused-vars`) — confirming lint is genuinely enforced again, not just silent. Removed the test variable, re-ran clean: `tsc --noEmit` zero errors, `npm run build` zero errors with all 13 routes prerendered, `npm run dev` ready on port 3000 with `/` → 307 → `/login` intact.

**Note:** this whole ESLint-8-vs-9 saga was superseded shortly after by the Next.js 14 → 16 upgrade below, which brought real native flat-config support and made the `@typescript-eslint@^7` pin unnecessary. Left in place above as an accurate record of what happened and why, since the same class of problem (a framework version not supporting a toolchain feature it appears to support) is worth remembering.

## Next.js 14 → 16 upgrade

Done as an isolated task on its own branch (`frontend/nextjs-16-upgrade`, off `frontend-setup`), specifically so Theodora could start new frontend work against Next 16 from day one. Before any installs, the codebase was audited against the official [v15](https://nextjs.org/docs/app/guides/upgrading/version-15) and [v16](https://nextjs.org/docs/app/guides/upgrading/version-16) upgrade guides for every breaking-change surface (Pages Router, middleware, `next/image`, async `params`/`searchParams`, cache APIs, parallel routes, etc.) — none applied, since the app is still all placeholder pages with an empty `next.config.mjs`. Full findings were reported and confirmed with the user before touching anything, including verifying React 19's _actual_ peer range directly from the npm registry (`^18.2.0 || 19.0.0-rc-... || ^19.0.0` — stable React 19 satisfies it; no canary needed, despite Next's own docs prose suggesting otherwise).

**What changed:**

- `next` 14.2.35 → **16.2.10**, `react`/`react-dom` 18.3.1 → **19.2.7**, `@types/react`/`@types/react-dom` bumped to match (`19.2.17`/`19.2.3`), `eslint-config-next` → **16.2.10**.
- Ran via the official `npx @next/codemod@canary upgrade 16.2.10 --yes` tool, which bumps versions, runs `npm install`, and applies all recommended jscodeshift codemods (`next-async-request-api`, `middleware-to-proxy`, `next-lint-to-eslint-cli`, `remove-unstable-prefix`, `remove-experimental-ppr`, etc. — all no-ops here since the codebase doesn't touch any of those surfaces).
- `eslint.config.mjs` regenerated by the `next-lint-to-eslint-cli` codemod — clean native flat config: `defineConfig([{ extends: [...nextCoreWebVitals, ...nextTypescript] }])`, no `FlatCompat` wrapper needed this time. `package.json`'s `"lint"` script changed from `"next lint"` to `"eslint ."` (`next lint` no longer exists in v16 — linting is fully decoupled from `next build` now). Note: the codemod migrates the _content_ of `.eslintrc.json` into the new flat config but doesn't delete the old file — it was left behind, stale and unused (ESLint 9 prefers `eslint.config.mjs` automatically, confirmed by `npm run lint` already working correctly with it still present), and had to be removed by hand afterward.
- `tsconfig.json` auto-updated by `next build` itself: `jsx: "react-jsx"` (was `"preserve"`), `target: "ES2017"` added, `include` extended with `.next/dev/types/**/*.ts` (Next 16 splits `next dev`/`next build` into separate output directories, enabling concurrent execution).
- The obsolete `@typescript-eslint/eslint-plugin`/`@typescript-eslint/parser@^7.18.0` pins (added earlier specifically for ESLint 8 compatibility) were removed — `eslint-config-next@16` brings its own compatible versions.

**Bugs hit:**

- The codemod's own first `npm install` pass failed with `ERESOLVE` — it bumped `eslint` straight to `10.7.0`, which directly conflicted with the still-present `@typescript-eslint@^7.18.0` pins (`peer eslint@"^8.56.0"`). Fixed by removing those obsolete pins before re-running the codemod.
- The codemod's interactive "Is your app deployed to Vercel?" prompt (for the `next-request-geo-ip` codemod, irrelevant here since the app has no middleware or geo/ip usage) caused the `upgrade` orchestrator to stop before reaching the ESLint migration step, even with `--yes`. Worked around by running the specific codemod directly: `npx @next/codemod@canary next-lint-to-eslint-cli . --force`.
- `npm run lint` crashed after the codemod completed: `TypeError: Error while loading rule 'react/display-name': contextOrFilename.getFilename is not a function`. Root cause: the codemod bumped `eslint` to `10.7.0`, but `eslint-config-next@16.2.10`'s bundled `eslint-plugin-react@^7.37.0` (resolved `7.37.5`) still calls the old ESLint `context.getFilename()` API, which ESLint 10 removed. `eslint-config-next@16.2.10`'s actual peer range is `eslint: >=9.0.0` (no upper bound) — not specifically 10 — so this was pinned back down to `eslint@^9.39.5` (matching the version already used at the monorepo root), which resolved it cleanly with no ERESOLVE warnings.

**Verification (all passing on `frontend/nextjs-16-upgrade`):**

- `npx tsc --noEmit` — zero errors.
- `npm run build` — compiles successfully under Turbopack (`▲ Next.js 16.2.10 (Turbopack)`), all 10 routes prerendered as static content. (Next 16 also removes the `size`/`First Load JS` columns from build output — expected, not a regression, per the v16 release notes.)
- `npm run lint` — runs cleanly via the new flat config: 0 errors, 2 harmless warnings (an unused `__dirname` in the codemod's own generated boilerplate, and a pre-existing anonymous-default-export warning in `postcss.config.mjs`).
- `npm run dev` — ready on port 3000 under Turbopack.
- Every route actually navigated (via HTTP, not just build success) and checked for both correct status/content and zero server-side errors in the dev log: `/` → 307 → `/login` (200, "Login page coming soon"), `/register` (200), `/home`, `/check-in`, `/therapy`, `/reflect`, `/circle`, `/admin` — all 200 with their expected placeholder text, zero errors or warnings logged by the dev server across all requests.

**Note on an out-of-band environment corruption during this verification:** partway through, `node_modules` and `package-lock.json` at the repo root were wiped out entirely from outside this work (not caused by the upgrade itself — a parallel terminal action). This first showed up as the dev server crashing on `/home` with `Error: Next.js inferred your workspace root, but it may not be correct... We couldn't find the Next.js package (next/package.json)` — a Turbopack workspace-root-inference error that looked upgrade-related but wasn't; `next` itself had simply gone missing from `node_modules`. Fixed with a full `npm install` from the repo root (~1 hour cold, no cache, 1225 packages), then the **entire verification pass above was redone from scratch** post-reinstall — tsc, build, lint, dev server, and every route re-navigated including `/home` specifically — with identical clean results. Worth remembering: if `/home`-style Turbopack workspace-root errors show up again, check `node_modules/next` exists before assuming it's a real Next 16/monorepo compatibility issue.

## npm audit — unresolved findings

Running `npm audit` from the repo root after the Next 16 upgrade reports **12 vulnerabilities (10 moderate, 2 high)**. The Next.js upgrade itself resolved a large pre-existing group of ~14 Next.js CVEs (DoS, XSS, cache poisoning, SSRF, request smuggling, etc.) that used to show up under `next <16.2.10` — those are gone. What's left:

**The 2 high-severity findings — `sharp <0.35.0`, inherited `libvips` CVEs (CVE-2026-33327/33328/35590/35591), one advisory counted twice by npm's tally.** `sharp` isn't declared anywhere in this monorepo directly — it's an `optionalDependency` Next.js 16 installs itself (`^0.34.5`) for `next/image`'s server-side optimizer. **Not currently exploitable**: `next/image` isn't used anywhere in `apps/patient-app` yet (confirmed via `grep -rn "next/image" src`), so this code path never executes.

**Attempted fix — a known npm limitation, not resolved:** tried forcing `sharp` to the fixed `0.35.3` three separate ways:

1. A plain root-level `overrides` entry (`"sharp": "^0.35.3"`) — silently ignored; `npm install` reported "up to date" and never even wrote an `overrides` block into `package-lock.json`, meaning it didn't trigger a re-resolution at all.
2. The same override _plus_ adding `sharp` as a real direct dependency of the root `package.json` (mirroring how the existing `axios`/`joi` overrides in this same file are paired with matching direct dependencies) — this did install `sharp@0.35.3` at the workspace root, but **did not dedupe the nested vulnerable copy**: `next` still resolved its own separate `sharp@0.34.5` under `node_modules/next/node_modules/sharp` (or workspace-hoisted equivalent), so both versions ended up coexisting and `npm audit` still flagged the old one.
3. A nested override scoped specifically to `sharp` as a dependency of `next` (`"overrides": { "next": { "sharp": "^0.35.3" } }`, plus a fresh `package-lock.json` regeneration) — same result, no change.

All three attempts were reverted (`package.json` restored to its pre-attempt state) since none of them actually fixed the audit finding — the direct-dependency approach in particular was actively worse than doing nothing, since it added a large native-binary package to every install without removing the vulnerable one. The likely root cause: `sharp` ships its own per-platform binary variants as _its own_ nested `optionalDependencies` (e.g. `@img/sharp-win32-x64`), and npm's `overrides` resolution appears to have a real limitation forcing a version outside the declaring parent's stated semver range (`next`'s own `^0.34.5`) for this specific shape of optional + platform-gated dependency — this isn't a config mistake on our part, it's npm (`10.9.2` here) not honoring the override the way its own docs describe for this case.

**Current status: left unresolved, deliberately.** `npm audit fix --force`'s own suggested remediation is to downgrade `next` to `9.3.3` — which would undo the entire v16 upgrade and is worse than the problem it claims to fix. Revisit when either (a) `next/image` actually gets used, at which point this stops being theoretical and is worth solving properly (possibly via `npm dedupe`, a Turborepo-level pin, or waiting for Next to bump its own bundled `sharp` range), or (b) a future Next.js patch release bumps its declared `sharp` range past `0.35.0` on its own.

**The other 10 moderate findings, for completeness** — none need action:

- `@hono/node-server <2.0.5` (path traversal via `serve-static` on Windows) — via `shadcn`'s own `@modelcontextprotocol/sdk` dependency. `shadcn` is a dev-time-only CLI tool (`npx`-invoked for scaffolding), never part of the running app.
- `postcss <8.5.10` (XSS via unescaped `</style>` in stringify output) — same story as `sharp`: bundled by `next`'s own optional dependency tree, not something the monorepo declares, only matters if untrusted CSS content is ever processed and stringified (it isn't, here).
- `uuid <11.1.1` (missing buffer bounds check) — via a `firebase-admin`/`@google-cloud/storage`/`gaxios`/`teeny-request` chain elsewhere in the monorepo (backend services), unrelated to the frontend work in this document.

## Known gaps / follow-ups

- **shadcn components (`button`, `card`, `input`, `label`, `badge`, `avatar`, `separator`, `sonner`) aren't visually exercised yet** — no placeholder page renders them except a couple of test `<Button>`s on the login page. Their semantic color classes now resolve correctly against Mindora's tokens (confirmed via grepping installed component source for every `--radius-*`/color var they reference and cross-checking against `globals.css`), but this hasn't been confirmed in an actual browser.
- **`toast` is not installed** — shadcn deprecated it in favor of `sonner`, which _is_ installed (`src/components/ui/sonner.tsx`), but nothing in the app calls it yet.
- **RouteGuard sidebar rendering** was only verified via HTTP requests (200 status, correct content, no server errors) with the guard's redirect temporarily bypassed — full visual confirmation (the sidebar actually painting after client-side hydration resolves `isLoading`) needs a real browser, which wasn't available in the environment this work was done in.
- **React Compiler and `cacheComponents`** (both new/stable in Next 16) are not enabled — worth evaluating once real pages with real data-fetching exist, not before.
- **Turbopack is now the default bundler** for `dev`/`build` — no custom webpack config existed to migrate, so this was a non-event here, but worth knowing if any future tooling assumes webpack-specific behavior.

## For Theodora — what's different writing code against Next 16 vs 14

- **Async `params`/`searchParams` are mandatory, no synchronous fallback.** Any dynamic route (`app/foo/[id]/page.tsx`) must `await props.params` — synchronous access was removed outright in v16 (v15 only warned). Run `npx next typegen` to get the `PageProps`/`LayoutProps`/`RouteContext` type helpers for this.
- **`fetch()` is not cached by default anymore** (this changed back in v15, carries into v16 — not new, but easy to trip on if following older tutorials/muscle memory). Every `fetch()` call in a Server Component or Route Handler is uncached unless you explicitly pass `{ cache: 'force-cache' }`, or set `export const fetchCache = 'default-cache'` at the layout/page level to flip the default for everything under it.
- **`GET` Route Handlers are also uncached by default** — opt in per-route with `export const dynamic = 'force-static'` if needed.
- **New cache-invalidation APIs**: `revalidateTag(tag, profile)` now requires a second `cacheLife` argument (e.g. `'max'`) — the old single-argument form is a TypeScript error. For "user should see their own change immediately" cases (as opposed to "stale is fine for a bit"), use the new `updateTag()` inside a Server Action instead — it expires and refreshes in the same request. There's also a new `refresh()` for just refreshing the client router from a Server Action without touching cache tags.
- **`next lint` doesn't exist anymore.** Use `npm run lint` (plain `eslint .` against `eslint.config.mjs`) — and note `npm run build` no longer runs lint at all, so a clean build is no longer proof of a clean lint pass; check both separately, especially in CI.
- **Turbopack is the default bundler** now for both `next dev` and `next build` — this app has no custom webpack config, so it's a non-issue here, but if you ever need webpack-specific behavior, it now requires an explicit `--webpack` flag.
- **`next/image` changes** (not yet relevant here since nothing uses `next/image` yet, but when you do): `images.domains` is deprecated in favor of `images.remotePatterns`; default `minimumCacheTTL` is now 4 hours (was 60s); default `qualities` is now just `[75]` — add more explicitly if you need them.
- **Middleware is being renamed to "proxy"** (`middleware.ts` → `proxy.ts`, `export function middleware` → `export function proxy`) and the Edge runtime is no longer supported there — this app has no middleware yet, but keep this in mind if you add any; if you specifically need the Edge runtime, the old `middleware.ts` convention still works for that case.
