---
id: T05
title: Three tiers and a search box
labels: [wayfinder:grilling]
map: talkable-portfolio
status: open
assignee:
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
