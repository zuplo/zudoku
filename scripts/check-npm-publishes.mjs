import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";

const configPath = new URL("../.github/npm-publish-monitor.json", import.meta.url);
const reportPath = process.env.PUBLISH_MONITOR_REPORT_PATH ?? "publish-monitor-report.json";

async function loadConfig() {
  const raw = await readFile(configPath, "utf8");
  const config = JSON.parse(raw);

  if (!config.capturedAt || !config.expiresAt || !Array.isArray(config.packages)) {
    throw new Error("Monitor config must include capturedAt, expiresAt, and packages.");
  }

  return config;
}

async function fetchMetadata(packageName) {
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${packageName}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function findUnexpectedPublishes(metadata, capturedAt) {
  return Object.entries(metadata.time ?? {})
    .filter(([version]) => version !== "created" && version !== "modified")
    .map(([version, publishedAt]) => ({ version, publishedAt }))
    .filter(({ publishedAt }) => new Date(publishedAt).getTime() > capturedAt.getTime())
    .sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
}

function appendSummary(lines) {
  if (!process.env.GITHUB_STEP_SUMMARY) {
    return Promise.resolve();
  }

  return writeFile(process.env.GITHUB_STEP_SUMMARY, `${lines.join("\n")}\n`, { flag: "a" });
}

async function writeReport(report) {
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

const config = await loadConfig();
const capturedAt = new Date(config.capturedAt);
const expiresAt = new Date(config.expiresAt);
const now = new Date();

if (Number.isNaN(capturedAt.getTime()) || Number.isNaN(expiresAt.getTime())) {
  throw new Error("capturedAt and expiresAt must be valid ISO timestamps.");
}

if (now.getTime() > expiresAt.getTime()) {
  const report = {
    status: "expired",
    capturedAt: config.capturedAt,
    expiresAt: config.expiresAt,
    checkedAt: now.toISOString(),
    packages: config.packages,
  };

  await writeReport(report);
  await appendSummary([
    "## npm publish monitor",
    "",
    `Monitor expired at ${config.expiresAt}; skipping checks.`,
  ]);
  process.exit(0);
}

const detections = [];
const inspected = [];

for (const packageName of config.packages) {
  const metadata = await fetchMetadata(packageName);
  const unexpectedPublishes = findUnexpectedPublishes(metadata, capturedAt);
  const distTags = metadata["dist-tags"] ?? {};

  inspected.push({
    packageName,
    latest: distTags.latest ?? null,
    dev: distTags.dev ?? null,
    modified: metadata.time?.modified ?? null,
  });

  if (unexpectedPublishes.length > 0) {
    detections.push({
      packageName,
      unexpectedPublishes,
      distTags,
    });
  }
}

const report = {
  status: detections.length > 0 ? "detected" : "ok",
  capturedAt: config.capturedAt,
  expiresAt: config.expiresAt,
  checkedAt: now.toISOString(),
  inspected,
  detections,
};

await writeReport(report);

if (detections.length === 0) {
  await appendSummary([
    "## npm publish monitor",
    "",
    `No new publishes detected since ${config.capturedAt}.`,
    "",
    "| Package | latest | dev |",
    "| --- | --- | --- |",
    ...inspected.map(
      ({ packageName, latest, dev }) => `| \`${packageName}\` | \`${latest ?? "-"}\` | \`${dev ?? "-"}\` |`,
    ),
  ]);
  console.log(`No new publishes detected since ${config.capturedAt}.`);
  process.exit(0);
}

await appendSummary([
  "## npm publish monitor",
  "",
  `Unexpected publishes detected after ${config.capturedAt}.`,
  "",
  "| Package | Version | Published at |",
  "| --- | --- | --- |",
  ...detections.flatMap(({ packageName, unexpectedPublishes }) =>
    unexpectedPublishes.map(
      ({ version, publishedAt }) => `| \`${packageName}\` | \`${version}\` | ${publishedAt} |`,
    ),
  ),
]);

for (const { packageName, unexpectedPublishes } of detections) {
  for (const { version, publishedAt } of unexpectedPublishes) {
    console.error(`Unexpected publish detected: ${packageName}@${version} at ${publishedAt}`);
  }
}

process.exit(1);
