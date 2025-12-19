# TinMan Codebase Manifest
## Metadata
- **Generated:** 2025-12-19 05:11:26 UTC
- **Repo:** vibelab-kids
- **Branch:** main
- **Commit:** 3ba4a2c

## Directory Skeleton
```text
.
TINMAN_MANIFEST.md
postcss.config.mjs
scripts
scripts/build_context_prompt.sh
scripts/generate_manifest.sh
playwright.config.ts
next.config.ts
package-lock.json
README.md
docs
docs/index.html
docs/qa_ux_report.md
docs/dev
public
public/file.svg
public/next.svg
public/globe.svg
public/window.svg
public/vercel.svg
package.json
eslint.config.mjs
tests
tests/auth.spec.ts
tsconfig.json
src
src/components
src/lib
src/app
supabase
supabase/migrations
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
