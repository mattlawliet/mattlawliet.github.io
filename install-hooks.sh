#!/usr/bin/env bash
# Install a post-commit hook in every project that has a git repo and a source
# path in projects.json. The hook re-syncs the site when a commit changes a
# version file to a stable version.
#
#   ./install-hooks.sh            # install
#   ./install-hooks.sh --list     # show what would be touched
#   ./install-hooks.sh --remove   # take them back out
set -euo pipefail

SITE="$(cd "$(dirname "$0")" && pwd)"
MODE="${1:-install}"

# id<TAB>path for every project whose source is a git repo
mapfile -t ENTRIES < <(python3 - "$SITE/projects.json" <<'PY'
import json, os, sys
for p in json.load(open(sys.argv[1]))["projects"]:
    src = p.get("source")
    if not src:
        continue
    path = os.path.expanduser(src)
    if os.path.isdir(os.path.join(path, ".git")):
        print(f"{p['id']}\t{path}")
PY
)

if [ "${#ENTRIES[@]}" -eq 0 ]; then
  echo "no git-backed projects found in projects.json"
  exit 0
fi

for e in "${ENTRIES[@]}"; do
  id="${e%%$'\t'*}"
  path="${e#*$'\t'}"
  hook="$path/.git/hooks/post-commit"

  case "$MODE" in
    --list)
      printf '%-18s %s\n' "$id" "$path"
      continue
      ;;
    --remove)
      if [ -f "$hook" ] && grep -q 'matt-dev-web' "$hook" 2>/dev/null; then
        command rm -f "$hook"
        echo "removed  $id"
      fi
      continue
      ;;
  esac

  if [ -f "$hook" ] && ! grep -q 'matt-dev-web' "$hook" 2>/dev/null; then
    echo "SKIP     $id — a different post-commit hook is already there"
    continue
  fi

  cat > "$hook" <<HOOK
#!/usr/bin/env bash
# matt-dev-web: refresh the site when this project cuts a stable release.
# Remove with: $SITE/install-hooks.sh --remove
set -euo pipefail

VERSION_FILES='gradle.properties|plugin.yml|paper-plugin.yml|fabric.mod.json|pom.xml'
changed=\$(git diff-tree --no-commit-id --name-only -r HEAD | grep -E "\$VERSION_FILES" || true)
[ -n "\$changed" ] || exit 0

cd "$SITE" || exit 0
out=\$(./sync.py $id 2>&1) || true
status=\$?

if [ \$status -eq 2 ]; then
  echo "\$out" | sed 's/^/  [site] /'
  git add projects.json
  git commit -q -m "chore(site): $id release from \$(basename "$path")" || true
  if [ -n "\${MATTDEV_AUTOPUSH:-}" ]; then
    git push -q && echo "  [site] pushed"
  else
    echo "  [site] committed — run 'git -C $SITE push' to publish"
  fi
fi
HOOK
  chmod +x "$hook"
  echo "installed $id"
done

[ "$MODE" = "--list" ] && exit 0
echo
echo "Hooks fire only when a commit touches a version file AND the new version"
echo "is stable. Set MATTDEV_AUTOPUSH=1 to push automatically."
