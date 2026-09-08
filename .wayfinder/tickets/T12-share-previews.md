---
id: T12
title: What a pasted link looks like
labels: [wayfinder:grilling]
map: talkable-portfolio
status: closed
assignee: claude
blocked-by: []
---

## Question

Graduated from the fog once routing was settled. "People talk about it" means
links get pasted into Discord, Reddit and Modrinth comments — and a hash route
(`#/shopah`) previews as the site's generic root card, identical for all
fourteen projects.

- Is a per-project preview worth leaving client-side hash routing for? The
  alternative is generating a real directory and `index.html` per project, which
  means a build step this repo has never had, or fourteen committed stubs kept in
  sync by `sync.py`.
- If yes: what does the preview image show? The 3D item on the site's ground is
  the obvious candidate, and it can be rendered rather than photographed.
- Title, description and image per project, and which of those `sync.py` owns.
- Does the root page need its own card, distinct from the project ones?

Decide the trade honestly: hash routing works, costs nothing, and is invisible
until someone shares a link — which is the exact moment this effort is aimed at.

## Resolution

**Yes — worth leaving hash routing for.** Every project now has a real URL at
`/p/<id>/`, and a pasted link carries its own card.

- **No build step.** `sync.py` already writes files and already runs on every
  release, so it writes the pages too. Each one is `index.html` with the block
  between the `og:` markers swapped for that project's tags — same markup, same
  scripts, one page to maintain. `main.js` reads the id back out of the path, and
  `#/<id>` still resolves so links shared before this keep working.
- **The preview image is a rendered card**, 1200×630: the project's Minecraft item
  on the site's ground, its name in its rarity colour, kind, blurb, download count
  and the wordmark. Fourteen of them plus a site card. Pasting `wtf` shows the
  purple shulker box; `SuperUtilities` shows the golden shovel.
- **Rendering needs a browser**, so it cannot live in `sync.py`. `tools/make-cards.sh`
  drives headless Chromium over `tools/card.html`, which reuses the site's own
  renderer rather than reimplementing it. Documented in the README; stale cards
  still work, they just show an old number.
- Full static generation was rejected: the pages fetch live Modrinth data anyway,
  so baking their content would reintroduce exactly the staleness `sync.py` exists
  to prevent.

Asset paths in `index.html`, `main.js` and `mc.js` became root-absolute, since the
same files are now served from `/p/<id>/` as well as `/`.
