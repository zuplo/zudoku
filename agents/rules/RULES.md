# 📜 Master Rules

> Living rulebook for the Zudoku autonomous agent team.
> All roles MUST follow these rules.

---

## R-001: Memory Bank Protocol

**Every cycle MUST:**

1. **Read** `agents/memory/bank.md` before taking action
2. **Update** the relevant section after acting
3. **Never delete** another role's state

---

## R-002: Commit Standards

All commits follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

- **Types:** feat, fix, refactor, docs, test, ci, chore
- **Scopes:** core, plugins, docs, examples, ci
- **Mood:** Imperative ("add" not "added")
- **Footer:** Reference issues (`Closes #N`, `Relates to #N`)

---

## R-003: Code Standards

Follow the existing AGENT.md guide:

- Use `.js` extensions for relative imports
- Prefer types over interfaces
- Use Biome for linting (Prettier for MD/YAML)
- TypeScript strict mode required
- Prefer functional, immutable patterns

---

## R-004: PR Workflow

All code changes go through PRs:

1. Create feature branch: `feat/<name>` or `fix/<name>`
2. Write tests for changes
3. Ensure CI passes
4. Request review
5. Squash merge to main

---

## R-005: Quality Gates

Before merging:

- [ ] `pnpm check` passes
- [ ] `vitest run --typecheck` passes
- [ ] No new type errors
- [ ] Docs updated if needed

---

_New rules are added by committing changes to this file._
