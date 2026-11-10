---
trigger: always_on
---

# G-AI workspace rules (Antigravity)

- Follow `AGENTS.md` at the repo root: layout, commands to run before pushing, security rules.
- Claude Code (cloud) hands tasks to you through `docs/agents/handoff/` — see `docs/agents/antigravity-bridge.md`.
- When the user says "làm task từ Claude" / "run Claude tasks", run the `/claude-tasks` workflow.
- Never commit secrets, `.env` files, or personal health data.
