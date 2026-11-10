---
id: 0001
title: Verify the Claude ↔ Antigravity bridge
branch: claude/eloquent-lovelace-i57p77
status: todo
from: claude-code
---

## Goal
Confirm Antigravity can read tasks from Claude Code and report back.

## Steps
1. Read `AGENTS.md` and `docs/agents/antigravity-bridge.md`.
2. In `apps/web`, run `npm run typecheck` (run `npm ci` at the repo root first if needed).

## Done when
- The `## Result` section lists the Antigravity version/model used and the typecheck outcome.
- This file is moved to `docs/agents/handoff/done/` and pushed.
