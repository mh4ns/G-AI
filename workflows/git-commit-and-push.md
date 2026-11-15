# Workflow: Safe Git Commit, Verify & Push Loop

## Goal
Automate the inspection, triage, verification, and staging of working tree changes into atomic conventional commits, pushing human intervention to the far right with a concise checkpoint brief before pushing to the remote repository.

---

## Loop Dynamics

- **Loop Name**: `git-commit-and-push`
- **Owner**: DevOps / CI-CD Agent (`devops`) & Implementing Developer
- **Cadence**: Triggered on task completion, sprint milestone, or user invocation (`/loop-me check out the commit and push them`).

---

## Vocabulary & Primitives

- **Trigger**: Developer or agent requests to commit and push changes on an active branch.
- **Push-Right**: All dirty file classification, dependency checks, TypeScript typechecking, and lint validation run autonomously before alerting the user.
- **Checkpoint**: A single decision gate right before `git push origin <branch>`. No multi-stage interruptions if automated checks pass.
- **Brief**: A high-density summary reporting:
  1. Exact list of created commits (hash + subject).
  2. Summary of verification gate results (`npm run typecheck`, `npm run lint`, `npm test`).
  3. Destination remote branch and pull request status.

---

## Step-by-Step Execution Plan

### Step 1: Fact Finding & Working Tree Triage
1. Run `git status -s` to identify modified, deleted, and untracked files.
2. Filter out environment-local or build artifacts:
   - Ensure build caches (`.remotion/`, `packages/motion/out/`, `.next/`, `node_modules/`, `agent/`) are ignored in `.gitignore`.
3. Cluster changes into semantic groups:
   - Configuration / dependencies (`package.json`, lockfiles)
   - Feature code (`apps/*`, `packages/*`)
   - Agent skills & guidelines (`AGENTS.md`, `.claude/*`, `.agents/*`, `docs/*`)

### Step 2: Verification Gates (Autonomous Pre-Commit)
Execute verification checks across the affected monorepo workspaces:
- Web App Typecheck: `npm --workspace=apps/web run typecheck`
- Root / Monorepo Typecheck: `npm run typecheck`
- Workspace Lint: `npm run lint`
- Fast Unit Tests: `npm --workspace=apps/web run test`

If any verification fails:
- Halt immediately.
- Report the specific error output with file references.
- Do not create dirty or broken commits.

### Step 3: Atomic Staging & Commit Creation
Stage files by logical boundary and generate conventional commit messages:
- Format: `<type>(<scope>): <imperative summary>`
- Examples:
  - `chore(skills): add thermo-nuclear code quality review skill and specs`
  - `feat(motion): add Remotion animation package and Next.js motion bundle config`
  - `chore(agents): configure sprint team roles and motion design guidelines`

### Step 4: Checkpoint Brief (Human Sign-off)
Present a brief to the user:
```markdown
### Pre-Push Verification Brief
- **Branch**: `chore/claude-project-plugins`
- **Verification Gates**:
  - `npm run typecheck`: PASSED
  - `npm run lint`: PASSED
  - `npm test`: PASSED
- **Commits Created**:
  - `abc1234` chore(skills): ...
  - `def5678` feat(motion): ...
- **Action Pending**: `git push origin <branch>`
```

### Step 5: Remote Push & Sync
Upon confirmation (or autonomous setting when pre-approved):
1. Execute `git push origin <branch>`.
2. Inspect `gh run list --branch <branch>` or remote status to confirm GitHub Actions CI has been triggered.
