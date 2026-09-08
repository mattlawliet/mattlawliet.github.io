# Local-markdown wayfinder tracker

No issue tracker is configured for this repo, so the map lives here.

- `MAP.md` — the map. One per effort. `labels: [wayfinder:map]`.
- `tickets/T##-<slug>.md` — child issues. `blocked-by` lists ticket ids.

**Claim** a ticket by putting your name in `assignee:` before doing any work.
**Resolve** it by appending a `## Resolution` section, setting `status: closed`,
and adding a one-line gist to the map's *Decisions so far* linking the file.

**Frontier** — what is takeable right now:

```sh
grep -L 'status: closed' .wayfinder/tickets/*.md \
  | xargs grep -l 'blocked-by: \[\]' \
  | xargs grep -L 'assignee: .'
```
