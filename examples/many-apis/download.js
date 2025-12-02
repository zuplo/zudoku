import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_GURU_URL = "https://api.apis.guru/v2/list.json";
const OUTPUT_DIR = path.join(__dirname, "apis");
const APIS_FILE = path.join(OUTPUT_DIR, "_apis.json");
const NAVIGATION_FILE = path.join(OUTPUT_DIR, "_navigation.json");

// TODO: fix the ones that are commented out
const selectedProviders = [
  "ably.io:platform",
  "ably.net:control",
  "1password.local:connect",
  "apple.com:app-store-connect",
  "apptigent.com",
  "appwrite.io:client",
  "asana.com",
  "atlassian.com:jira",
  "bitbucket.org",
  "billingo.hu",
  "clickmeter.com",
  "docker.com:engine",
  "digitalocean.com",
  // "docusign.net",
  // "enode.io",
  "getpostman.com",
  // "github.com",
  "neutrinoapi.net",
  "tomtom.com:maps",
  "twitter.com:current",
];

function slugify(text) {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

async function main() {
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const response = await fetch(API_GURU_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${API_GURU_URL}: ${response.statusText}`);
  }
  const listData = await response.json();

  const downloadTasks = selectedProviders.map(async (apiKey) => {
    const apiObj = listData[apiKey];
    if (!apiObj?.preferred) return null;

    const versionObj = apiObj.versions?.[apiObj.preferred];
    if (!versionObj?.swaggerUrl) return null;

    const info = versionObj.info || {};
    const xOrigins = Array.isArray(info["x-origin"]) ? info["x-origin"] : [];
    if (!xOrigins.some((o) => o.format === "openapi")) return null;

    try {
      const schemaResponse = await fetch(versionObj.swaggerUrl);
      if (!schemaResponse.ok) {
        // biome-ignore lint/suspicious/noConsole: Logging allowed here
        console.warn(
          `Failed to download schema for "${apiKey}" from ${versionObj.swaggerUrl}`,
        );
        return null;
      }

      const schemaData = await schemaResponse.text();
      const fileNameSafeKey = apiKey.replace(/[^\w.-]+/g, "_");
      const localFileName = `${fileNameSafeKey}-${apiObj.preferred}.json`;
      const outPath = path.join(OUTPUT_DIR, localFileName);
      fs.writeFileSync(outPath, schemaData, "utf-8");

      return { info, localFileName };
    } catch (err) {
      // biome-ignore lint/suspicious/noConsole: Logging allowed here
      console.warn(`Error downloading "${apiKey}":`, err);
      return null;
    }
  });

  const results = (await Promise.all(downloadTasks)).sort((a, b) =>
    a.info.title.localeCompare(b.info.title),
  );

  const apis = results.map(({ info, localFileName }) => ({
    type: "file",
    input: path.join("apis", localFileName),
    path: slugify(info.title || "untitled-api"),
  }));

  const navigation = results.map(({ info }) => ({
    type: "link",
    label: info.title || "Untitled API",
    to: slugify(info.title || "untitled-api"),
  }));

  fs.writeFileSync(APIS_FILE, JSON.stringify(apis, null, 2), "utf-8");
  fs.writeFileSync(
    NAVIGATION_FILE,
    JSON.stringify(navigation, null, 2),
    "utf-8",
  );
}

void main();
