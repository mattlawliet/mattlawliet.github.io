---
id: T03
title: Can we hotlink the Modrinth galleries?
labels: [wayfinder:research]
map: talkable-portfolio
status: open
assignee:
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
