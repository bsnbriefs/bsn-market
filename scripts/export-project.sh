#!/usr/bin/env bash
set -euo pipefail

# Determine repository root
if git rev-parse --show-toplevel >/dev/null 2>&1; then
  ROOT="$(git rev-parse --show-toplevel)"
else
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
fi

cd "$ROOT"

# Essential files check
ESSENTIALS=(package.json package-lock.json tsconfig.json vite.config.ts src migrations)
for f in "${ESSENTIALS[@]}"; do
  if [[ ! -e "$f" ]]; then
    echo "ERROR: Essential path missing: $f" >&2
    exit 1
  fi
done

# Output location
EXPORT_DIR="$ROOT/export"
mkdir -p "$EXPORT_DIR"
ZIP_PATH="$EXPORT_DIR/bsn-market-complete.zip"

rm -f "$ZIP_PATH"

# Use Python to create ZIP with exclusions (zip command not always available)
python3 << PY
import os
import zipfile
from pathlib import Path

root = Path(".")
zip_path = Path("$ZIP_PATH")
exclude_dirs = {".git", ".grok", ".vercel", ".tanstack", "node_modules", "export", "artifacts", "attachments", "coverage", "dist", "build"}
exclude_patterns = {".env", ".env.", ".DS_Store", "Thumbs.db", ".node_modules.lock"}
exclude_ext = {".zip", ".log"}

def should_exclude(path: Path) -> bool:
    parts = path.parts
    for d in exclude_dirs:
        if d in parts:
            return True
    name = path.name
    if any(name.startswith(p) for p in exclude_patterns):
        return True
    if path.suffix in exclude_ext:
        return True
    if "secret" in name.lower() or "password" in name.lower() or name.endswith(".pem"):
        return True
    return False

with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    for dirpath, dirnames, filenames in os.walk(root):
        # Prune excluded dirs
        dirnames[:] = [d for d in dirnames if d not in exclude_dirs]
        rel_dir = Path(dirpath).relative_to(root)
        if should_exclude(rel_dir):
            continue
        for fn in filenames:
            fp = Path(dirpath) / fn
            if should_exclude(fp.relative_to(root)):
                continue
            arcname = str(fp.relative_to(root))
            zf.write(fp, arcname)

print(f"Created {zip_path}")
PY

SIZE=$(du -h "$ZIP_PATH" | cut -f1)
echo "SUCCESS: Archive created at $ZIP_PATH"
echo "Size: $SIZE"
echo "Important included directories:"
echo "  - src/ (including routes/_store, lib/market)"
echo "  - migrations/"
echo "  - public/"
echo "  - server/"
echo "  - scripts/"
echo "  - package.json, package-lock.json at root"
echo "Excluded: node_modules, .git, .grok, .vercel, .env*, build artifacts, nested zips, etc."
