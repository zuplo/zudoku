import fs from "node:fs/promises";
import path from "node:path";
import colors from "picocolors";
import { ZuploEnv } from "../../app/env.js";
import { findZudokuConfigFile } from "../../config/loader.js";
import {
  createFromZuplo,
  type CreateFromZuploResult,
  ZUPLO_GENERATED_CONFIG_FILE,
} from "../../zuplo/create-from-zuplo.js";
import {
  printDiagnosticsToConsole,
  printWarningToConsole,
} from "../common/output.js";

export type Arguments = {
  dir: string;
};

/**
 * Prints a hint when the project's Zudoku config doesn't reference the
 * generated file yet, since the generated config has no effect until it's
 * listed in `extends`.
 */
async function printExtendsHint(dir: string) {
  const configPath = await findZudokuConfigFile(dir);
  if (!configPath) return;

  const configSource = await fs.readFile(configPath, "utf-8").catch(() => "");
  if (configSource.includes(ZUPLO_GENERATED_CONFIG_FILE)) return;

  printWarningToConsole(
    colors.yellow(
      `To use the generated config, add it to \`extends\` in ${path.basename(configPath)}:`,
    ),
  );
  printWarningToConsole(
    colors.yellow(`  extends: ["./${ZUPLO_GENERATED_CONFIG_FILE}"],`),
  );
}

export async function runCreateFromZuplo(
  argv: Arguments,
): Promise<CreateFromZuploResult> {
  const dir = path.resolve(process.cwd(), argv.dir);

  const result = await createFromZuplo({
    rootDir: dir,
    serverUrl: ZuploEnv.serverUrl,
  });

  for (const warning of result.warnings) {
    printWarningToConsole(colors.yellow(warning));
  }

  if (!result.outputPath) {
    printDiagnosticsToConsole(
      `Skipped generating ${ZUPLO_GENERATED_CONFIG_FILE}`,
    );
    return result;
  }

  for (const api of result.apis) {
    printDiagnosticsToConsole(`  OpenAPI  ${api.input} -> ${api.path}`);
  }
  for (const endpoint of result.graphqlEndpoints) {
    printDiagnosticsToConsole(
      `  GraphQL  ${endpoint.endpoint} -> ${endpoint.path}`,
    );
  }

  printDiagnosticsToConsole(
    result.written
      ? `Generated ${ZUPLO_GENERATED_CONFIG_FILE}`
      : `${ZUPLO_GENERATED_CONFIG_FILE} is up to date`,
  );

  await printExtendsHint(dir);

  return result;
}
