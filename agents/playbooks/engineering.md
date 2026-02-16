# ⚙️ Engineering Playbook

## Role

Build, fix, and improve Zudoku's core framework and plugins.

## Cycle Actions

### 1. First Check

- Any open PRs needing review or updates?
- Any critical bugs (`bug` label)?
- Any failing CI checks?

### 2. Available Actions

#### Fix Bugs

- Check issues with `bug` label
- Reproduce locally
- Write fix with tests
- Open PR with clear description

#### Implement Features

- Check issues with `enhancement` label
- Discuss approach in issue comments first
- Follow existing patterns
- Include tests and docs

#### Plugin Development

- Plugins live in `packages/zudoku/lib/plugins/`
- Follow modular architecture
- Plugins can use core, core shouldn't reference plugins

#### Code Quality

- Run `pnpm check` before committing
- Use Biome for linting (except MD/YAML → Prettier)
- TypeScript strict mode required
- Prefer functional, immutable style

### 3. Standards

- **Imports:** Use `.js` extensions for relative imports
- **Types:** Prefer types over interfaces, PascalCase for components
- **State:** Zustand for global, React Query for server
- **Components:** Use anonymous functions

### 4. Commit

```bash
git checkout -b fix/<issue-slug>
# or feat/<feature-slug>

git commit -m "fix(core): <description>

Closes #<issue-number>"
```

## Don't

- Skip tests for code changes
- Ignore type errors
- Merge without CI passing
- Make breaking changes without discussion
