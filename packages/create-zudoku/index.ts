#!/usr/bin/env node
// biome-ignore-all lint/suspicious/noConsole: Console is used for logging
import { existsSync, readFileSync } from "node:fs";
import path, { basename, resolve } from "node:path";
import ciInfo from "ci-info";
import { Command } from "commander";
import Conf from "conf";
import { blue, bold, cyan, green, red, yellow } from "picocolors";
import type { InitialReturnValue } from "prompts";
import prompts from "prompts";
import updateCheck from "update-check";
import { createApp, DownloadError } from "./create-app";
import type { PackageManager } from "./helpers/get-pkg-manager";
import { getPkgManager } from "./helpers/get-pkg-manager";
import { isFolderEmpty } from "./helpers/is-folder-empty";
import { validateNpmName } from "./helpers/validate-pkg";

let projectPath: string = "";

const handleSigTerm = () => process.exit(0);

process.on("SIGINT", handleSigTerm);
process.on("SIGTERM", handleSigTerm);

const onPromptState = (state: {
  value: InitialReturnValue;
  aborted: boolean;
  exited: boolean;
}) => {
  if (state.aborted) {
    // If we don't re-enable the terminal cursor before exiting
    // the program, the cursor will remain hidden
    process.stdout.write("\x1B[?25h");
    process.stdout.write("\n");
    process.exit(1);
  }
};

const packageJson = JSON.parse(
  readFileSync(path.resolve(__dirname, "../package.json"), "utf-8"),
);

const program = new Command(packageJson.name)
  .version(
    packageJson.version,
    "-v, --version",
    "Output the current version of create-zudoku.",
  )
  .argument("[directory]")
  .usage("[directory] [options]")
  .helpOption("-h, --help", "Display this help message.")
  .option("--ts, --typescript", "Initialize as a TypeScript project. (default)")
  .option("--js, --javascript", "Initialize as a JavaScript project.")
  .option("--eslint", "Initialize with ESLint config.")
  .option(
    "--import-alias <prefix/*>",
    'Specify import alias to use (default "@/*").',
  )
  .option(
    "--use-npm",
    "Explicitly tell the CLI to bootstrap the application using npm.",
  )
  .option(
    "--use-pnpm",
    "Explicitly tell the CLI to bootstrap the application using pnpm.",
  )
  .option(
    "--use-yarn",
    "Explicitly tell the CLI to bootstrap the application using Yarn.",
  )
  .option(
    "--use-bun",
    "Explicitly tell the CLI to bootstrap the application using Bun.",
  )
  .option(
    "--reset, --reset-preferences",
    "Reset the preferences saved for create-zudoku.",
  )
  .option(
    "--skip-install",
    "Explicitly tell the CLI to skip installing packages.",
  )
  .option("--yes", "Use saved preferences or defaults for unprovided options.")
  .option(
    "-e, --example <example-name|github-url>",
    `

  An example to bootstrap the app with. You can use an example name
  from the official Zudoku repo or a public GitHub URL. The URL can use
  any branch and/or subdirectory.
`,
  )
  .option(
    "--example-path <path-to-example>",
    `

  In a rare case, your GitHub URL might contain a branch name with
  a slash (e.g. bug/fix-1) and the path to the example (e.g. foo/bar).
  In this case, you must specify the path to the example separately:
  --example-path foo/bar
`,
  )
  .action((name) => {
    // Commander does not implicitly support negated options. When they are used
    // by the user they will be interpreted as the positional argument (name) in
    // the action handler. See https://github.com/tj/commander.js/pull/1355
    if (name && !name.startsWith("--no-")) {
      projectPath = name;
    }
  })
  .allowUnknownOption()
  .parse(process.argv);

const opts = program.opts();
const { args } = program;

const packageManager: PackageManager = opts.useNpm
  ? "npm"
  : opts.usePnpm
    ? "pnpm"
    : opts.useYarn
      ? "yarn"
      : opts.useBun
        ? "bun"
        : getPkgManager();

async function run(): Promise<void> {
  const conf = new Conf({ projectName: "create-zudoku" });

  if (opts.resetPreferences) {
    const { resetPreferences } = await prompts({
      onState: onPromptState,
      type: "toggle",
      name: "resetPreferences",
      message: "Would you like to reset the saved preferences?",
      initial: false,
      active: "Yes",
      inactive: "No",
    });
    if (resetPreferences) {
      conf.clear();
      console.log("The preferences have been reset successfully!");
    }
    process.exit(0);
  }

  if (typeof projectPath === "string") {
    projectPath = projectPath.trim();
  }

  if (!projectPath) {
    const res = await prompts({
      onState: onPromptState,
      type: "text",
      name: "path",
      message: "What is your project named?",
      initial: "my-app",
      validate: (name) => {
        const validation = validateNpmName(basename(resolve(name)));
        if (validation.valid) {
          return true;
        }
        return `Invalid project name: ${validation.problems[0]}`;
      },
    });

    if (typeof res.path === "string") {
      projectPath = res.path.trim();
    }
  }

  if (!projectPath) {
    console.log(
      "\nPlease specify the project directory:\n" +
        `  ${cyan(opts.name())} ${green("<project-directory>")}\n` +
        "For example:\n" +
        `  ${cyan(opts.name())} ${green("my-zudoku-app")}\n\n` +
        `Run ${cyan(`${opts.name()} --help`)} to see all options.`,
    );
    process.exit(1);
  }

  const appPath = resolve(projectPath);
  const appName = basename(appPath);

  const validation = validateNpmName(appName);
  if (!validation.valid) {
    console.error(
      `Could not create a project called ${red(
        `"${appName}"`,
      )} because of npm naming restrictions:`,
    );

    validation.problems.forEach((p) =>
      console.error(`    ${red(bold("*"))} ${p}`),
    );
    process.exit(1);
  }

  if (opts.example === true) {
    console.error(
      "Please provide an example name or url, otherwise remove the example option.",
    );
    process.exit(1);
  }

  if (existsSync(appPath) && !isFolderEmpty(appPath, appName)) {
    process.exit(1);
  }

  const example = typeof opts.example === "string" && opts.example.trim();
  const preferences = (conf.get("preferences") || {}) as Record<
    string,
    boolean | string
  >;

  /**
   * If the user does not provide the necessary flags, prompt them for their
   * preferences, unless `--yes` option was specified, or when running in CI.
   */
  const skipPrompt = ciInfo.isCI || opts.yes;

  if (!example) {
    const defaults: typeof preferences = {
      typescript: true,
      eslint: true,
      empty: false,
    };
    const getPrefOrDefault = (field: string) =>
      preferences[field] ?? defaults[field];

    if (!opts.typescript && !opts.javascript) {
      if (skipPrompt) {
        // default to TypeScript in CI as we can't prompt to
        // prevent breaking setup flows
        opts.typescript = getPrefOrDefault("typescript");
      } else {
        const styledTypeScript = blue("TypeScript");
        const { typescript } = await prompts(
          {
            type: "toggle",
            name: "typescript",
            message: `Would you like to use ${styledTypeScript}?`,
            initial: getPrefOrDefault("typescript"),
            active: "Yes",
            inactive: "No",
          },
          {
            /**
             * User inputs Ctrl+C or Ctrl+D to exit the prompt. We should close the
             * process and not write to the file system.
             */
            onCancel: () => {
              console.error("Exiting.");
              process.exit(1);
            },
          },
        );
        /**
         * Depending on the prompt response, set the appropriate program flags.
         */
        opts.typescript = Boolean(typescript);
        opts.javascript = !typescript;
        preferences.typescript = Boolean(typescript);
      }
    }

    if (!opts.eslint && !args.includes("--no-eslint")) {
      if (skipPrompt) {
        opts.eslint = getPrefOrDefault("eslint");
      } else {
        const styledEslint = blue("ESLint");
        const { eslint } = await prompts({
          onState: onPromptState,
          type: "toggle",
          name: "eslint",
          message: `Would you like to use ${styledEslint}?`,
          initial: getPrefOrDefault("eslint"),
          active: "Yes",
          inactive: "No",
        });
        opts.eslint = Boolean(eslint);
        preferences.eslint = Boolean(eslint);
      }
    }
  }

  try {
    await createApp({
      appPath,
      packageManager,
      example: example && example !== "default" ? example : undefined,
      examplePath: opts.examplePath,
      typescript: opts.typescript,
      eslint: opts.eslint,
      skipInstall: opts.skipInstall,
      zudokuVersion: packageJson.version,
    });
  } catch (reason) {
    if (!(reason instanceof DownloadError)) {
      throw reason;
    }

    const res = await prompts({
      onState: onPromptState,
      type: "confirm",
      name: "builtin",
      message:
        `Could not download "${example}" because of a connectivity issue between your machine and GitHub.\n` +
        `Do you want to use the default template instead?`,
      initial: true,
    });
    if (!res.builtin) {
      throw reason;
    }

    await createApp({
      appPath,
      packageManager,
      typescript: opts.typescript,
      eslint: opts.eslint,
      skipInstall: opts.skipInstall,
      zudokuVersion: packageJson.version,
    });
  }
  conf.set("preferences", preferences);
}

const update = updateCheck(packageJson).catch(() => null);

async function notifyUpdate(): Promise<void> {
  try {
    if ((await update)?.latest) {
      const global = {
        npm: "npm i -g",
        yarn: "yarn global add",
        pnpm: "pnpm add -g",
        bun: "bun add -g",
      };
      const updateMessage = `${global[packageManager]} create-zudoku`;
      console.log(
        yellow(bold("A new version of `create-zudoku` is available!")) +
          "\n" +
          "You can update by running: " +
          cyan(updateMessage) +
          "\n",
      );
    }
    process.exit(0);
  } catch {
    // ignore error
  }
}

async function exit(reason: { command?: string }) {
  console.log();
  console.log("Aborting installation.");
  if (reason.command) {
    console.log(`  ${cyan(reason.command)} has failed.`);
  } else {
    console.log(
      `${red("Unexpected error. Please report it as a bug:")}\n`,
      reason,
    );
  }
  console.log();
  await notifyUpdate();
  process.exit(1);
}

run().then(notifyUpdate).catch(exit);
