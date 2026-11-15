# Engineering Notes & Context

## Environment & Repository Terminology

- **Repository**: `mh4ns/G-AI` (Comprehensive Health Coaching Ecosystem with Real-Time AI Companion)
- **Primary Branch Model**: Trunk-based with short-lived feature/chore branches (`chore/*`, `feat/*`, `fix/*`). Current branch: `chore/claude-project-plugins`.
- **Monorepo Workspaces**:
  - `apps/web`: Coaching application (Next.js 15 App Router, React 19, Tailwind CSS, Lucide, Canvas Confetti).
  - `apps/site`: Brand website & Movement Goods store (Next.js 15).
  - `apps/hub`: Central product navigation hub.
  - `packages/ui`: Design foundation preset, shared components (`BrandLogo`, `BackLink`), cross-site link resolvers.
  - `packages/motion`: Motion assets and scene video transitions using Remotion & Three.js.
  - `packages/shared-types`: Canonical domain models and test fixtures (`fixtures/plan-vectors.json`).
  - `apps/backend`: Python FastAPI service with SQLAlchemy 2.0 async and Alembic migrations.
- **Verification Gates**:
  - `npm run typecheck`: Strict TypeScript checking across workspaces.
  - `npm run lint`: ESLint across Next.js workspaces.
  - `npm test`: Workspace unit and integration tests.
  - Pre-push checkpoint: Automated parity checks run before asking human confirmation.
- **Agent Ecosystem**:
  - Claude / Antigravity subagents (`.claude/agents/`, `.claude/skills/`, `.agents/skills/`).
  - Roles: `ui-ux`, `devops`, `code-reviewer`, `codebase-reviewer`.
  - Mandatory Repo Grilling Protocol active for architectural changes.
