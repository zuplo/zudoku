import path from "node:path";
import { fileURLToPath } from "node:url";
import colors from "picocolors";
import { minVersion, satisfies } from "semver";
import { getPackageJson } from "../cli.js";
import { printWarningToConsole } from "./output.js";
import box from "./utils/box.js";

export const getPkgManager = () => {
  const userAgent = process.env.npm_config_user_agent ?? "";

  if (userAgent.startsWith("yarn")) return "yarn";
  if (userAgent.startsWith("pnpm")) return "pnpm";
  if (userAgent.startsWith("bun")) return "bun";

  return "npm";
};

export const warnPackageVersionMismatch = async () => {
  if (!process.env.ZUDOKU_OVERRIDE_CI_TO_TEST && process.env.CI) {
    return;
  }

  if (process.env.ZUDOKU_ENV === "internal") {
    return;
  }

  const packageJson = getPackageJson(
    fileURLToPath(new URL("../../../package.json", import.meta.url)),
  );
  const nodeModulesPath = fileURLToPath(
    new URL("../../../..", import.meta.url),
  );
  const reactPath = path.join(nodeModulesPath, "react/package.json");
  const reactDomPath = path.join(nodeModulesPath, "react-dom/package.json");

  const required = packageJson.peerDependencies;

  const tryGetVersion = (pkgPath: string) => {
    try {
      return getPackageJson(pkgPath).version;
    } catch {
      return undefined;
    }
  };

  const installed = {
    react: tryGetVersion(reactPath),
    "react-dom": tryGetVersion(reactDomPath),
  };

  if (
    !installed.react ||
    !installed["react-dom"] ||
    !required.react ||
    !required["react-dom"]
  ) {
    printWarningToConsole(
      "Could not verify React version. Ensure react and react-dom are installed.",
    );
    return;
  }

  if (
    satisfies(installed.react, required.react) &&
    satisfies(installed["react-dom"], required["react-dom"])
  ) {
    return;
  }

  const pkgManager = getPkgManager();
  const message = `${colors.yellow("React version mismatch detected!")}

Zudoku requires specific versions of React
and React DOM to function correctly.

Installed: ${colors.bold(`react@${installed.react}, react-dom@${installed["react-dom"]}`)}
Required:  ${colors.green(`react@${required.react}, react-dom@${required["react-dom"]}`)}

To fix, run:
  ${colors.cyan(`${pkgManager} install react@${minVersion(required.react)} react-dom@${minVersion(required["react-dom"])}`)}`;

  printWarningToConsole(box(message));
  process.exit(1);
};
