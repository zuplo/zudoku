/**
 * node-machine-id
 * Copyright (c) 2016 Aleksandr Komlev
 * MIT Licensed
 *
 * From https://github.com/automation-stack/node-machine-id
 */
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";

const win32RegBinPath = {
  skipped: "",
  native: "%windir%\\System32",
  mixed: "%windir%\\sysnative\\cmd.exe /c %windir%\\System32",
};
const guid = {
  darwin: "ioreg -rd1 -c IOPlatformExpertDevice",
  win32:
    `${
      win32RegBinPath[isWindowsProcessMixedOrNativeArchitecture()]
    }\\REG.exe ` +
    "QUERY HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography " +
    "/v MachineGuid",
  linux:
    "( cat /var/lib/dbus/machine-id /etc/machine-id 2> /dev/null || hostname ) | head -n 1 || :",
};

function isWindowsProcessMixedOrNativeArchitecture():
  | "skipped"
  | "mixed"
  | "native" {
  // detect if the node binary is the same arch as the Windows OS.
  // or if this is 32 bit node on 64 bit windows.
  if (process.platform !== "win32") {
    return "skipped";
  }
  if (process.arch === "ia32" && process.env["PROCESSOR_ARCHITEW6432"]) {
    return "mixed";
  }
  return "native";
}

function hash(guid: string): string {
  return createHash("sha256").update(guid).digest("hex");
}

function expose(result: string): string {
  switch (process.platform) {
    case "darwin":
      return result
        .split("IOPlatformUUID")[1]!
        .split("\n")[0]!
        .replace(/=|\s+]"/gi, "")
        .toLowerCase();
    case "win32":
      return result
        .toString()
        .split("REG_SZ")[1]!
        .replace(/\r+|\n+|\s+/gi, "")
        .toLowerCase();
    case "linux":
      return result
        .toString()
        .replace(/\r+|\n+|\s+/gi, "")
        .toLowerCase();
    case "freebsd":
      return result
        .toString()
        .replace(/\r+|\n+|\s+/gi, "")
        .toLowerCase();
    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
  }
}

export function machineId(): string {
  switch (process.platform) {
    case "darwin":
    case "win32":
    case "linux":
      return hash(expose(execSync(guid[process.platform]).toString()));
    default:
      return "e16fc483-5593-4d71-b485-a6533693da9b";
  }
}
