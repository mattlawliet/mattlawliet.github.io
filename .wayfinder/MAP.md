---
labels: [wayfinder:map]
slug: talkable-portfolio
---

# Make the portfolio worth talking about

## Destination

`mattlawliet.github.io` redesigned so a Minecraft player screenshots it and a
developer respects it: the project grid reads as an inventory (slots, real MC
tooltips, live-data rarity and glint), each project opens a full page carrying
its Modrinth comic strip, exact technical detail and 3D model, and every entry
speaks in two layers — a human reason first, a precise spec second.

Done when that site is live on `main`, not when it is specified.

## Notes

- **Execution is in scope.** Overrides wayfinder's plan-only default. Tickets
  end in committed code, not documents. Settled in charting round 1.
- **Domain:** static site, no build step. GitHub Pages, push to `main` deploys.
- **Untouchable:** `projects.json` as sole source of truth, `sync.py`, and the
  bbmodel reading core of `viewer.js`. The schema may gain fields and the viewer
  may gain mount points; neither gets rewritten.
- **Presentation is fully up for grabs:** `index.html`, `style.css`, `main.js`.
- **Skills every session should call:** `grilling` + `domain-modeling` by
  default; `prototype` for the tickets labelled as such; `frontend-design` for
  any ticket that decides visuals.
- **Audience:** both, players first. A site unusual enough to travel on its own.
- **Voice:** the Modrinth gallery voice ("and- oh…"), not the changelog voice.
  Joke first, spec second, never comedy at the expense of the engineering.
- **Media reality:** 3 of 14 projects have anything to look at. Shopah and
  DeathChestReborn have 7-image captioned comics; wtf has 3 UI shots; Art Snap
  and Death On The Spot have a logo each; the other 9 have nothing. Design
  around this, don't assume it away.
- **Live data drifts:** Modrinth reports wtf at 256 and Art Snap at 129 against
  220/119 in `projects.json`. Run `./sync.py` before judging any number.

## Decisions so far

- Charting round 1–2 (this map's Destination and Notes): execute in-map · both
  audiences, players first · rendered visuals plus GIFs for the top 3 · two-layer
  voice · data layer survives, presentation rewritten · inventory shell with real
  pages underneath · three tiers plus search.
- [The slot and the tooltip](tickets/T01-slot-and-tooltip.md): variant D "Workshop" —
  full-bleed grid, tile size and name colour driven by live download rarity
  (epic 200+ / rare 100+ / uncommon 25+), a quoted Minecraft tooltip on hover, and
  **real Minecraft models instead of emoji**, chosen semantically per project and
  rendered in one shared WebGL context. Idle drift, cursor-follow on hover, no loop
  spin. Hovering `wtf` puts a compass on the cursor pointing at the shulker box.
- [The tooltip has no hover on a phone](tickets/T13-touch-tooltip.md): it does not exist
  on touch — a tap opens the page instead, which carries far more than a tooltip could.
  A deletion, not a replacement. Rare tiles also stopped hogging the full width on
  phones, cutting about a third off the scroll.
- [Whose assets are these](tickets/T11-mojang-assets.md): **ship with Mojang's assets**,
  decided without the research running and against a raised concern — a footer
  attribution line is the only mitigation. The swap to Matt's own art stays cheap.
- [From rail to page](tickets/T02-rail-to-page.md): clicking opens a full-viewport page
  carrying the entire live Modrinth record — stats, gallery with captions, body,
  version table — at hash routes (`#/wtf`), with a wide 3D carousel for multi-model
  projects. Unpublished projects show only what this site knows and say so.

## Not yet specified

- **The nine projects with no media.** Partly answered — the detail page now falls
  back to local data and says plainly when there is no public record. What remains:
  whether unreleased entries get a "watch this" affordance or stay inert.
- **README and PROFILE_README drift.** Both describe the current site and list
  projects by hand. Revisit after the redesign lands.
- **Where the models come from long-term.** If the Mojang assets have to go, the
  replacement set is Matt's own Blockbench work and that is a body of art to plan,
  not a swap. Only becomes real if [Whose assets are these](tickets/T11-mojang-assets.md)
  lands that way.

## Out of scope

- A 3D model for every project — rejected while charting; ~14 new models is a
  content cost that would stall the map.
- Rewriting `sync.py`'s release/version logic, hook installation, or the
  Modrinth polling model.
- A per-project 3D model *authored from scratch* for every entry — the semantic
  mapping onto existing Minecraft items did the job for a fraction of the cost.
- Analytics, a blog, a CMS, or any build step.
