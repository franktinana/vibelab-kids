#!/bin/bash
set -euo pipefail

MANIFEST_ROOT="TINMAN_MANIFEST.md"
MANIFEST_PAGES="docs/assets/TINMAN_MANIFEST.md"
MANIFEST_PUBLIC="public/TINMAN_MANIFEST.md"

mkdir -p "docs/assets"
[ -d "public" ] || mkdir -p "public"

REPO_NAME="$(basename "$PWD")"
BRANCH="$(git branch --show-current 2>/dev/null || echo 'unknown')"
COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
TS="$(date -u +'%Y-%m-%d %H:%M:%S UTC')"

# Try to detect Next.js App Router path
APP_DIR=""
if [ -d "src/app" ]; then APP_DIR="src/app"; fi
if [ -z "$APP_DIR" ] && [ -d "app" ]; then APP_DIR="app"; fi

{
  echo "# TinMan Codebase Manifest"
  echo "## Metadata"
  echo "- **Generated:** $TS"
  echo "- **Repo:** $REPO_NAME"
  echo "- **Branch:** $BRANCH"
  echo "- **Commit:** $COMMIT"
  if [ -n "$APP_DIR" ]; then
    echo "- **App Router Dir:** $APP_DIR"
  fi

  echo -e "\n## Directory Skeleton (maxdepth=3)"
  echo '```text'
  find . -maxdepth 3 \
    -not -path '*/.*' \
    -not -path './node_modules*' \
    -not -path './.next*' \
    -not -path './dist*' \
    -not -path './build*' \
    -not -path './docs/assets*' \
    -not -path './coverage*' \
    | sed 's|^\./||'
  echo '```'

  echo -e "\n## Tech Stack Highlights"
  echo "| Layer | Marker File | Purpose |"
  echo "| :--- | :--- | :--- |"
  echo "| Frontend | $(find . -maxdepth 2 -name "package.json" -o -name "App.js" -o -name "next.config.js" -o -name "next.config.mjs" | head -n 1) | UI Framework |"
  echo "| Backend | $(find . -maxdepth 3 -name "requirements.txt" -o -name "Program.cs" -o -name "server.js" -o -name "supabase" | head -n 1) | Logic/API |"
  echo "| Infrastructure | $(find . -maxdepth 3 -name "docker-compose.yml" -o -name ".github" -o -name "vercel.json" -o -name "netlify.toml" | head -n 1) | CI/CD/Deploy |"

  echo -e "\n## package.json (Dependencies Snapshot)"
  if [ -f "package.json" ]; then
    echo '```json'
    node - <<'NODE' 2>/dev/null || true
const fs=require("fs");
const p=JSON.parse(fs.readFileSync("package.json","utf8"));
const out={
  name:p.name,
  private:p.private,
  scripts:p.scripts||{},
  dependencies:p.dependencies||{},
  devDependencies:p.devDependencies||{},
};
console.log(JSON.stringify(out,null,2));
NODE
    echo '```'
  else
    echo "_No package.json found._"
  fi

  echo -e "\n## Prisma Schema (if present)"
  if [ -f "prisma/schema.prisma" ]; then
    echo "- prisma/schema.prisma"
    echo '```prisma'
    sed -n '1,240p' prisma/schema.prisma
    echo '```'
  else
    echo "_No prisma/schema.prisma found._"
  fi

  echo -e "\n## Environment Variable Keys (no values)"
  echo "_Scans .env* files but only prints the key names._"
  echo '```text'
  # Find typical env files; only print keys before '='; ignore comments/blank lines
  find . -maxdepth 2 -type f \( -name ".env" -o -name ".env.*" -o -name ".env.local" -o -name ".env.example" \) \
    -not -path "./node_modules/*" \
    -not -path "./.next/*" \
    -print0 \
  | while IFS= read -r -d '' f; do
      echo "## $(echo "$f" | sed 's|^\./||')"
      grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "$f" | sed 's/=.*$//' | sort -u || true
      echo ""
    done
  echo '```'

  echo -e "\n## Safety"
  echo "- Manifest excludes: secret VALUES, node_modules, build outputs."
  echo "- If a secret is hardcoded in code, CI should fail it separately (add secret scanning)."
} > "$MANIFEST_ROOT"

cp "$MANIFEST_ROOT" "$MANIFEST_PAGES"
cp "$MANIFEST_ROOT" "$MANIFEST_PUBLIC"

echo "Manifest written:"
echo " - $MANIFEST_ROOT"
echo " - $MANIFEST_PAGES"
echo " - $MANIFEST_PUBLIC"
