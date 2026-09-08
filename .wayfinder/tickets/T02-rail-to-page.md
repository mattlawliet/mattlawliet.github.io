---
id: T02
title: From rail to page
labels: [wayfinder:prototype]
map: talkable-portfolio
status: closed
assignee:
blocked-by: []
---

## Question

The 420px rail cannot hold a 7-image comic strip, a 3D viewer, live stats and
two layers of copy. Each project needs a page. What is a page here?

- **Routing.** No build step, so: client-side hash routes (`#/wtf`) rendered
  from `projects.json`, real directories with generated `index.html` per
  project, or the History API with a 404 fallback. This decides whether a link
  someone pastes previews correctly — which is the whole point of "people talk
  about it" — so weigh sharing above implementation comfort.
- **Layout.** Order and prominence of: the comic strip, the technical detail,
  the manifest table, the 3D viewer, the links out to Modrinth and source.
- **The trip back.** How the page returns to the grid without losing scroll
  position or the active tier.

Answer with a working prototype of one project page — `Shopah`, which has the
full 7-image comic and is not the top project.

## Resolution

Clicking a project opens a **full-viewport page** carrying its entire public record,
fetched live from the Modrinth API at open: downloads, followers, latest version,
release count, Minecraft range, loaders, environment, licence, published and updated
dates, every outbound link that exists, the full gallery with captions, the complete
description body, and the last ten releases with their versions, loaders, downloads
and dates.

- **Routing: hash routes** (`#/wtf`), rendered client-side from `projects.json`. Deep
  links work and back/forward behave. This is the compromise recorded rather than
  hidden: a pasted `#/shopah` produces **no link preview**, which real per-project
  static pages would. Graduated to its own ticket.
- **Bodies are markdown**, escaped before transforming, so nothing from the API reaches
  the DOM as HTML. All of Matt's bodies are plain markdown — verified against the API.
- **Unpublished projects do not fake it.** No Modrinth record means the page says so
  and shows only what this site knows, plus the GitHub link.
- **The 3D model carries over** at full size in the same shared context; grid items
  stop drawing while a page is open.
- **Multi-model projects get a carousel.** `Models & Textures` shows all three
  Blockbench models on a wide ellipse, the selected one eased to front-centre, with
  arrows, dots and keyboard control. The carousel spans the full width and the title
  block sits beneath it.

Two bugs found here are worth carrying forward as facts, not anecdotes:

1. **Blockbench models put their front on `north`**, exactly like vanilla block models,
   so every model faced away until corrected globally. A per-model `yaw` remains as an
   override; nothing currently needs it.
2. Async ordering bit three times — grid models drawing over the page, an opacity fade
   caught mid-flight, and markdown lists eaten by headings. Visibility is now a
   render-loop guard rather than a call-ordering assumption.
