# Frontend — `apps/patient-app`

Documentation of the patient-facing Next.js frontend added to the Mindora V3 monorepo, and everything done to it so far. Written to be accurate as of the work completed in this session — update it as the app evolves.

## Stack

- **Next.js 14.2.35** — App Router only (no Pages Router), TypeScript, `src/` directory, `@/*` import alias.
- **Tailwind CSS v4** (`4.3.3`) — CSS-first configuration, no `tailwind.config.ts`.
- **shadcn/ui** (`base-nova` style, Base UI primitives, not Radix) — `components.json` at `apps/patient-app/components.json`.
- **TanStack React Query v5** (`@tanstack/react-query` + `-devtools`) for server state.
- **Custom auth scaffolding** — in-memory access token + HttpOnly refresh-token cookie, matching the backend Auth Service's design.
- **ESLint 8** (legacy `.eslintrc.json`), pinned `@typescript-eslint` 7.x — deliberately *not* ESLint 9/flat-config; see [ESLint](#eslint-8-vs-9) below for why.

## Folder structure

```
apps/patient-app/
├── .env.local, .env.example          # NEXT_PUBLIC_API_URL=http://localhost:8000
├── .eslintrc.json                    # legacy config: extends next/core-web-vitals, next/typescript
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

**First attempt (reverted): upgrade to ESLint 9 + flat config.** Bumped `eslint` to `^9`, added `@eslint/eslintrc`, replaced `.eslintrc.json` with a `FlatCompat`-wrapped `eslint.config.mjs`. This turned out **not to work**: Next.js 14.2.35's build-integrated linter doesn't recognize flat config at all — `npm run build` stopped crashing, but it also stopped linting *at all*, silently reporting success with zero lint signal (confirmed by planting a deliberate unused-variable violation that went uncaught). Native flat-config support in `next build`/`next lint` didn't land until Next.js 15.

Mid-upgrade, a forced `npm install eslint@^9 ... ` (needed to override `eslint-config-next`'s `eslint@"^7.23.0 || ^8.0.0"` peer constraint) corrupted `node_modules/.bin` across the **entire workspace** — even `next` itself stopped resolving (`'next' is not recognized as an internal or external command`). Fixed with a full `npm install` from the repo root (~16 minutes, 738 packages touched) followed by an explicit `npm install next@14.2.35` in patient-app, since `next` had gone missing from `node_modules` entirely and needed to be pulled back in by hand (it re-resolved hoisted to the root `node_modules`, which is normal for npm workspaces).

**Final fix: stayed on ESLint 8, pinned `@typescript-eslint` to a compatible version.** `.eslintrc.json` restored, `eslint.config.mjs` removed, `eslint` back to `^8`. Added `@typescript-eslint/eslint-plugin@^7.18.0` and `@typescript-eslint/parser@^7.18.0` as **direct devDependencies of patient-app** (a root-level nested `overrides` entry was tried first but npm deduped it away against the root's own `typescript-eslint@8.60.1`; a direct devDependency pin in patient-app's own `package.json` was what actually stuck). This keeps patient-app's whole ESLint chain on 8.x-compatible versions without touching the root monorepo's own ESLint 9 flat-config setup (`eslint.config.js`, `typescript-eslint@^8.26.1`), which remains untouched and still correct for the backend services.

Verified for real this time: replanted the same unused-variable violation, ran `npm run build`, and got a correctly attributed error (`'unusedLintTestVar' is assigned a value but never used. @typescript-eslint/no-unused-vars`) — confirming lint is genuinely enforced again, not just silent. Removed the test variable, re-ran clean: `tsc --noEmit` zero errors, `npm run build` zero errors with all 13 routes prerendered, `npm run dev` ready on port 3000 with `/` → 307 → `/login` intact.

## Known gaps / follow-ups

- **shadcn components (`button`, `card`, `input`, `label`, `badge`, `avatar`, `separator`, `sonner`) aren't visually exercised yet** — no placeholder page renders them except a couple of test `<Button>`s on the login page. Their semantic color classes now resolve correctly against Mindora's tokens (confirmed via grepping installed component source for every `--radius-*`/color var they reference and cross-checking against `globals.css`), but this hasn't been confirmed in an actual browser.
- **`toast` is not installed** — shadcn deprecated it in favor of `sonner`, which *is* installed (`src/components/ui/sonner.tsx`), but nothing in the app calls it yet.
- **RouteGuard sidebar rendering** was only verified via `curl` (200 status, no server errors) with the guard's redirect temporarily bypassed — full visual confirmation (the sidebar actually painting after client-side hydration resolves `isLoading`) needs a real browser, which wasn't available in the environment this work was done in.
- **`next`/`eslint-config-next` are still on Next.js 14** — a future upgrade to Next.js 15 would allow ESLint 9 + flat config to actually work natively in `next build`, removing the need for the `@typescript-eslint@^7` pin. Not done here since it's a bigger, riskier change than this session's scope.
