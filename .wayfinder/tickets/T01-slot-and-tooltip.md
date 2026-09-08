---
id: T01
title: The slot and the tooltip
labels: [wayfinder:prototype]
map: talkable-portfolio
status: closed
assignee: claude
blocked-by: []
---

## Question

What does one project look like in the grid, and what does hovering it do?

The tooltip is the signature — the single most screenshottable element on the
site — so it gets prototyped before anything else is built around it.

Decide together:

- **Slot content.** Does a card become a bare icon slot with the tooltip
  carrying all text, or keep name/blurb/chips visible as today? Bare slots make
  a denser, more inventory-like grid and lean harder on hover; visible text is
  what "clear and organized" currently buys.
- **Tooltip anatomy.** Fidelity to the real Minecraft tooltip: dark violet
  background, two-tone purple border, item name line, gray lore lines, the
  italic footer. How close is close enough before it reads as a knockoff.
- **Rarity and glint.** Live Modrinth downloads drive an item rarity color, and
  the top project gets the enchantment glint. Set the thresholds and the color
  ramp. `wtf` at 256 is the current top; `SuperUtilities` at 19 the floor;
  five projects have no number at all.
- **Touch.** Hover does not exist on a phone. Tap-to-tooltip, tooltip-on-page,
  or the grid degrades to today's card on small screens.

Prototype it against real `projects.json` data, not lorem.

## Resolution

**Variant D ("Workshop") wins**, arrived at through four variants judged against real
`projects.json` data — A Chest (bare 9-wide slots), B Ledger (a row each), C Weighted
(size by downloads), D Workshop (C, gone full-bleed and 3D).

- **Slot content.** Tiles carry name, downloads, and — on the larger ones — the blurb.
  Bare slots lost: 14 items in two rows left the page looking empty and gave no clue
  to hover.
- **Tooltip.** Kept, and quoted rather than invented: ground `rgba(16,0,16,.94)`, a
  `#5000FF → #28007F` gradient border, Press Start 2P name line in the rarity colour,
  `#AAAAAA` lore, `#555555` stats, italic footer.
- **Rarity.** Live downloads drive it: epic 200+, rare 100+, uncommon 25+, else common.
  It is load-bearing — it sets tile *size* as well as name colour. `wtf` is the only
  epic and carries the enchantment glint.
- **The icons are real Minecraft models**, not emoji. Vanilla JSON models are flattened
  offline out of the Loom client jar (parent chains and texture vars resolved); item
  sprites are extruded per opaque pixel the way Minecraft builds a generated item;
  chest and shulker are entity-rendered so they are rebuilt from the entity box-UV
  layout. Chosen semantically, not decoratively — `barrel` for Shopah (the block the
  plugin uses), `golden shovel` for SuperUtilities (GriefPrevention's claim tool),
  `cartography table` for Art Snap, `totem of undying` for Death On The Spot. CAPSlock
  is the literal string "Ab" cut out of `ascii.png`. Art Snap is a composite —
  map, arrow, map — because the mod is about the transfer.
- **Motion.** No loop spin. A slow idle drift plus a bob; hover hands rotation to the
  cursor. Blocks sit in the inventory pose so two faces always read.
- **The moment:** hovering `wtf` puts a compass on the cursor whose needle tracks the
  shulker box.
- **One shared WebGL context** for the whole grid, scissored per tile.

**Still open, deliberately:** touch. Hover does not exist on a phone and the tooltip
swallows the grid at 390px. Graduated to its own ticket.

Prototype: `prototype-slots.html` + `prototype-mc.js` + `prototype-assets/`, captured
on branch `prototype/mc-workshop`. `?variant=A|B|C|D` switches; `&tip=<id>` forces a
tooltip; `&demo=wtf` fakes the hover.
