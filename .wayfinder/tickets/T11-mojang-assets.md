---
id: T11
title: Whose assets are these
labels: [wayfinder:research]
map: talkable-portfolio
status: closed
assignee:
blocked-by: []
---

## Question

The grid now renders real Minecraft models, and **13 of the 16 files in
`prototype-assets/` are Mojang's** — extracted from the Loom client jar. That is
fine on a local prototype and unsettled on a public site. Nothing ships until
this is answered.

- What do Mojang's asset guidelines and the Minecraft EULA actually permit for
  redisplaying vanilla models and textures on a personal site? Distinguish
  clearly between what is permitted, what is tolerated, and what is neither.
- Does it change anything that the site promotes mods for the game?
- Attribution: is there wording that makes it acceptable, and where must it go?

Then the fallback, which is strong here because Matt paints his own textures and
models in Blockbench: **how much work is replacing them?** Fourteen items, mostly
simple boxes. The two entity-rebuilt ones (chest, shulker) are already hand-built
geometry and need only a texture swap. `Models & Textures` already uses his own
`.bbmodel` files and is unaffected either way.

Resolve with a recommendation, not just findings: ship as-is with attribution,
swap everything to Matt's own art, or a mix.

## Resolution

**Decided by Matt, without the research running: ship with Mojang's assets.**

Recorded honestly, because the ticket asked a question that was never answered.
Redistributing vanilla models and textures on a public site is a grey area rather
than a clearly permitted one; nobody read the asset guidelines or the EULA before
this call. The concern was raised once and overruled, which is Matt's call to make
on his own site.

What shipped: 13 of the 16 files under `assets/` are extracted from the Minecraft
client jar. The site carries an attribution line in the footer — "Minecraft assets
© Mojang Studios. Not an official Minecraft product." — which is the minimum a
fan-content page should say and is not a legal opinion.

The swap path stays open and cheap if this ever needs undoing: the item set is
fourteen simple shapes, the chest and shulker are already hand-built geometry
needing only a texture, and `Models & Textures` uses Matt's own `.bbmodel` files
and is unaffected either way.
