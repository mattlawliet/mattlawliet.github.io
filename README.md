# mattlawliet.github.io

Portfolio site. Static, hosted on GitHub Pages, no build step — push to `main`
and it deploys.

## How it fits together

```
projects.json   the only source of truth for what appears on the site
main.js         renders cards + detail rail from that file
viewer.js       Blockbench .bbmodel viewer (loaded on demand)
style.css
sync.py         updates projects.json from local sources + the Modrinth API
install-hooks.sh  arms a post-commit hook in each project repo
models/         .bbmodel files, textures embedded as data URIs
```

Cards are **not** written in HTML. To change what the site shows, edit
`projects.json` or run `./sync.py` — never `index.html`.

## Updating after a release

```bash
./sync.py              # everything
./sync.py wtf          # one project
./sync.py --offline    # skip Modrinth, local version numbers only
./sync.py --check      # report drift, write nothing (exit 1 if stale)
git add -A && git commit -m "chore: sync" && git push
```

`sync.py` pulls, per project:

- **version** — from the source tree, or from Modrinth when the project is
  published there (Modrinth wins; it is the published truth)
- **downloads** and **status** — Modrinth. An `approved`/`listed` project
  automatically flips from "In review" to "Published"
- **mc** — the game version range Modrinth reports
- a fresh **cache key** stamped onto `style.css` / `main.js` / `viewer.js`

### What counts as a release

Only a version that is digits and dots. Anything containing `proto`, `test`,
`wip`, `rc`, `alpha`, `beta`, `snapshot`, `pre`, `dev` or `nightly` — anchored
to a separator, so a descriptive name like `1.4.25_all_spots_head_collector`
still counts — is treated as a work in progress and ignored.

Only `releases/` is scanned for built jars. `build/libs` and `target/` hold
throwaway local builds; trusting those is how a test build ends up advertised.

Some versions look stable but were abandoned. Nothing in the numbering reveals
that, so list them per project:

```json
"exclude": ["1.3.0", "1.3.0-1"]
```

DeathChestReborn uses this: 1.3.0 and 1.3.0-1 were both built 2026-05-25 and
1.2.1 shipped the day after, so the 1.3.x line was backed out.

### Projects whose source is gone

Art Snap and Death On The Spot have no local source. Their `source` is `null`
and everything comes from Modrinth. This is deliberate and needs no special
handling — do not "fix" it by pointing them at a local path.

## Automatic updates

```bash
./install-hooks.sh --list     # what would be touched
./install-hooks.sh            # install
./install-hooks.sh --remove   # take them back out
```

Installs a `post-commit` hook in every project with a git repo and a `source`
path. It fires only when a commit touches a version file **and** the new
version is stable, then syncs and commits the site.

**Installed and armed since 2026-08-25.** A stable version bump in any of the
eight hooked projects commits *and pushes* the site with no further
confirmation — the release is public about a minute later. To bump a version
without publishing:

```bash
MATTDEV_NOPUSH=1 git commit -m "release 2.4.0"
```

Hooked: shopah, deathchestreborn, superutilities, wtf, capslock, noted, ptime,
parakon.

Not hooked, so they need `./sync.py` by hand: **ForkPaperFix** (no git repo),
and **Art Snap** / **Death On The Spot** (no local source). Modrinth download
counts also drift with no commit to trigger on, so an occasional manual sync is
worth running regardless.

## Adding a project

Append to `projects.json`:

```json
{
  "id": "slug", "name": "Name", "icon": "📦",
  "kind": "Fabric Mod | Paper Plugin | Tool | 3D Art",
  "blurb": "One line, shown on the card.",
  "detail": "A paragraph, shown in the rail.",
  "mc": "1.21+", "version": null,
  "status": "published | in-review | source | local",
  "downloads": null,
  "modrinth": "modrinth-slug or null",
  "github": "url or null",
  "source": "~/Projects/... or null"
}
```

`kind` must match a filter button in `index.html`, and its colour comes from
`KIND` in `main.js` plus a `.chip.*` rule in `style.css`. A new kind needs all
three.

## 3D models

`viewer.js` reads Blockbench `.bbmodel` files directly — they are boxes with
per-face UVs, which map onto `BoxGeometry`. Textures are embedded as data URIs
inside the file, so models are self-contained.

Two things to know before editing it:

- Both UV modes are in use. `box_uv: true` means one offset implies the
  standard six-face layout; otherwise each face carries its own rectangle.
- Zero-thickness cubes are normal. Blockbench uses them as flat planes for
  gills, fins and limbs — nine of axolittle's eleven parts. `BoxGeometry`
  rejects a zero dimension, so they get a 0.001 sliver. Do not skip them.

To add a model: drop the `.bbmodel` in `models/` and add it to the `models`
array on that project.

## Gotchas

- **Caching.** `style.css`, `main.js` and `viewer.js` carry a content hash
  stamped by `sync.py`. Edit any of them and run `./sync.py`, or browsers serve
  a stale copy — this already caused one "the page is blank" false alarm.
  `main.js` is a module and passes its own `?v=` through to `viewer.js`.
- `rm` on this machine is aliased to `trash -v`, which fails silently on large
  directories. Use `command rm -rf`.
- Modrinth registers every one of these as a **mod**, including the Paper
  plugins, so links are `/mod/<slug>`. `sync.py` reads `project_type` and
  keeps `modrinth_type` correct.
