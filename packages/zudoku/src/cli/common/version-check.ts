import colors from "picocolors";
import { minVersion, satisfies } from "semver";
import { printWarningToConsole } from "./output.js";
import {
  getPackageJson,
  getPackageJsonPath,
  getZudokuPackageJson,
} from "./package-json.js";
import box from "./utils/box.js";

export const getPkgManager = () => {
  const userAgent = process.env.npm_config_user_agent ?? "";

  if (userAgent.startsWith("yarn")) return "yarn";
  if (userAgent.startsWith("pnpm")) return "pnpm";
  if (userAgent.startsWith("bun")) return "bun";

  return "npm";
};

export const warnPackageVersionMismatch = () => {
  if (!process.env.ZUDOKU_OVERRIDE_CI_TO_TEST && process.env.CI) {
    return;
  }

  if (process.env.ZUDOKU_ENV === "internal") {
    return;
  }

  const packageJson = getZudokuPackageJson();
  const reactPath = getPackageJsonPath("react");
  const reactDomPath = getPackageJsonPath("react-dom");

  const required = packageJson.peerDependencies;

  const installed = {
    react: getPackageJson(reactPath).version,
    "react-dom": getPackageJson(reactDomPath).version,
  };

  if (
    !installed.react ||
    !installed["react-dom"] ||
    !required?.react ||
    !required?.["react-dom"]
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
