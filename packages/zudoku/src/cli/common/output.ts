// biome-ignore-all lint/suspicious/noExplicitAny: Allow any type

import colors from "picocolors";

// Diagnostic info goes to stderr; stdout is reserved for command output.
// https://unix.stackexchange.com/questions/331611/do-progress-reports-logging-information-belong-on-stderr-or-stdout
export function printDiagnosticsToConsole(message?: any) {
  console.error(colors.bold(colors.blue(message)));
}

export function printWarningToConsole(message?: any) {
  console.error(message);
}
