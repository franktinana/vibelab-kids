#!/bin/bash
set -euo pipefail

MANIFEST="TINMAN_MANIFEST.md"
OUT="docs/assets/DEV_CONTEXT_PROMPT.md"

mkdir -p "docs/assets"

if [ ! -f "$MANIFEST" ]; then
  echo "Missing $MANIFEST. Run scripts/generate_manifest.sh first."
  exit 1
fi

cat > "$OUT" <<'PROMPT'
**ROLE:** Technical Archaeologist + Solutions Architect
**OBJECTIVE:** Ingest the manifest and return a “Lossless Context State” for TinMan SDLC v2.1 (focus: Phase 2.1 → 3.X → 3.45 → 3.5).

**INSTRUCTIONS:**
1. Read the manifest below.
2. Identify the Data Flow (entry → UI → API/logic → DB).
3. Identify constraints (auth, env vars, hosting, CI/CD).
4. Output:
   - ### GLOBAL PROJECT STATE (GPS)
   - Mermaid architecture diagram
   - Top 10 risks/unknowns
   - Next 5 actions
5. Do NOT ask for missing context until you list exactly what you searched for in the manifest.

---
## INPUT MANIFEST
PROMPT

cat "$MANIFEST" >> "$OUT"

echo "Prompt written: $OUT"
