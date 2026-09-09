# Local-markdown wayfinder tracker

No issue tracker is configured for this repo, so the map lives here.

- `MAP.md` — the map. One per effort. `labels: [wayfinder:map]`.
- `tickets/T##-<slug>.md` — child issues. `blocked-by` lists ticket ids.

**Claim** a ticket by putting your name in `assignee:` before doing any work.
**Resolve** it by appending a `## Resolution` section, setting `status: closed`,
and adding a one-line gist to the map's *Decisions so far* linking the file.

**Frontier** — what is takeable right now:

```sh
python3 .wayfinder/frontier.py
```

A ticket is takeable when it is open, unassigned, and every id in its `blocked-by`
is closed. The obvious grep for `blocked-by: []` is wrong: it misses tickets whose
blockers have since been resolved, which is most of them by the end.
