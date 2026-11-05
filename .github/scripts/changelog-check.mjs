// Validates the release-notes block in a pull request description and keeps
// the PR's release-notes labels in sync with it. Run by
// .github/workflows/changelog-check.yaml through actions/github-script.
//
// The block is the source of truth; labels are derived from it so
// maintainers can filter without parsing the body. Only the labels listed in `managedLabels` are ever removed; type
// labels (`feature`, `bug`, ...) are only ever added, so a label a human set by
// hand is never taken away.

const TYPE_LABELS = {
  new: "feature",
  improved: "improvement",
  changed: "behavior-change",
  fixed: "bug",
  deprecated: "deprecation",
  breaking: "breaking-change",
};

const LABEL_META = {
  "changelog:customer": ["0e8a16", "Customer-facing change for the changelog"],
  "changelog:internal": ["cfd3d7", "No customer-facing change"],
  "changelog:hold": ["fbca04", "Customer-facing, but not yet disclosable"],
  "changelog:highlight": ["5319e7", "Worth a long-form changelog post"],
  "changelog:needs-triage": ["d93f0b", "Changelog block missing or invalid"],
  "skip-changelog": ["cfd3d7", "Excluded from release notes"],
  feature: ["a2eeef", "New feature"],
  improvement: ["a2eeef", "Improvement to existing behavior"],
  "behavior-change": ["fbca04", "Changes existing behavior customers rely on"],
  bug: ["d73a4a", "Bug fix"],
  deprecation: ["fbca04", "Deprecates an option or behavior"],
  "breaking-change": ["b60205", "Breaking change"],
  internal: ["cfd3d7", "Internal change"],
};

export const CONFIGS = {
  internal: {
    section: "Changelog",
    fence: "changelog",
    impacts: ["customer", "internal", "none"],
    customerImpact: "customer",
    types: Object.keys(TYPE_LABELS),
    disclosures: ["public", "hold-flag", "hold-release", "hold-security"],
    managedLabels: [
      "changelog:customer",
      "changelog:internal",
      "changelog:hold",
      "changelog:highlight",
      "changelog:needs-triage",
    ],
    externalContributorsOptional: false,
  },
  public: {
    section: "Release notes",
    fence: "release-notes",
    impacts: ["user", "internal", "none"],
    customerImpact: "user",
    types: Object.keys(TYPE_LABELS),
    disclosures: null,
    managedLabels: ["skip-changelog", "changelog:needs-triage"],
    externalContributorsOptional: true,
  },
};

// Text the templates ship with. A block that still contains it was not filled.
const PLACEHOLDERS = [
  "one sentence a customer would understand.",
  "one sentence a zudoku user would understand.",
  "before and after, with exact names, messages, and codes.",
  "before and after, with exact option names and messages.",
];

const ENUM_FIELDS = new Set([
  "impact",
  "type",
  "area",
  "disclosure",
  "highlight",
]);
const TEXT_FIELDS = new Set(["entry", "details", "action"]);
const BOT_AUTHORS = new Set(["dependabot[bot]", "renovate[bot]"]);
const MEMBER_ASSOCIATIONS = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);

export function extractBlock(body, fence) {
  const withoutComments = (body ?? "").replace(/<!--[\s\S]*?-->/g, "");
  const re = new RegExp(
    "^(`{3,}|~{3,})[ \\t]*" +
      fence +
      "[ \\t]*\\r?\\n([\\s\\S]*?)\\r?\\n\\1[ \\t]*$",
    "m",
  );
  const match = withoutComments.match(re);
  return match ? match[2] : null;
}

// A deliberately small parser for the block's YAML subset: `key: value`,
// optional `# comment` after enum values, and `key: >` / `key: |` followed by
// indented continuation lines.
export function parseBlock(text) {
  const fields = {};
  const unknown = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const m = line.match(/^([A-Za-z_][\w-]*):[ \t]*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2];
    if (/^[>|][-+]?\s*(#.*)?$/.test(value)) {
      const folded = value.startsWith(">");
      const parts = [];
      while (
        i + 1 < lines.length &&
        (/^[ \t]+\S/.test(lines[i + 1]) || !lines[i + 1].trim())
      ) {
        i++;
        parts.push(lines[i].trim());
      }
      while (parts.length && !parts[parts.length - 1]) parts.pop();
      value = folded
        ? parts.join(" ").replace(/\s+/g, " ").trim()
        : parts.join("\n").trim();
    } else if (ENUM_FIELDS.has(key)) {
      value = value.replace(/\s+#.*$/, "").trim();
    } else {
      value = value.trim();
    }
    value = value.replace(/^(["'])([\s\S]*)\1$/, "$2");
    if (!ENUM_FIELDS.has(key) && !TEXT_FIELDS.has(key)) unknown.push(key);
    fields[key] = value;
  }
  return { fields, unknown };
}

function isPlaceholder(value) {
  return PLACEHOLDERS.includes((value ?? "").trim().toLowerCase());
}

export function validate(fields, config, areas) {
  const errors = [];
  const { impact } = fields;
  if (!impact) {
    errors.push("`impact` is required.");
    return errors;
  }
  if (!config.impacts.includes(impact)) {
    errors.push(
      `\`impact: ${impact}\` must be one of ${config.impacts.join(" | ")}.`,
    );
    return errors;
  }
  if (impact !== config.customerImpact) return errors;

  if (!config.types.includes(fields.type ?? "")) {
    errors.push(`\`type\` must be one of ${config.types.join(" | ")}.`);
  }
  if (areas.length && !areas.includes(fields.area ?? "")) {
    errors.push(`\`area\` must be one of ${areas.join(" | ")}.`);
  }
  if (
    config.disclosures &&
    fields.disclosure &&
    !config.disclosures.includes(fields.disclosure)
  ) {
    errors.push(
      `\`disclosure\` must be one of ${config.disclosures.join(" | ")}.`,
    );
  }
  if (fields.highlight && !["true", "false"].includes(fields.highlight)) {
    errors.push("`highlight` must be true or false.");
  }
  if (!fields.entry || isPlaceholder(fields.entry)) {
    errors.push(
      "`entry` needs one customer-facing sentence (the template text is still there).",
    );
  }
  if (isPlaceholder(fields.details)) {
    errors.push(
      "`details` still contains the template text: fill it in or delete the line.",
    );
  }
  return errors;
}

// Returns the labels the PR should carry, given a parsed and validated block.
export function desiredLabels(fields, config, valid) {
  const managed = new Set();
  const additive = new Set();
  if (!valid) {
    managed.add("changelog:needs-triage");
    return { managed, additive };
  }
  const customer = fields.impact === config.customerImpact;
  if (config.fence === "changelog") {
    if (!customer) managed.add("changelog:internal");
    else if ((fields.disclosure ?? "public").startsWith("hold"))
      managed.add("changelog:hold");
    else managed.add("changelog:customer");
    if (customer && fields.highlight === "true")
      managed.add("changelog:highlight");
  } else if (!customer) {
    managed.add("skip-changelog");
  }
  if (customer && TYPE_LABELS[fields.type])
    additive.add(TYPE_LABELS[fields.type]);
  if (!customer) additive.add("internal");
  return { managed, additive };
}

// Pure decision for one PR: what to report and which labels to set.
export function evaluate(pr, config, areas) {
  const author = pr.user?.login ?? "";
  const block = extractBlock(pr.body, config.fence);

  if (block === null) {
    if (BOT_AUTHORS.has(author)) {
      return {
        errors: [],
        notes: ["Bot PR without a block: treated as `impact: none`."],
        ...desiredLabels({ impact: "none" }, config, true),
      };
    }
    const external =
      config.externalContributorsOptional &&
      !MEMBER_ASSOCIATIONS.has(pr.author_association);
    const message = `No \`\`\`${config.fence} block found in the PR description.`;
    return external
      ? {
          errors: [],
          notes: [`${message} A maintainer will fill it in.`],
          ...desiredLabels({}, config, false),
        }
      : { errors: [message], notes: [], ...desiredLabels({}, config, false) };
  }

  const { fields, unknown } = parseBlock(block);
  const errors = validate(fields, config, areas);
  const notes = unknown.length
    ? [`Ignored unknown keys: ${unknown.join(", ")}.`]
    : [];
  return {
    errors,
    notes,
    fields,
    ...desiredLabels(fields, config, errors.length === 0),
  };
}

async function ensureLabel(github, owner, repo, name) {
  const [color, description] = LABEL_META[name] ?? ["ededed", ""];
  try {
    await github.rest.issues.createLabel({
      owner,
      repo,
      name,
      color,
      description,
    });
  } catch (error) {
    if (error.status !== 422) throw error; // 422 = already exists
  }
}

export async function run({ github, context, core }) {
  const config = CONFIGS[process.env.CHANGELOG_CONFIG ?? "internal"];
  if (!config)
    throw new Error(`Unknown CHANGELOG_CONFIG ${process.env.CHANGELOG_CONFIG}`);
  const areas = (process.env.CHANGELOG_AREAS ?? "")
    .split(/[\s,|]+/)
    .filter(Boolean);
  const enforce = process.env.CHANGELOG_CHECK_MODE === "enforce";

  const { owner, repo } = context.repo;
  const number = context.payload.pull_request.number;
  // Re-read the PR: the event payload can be stale after quick successive edits.
  const { data: pr } = await github.rest.pulls.get({
    owner,
    repo,
    pull_number: number,
  });
  const result = evaluate(pr, config, areas);

  const current = new Set(pr.labels.map((l) => l.name));
  const toAdd = [...result.managed, ...result.additive].filter(
    (l) => !current.has(l),
  );
  const toRemove = config.managedLabels.filter(
    (l) => current.has(l) && !result.managed.has(l),
  );
  try {
    for (const name of toAdd) await ensureLabel(github, owner, repo, name);
    if (toAdd.length) {
      await github.rest.issues.addLabels({
        owner,
        repo,
        issue_number: number,
        labels: toAdd,
      });
    }
    for (const name of toRemove) {
      await github.rest.issues.removeLabel({
        owner,
        repo,
        issue_number: number,
        name,
      });
    }
  } catch (error) {
    // Fork PRs get a read-only token. Labels are a convenience; the
    // validation result below is what matters.
    core.warning(`Could not update labels: ${error.message}`);
  }

  const summary = core.summary.addHeading("Changelog block", 3);
  if (result.fields) {
    summary.addTable([
      [
        { data: "Field", header: true },
        { data: "Value", header: true },
      ],
      ...Object.entries(result.fields).map(([k, v]) => [k, v]),
    ]);
  }
  for (const note of result.notes) {
    summary.addRaw(`ℹ️ ${note}`, true);
    core.notice(note);
  }
  for (const error of result.errors) summary.addRaw(`❌ ${error}`, true);
  if (!result.errors.length)
    summary.addRaw("✅ Changelog block is valid.", true);
  await summary.write();

  if (!result.errors.length) return;
  const message = `Changelog block: ${result.errors.join(" ")} See the ## ${config.section} section of .github/pull_request_template.md.`;
  if (enforce) core.setFailed(message);
  else core.warning(message);
}
