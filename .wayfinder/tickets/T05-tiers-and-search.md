---
id: T05
title: Three tiers and a search box
labels: [wayfinder:grilling]
map: talkable-portfolio
status: closed
assignee: claude
blocked-by: []
---

## Question

Fourteen projects currently sit in one flat grid behind four type filters, in
source order, with 256 downloads and "never released" looking identical.

Charting settled on three tiers plus search. Pin down the rest:

- **Names and copy.** What each tier is called on the page. "Published" /
  "In the workshop" / "Not Minecraft" are placeholders, not decisions.
- **Membership rules.** Derived from `status` and `kind`, or an explicit field?
  `Models & Textures` is `3D Art` and `local` — Minecraft-adjacent but not a
  mod. `Art Snap` and `Death On The Spot` are published with no local source.
- **What happens to the four type filters.** Tiers may replace them, or both
  survive and compose.
- **Search.** Substring or fuzzy; searches names only or blurb and detail too;
  whether it crosses tiers; whether it needs to survive with JS disabled.
- **Default sort inside a tier.** Downloads descending puts `SuperUtilities`
  last forever; source order is arbitrary.

## Resolution

**Three labelled tiers over the existing sorted grid. No search.**

Half of this ticket had already been answered by the time it was worked, and the
other half was withdrawn:

- **Names and membership.** `Published` (8) / `Source available` (3) / `In the
  workshop` (3), derived straight from `status`. No new field, and no rules to
  maintain: the three `local` projects turn out to be exactly the ones that are not
  Minecraft mods, which hands
  [Breaking the frame](T09-breaking-the-frame.md) its membership for free.
- **Form: headings, not filters.** The grid already sorted by downloads and sized
  tiles by rarity, and unreleased projects have no count so they already sank to the
  bottom. The hierarchy existed and was simply unlabelled — a visitor could not tell
  *why* the lower half was dimmer. Headings add that and nothing else. Filter chips
  were rejected twice over: they would reinstate the bar removed when the grid
  shipped, and hiding ten of fourteen projects works against discovery.
- **The four type filters** are already gone, removed when variant D shipped.
- **Default sort** is downloads descending, unchanged, now applied within each tier.

**Search was dropped, and that reverses a decision made during charting** ("three
tiers plus search"). Put back to Matt rather than quietly narrowed, and confirmed:
fourteen projects reach in about two scrolls, every one is a distinct 3D object, and
a search box over that many items is furniture implying a longer list than exists.
Worth adding at roughly thirty projects.

Found while testing: every model eased in from rotation 0 toward its resting pose,
so the whole grid visibly swung into place on load. Models now start at rest.
