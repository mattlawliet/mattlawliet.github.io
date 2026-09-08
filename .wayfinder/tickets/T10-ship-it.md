---
id: T10
title: Ship it
labels: [wayfinder:task]
map: talkable-portfolio
status: open
assignee:
blocked-by: [T01, T02, T04, T05, T06, T07, T08, T09]
---

## Question

Integration and deploy. Nothing left to decide — this is the ticket that makes
the destination true.

- Fold the accepted prototypes into `index.html`, `style.css`, `main.js`.
- Delete what the redesign replaced; the rail, scrim and focus handling either
  moved or die here.
- `./sync.py` for fresh numbers, which also stamps the cache key across
  `style.css`, `main.js` and `viewer.js`. Confirm the key actually changed.
- Check the release hooks still behave: they are armed and auto-push, so a
  version bump in any of the eight hooked projects must not commit a
  half-finished site.
- Keyboard, focus order, reduced motion, and the page with JavaScript off.
- Push to `main`, then load the live URL — not the local file — and confirm
  three.js, the Modrinth images and the fonts all resolve from the deployed
  origin.
