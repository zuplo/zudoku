import { existsSync, mkdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import colors from "picocolors";
import { gt } from "semver";
import { VERSION_CHECK_FILE } from "./constants.js";
import { printWarningToConsole } from "./output.js";
import box from "./utils/box.js";
import { ZUPLO_XDG_STATE_HOME } from "./xdg/lib.js";

interface VersionCheckInfo {
  lastCheck: number;
  latestVersion: string;
}
export async function warnIfOutdatedVersion(currentVersion: string) {
  // Print update information, if available
  if (
    !process.env.ZUPLO_OVERRIDE_CI_TO_TEST &&
    (process.env.CI || process.env.ZUPLO_DISABLE_UPDATE_CHECK)
  ) {
    return false;
  }
  const versionCheckInfo = await getVersionCheckInfo();
  const shouldWarn = gt(versionCheckInfo.latestVersion, currentVersion);

  if (shouldWarn) {
    printWarningToConsole(
      box(
        `Update available! ${colors.gray(`v${currentVersion}`)} ≫ ${colors.green(
          `v${versionCheckInfo.latestVersion}`,
        )}
Run ${colors.cyan("npm install zuplo@latest")} to update.

${colors.gray("Older versions are unsupported and may not work as expected.")}`,
      ),
    );
  }

  return shouldWarn;
}

async function getLatestVersion(): Promise<string> {
  const response = await fetch(
    "https://raw.githubusercontent.com/zuplo/zudoku/main/packages/zudoku/package.json",
  );
  const result = await response.json();

  return result.dependencies["zudoku"];
}

async function getVersionCheckInfo(): Promise<VersionCheckInfo> {
  if (!existsSync(ZUPLO_XDG_STATE_HOME)) {
    mkdirSync(ZUPLO_XDG_STATE_HOME, { recursive: true });
  }
  const versionCheckPath = join(ZUPLO_XDG_STATE_HOME, VERSION_CHECK_FILE);

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
