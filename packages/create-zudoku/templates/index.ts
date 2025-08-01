// biome-ignore-all lint/suspicious/noConsole: Logging allowed here
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { bold, cyan } from "picocolors";
import { copy } from "../helpers/copy";
import { install } from "../helpers/install";

import type { GetTemplateFileArgs, InstallTemplateArgs } from "./types";

// When bundled by ncc, __dirname points to dist/, but templates are at dist/templates/
const TEMPLATES_DIR = __dirname.endsWith("dist")
  ? path.join(__dirname, "templates")
  : __dirname;

/**
 * Get the file path for a given file in a template, e.g. "next.config.js".
 */
export const getTemplateFile = ({
  template,
  mode,
  file,
}: GetTemplateFileArgs): string => {
  return path.join(TEMPLATES_DIR, template, mode, file);
};

/**
 * Install a Zudoku internal template to a given `root` directory.
 */
export const installTemplate = async ({
  appName,
  root,
  packageManager,
  isOnline,
  template,
  mode,
  eslint,
  skipInstall,
  zudokuVersion,
}: InstallTemplateArgs) => {
  console.log(bold(`Using ${packageManager}.`));

  /**
   * Copy the template files to the target directory.
   */
  console.log("\nInitializing project with template:", template, "\n");
  const templatePath = path.join(TEMPLATES_DIR, template, mode);
  const copySource = ["**"];
  if (!eslint) copySource.push("!eslintrc.json");

  await copy(copySource, root, {
    parents: true,
    cwd: templatePath,
    rename(name) {
      switch (name) {
        case "gitignore":
        case "eslintrc.json": {
          return `.${name}`;
        }
        // README.md is ignored by webpack-asset-relocator-loader used by ncc:
        // https://github.com/vercel/webpack-asset-relocator-loader/blob/e9308683d47ff507253e37c9bcbb99474603192b/src/asset-relocator.js#L227
        case "README-template.md": {
          return "README.md";
        }
        default: {
          return name;
        }
      }
    },
  });

  // update import alias in any files if not using the default

  /** Copy the version from package.json or override for tests. */
  const version = process.env.ZUDOKU_PRIVATE_TEST_VERSION ?? zudokuVersion;

  /** Create a package.json for the new project and write it to disk. */
  // biome-ignore lint/suspicious/noExplicitAny: Allow any type
  const packageJson: any = {
    name: appName,
    version: "0.1.0",
    type: "module",
    private: true,
    scripts: {
      dev: "zudoku dev",
      build: "zudoku build",
      preview: "zudoku preview",
      lint: "eslint",
    },
    /**
     * Default dependencies.
     */
    dependencies: {
      react: ">=19.0.0",
      "react-dom": ">=19.0.0",
      zudoku: version,
    },
    devDependencies: {},
  };

  /**
   * TypeScript projects will have type definitions and other devDependencies.
   */
  if (mode === "ts") {
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      "@types/node": "^22",
      "@types/react": "^19",
      "@types/react-dom": "^19",
      typescript: "^5",
    };
  }

  /* Default ESLint dependencies. */
  if (eslint) {
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      eslint: "^8",
    };
  }

  // Typescript eslint dependencies
  if (eslint && mode === "ts") {
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      "@typescript-eslint/eslint-plugin": "^8",
      "@typescript-eslint/parser": "^8",
    };
  }

  const devDeps = Object.keys(packageJson.devDependencies).length;
  if (!devDeps) delete packageJson.devDependencies;

  await fs.writeFile(
    path.join(root, "package.json"),
    JSON.stringify(packageJson, null, 2) + os.EOL,
  );

  if (skipInstall) return;

  console.log("\nInstalling dependencies:");
  for (const dependency in packageJson.dependencies)
    console.log(`- ${cyan(dependency)}`);

  if (devDeps) {
    console.log("\nInstalling devDependencies:");
    for (const dependency in packageJson.devDependencies)
      console.log(`- ${cyan(dependency)}`);
  }

  console.log();

  await install(packageManager, isOnline);
};

export * from "./types";
