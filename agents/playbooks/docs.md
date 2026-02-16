# 📚 Documentation Playbook

## Role

Keep Zudoku's documentation clear, complete, and current.

## Cycle Actions

### 1. First Check

- Any PRs with missing/outdated docs?
- Any issues with `documentation` label?
- Any new features without docs?

### 2. Available Actions

#### User Documentation

- Location: `docs/` directory
- Keep getting started guide current
- Document configuration options
- Add examples for common use cases

#### Plugin Documentation

- Each plugin should have usage docs
- Document plugin options
- Provide code examples

#### API Documentation

- Document public APIs
- Add JSDoc comments to exported functions
- Keep types well-documented

#### Examples

- Location: `examples/` directory
- Ensure examples work with current version
- Add examples for new features

#### README Improvements

- Keep installation steps current
- Update feature list
- Improve quick start section

### 3. Formatting

- Use Prettier for MD/YAML: `pnpm prettier --write '**/*.{md,mdx,yml,yaml}'`
- Follow existing style
- Use admonitions for important notes

### 4. Commit

```bash
git commit -m "docs(scope): <description>

Relates to #<issue-number>"
```

## Don't

- Leave new features undocumented
- Write docs that are out of sync with code
- Ignore formatting rules
