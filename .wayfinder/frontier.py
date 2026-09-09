#!/usr/bin/env python3
"""What is takeable right now: open, unassigned, and every blocker closed."""
import re, sys
from pathlib import Path

TICKETS = Path(__file__).parent / "tickets"
info = {}
for f in sorted(TICKETS.glob("*.md")):
    head = f.read_text().split("---")[1]
    g = lambda k, d="": (re.search(rf"^{k}:[ \t]*(.*)$", head, re.M) or [None, d])[1].strip()
    info[g("id")] = {
        "file": f.name, "title": g("title"), "status": g("status"),
        "assignee": g("assignee"), "labels": g("labels"),
        "blocked": re.findall(r"[A-Z]\d+", g("blocked-by", "[]")),
    }

for tid, t in info.items():
    if t["status"] == "closed":
        continue
    waiting = [b for b in t["blocked"] if info.get(b, {}).get("status") != "closed"]
    if waiting:
        print(f"  blocked  {tid}  {t['title']}  ← waiting on {', '.join(waiting)}")
    elif t["assignee"]:
        print(f"  claimed  {tid}  {t['title']}  ({t['assignee']})")
    else:
        print(f"FRONTIER  {tid}  {t['title']}")
