---
id: T03
title: Can we hotlink the Modrinth galleries?
labels: [wayfinder:research]
map: talkable-portfolio
status: closed
assignee: claude
blocked-by: []
---

## Question

The comics on Modrinth are the best media that exists. Establish whether the
site can use them directly, before any layout assumes it can.

- Does `cdn.modrinth.com` permit hotlinking from a third-party site — terms,
  and any rate limiting or referer policy in practice?
- What image variants exist? Gallery URLs carry a `_350` suffix on some entries
  and none on others (`…537c_350.webp` vs `…f48e.png`). Determine how to get
  full resolution and whether every image has every variant.
- Does `GET /v2/project/{id}` expose caption, ordering and `featured` reliably
  for gallery entries, and is that ordering the one shown on the site?
- Licensing: these are the user's own uploads, but confirm nothing in the
  Modrinth terms complicates re-display.
- Fallback: cost of mirroring the ~18 images into the repo instead.

Findings go in a Markdown file in the repo, linked from this ticket.

## Resolution

**Don't hotlink — mirror.** Decided by Matt without waiting on the terms research,
which makes the terms question moot rather than answered.

The practical half had already answered itself: the site hotlinked
`cdn.modrinth.com` in production across several deploys and the images always
loaded. That was never the real risk. The risk is that a CDN is free to start
refusing requests from another domain, and those URLs are not ours to depend on.
These are Matt's own uploads, so a copy costs almost nothing and removes the
dependency outright.

`sync.py` now mirrors each published project's gallery into
`assets/gallery/<id>/`, carrying captions and ordering into `projects.json`.
**19 images, 1.7 MB.** An image deleted on Modrinth is deleted here on the next
sync, so the mirror cannot rot into showing something that no longer exists.

The project page draws its gallery from `projects.json` and consults the API only
for numbers that actually change. The favicon — the last thing still pointing at
someone else's CDN — is mirrored too. Nothing on the page now loads from another
domain except Google Fonts and the three.js module.

Unanswered on purpose: the full-resolution question from the original ticket. The
`_350` variants Modrinth serves are what the gallery displays, and they are what
was mirrored. Worth revisiting only if the cards ever want print-size art.
