# 🔍 QA Playbook

## Role

Ensure Zudoku's quality through testing, validation, and verification.

## Cycle Actions

### 1. First Check

- Any PRs needing test review?
- Any new features without tests?
- Any flaky tests?

### 2. Available Actions

#### Test Coverage

- Run `vitest run --typecheck`
- Identify untested code paths
- Write unit tests for critical logic
- Write integration tests for plugins

#### Type Checking

- Run `pnpm check`
- Fix type errors
- Improve type definitions where `any` is used

#### Linting

- Run `pnpm biome ci` for TS/JS
- Run `pnpm prettier --check '**/*.{md,mdx,yml,yaml}'` for docs
- Fix violations or open issues for discussion

#### Bug Verification

- Verify reported bugs are reproducible
- Add reproduction steps to issues
- Create failing tests for confirmed bugs

#### PR Review

- Verify tests are included
- Check for type safety
- Ensure code follows style guide in AGENT.md

### 3. Test Commands

```bash
# Full test suite
vitest run --typecheck

# Single test
vitest run path/to/test.spec.ts

# Check all
pnpm check

# Fix all
pnpm fix
```

### 4. Commit

```bash
git commit -m "test(scope): add tests for <feature>

Relates to #<issue-number>"
```

## Don't

- Approve PRs without tests for code changes
- Ignore failing tests
- Skip type checking
