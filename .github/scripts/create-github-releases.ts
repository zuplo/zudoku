// Creates GitHub releases for every published package except create-zudoku.
// Reads the PUBLISHED env var (JSON array of {name, version} objects) and
// creates a GitHub release for each entry, using the matching CHANGELOG.md entry.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getChangelogEntry } from "@changesets/release-utils";
import { getPackages } from "@manypkg/get-packages";

const { GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_SHA, PUBLISHED } = process.env;
if (!GITHUB_TOKEN || !GITHUB_REPOSITORY || !GITHUB_SHA || !PUBLISHED) {
  throw new Error(
    "Missing GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_SHA or PUBLISHED",
  );
}

let published: Array<{ name: string; version: string }>;
try {
  published = JSON.parse(PUBLISHED);
} catch (error) {
  throw new Error(`PUBLISHED env is not valid JSON: ${error}`);
}

const { packages } = await getPackages(process.cwd());
const dirByName = new Map(
  packages.map((pkg) => [pkg.packageJson.name, pkg.dir]),
);

for (const { name, version } of published) {
  if (name === "create-zudoku") {
    // biome-ignore lint/suspicious/noConsole: Logging allowed here
    console.log("skipping tag/release for create-zudoku");
    continue;
  }

  const dir = dirByName.get(name);
  if (!dir) throw new Error(`No workspace package found for ${name}`);

  // The package is already on npm at this point, so a missing changelog (e.g.
  // a version bumped by hand without a changeset) must not fail the release.
  const changelog = await readFile(join(dir, "CHANGELOG.md"), "utf8").catch(
    () => undefined,
  );
  const entry = changelog ? getChangelogEntry(changelog, version) : undefined;
  if (!entry) {
    // biome-ignore lint/suspicious/noConsole: Logging allowed here
    console.warn(`no changelog entry for ${name}@${version}`);
  }

  const isZudoku = name === "zudoku";
  const isPrerelease = version.includes("-");
  // zudoku keeps the `v{version}` tags it has always had
  const tag = isZudoku ? `v${version}` : `${name}@${version}`;
  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_REPOSITORY}/releases`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${GITHUB_TOKEN}`,
        accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        tag_name: tag,
        name: tag,
        body: entry?.content ?? `Published ${name}@${version} to npm.`,
        target_commitish: GITHUB_SHA,
        prerelease: isPrerelease,
        // Plugin releases must not take the repo's "Latest" badge from zudoku
        make_latest: String(isZudoku && !isPrerelease),
      }),
    },
  );
  if (!response.ok) {
    throw new Error(
      `Failed to create release ${tag}: ${response.status} ${await response.text()}`,
    );
  }
  // biome-ignore lint/suspicious/noConsole: Logging allowed here
  console.log(`created release ${tag}`);
}
