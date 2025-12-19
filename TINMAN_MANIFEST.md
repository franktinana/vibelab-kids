# TinMan Codebase Manifest
## Metadata
- **Generated:** 2025-12-19 05:26:00 UTC
- **Repo:** vibelab-kids
- **Branch:** main
- **Commit:** c2d36aa
- **App Router Dir:** src/app

## Directory Skeleton (maxdepth=3)
```text
.
TINMAN_MANIFEST.md
postcss.config.mjs
scripts
scripts/tinman_qa.sh
scripts/build_context_prompt.sh
scripts/generate_manifest.sh
scripts/audit_links.cjs
playwright.config.ts
next.config.ts
package-lock.json
README.md
docs
docs/index.html
docs/qa_ux_report.md
docs/dev
docs/dev/index.html
docs/dev/app.js
public
public/TINMAN_MANIFEST.md
public/file.svg
public/next.svg
public/globe.svg
public/window.svg
public/vercel.svg
BROKEN_LINKS.md
package.json
eslint.config.mjs
tests
tests/auth.spec.ts
tsconfig.json
src
src/components
src/components/AuthGate.tsx
src/components/SandboxPlayer.tsx
src/lib
src/lib/sandbox.ts
src/lib/supabase.ts
src/app
src/app/games
src/app/globals.css
src/app/login
src/app/friends
src/app/profile
src/app/layout.tsx
src/app/favicon.ico
src/app/page.tsx
supabase
supabase/migrations
supabase/migrations/20241217000000_initial_schema.sql
```

## Tech Stack Highlights
| Layer | Marker File | Purpose |
| :--- | :--- | :--- |
| Frontend | ./package.json | UI Framework |
| Backend | ./supabase | Logic/API |
| Infrastructure | ./.github | CI/CD/Deploy |

## package.json (Dependencies Snapshot)
```json
{
  "name": "vibelab-kids",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "tinman:manifest": "bash scripts/generate_manifest.sh",
    "tinman:prompt": "bash scripts/build_context_prompt.sh",
    "tinman:links": "node scripts/audit_links.cjs",
    "tinman:qa": "bash scripts/tinman_qa.sh",
    "tinman:gate": "npm run tinman:manifest && npm run tinman:qa"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.88.0",
    "next": "16.0.10",
    "react": "19.2.1",
    "react-dom": "19.2.1"
  },
  "devDependencies": {
    "@playwright/test": "^1.57.0",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "babel-plugin-react-compiler": "1.0.0",
    "eslint": "^9",
    "eslint-config-next": "16.0.10",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

## Prisma Schema (if present)
_No prisma/schema.prisma found._

## Environment Variable Keys (no values)
_Scans .env* files but only prints the key names._
```text
```

## Safety
- Manifest excludes: secret VALUES, node_modules, build outputs.
- If a secret is hardcoded in code, CI should fail it separately (add secret scanning).
