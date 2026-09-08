---
id: T12
title: What a pasted link looks like
labels: [wayfinder:grilling]
map: talkable-portfolio
status: open
assignee:
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
