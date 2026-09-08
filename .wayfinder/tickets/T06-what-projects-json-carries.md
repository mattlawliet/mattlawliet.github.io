---
id: T06
title: What projects.json has to carry
labels: [wayfinder:grilling, wayfinder:domain-modeling]
map: talkable-portfolio
status: open
assignee:
blocked-by: [T01, T02, T03, T05]
---

## Question

`projects.json` is the sole source of truth and `sync.py` overwrites part of
it. The redesign needs fields that do not exist yet. Settle the schema in one
pass rather than growing it ticket by ticket.

Likely additions, to be confirmed by whatever the blocking tickets decided:

- the human one-line reason a project exists, alongside `blurb` and `detail`
- gallery images: mirrored paths or Modrinth URLs, with captions and order
- tier membership, if not derivable from `status` and `kind`
- rarity, if not derived from `downloads` at render time

Then the ownership question, which is the real one: which of these does
`sync.py` write and which stay hand-authored? The file already warns that
version, status and downloads are overwritten. Anything new must land clearly
on one side of that line or the next sync silently eats copy.

Record the resolved vocabulary in `CONTEXT.md`.
