---
description: Pick up and execute tasks that Claude Code queued in docs/agents/handoff/inbox
---

1. `git pull` on the current branch so the latest tasks from Claude are present.
2. List `docs/agents/handoff/inbox/*.md`, sorted by filename (lowest number first). If empty, tell the user there are no queued tasks and stop.
3. Open the first task file. Read its front matter (`branch`, `status`) and the **Goal**, **Steps** and **Done when** sections.
4. If `branch` is set, check out that branch (create it from the current branch if missing).
5. Do the steps. Follow `AGENTS.md`. Run the checks listed under **Done when**.
6. Append a `## Result` section to the task file: what changed, commands run with pass/fail, anything left undone.
7. Set `status: done` (or `status: blocked` with the reason) and `git mv` the file to `docs/agents/handoff/done/`.
8. Commit with message `handoff: <task id> <short title>` and push.
9. Ask the user whether to continue with the next task in the inbox.
