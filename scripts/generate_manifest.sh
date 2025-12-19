#!/bin/bash
set -euo pipefail

MANIFEST_ROOT="TINMAN_MANIFEST.md"
MANIFEST_PAGES="docs/assets/TINMAN_MANIFEST.md"

mkdir -p "docs/assets"

generate_manifest () {
  {
    echo "# TinMan Codebase Manifest"
    echo "## Metadata"
    echo "- **Generated:** $(date -u +'%Y-%m-%d %H:%M:%S UTC')"
    echo "- **Repo:** $(basename "$PWD")"
    echo "- **Branch:** $(git branch --show-current 2>/dev/null || echo 'unknown')"
    echo "- **Commit:** $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"

    echo -e "\n## Directory Skeleton"
    echo '```text'
    find . -maxdepth 2 \
      -not -path '*/.*' \
      -not -path './node_modules*' \
      -not -path './.next*' \
      -not -path './dist*' \
      -not -path './build*' \
      -not -path './docs/assets*' \
      | sed 's/..//'
    echo '```'

    echo -e "\n## Tech Stack Highlights"
    echo "| Layer | Marker File | Purpose |"
    echo "| :--- | :--- | :--- |"
    echo "| Frontend | $(find . -maxdepth 2 -name "package.json" -o -name "App.js" | head -n 1) | UI Framework |"
    echo "| Backend | $(find . -maxdepth 2 -name "requirements.txt" -o -name "Program.cs" | head -n 1) | Logic/API |"
    echo "| Infrastructure | $(find . -maxdepth 2 -name "docker-compose.yml" -o -name ".github" | head -n 1) | CI/CD |"

    echo -e "\n## Critical Config Snapshots"
    if [ -f "package.json" ]; then
      echo "### package.json (Dependencies)"
      echo '```json'
      node -e "const p=require('./package.json'); console.log(JSON.stringify({dependencies:p.dependencies||{},devDependencies:p.devDependencies||{}},null,2));" 2>/dev/null || true
      echo '```'
    fi

    echo -e "\n## Safety"
    echo "- Manifest excludes: .env contents, node_modules, build outputs."
  }
}

generate_manifest > "$MANIFEST_ROOT"
cp "$MANIFEST_ROOT" "$MANIFEST_PAGES"

echo "Manifest Created:"
echo " - $MANIFEST_ROOT"
echo " - $MANIFEST_PAGES"
