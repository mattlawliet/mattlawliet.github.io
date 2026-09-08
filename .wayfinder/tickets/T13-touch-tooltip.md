---
id: T13
title: The tooltip has no hover on a phone
labels: [wayfinder:prototype]
map: talkable-portfolio
status: open
assignee:
blocked-by: []
---

## Question

Graduated from *The slot and the tooltip*, which resolved everything except this.

Hover does not exist on touch. In the prototype a tap pins the tooltip, and at
390px it covers the entire grid — the screenshot of that is the argument for a
different mechanic, not a smaller tooltip.

- Does the tooltip exist on touch at all, or does the tile carry its content
  instead at small sizes?
- The cursor-follow rotation and the `wtf` compass are both pointer-driven. What
  replaces them, if anything — device tilt, drag, or nothing at all?
- A tap currently does two jobs on touch (reveal, then open). Is that
  discoverable, or should a tap just open the page now that pages are rich?

Prototype against a real phone viewport, not a resized desktop window.
