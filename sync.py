#!/usr/bin/env python3
"""Update projects.json from local project sources and the Modrinth API.

    ./sync.py                 # every project
    ./sync.py wtf shopah      # just these ids
    ./sync.py --offline       # skip Modrinth, local versions only
    ./sync.py --check         # report drift, write nothing (exit 1 if stale)

Only *stable* versions reach the site. A version containing proto, test, wip,
rc, alpha, beta, snapshot, pre, dev or nightly is treated as a work in progress
and ignored, so bumping to 2.4.0-proto.2 does not publish anything. The newest
stable version wins, whether it comes from the source tree or a built artifact.

Exit code 2 means projects.json changed — the git hook uses that to decide
whether there is anything to commit.
"""

import argparse
import hashlib
import json
import re
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "projects.json"
API = "https://api.modrinth.com/v2/project/{}"
UA = "matt-dev-web/1.0 (github.com/mattlawliet)"

# A release is boring on purpose: digits and dots. Anything else is a WIP.
# Anchored to a separator so a descriptive name like
# "1.4.25_all_spots_head_collector" is not read as a prerelease.
WIP = re.compile(r"(?:^|[-_.])(proto|test|wip|rc|alpha|beta|snapshot|pre|dev|nightly)", re.I)
STABLE = re.compile(r"^\d+(?:\.\d+)*$")


def is_stable(v: str) -> bool:
    return bool(v) and not WIP.search(v) and bool(STABLE.match(v))


def vkey(v: str) -> tuple:
    return tuple(int(p) for p in v.split("."))


def newest(versions) -> str | None:
    stable = {v for v in versions if is_stable(v)}
    return max(stable, key=vkey) if stable else None


def versions_in_tree(src: Path) -> set[str]:
    """Every version this project declares or has ever built."""
    found = set()

    def add(m):
        if m:
            found.add(m.group(1).strip().strip("'\""))

    for name, pat in (
        ("gradle.properties", r"^\s*mod_version\s*=\s*(.+)$"),
        ("pom.xml", r"<version>([^<]+)</version>"),
    ):
        f = src / name
        if f.is_file():
            add(re.search(pat, f.read_text(errors="ignore"), re.M))

    for p in list(src.glob("src/main/resources/plugin.yml")) + list(
        src.glob("src/main/resources/paper-plugin.yml")
    ):
        add(re.search(r"^version:\s*(.+)$", p.read_text(errors="ignore"), re.M))

    for p in src.glob("src/main/resources/fabric.mod.json"):
        try:
            add(re.search(r'"version"\s*:\s*"([^"$]+)"', p.read_text(errors="ignore")))
        except OSError:
            pass

    # Built and released jars are the strongest evidence a version shipped.
    # Capture the whole version token including any -proto.2 / -rc1 suffix, so
    # is_stable() can reject it. Matching only the digits would read
    # "wtf-2.4.0-proto.1.jar" as a 2.4.0 release, which never existed.
    # Only `releases/` counts. build/libs and target/ hold throwaway local
    # builds that were never shipped, and treating those as releases is how a
    # test build ends up advertised on the site.
    for jar in (src / "releases").glob("*.jar"):
        stem = re.sub(r"[-_](debug|sources)$", "", jar.stem)
        # First version-shaped token after the name; a trailing _26.2 is the
        # Minecraft target, not the project version, so stop at the next "_".
        m = re.search(r"[-_](\d+(?:\.\d+)*(?:-[\w.]+?)?)(?=$|_)", stem)
        if m:
            found.add(m.group(1))

    return found


def modrinth_latest_version(slug: str) -> str | None:
    """Newest published release on Modrinth, normalised to digits and dots.

    Modrinth version names carry extra freight — a Minecraft suffix
    ("2.3.1_26.2") or a description ("1.4.25_all_spots_head_collector").
    The leading numeric token is the actual version.
    """
    data = _get(f"{API.format(slug)}/version")
    if not data:
        return None
    found = []
    for v in data:
        num = v.get("version_number", "")
        if v.get("version_type") != "release" or WIP.search(num):
            continue
        m = re.match(r"\d+(?:\.\d+)*", num)
        if m and is_stable(m.group(0)):
            found.append(m.group(0))
    return max(found, key=vkey) if found else None


def _get(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise
    except (urllib.error.URLError, TimeoutError) as e:
        print(f"  ! modrinth unreachable ({e}) — keeping stored values")
        return None


def modrinth(slug: str) -> dict | None:
    req = urllib.request.Request(API.format(slug), headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None  # not published yet, or wrong slug
        raise
    except (urllib.error.URLError, TimeoutError) as e:
        print(f"  ! modrinth unreachable ({e}) — keeping stored values")
        return None


def sync(project: dict, offline: bool) -> list[str]:
    """Update one project in place. Returns human-readable changes."""
    changes = []

    def set_(field, value):
        if value is not None and project.get(field) != value:
            changes.append(f"{field}: {project.get(field)!r} -> {value!r}")
            project[field] = value

    src = project.get("source")
    if src:
        path = Path(src.replace("~", str(Path.home())))
        if path.is_dir():
            found = versions_in_tree(path)
            # Versions that look stable but were abandoned — a release line you
            # backed out of. Nothing in the numbering reveals this, so it is
            # declared per project.
            found -= set(project.get("exclude", []))
            best = newest(found)
            if best:
                set_("version", best)
            elif found:
                skipped = ", ".join(sorted(found))
                print(f"  · no stable version yet (ignored: {skipped})")
        else:
            print(f"  ! source missing: {src}")

    slug = project.get("modrinth")
    if slug and not offline:
        data = modrinth(slug)
        if data:
            set_("downloads", data.get("downloads"))
            set_("modrinth_type", data.get("project_type"))
            # Modrinth is the published truth. It wins over the local tree,
            # and for projects whose source is gone it is the only record.
            published = modrinth_latest_version(slug)
            if published:
                set_("version", published)
            # approved/listed means it cleared review — flip the badge.
            if data.get("status") in ("approved", "listed"):
                set_("status", "published")
            gv = [g for g in data.get("game_versions", []) if g]
            if gv:
                set_("mc", gv[0] if len(gv) == 1 else f"{gv[0]}–{gv[-1]}")
            vs = data.get("versions")
            if vs:
                set_("modrinth_id", data.get("id"))
        elif project.get("status") == "in-review":
            print("  · still not public on Modrinth")

    return changes


def bump_assets() -> bool:
    """Re-stamp ?v= on css/js so browsers can't serve a stale cached copy."""
    html = ROOT / "index.html"
    if not html.is_file():
        return False
    blob = b"".join(
        (ROOT / n).read_bytes()
        for n in ("main.js", "style.css", "viewer.js")
        if (ROOT / n).is_file()
    )
    digest = hashlib.md5(blob).hexdigest()[:8]
    src = html.read_text()
    out = re.sub(r"(style\.css|main\.js)\?v=[0-9a-f]+", rf"\1?v={digest}", src)
    if out != src:
        html.write_text(out)
        print(f"assets: cache key -> {digest}")
        return True
    return False


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("ids", nargs="*", help="project ids; default all")
    ap.add_argument("--offline", action="store_true", help="skip Modrinth")
    ap.add_argument("--check", action="store_true", help="report drift, write nothing")
    args = ap.parse_args()

    doc = json.loads(DATA.read_text())
    before = json.dumps(doc, sort_keys=True)

    targets = [p for p in doc["projects"] if not args.ids or p["id"] in args.ids]
    if args.ids and not targets:
        print(f"no project matching: {', '.join(args.ids)}", file=sys.stderr)
        return 1

    total = 0
    if bump_assets():
        total += 1
    for p in targets:
        print(f"{p['id']}:")
        for line in sync(p, args.offline):
            print(f"  {line}")
            total += 1

    if not total:
        print("\nno changes")
        return 0

    if args.check:
        print(f"\n{total} change(s) pending — run ./sync.py to apply")
        return 1

    doc["generated"] = subprocess.run(
        ["date", "+%Y-%m-%d"], capture_output=True, text=True
    ).stdout.strip()
    DATA.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
    print(f"\n{total} change(s) written to {DATA.name}")
    return 2 if json.dumps(doc, sort_keys=True) != before else 0


if __name__ == "__main__":
    sys.exit(main())
