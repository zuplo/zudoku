import { existsSync, mkdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import colors from "picocolors";
import { gt } from "semver";
import { VERSION_CHECK_FILE } from "./constants.js";
import { printWarningToConsole } from "./output.js";
import box from "./utils/box.js";
import { ZUDOKU_XDG_STATE_HOME } from "./xdg/lib.js";

interface VersionCheckInfo {
  lastCheck: number;
  latestVersion: string | undefined;
}
export async function warnIfOutdatedVersion(currentVersion: string) {
  // Print update information, if available
  if (
    !process.env.ZUDOKU_OVERRIDE_CI_TO_TEST &&
    (process.env.CI || process.env.ZUDOKU_DISABLE_UPDATE_CHECK)
  ) {
    return false;
  }
  const versionCheckInfo = await getVersionCheckInfo();

  if (!versionCheckInfo.latestVersion) {
    return false;
  }
  const shouldWarn =
    gt(versionCheckInfo.latestVersion, currentVersion) &&
    !process.env.ZUDOKU_INTERNAL_DEV;

  if (shouldWarn) {
    printWarningToConsole(
      box(
        `Update available! ${colors.gray(`v${currentVersion}`)} ≫ ${colors.green(
          `v${versionCheckInfo.latestVersion}`,
        )}
Run ${colors.cyan("npm install zudoku@latest")} to update.

${colors.gray("Upgrade to receive the latest features and fixes.")}`,
      ),
    );
  }

  return shouldWarn;
}

async function getLatestVersion(): Promise<string | undefined> {
  const response = await fetch(
    "https://api.github.com/repos/zuplo/zudoku/releases?per_page=1",
  );
  // Try to get the version from the tag name
  if (response.status === 200) {
    const result = (await response.json()) as { tag_name: string }[];
    if (Array.isArray(result) && result.length > 0) {
      return result[0]!.tag_name.substring(1);
    }
  }

  return undefined;
}

async function getVersionCheckInfo(): Promise<VersionCheckInfo> {
  if (!existsSync(ZUDOKU_XDG_STATE_HOME)) {
    mkdirSync(ZUDOKU_XDG_STATE_HOME, { recursive: true });
  }
  const versionCheckPath = join(ZUDOKU_XDG_STATE_HOME, VERSION_CHECK_FILE);

  let versionCheckInfo: VersionCheckInfo | undefined;
  if (existsSync(versionCheckPath)) {
    try {
      versionCheckInfo = await readFile(versionCheckPath, "utf-8").then(
        JSON.parse,
      );
    } catch (err) {
      // Error reading or parsing file, ignore it
    }

    // Check if the file is valid, if not ignore it
    if (versionCheckInfo) {
      if (
        typeof versionCheckInfo.lastCheck !== "number" ||
        typeof versionCheckInfo.latestVersion !== "string"
      ) {
        versionCheckInfo = undefined;
      }
    }
  }

  let shouldCheck = true;
  if (versionCheckInfo) {
    const now = Date.now();
    const lastCheck = versionCheckInfo.lastCheck;
    if (now - lastCheck < 1000 * 60 * 60 * 24) {
      shouldCheck = false;
    }
  }

  if (!versionCheckInfo || shouldCheck) {
    const latestVersion = await getLatestVersion();

    versionCheckInfo = {
      lastCheck: Date.now(),
      latestVersion,
    };
    await writeFile(
      versionCheckPath,
      JSON.stringify(versionCheckInfo),
      "utf-8",
    );
  }

  return versionCheckInfo;
}
