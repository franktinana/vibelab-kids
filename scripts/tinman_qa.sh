#!/bin/bash
set -euo pipefail

if [ ! -f package.json ]; then
  echo "No package.json found. TinMan QA skipped."
  exit 0
fi

has_script() {
  node - <<'NODE'
const fs=require("fs");
const p=JSON.parse(fs.readFileSync("package.json","utf8"));
const s=p.scripts||{};
const name=process.argv[1];
process.exit(s[name] ? 0 : 1);
NODE "$1"
}

run_if_exists() {
  local name="$1"
  if has_script "$name"; then
    echo "== Running: npm run $name =="
    npm run "$name"
  else
    echo "-- Skipping: npm run $name (not defined)"
  fi
}

# Standard QA steps (only if they exist)
run_if_exists lint
run_if_exists typecheck
run_if_exists test

# Always run route audit if the script file exists
if [ -f scripts/audit_links.cjs ]; then
  echo "== Running: TinMan 3.45 Route Auditor =="
  node scripts/audit_links.cjs
fi

echo "== TinMan QA complete =="
