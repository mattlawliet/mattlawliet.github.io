---
id: T04
title: What the hero becomes
labels: [wayfinder:prototype]
map: talkable-portfolio
status: closed
assignee: claude
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

## Resolution

**The avatar is replaced by the Rimuru mask**, rendered by the same engine as the
grid and turning toward the cursor like every other item on the page. It is
interactive, not decorative — the hero now uses the site's own interaction
language rather than sitting outside it. It is also Matt's own Blockbench model,
so the one thing a visitor sees first carries no Mojang question at all.

That is a real trade, recorded rather than glossed: the site no longer shows the
avatar Matt uses on GitHub and Modrinth. The mask is more distinctive and more
his; the handle still names him.

**The number is a quiet line, not a hero statistic.** `774 downloads · 8 published
· 14 projects`, the count in the accent colour. The ticket asked whether an honest
774 is an asset or a liability displayed large — displayed large it would look
thin, so it is set at 12.5px beside the bio where it reads as precision instead of
a boast. It is summed from `projects.json`, which `sync.py` already keeps current;
fetching it live would mean eight API calls before the page could say anything.

**The cost question resolved itself.** The ticket worried about three.js becoming
load-bearing on first paint — it already is, since the grid renders fourteen
models. The hero model is a fifteenth view in the existing context and costs
nothing extra.

**Survived unchanged:** wordmark, scanlines, handle, bio, link buttons.

Two small renderer additions fell out of this: `item.tilt` can now be overridden,
because the three-quarter inventory pose that suits a barrel is wrong for
something read as a portrait, and the hero sets `yaw` explicitly for the same
reason.
