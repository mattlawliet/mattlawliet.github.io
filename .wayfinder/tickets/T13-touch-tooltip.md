---
id: T13
title: The tooltip has no hover on a phone
labels: [wayfinder:prototype]
map: talkable-portfolio
status: closed
assignee: claude
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

## Resolution

**The tooltip does not exist on touch.** A tap opens the project page.

That is a deletion rather than a replacement, and it is the right shape now: the
tooltip was designed when a click opened a cramped 420px rail, so it had real work
to do. Since *From rail to page*, a tap reaches the entire public record — every
stat the tooltip showed and a great deal more. Reproducing that in a panel that
covers the grid would be worse than the thing it summarises. The tooltip stays a
pointer affordance; keyboard focus still summons it.

The two-tap dance (reveal, then open) is gone, and with it the `pinned` state that
existed only to serve it.

**The pointer check is now per-event, not once at load.** A hybrid laptop has both
a trackpad and a touchscreen and can switch between them mid-session.

**Also fixed, since the same viewport exposed it:** on a phone every rare and epic
tile spanned the full width, so almost nothing paired up and the grid was a single
long stack. Only the epic tile earns full width now; rare tiles sit one-up, which
cuts roughly a third off the scroll and gives the models more room.

**Not verified on real hardware.** Headless Chromium reports `hover: hover` and
`pointer: fine`, so the touch path could not be exercised here — only reasoned
about and read. Worth a minute on an actual phone before trusting it.
