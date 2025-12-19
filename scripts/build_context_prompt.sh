#!/bin/bash
set -euo pipefail

MANIFEST="TINMAN_MANIFEST.md"
OUT="docs/assets/DEV_CONTEXT_PROMPT.md"

mkdir -p "docs/assets"

if [ ! -f "$MANIFEST" ]; then
  echo "Missing $MANIFEST. Run generate_manifest.sh first."
  exit 1
fi

cat > "$OUT" <<'PROMPT'
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
PROMPT

cat "$MANIFEST" >> "$OUT"

echo "Prompt Created: $OUT"
