// Validates the structured changelog block in a pull request description and
// keeps the PR's changelog labels in sync with it. Run by
// .github/workflows/changelog-check.yaml through actions/github-script.
//
// The block is the source of truth; labels are derived from it so tooling
// and humans scanning the PR list can filter without parsing the body. Only
// the labels this script manages are ever removed: the changelog labels in
// `managedLabels`, and the type labels below once a valid block no longer
// implies them. Other labels a human sets are never touched.

const TYPE_LABELS = {
  new: "feature",
  improved: "improvement",
  changed: "behavior-change",
  fixed: "bug",
  deprecated: "deprecation",
  breaking: "breaking-change",
};
const DERIVED_TYPE_LABELS = new Set([
  ...Object.values(TYPE_LABELS),
  "internal",
]);

const LABEL_META = {
  "changelog:customer": ["0e8a16", "Customer-facing change for the changelog"],
  "changelog:internal": ["cfd3d7", "No customer-facing change"],
  "changelog:hold": ["fbca04", "Customer-facing, but not yet announced"],
  "changelog:highlight": ["5319e7", "Worth a long-form changelog post"],
  "changelog:needs-triage": ["d93f0b", "Changelog block missing or invalid"],
  "skip-changelog": ["cfd3d7", "Excluded from release notes"],
  feature: ["a2eeef", "New feature"],
  improvement: ["a2eeef", "Improvement to existing behavior"],
  "behavior-change": ["fbca04", "Changes existing behavior users rely on"],
  bug: ["d73a4a", "Bug fix"],
  deprecation: ["fbca04", "Deprecates an option or behavior"],
  "breaking-change": ["b60205", "Breaking change"],
  internal: ["cfd3d7", "Internal change"],
};

export const CONFIGS = {
  internal: {
    section: "Changelog",
    fence: "changelog",
    title: "Changelog block",
    audience: "customer",
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
    // Bot PRs without a block are marked internal.
    botsAreInternal: true,
    externalContributorsOptional: false,
  },
  public: {
    section: "Release notes",
    fence: "release-notes",
    title: "Release notes block",
    audience: "user",
    impacts: ["user", "internal", "none"],
    customerImpact: "user",
    types: Object.keys(TYPE_LABELS),
    disclosures: null,
    managedLabels: ["skip-changelog", "changelog:needs-triage"],
    // Bot PRs (dependency updates) keep their own release notes section, so
    // they get no skip-changelog label.
    botsAreInternal: false,
    externalContributorsOptional: true,
  },
};

// Text the templates ship with. A block that still contains it was not filled.
const PLACEHOLDERS = [
  "one sentence a customer would understand.",
  "one sentence a zudoku user would understand.",
  "before and after, with exact names, messages, and codes.",
  "before and after, with exact option names and messages.",
  'what a customer needs to do, or "none".',
  'what users need to change in zudoku.config.ts, or "none".',
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

// Drops HTML comments, as GitHub does when it renders the body, so the
// template's commented examples are never read as the block. An unclosed
// comment hides the rest of the body, matching GitHub.
function stripHtmlComments(text) {
  let out = "";
  let rest = text;
  for (;;) {
    const start = rest.indexOf("<!--");
    if (start === -1) return out + rest;
    out += rest.slice(0, start);
    const end = rest.indexOf("-->", start + 4);
    if (end === -1) return out;
    rest = rest.slice(end + 3);
  }
}

export function extractBlock(body, fence) {
  const withoutComments = stripHtmlComments(body ?? "");
  // An opening fence of 3+ backticks or tildes, closed by a fence of the same
  // character that is at least as long. The block may be empty.
  const re = new RegExp(
    "^[ \\t]{0,3}(`{3,}|~{3,})[ \\t]*" +
      fence +
      "[ \\t]*\\r?\\n([\\s\\S]*?)^[ \\t]{0,3}\\1[`~]*[ \\t]*$",
    "gm",
  );
  // The template puts the block last, so take the last one: a changelog fence
  // quoted inside an earlier example must not override the real block.
  const matches = [...withoutComments.matchAll(re)];
  if (!matches.length) return null;
  return matches[matches.length - 1][2].replace(/\r?\n$/, "");
}

// A deliberately small parser for the block's YAML subset: `key: value`,
// optional `# comment` after enum values, `key: >` / `key: |` followed by
// indented lines, and plain values wrapped onto indented lines.
export function parseBlock(text) {
  const fields = {};
  const unknown = [];
  const lines = text.split(/\r?\n/);
  const isContinuation = (l) => l !== undefined && /^[ \t]+\S/.test(l);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const m = line.match(/^([A-Za-z_][\w-]*):[ \t]*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    let value = m[2];
    if (/^[>|][-+]?\s*(#.*)?$/.test(value)) {
      const folded = value.startsWith(">");
      const parts = [];
      while (
        i + 1 < lines.length &&
        (isContinuation(lines[i + 1]) || !lines[i + 1].trim())
      ) {
        i++;
        parts.push(lines[i].trim());
      }
      while (parts.length && !parts[parts.length - 1]) parts.pop();
      value = folded
        ? parts.join(" ").replace(/\s+/g, " ").trim()
        : parts.join("\n").trim();
    } else {
      if (ENUM_FIELDS.has(key)) value = value.replace(/(^|\s+)#.*$/, "");
      const parts = [value.trim()];
      while (isContinuation(lines[i + 1])) {
        i++;
        parts.push(lines[i].trim());
      }
      value = parts.filter(Boolean).join(" ");
    }
    value = value.replace(/^(["'])([\s\S]*)\1$/, "$2");
    if (ENUM_FIELDS.has(key)) value = value.toLowerCase();
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
    errors.push(`\`impact\` is required: ${config.impacts.join(" | ")}.`);
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
      `\`entry\` needs one ${config.audience}-facing sentence, not the template text.`,
    );
  }
  if (isPlaceholder(fields.details)) {
    errors.push(
      "`details` still contains the template text: fill it in or delete the line.",
    );
  }
  if (isPlaceholder(fields.action)) {
    errors.push(
      '`action` still contains the template text: say what to do, or "None".',
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
    return { managed, additive, typesKnown: false };
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
  return { managed, additive, typesKnown: true };
}

function isBot(pr) {
  return BOT_AUTHORS.has(pr.user?.login ?? "") || pr.user?.type === "Bot";
}

// Pure decision for one PR: what to report and which labels to set.
export function evaluate(pr, config, areas) {
  const block = extractBlock(pr.body, config.fence);
  const external =
    config.externalContributorsOptional &&
    !MEMBER_ASSOCIATIONS.has(pr.author_association);

  if (block === null) {
    if (isBot(pr)) {
      const note = "Bot PR without a block.";
      return config.botsAreInternal
        ? {
            errors: [],
            notes: [`${note} Treated as \`impact: none\`.`],
            ...desiredLabels({ impact: "none" }, config, true),
          }
        : {
            errors: [],
            notes: [note],
            managed: new Set(),
            additive: new Set(),
            typesKnown: false,
          };
    }
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
  const problems = validate(fields, config, areas);
  const notes = unknown.length
    ? [`Ignored unknown keys: ${unknown.join(", ")}.`]
    : [];
  const labels = desiredLabels(fields, config, problems.length === 0);
  if (external && problems.length) {
    // Optional for community contributors: report, never warn or fail.
    return {
      errors: [],
      notes: [...notes, ...problems, "A maintainer will fill it in."],
      fields,
      ...labels,
    };
  }
  return { errors: problems, notes, fields, ...labels };
}

// Labels to add and remove so the PR matches `result`.
export function labelChanges(currentNames, result, config) {
  const current = new Set(currentNames);
  const wanted = new Set([...result.managed, ...result.additive]);
  const toAdd = [...wanted].filter((l) => !current.has(l));
  const removable = new Set(config.managedLabels);
  if (result.typesKnown) for (const l of DERIVED_TYPE_LABELS) removable.add(l);
  const toRemove = [...current].filter(
    (l) => removable.has(l) && !wanted.has(l),
  );
  return { toAdd, toRemove };
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

async function syncLabels({
  github,
  core,
  owner,
  repo,
  number,
  toAdd,
  toRemove,
}) {
  // Each call is independent, so one failure (a fork PR's read-only token, a
  // label someone already removed) doesn't stop the rest.
  if (toAdd.length) {
    try {
      for (const name of toAdd) await ensureLabel(github, owner, repo, name);
      await github.rest.issues.addLabels({
        owner,
        repo,
        issue_number: number,
        labels: toAdd,
      });
    } catch (error) {
      core.warning(
        `Could not add labels ${toAdd.join(", ")}: ${error.message}`,
      );
    }
  }
  for (const name of toRemove) {
    try {
      await github.rest.issues.removeLabel({
        owner,
        repo,
        issue_number: number,
        name,
      });
    } catch (error) {
      if (error.status !== 404)
        core.warning(`Could not remove label ${name}: ${error.message}`);
    }
  }
}

export async function run({ github, context, core }) {
  const enforce = process.env.CHANGELOG_CHECK_MODE === "enforce";
  try {
    await check({ github, context, core, enforce });
  } catch (error) {
    // In warn mode the check must never turn a PR red, not even on an API error.
    if (enforce) throw error;
    core.warning(`Changelog check could not run: ${error.message}`);
  }
}

async function check({ github, context, core, enforce }) {
  const config = CONFIGS[process.env.CHANGELOG_CONFIG ?? "internal"];
  if (!config)
    throw new Error(`Unknown CHANGELOG_CONFIG ${process.env.CHANGELOG_CONFIG}`);
  const areas = (process.env.CHANGELOG_AREAS ?? "")
    .split(/[\s,|]+/)
    .filter(Boolean);

  const { owner, repo } = context.repo;
  const number = context.payload.pull_request.number;
  // Re-read the PR: the event payload can be stale after quick successive edits.
  const { data: pr } = await github.rest.pulls.get({
    owner,
    repo,
    pull_number: number,
  });
  const result = evaluate(pr, config, areas);

  const { toAdd, toRemove } = labelChanges(
    pr.labels.map((l) => l.name),
    result,
    config,
  );
  await syncLabels({ github, core, owner, repo, number, toAdd, toRemove });

  const summary = core.summary.addHeading(config.title, 3);
  if (result.fields) {
    summary.addTable([
      [
        { data: "Field", header: true },
        { data: "Value", header: true },
      ],
      ...Object.entries(result.fields)
        .filter(([k]) => ENUM_FIELDS.has(k) || TEXT_FIELDS.has(k))
        .map(([k, v]) => [k, v]),
    ]);
  }
  for (const note of result.notes) {
    summary.addRaw(`ℹ️ ${note}`, true);
    core.notice(note);
  }
  for (const error of result.errors) summary.addRaw(`❌ ${error}`, true);
  if (!result.errors.length)
    summary.addRaw(`✅ ${config.title} checked.`, true);
  await summary.write();

  if (!result.errors.length) return;
  const message = `${config.title}: ${result.errors.join(" ")} See the ## ${config.section} section of .github/pull_request_template.md.`;
  if (enforce) core.setFailed(message);
  else core.warning(message);
}
