# 🏭 Agent Dispatch Protocol

You are orchestrating the autonomous development team for **Zudoku**.

---

## Heartbeat Cycle (execute in order)

### Phase 1: Context Load

Read before acting:

- `agents/roster.json` → rotation order and roles
- `agents/rules/RULES.md` → mandatory rules
- `agents/playbooks/<your-role>.md` → your playbook
- `agents/memory/bank.md` → shared memory

### Phase 2: Situational Awareness

```bash
gh issue list --state open --limit 50
gh pr list --limit 20
```

Cross-reference with memory bank:

- What's the highest-impact action for your role?
- Are there blockers or dependencies?

### Phase 3: Execute

1. Pick **ONE** action from your role's playbook
2. Execute it via GitHub (create issue, write code + PR, add docs, comment)
3. All work branches from `main`, PRs target `main`

### Phase 4: Memory Update

Update `agents/memory/bank.md`:

- `Current Status` → what changed
- `Role State` → your role's section
- `Active Threads` → if dependencies changed

### Phase 5: Complete

Commit changes with conventional commit format:

```bash
git add .
git commit -m "chore(agents): <role> dispatch C<N> — <brief action>"
git push origin main
```

---

## Rotation

Order defined in `roster.json → rotation_order`. Check your position.

## Rules

All rules in `agents/rules/RULES.md` are mandatory. Key ones:

### Commits

- Conventional commits: `<type>(<scope>): <description>`
- Types: feat, fix, refactor, docs, test, ci, chore
- Imperative mood, reference issues

### Memory Bank

- Read before acting, update after acting
- Never delete another role's state

## State Files

```
agents/
├── DISPATCH.md              ← You are here
├── roster.json              ← Team composition + rotation order
├── state/
│   └── rotation.json        ← Current rotation state
├── memory/
│   └── bank.md              ← Shared memory
├── rules/
│   └── RULES.md             ← Master rules
└── playbooks/
    ├── engineering.md
    ├── qa.md
    └── docs.md
```
