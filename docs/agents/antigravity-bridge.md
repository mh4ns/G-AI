# Claude Code ↔ Antigravity bridge

Claude Code runs in the cloud and cannot drive Antigravity (local IDE) directly.
The two agents communicate through files in this repository.

## Flow

1. **Claude Code** writes a task to `docs/agents/handoff/inbox/NNNN-short-name.md`, commits and pushes.
2. **You** open the repo in Antigravity and type `/claude-tasks` (workflow in `.agent/workflows/claude-tasks.md`).
3. **Antigravity** pulls, executes the oldest task, writes a `## Result`, moves the file to `handoff/done/`, commits and pushes.
4. **Claude Code** pulls and reads the result to review or queue follow-ups.

Workspace rules for Antigravity live in `.agent/rules/g-ai.md` (always on; points to `AGENTS.md`).

## Task file format

```markdown
---
id: 0001
title: Short imperative title
branch: claude/eloquent-lovelace-i57p77
status: todo   # todo | done | blocked
from: claude-code
---

## Goal
What and why.

## Steps
1. ...

## Done when
- `npm run typecheck` passes in apps/web
- ...
```

Rules: one task per file, numbered so order is explicit; tasks must be self-contained (Antigravity does not see Claude's conversation); never put secrets in a task file.
