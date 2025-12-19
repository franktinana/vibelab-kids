**ROLE:** Technical Archaeologist + Solutions Architect
**OBJECTIVE:** Ingest the manifest and return a “Lossless Context State” for SDLC v2.1 Phase 2.1 (Architecture).

**INSTRUCTIONS:**
1. Read the manifest below.
2. Identify the Data Flow (entry → logic → DB).
3. Identify key constraints (auth, env vars, hosting, CI/CD).
4. Output:
   - GLOBAL PROJECT STATE block
   - Mermaid architecture diagram
   - Top 10 risks / unknowns
   - Next 5 actions

---
## INPUT MANIFEST
# TinMan Codebase Manifest
## Metadata
- **Generated:** 2025-12-19 05:11:17 UTC
- **Repo:** vibelab-kids
- **Branch:** main
- **Commit:** 080f801

## Directory Skeleton
```text
.
docs
docs/qa_ux_report.md
docs/index.html
docs/dev
tsconfig.json
tests
tests/auth.spec.ts
TINMAN_MANIFEST.md
supabase
supabase/migrations
package.json
postcss.config.mjs
next-env.d.ts
eslint.config.mjs
package-lock.json
public
public/window.svg
public/globe.svg
public/next.svg
public/vercel.svg
public/file.svg
scripts
scripts/build_context_prompt.sh
scripts/generate_manifest.sh
playwright.config.ts
README.md
next.config.ts
src
src/components
src/lib
src/app
```

## Tech Stack Highlights
| Layer | Marker File | Purpose |
| :--- | :--- | :--- |
| Frontend | ./package.json | UI Framework |
| Backend |  | Logic/API |
| Infrastructure | ./.github | CI/CD |

## Critical Config Snapshots
### package.json (Dependencies)
```json
{
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

## Safety
- Manifest excludes: .env contents, node_modules, build outputs.
