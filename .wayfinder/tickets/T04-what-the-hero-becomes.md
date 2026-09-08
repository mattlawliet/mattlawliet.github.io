---
id: T04
title: What the hero becomes
labels: [wayfinder:prototype]
map: talkable-portfolio
status: open
assignee:
blocked-by: []
---

## Question

Today the hero is an 80px avatar, a Press Start 2P wordmark, one line of bio,
three link buttons and a scanline overlay. It is the first thing a visitor
sees and it says nothing only this site could say.

- **The model.** `viewer.js` already renders `.bbmodel` in-browser. Put a
  slowly turning Rimuru mask in the hero instead of a static avatar — decide
  whether it is decorative, draggable, or the site's first interaction.
- **The number.** Combined downloads across the 8 published projects, live from
  Modrinth. Decide whether it animates, and whether an honest ~774 is an asset
  or a liability displayed that large.
- **Cost.** three.js is currently a lazy import that only loads when someone
  opens the models card. Hero use makes it load-bearing on first paint. Decide
  what the page looks like before and if it fails.
- **What survives.** Wordmark, scanlines, bio line, link buttons.
