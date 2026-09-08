#!/usr/bin/env bash
# Render the share cards into og/. Needs the site served locally and chromium present.
#
#   tools/make-cards.sh [port]
#
# Re-run after a project's name, download count or model changes; sync.py only writes
# the stub pages that point at these, it cannot render them.
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${1:-8137}"
BROWSER="$(command -v chromium || command -v chromium-browser || command -v google-chrome)"

if ! curl -sf -o /dev/null "http://localhost:$PORT/projects.json"; then
  echo "no server on :$PORT — run  python3 -m http.server $PORT  from the repo root" >&2
  exit 1
fi

mkdir -p og
ids=$(python3 -c "import json;print(' '.join(p['id'] for p in json.load(open('projects.json'))['projects']))")

for id in site $ids; do
  "$BROWSER" --headless --disable-gpu --enable-unsafe-swiftshader --use-gl=swiftshader \
    --hide-scrollbars --window-size=1200,630 --virtual-time-budget=20000 \
    --screenshot="og/$id.png" "http://localhost:$PORT/tools/card.html?id=$id" 2>/dev/null
  printf '  og/%s.png\n' "$id"
done
# A straight screenshot of the gradient is ~250 KB each; these get regenerated on
# releases, so keeping them small keeps the repo from growing a copy every time.
python3 - <<'EOF'
from PIL import Image
import glob, os
before = sum(os.path.getsize(f) for f in glob.glob('og/*.png'))
for f in glob.glob('og/*.png'):
    im = Image.open(f).convert('RGB')
    im.quantize(colors=256, dither=Image.FLOYDSTEINBERG).save(f, optimize=True)
after = sum(os.path.getsize(f) for f in glob.glob('og/*.png'))
print(f"  compressed {before/1e6:.1f} MB -> {after/1e6:.1f} MB")
EOF

echo "$(ls og/*.png | wc -l) cards written"
