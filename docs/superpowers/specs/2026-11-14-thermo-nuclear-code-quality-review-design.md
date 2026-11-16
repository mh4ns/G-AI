# Thermo-Nuclear Code Quality Review Skill

## Intent

Add the supplied rigorous maintainability-review rubric as a project skill so G-AI contributors can invoke it for unusually strict code-quality reviews.

## Goals and constraints

- Place the skill at `.agents/skills/thermo-nuclear-code-quality-review/SKILL.md`.
- Preserve its supplied review criteria, output expectations, and `disable-model-invocation: true` frontmatter.
- Follow the repository's existing skill layout and frontmatter conventions.
- Do not change application code, CI behavior, or unrelated worktree changes.

## Approaches

- **Repo-local skill (chosen):** available to G-AI contributors alongside existing project skills and versioned with the repository.
- **Personal skill installation:** available only in the current user's environment and not discoverable from the project; rejected because the request is to add it to this project.

## Verification

Confirm the skill file contains the supplied content and valid frontmatter; no application tests are needed for a documentation-only change.
