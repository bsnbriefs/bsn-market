#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <path-to-zip>" >&2
  exit 1
fi

ZIP="$1"
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

PASS=0
FAIL=0

check() {
  local desc="$1"
  local cond="$2"
  if eval "$cond"; then
    echo "PASS: $desc"
    ((PASS++))
  else
    echo "FAIL: $desc"
    ((FAIL++))
  fi
}

echo "Verifying ZIP: $ZIP"
echo "================================"

check "Archive exists and is readable" "[[ -f \"$ZIP\" && -r \"$ZIP\" ]]"

# Extract
if unzip -q "$ZIP" -d "$TMPDIR" 2>/dev/null; then
  echo "PASS: ZIP extracts successfully"
  ((PASS++))
else
  echo "FAIL: ZIP extracts successfully"
  ((FAIL++))
  echo "OVERALL: FAIL (cannot extract)"
  exit 1
fi

check "package.json at archive root" "[[ -f \"$TMPDIR/package.json\" ]]"
check "package-lock.json at archive root" "[[ -f \"$TMPDIR/package-lock.json\" ]]"
check "src/ directory exists" "[[ -d \"$TMPDIR/src\" ]]"
check "src/routes/_store/ exists" "[[ -d \"$TMPDIR/src/routes/_store\" ]]"
check "src/lib/market/ exists" "[[ -d \"$TMPDIR/src/lib/market\" ]]"
check "migrations/ exists" "[[ -d \"$TMPDIR/migrations\" ]]"
check "public/ exists" "[[ -d \"$TMPDIR/public\" ]]"
check "server/ exists" "[[ -d \"$TMPDIR/server\" ]]"
check "scripts/ exists" "[[ -d \"$TMPDIR/scripts\" ]]"
check "tsconfig.json exists" "[[ -f \"$TMPDIR/tsconfig.json\" ]]"
check "vite.config.ts exists" "[[ -f \"$TMPDIR/vite.config.ts\" ]]"

# SEEK features (optional but check if present)
check "SEEK Companion files present (if any)" "[[ -f \"$TMPDIR/src/lib/market/companion.ts\" ]] || true"
# Actually distinguish: always pass if not required, but report
if [[ -f "$TMPDIR/src/lib/market/companion.ts" ]]; then
  echo "PASS: SEEK Companion (companion.ts) included"
  ((PASS++))
else
  echo "INFO: SEEK Companion not present (optional)"
fi
if [[ -f "$TMPDIR/src/lib/market/fair.ts" ]]; then
  echo "PASS: SEEK Fair Deal (fair.ts) included"
  ((PASS++))
else
  echo "INFO: SEEK Fair Deal not present (optional)"
fi
if [[ -f "$TMPDIR/src/lib/market/bundle.ts" ]]; then
  echo "PASS: SEEK Bundle Builder (bundle.ts) included"
  ((PASS++))
else
  echo "INFO: SEEK Bundle Builder not present (optional)"
fi

# package.json valid JSON
if node -e "JSON.parse(require('fs').readFileSync('$TMPDIR/package.json','utf8'))" 2>/dev/null; then
  echo "PASS: package.json is valid JSON"
  ((PASS++))
else
  echo "FAIL: package.json is valid JSON"
  ((FAIL++))
fi

# No forbidden dirs/files
check "No node_modules/ in archive" "! unzip -l \"$ZIP\" | grep -q 'node_modules/'"
check "No .git/ in archive" "! unzip -l \"$ZIP\" | grep -qE '\\.git/'"
check "No .grok/ in archive" "! unzip -l \"$ZIP\" | grep -qE '\\.grok/'"
check "No .vercel/output/ in archive" "! unzip -l \"$ZIP\" | grep -qE '\\.vercel/output/'"
check "No .env files in archive" "! unzip -l \"$ZIP\" | grep -qE '\\.env'"
check "No obvious secret files" "! unzip -l \"$ZIP\" | grep -qiE '(secret|password|key\\.pem|credentials)'"

# No nested roots (package.json only at root)
PKG_COUNT=$(unzip -l "$ZIP" | grep -c 'package.json' || true)
check "No accidental nested package.json" "[[ $PKG_COUNT -eq 1 ]]"

echo "================================"
echo "Results: $PASS passed, $FAIL failed"
if [[ $FAIL -eq 0 ]]; then
  echo "OVERALL: PASS"
  exit 0
else
  echo "OVERALL: FAIL"
  exit 1
fi
