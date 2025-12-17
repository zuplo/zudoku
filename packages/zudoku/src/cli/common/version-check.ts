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

  // Try to resolve React packages from the current working directory
  // This works better in monorepo setups with pnpm
  let reactPath: string;
  let reactDomPath: string;

  try {
    reactPath = require.resolve("react/package.json", { paths: [process.cwd()] });
    reactDomPath = require.resolve("react-dom/package.json", { paths: [process.cwd()] });
  } catch {
    // Fallback: Skip version check if React can't be resolved
    // This happens in development/monorepo scenarios
    return;
  }

  const required = packageJson.peerDependencies;
  const installed = {
    react: getPackageJson(reactPath).version,
    "react-dom": getPackageJson(reactDomPath).version,
  };

  if (
    !installed.react ||
    !installed["react-dom"] ||
    !required.react ||
    !required["react-dom"]
  ) {
    throw new Error("React/React-DOM version could not be determined");
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
