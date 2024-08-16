/* eslint-disable no-console */
import yaml from "js-yaml";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_CONCURRENT_DOWNLOADS = 5;
const API_GURU_URL = "https://api.apis.guru/v2/list.json";
const OUTPUT_DIR = path.join(__dirname, "apis");
const NAVIGATION_FILE = path.join(OUTPUT_DIR, "navigation.json");

const downloadAndConvertFile = async (url, outputFilePath) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download ${url}: ${response.statusText}`);
    }
    let data = await response.text();

    if (url.endsWith(".yaml") || url.endsWith(".yml")) {
      const jsonData = yaml.load(data);
      data = JSON.stringify(jsonData, null, 2);
      outputFilePath = outputFilePath.replace(/\.(yaml|yml)$/, ".json");
    } else {
      const parsedData = JSON.parse(data);
      // Skip swagger
      if (parsedData.swagger === "2.0") {
        console.log(`Skipping ${outputFilePath} because it is Swagger 2.0`);
        return false;
      }
      data = JSON.stringify(parsedData, null, 2);
    }

    fs.writeFileSync(outputFilePath, data);
    console.log(`Downloaded and converted: ${outputFilePath}`);
    return true;
  } catch (error) {
    console.error(`Error downloading ${url}:`, error);
    return false;
  }
};

const isVersionGTE3 = (version) => {
  const [major, minor] = version.split(".").map(Number);
  return major > 3 || (major === 3 && (minor === undefined || minor >= 0));
};

const main = async () => {
  const response = await fetch(API_GURU_URL);
  if (!response.ok) {
    console.error(`Failed to fetch API list: ${response.statusText}`);
    return;
  }

  const apis = await response.json();

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }

  const downloadQueue = [];
  const navigation = [];

  for (const apiKey in apis) {
    const apiData = apis[apiKey];
    const versions = apiData.versions;

    const versionKeyToDownload = Object.keys(versions).find((versionKey) => {
      const versionData = versions[versionKey];
      return versionData.swaggerUrl && isVersionGTE3(versionData.info.version);
    });

    if (versionKeyToDownload) {
      const versionData = versions[versionKeyToDownload];
      const apiName = apiKey.replace(/[:/]/g, "_");
      const swaggerUrl = versionData.swaggerUrl;
      const outputFilePath = path.join(OUTPUT_DIR, `${apiName}.json`);

      console.log(`Queueing download for ${apiName}`);

      const downloadTask = downloadAndConvertFile(
        swaggerUrl,
        outputFilePath,
      ).then((success) => {
        if (success) {
          navigation.push({ label: apiName, id: apiName });
        }
      });

      downloadQueue.push(downloadTask);

      if (downloadQueue.length >= MAX_CONCURRENT_DOWNLOADS) {
        await Promise.all(downloadQueue);
        downloadQueue.length = 0;
      }
    } else {
      console.log(`No suitable version found for ${apiKey}`);
    }
  }

  if (downloadQueue.length > 0) {
    await Promise.all(downloadQueue);
  }

  fs.writeFileSync(NAVIGATION_FILE, JSON.stringify(navigation, null, 2));
  console.log(`Navigation file generated at ${NAVIGATION_FILE}`);

  console.log(
    `All files downloaded. Total APIs processed: ${navigation.length}`,
  );
};

main().catch((err) => console.error(err));
