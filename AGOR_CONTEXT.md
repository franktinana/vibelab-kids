# AGOR_CONTEXT.md — Vibe Code Kids (VibeLab Kids) Project Context

> **Purpose of this file:** Single-source context export for migrating this repo into an AI-driven SDLC workflow (Agor).  
> **Scope:** Captures vision, current architecture, known working/broken areas, established “rules,” and the immediate roadmap based on our last working sessions.

---

## 1) High-Level Pitch — What is “Vibe Code Kids”?

**Vibe Code Kids (a.k.a. VibeLab Kids)** is a **safe, kid-friendly “vibe-coding” playground**: a web app where kids can **create tiny web “games” / interactive pages**, **run them in a sandbox**, and **share/remix** projects with friends.

### Core vision
- **“GitHub-for-kids,” but simpler:** create → run → share → remix.
- **Immediate feedback loop:** kids type/modify code and see it run instantly (sandboxed).
- **Social layer (lightweight):** friends, friend requests, optional system/community posts, notifications.
- **Safety-first execution:** user code runs in a constrained environment (iframe sandbox), not on the server.
- **Progressive complexity:** start with HTML/CSS/JS snippets; later expand to “templates,” lessons, and curated challenge packs.

### What the product is *not*
- Not a full IDE replacement.
- Not server-side execution of user code.
- Not an unmoderated public social network.

---

## 2) Architecture Stack

> Some components are inferred from file paths and build behavior in prior sessions; unknowns are marked **TBD** (to be verified by repo scan once available in the new SDLC).

### Frontend
- **Framework:** Next.js (App Router) + React  
  - Evidence: `src/app/...` routes and `use client` components.
- **Language:** TypeScript
- **Styling:** Tailwind CSS (**likely**, given prior styling expectations and typical stack; **TBD** if confirmed in config files)
- **Key UI execution component:** `src/components/SandboxPlayer.tsx`  
  - Uses an **iframe** with `srcDoc` and a local `rev` state to force reload when HTML changes.

### Backend / Server
- **Primary pattern:** Next.js server actions / API routes (**TBD**, not directly observed yet)
- **Auth gate:** `src/components/AuthGate.tsx` indicates a dedicated client-side auth boundary (**auth provider TBD**).

### Database
- **Expected:** Postgres (likely Supabase) (**TBD**)  
  - Evidence: SQL error from a trigger and Postgres error code `42703`.
- **Known DB issue (observed):** a trigger named `sync` failing due to missing columns (`email`, `username`) in a table that currently includes:
  - `id uuid NOT NULL`
  - `handle text`
  - `display_name text NOT NULL`
  - `created_at timestamptz NOT NULL`
  - `updated_at timestamptz NOT NULL`

### Hosting / Dev Environment
- **Repo hosting:** GitHub (confirmed by your “move to GitHub VS Code online / Codespaces” workflow)
- **Dev environment target:** GitHub Codespaces (explicitly desired)
- **CI / Gates:** custom scripts run via npm (`tinman:qa`, `tinman:gate`), and ESLint enforcement in CI.

### Tooling & Key Libraries (confirmed by behavior)
- **ESLint** (strict rules: forbids `require()`, forbids `any`)
- **TypeScript**
- **Node/npm scripts**:
  - `npm run tinman:qa`
  - `npm run tinman:gate`
  - `npm run lint`

---

## 3) Current State — Working vs Broken vs Mocked

### Working (confirmed)
- **Next.js app structure exists** with routes under `src/app/...`
- **Sandbox runtime behavior exists**:
  - `SandboxPlayer.tsx` reloads iframe whenever `html` prop changes.
  - Has a default `srcDoc` fallback for empty content.
- **Auth boundary component exists**:
  - `AuthGate.tsx` present and used to gate UI (details TBD).
- **CI entry points exist**:
  - `tinman:qa` runs `lint` at minimum (and probably other checks inside shell scripts).

### Broken / Blocking (confirmed)
#### A) CI/Lint failures (from `npm run tinman:qa`)
1) **CommonJS require forbidden** in:
   - `/scripts/audit_links.cjs`
   - Errors: `A require() style import is forbidden  @typescript-eslint/no-require-imports`

2) **Type safety gate failing** due to explicit `any`:
   - `/src/app/friends/page.tsx` (multiple occurrences)
   - `/src/app/games/[id]/GameClient.tsx` (at least one occurrence)
   - Errors: `Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any`

#### B) Database trigger failure (from downstream trigger output)
- Trigger: `sync`
- Error: `ERROR: 42703: column "email" does not exist`
- Failing query references: `select id, email, username, handle ...`
- Actual table columns (observed): `id`, `handle`, `display_name`, `created_at`, `updated_at`
- Impact: any background “sync” / profile hydration relying on that trigger/function is currently broken.

### Mocked / Incomplete (best-effort inference)
- **Friends screen** likely exists but may be stubbed (given `any` types in `/friends/page.tsx`).
- **Game runtime view** exists (`/games/[id]/GameClient.tsx`) but may rely on placeholder data or loosely typed payloads.
- **Auth integration** may be partially mocked (AuthGate exists, provider unclear).
- **Notifications / system posts** were part of parallel feature threads across related projects; treat as **planned**, not guaranteed implemented here (until verified).

---

## 4) The “Rules” — Patterns, Conventions, Principles

### Code quality rules (enforced)
- **No `any` in TypeScript**  
  - Use proper interfaces/types for data payloads, props, and API returns.
- **No CommonJS `require()`** in TS/JS code enforced by ESLint  
  - Prefer **ES modules**: `import x from "y"` / `import { x } from "y"`.
  - If scripts must stay CommonJS, isolate them from lint or rename/configure appropriately (but the current rule is “no require”).

### Frontend patterns
- **App Router conventions:** route files under `src/app/**`
- **Client components explicitly marked:** `"use client";` used where hooks/state exist.
- **Sandboxing principle:** user code must run in a **restricted iframe**, not in privileged context.
  - Use `iframe sandbox` attributes appropriately (see roadmap).

### Operational / SDLC conventions
- **Gate scripts are first-class:** `tinman:qa` and `tinman:gate` represent the “definition of done” checks.
- **Prefer repeatable CLI workflows:** bash scripts for fixes and consistent dev setup were explicitly requested.
- **Repository-first workflow:** you are standardizing on GitHub + (ideally) Codespaces for “single source of truth.”

### UX / Product principles (established direction)
- **Kid-friendly, low-friction UI:** “library” + “run sandbox” is the center of gravity.
- **Clear separation:** create/edit vs run vs share.
- **Safety-by-default:** avoid open-ended social exposure; default to friends-only / controlled spaces.

---

## 5) Immediate Roadmap — Next 3–5 Critical Tasks

> Ordered roughly by “unblocks progress fastest” + “reduces risk.”

### 1) Unblock CI by fixing lint gate failures (must-do)
- Convert `/scripts/audit_links.cjs` from `require()` to ESM `import`, **or** move it behind a separate lint config / ignore path used by CI.
- Replace `any` usage in:
  - `src/app/friends/page.tsx`
  - `src/app/games/[id]/GameClient.tsx`
- Outcome: `npm run tinman:qa` and `npm run tinman:gate` go green.

### 2) Fix database “sync” trigger mismatch (must-do if DB-connected)
- Update the trigger/function query to match the real schema (use `handle`, `display_name`, etc.), **or**
- Update schema to include the expected columns (`email`, `username`) if that is the intended model.
- Outcome: background sync succeeds; profiles resolve consistently.

### 3) Formalize the data contracts (types) between UI ↔ API ↔ DB
- Introduce shared TS types:
  - `UserProfile`, `FriendRequest`, `GameProject`, `GameRunPayload`
- Ensure UI never relies on loosely typed blobs (the source of `any`).
- Outcome: fewer regressions; easier AI-assisted changes.

### 4) Harden the sandbox (security + reliability)
- Add/verify:
  - `iframe sandbox` flags (restrict scripts, forms, same-origin as appropriate)
  - Content Security Policy (CSP) headers where possible
  - Size/time safeguards (avoid runaway scripts freezing the UI)
- Outcome: safer execution for kid-submitted code.

### 5) Complete the “kid loop”: Library → Open → Run → Remix → Save
- Implement or validate:
  - Project library list + detail view
  - Create/edit page
  - Save/update (DB or local) and share/remix workflow
- Outcome: the MVP loop is real and testable with early users.

---

## Appendix A — Known Files Mentioned (from prior sessions)

- `src/components/SandboxPlayer.tsx`
  - Holds iframe `srcDoc`, `rev` state reload logic.
- `src/components/AuthGate.tsx`
  - Auth boundary wrapper.
- `src/app/friends/page.tsx`
  - Currently fails lint due to `any`.
- `src/app/games/[id]/GameClient.tsx`
  - Currently fails lint due to `any`.
- `scripts/audit_links.cjs`
  - Currently fails lint due to `require()` usage.
- `scripts/tinman_qa.sh`
  - Called by `npm run tinman:qa` (script contents TBD).

---

## Appendix B — “What Agor needs to know” (SDLC handoff notes)

- The repo is intentionally **lint-strict**; green gates matter more than “it runs locally.”
- Prioritize changes that:
  1) Keep sandbox execution isolated (iframe-based),
  2) Improve type safety (no `any`),
  3) Preserve App Router conventions (`src/app`),
  4) Keep CI scripts (`tinman:*`) passing.

---

## Appendix C — Open Questions / TBD (non-blocking, but should be verified in repo)
- Exact auth provider (Supabase Auth? NextAuth? custom?) — **TBD**
- Exact DB layer used in this repo (Supabase? Prisma? direct Postgres?) — **TBD**
- Hosting target (Vercel vs other) — **TBD**
- Tailwind presence (likely) — **TBD**

> These are explicitly marked so the AI-driven SDLC can schedule a “repo scan” step and fill gaps without guessing.
