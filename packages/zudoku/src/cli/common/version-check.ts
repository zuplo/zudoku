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

const resolvePackageJson = (pkg: string) => {
  try {
    return fileURLToPath(import.meta.resolve(`${pkg}/package.json`));
  } catch {
    return undefined;
  }
};

export const warnPackageVersionMismatch = async () => {
  if (!process.env.ZUDOKU_OVERRIDE_CI_TO_TEST && process.env.CI) {
    return;
  }

  if (process.env.ZUDOKU_ENV === "internal") {
    return;
  }

  const zudokuPkgPath = resolvePackageJson("zudoku");
  if (!zudokuPkgPath) return;

  const packageJson = getPackageJson(zudokuPkgPath);
  const reactPath = resolvePackageJson("react");
  const reactDomPath = resolvePackageJson("react-dom");

  const required = packageJson.peerDependencies;

  const installed = {
    react: reactPath ? getPackageJson(reactPath).version : undefined,
    "react-dom": reactDomPath
      ? getPackageJson(reactDomPath).version
      : undefined,
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
