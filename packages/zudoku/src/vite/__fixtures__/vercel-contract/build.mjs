import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const outputDirectory = path.resolve(".vercel/output");
const staticDirectory = path.join(outputDirectory, "static");
const functionDirectory = path.join(
  outputDirectory,
  "functions/zudoku-markdown.func",
);
const cacheControl = "public, max-age=0, s-maxage=3600, must-revalidate";
const catalogType =
  'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"';
const exactRoute = (value) =>
  `^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/?$`;
const artifactRoute = (urlPath, contentType, relation) => ({
  src: exactRoute(urlPath),
  methods: ["GET", "HEAD"],
  headers: {
    "Content-Type": contentType,
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": cacheControl,
    Link: relation,
  },
  continue: true,
});
const aliasRoute = (source, destination, contentType, relation) => ({
  src: exactRoute(source),
  dest: destination,
  methods: ["GET", "HEAD"],
  headers: {
    "Content-Type": contentType,
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": cacheControl,
    Link: relation,
  },
});

await Promise.all([
  mkdir(path.join(staticDirectory, "docs/.well-known"), { recursive: true }),
  mkdir(functionDirectory, { recursive: true }),
  mkdir(path.resolve("dist/docs/.well-known"), { recursive: true }),
]);

const ard = '{"entries":[]}\n';
const catalog =
  '{"linkset":[{"anchor":"https://developers.example.com/.well-known/api-catalog","item":[]}]}\n';
const openapi =
  '{"openapi":"3.1.1","info":{"title":"Contract API","version":"1.0.0"},"paths":{}}\n';
const middlewareSource = await readFile(
  path.resolve("zudoku-markdown.js"),
  "utf8",
);

await Promise.all([
  writeFile(path.join(staticDirectory, "docs/.well-known/ard.json"), ard),
  writeFile(
    path.join(staticDirectory, "docs/.well-known/api-catalog"),
    catalog,
  ),
  writeFile(path.join(staticDirectory, "openapi.json"), openapi),
  writeFile(path.resolve("dist/docs/.well-known/ard.json"), ard),
  writeFile(path.resolve("dist/docs/.well-known/api-catalog"), catalog),
  writeFile(path.resolve("dist/openapi.json"), openapi),
  writeFile(
    path.join(functionDirectory, ".vc-config.json"),
    JSON.stringify({ runtime: "edge", entrypoint: "index.js" }),
  ),
  writeFile(path.join(functionDirectory, "index.js"), middlewareSource),
]);

const ardLink =
  '<https://developers.example.com/.well-known/ard.json>; rel="ard"; type="application/json"';
const catalogLink =
  '<https://developers.example.com/.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"';

await writeFile(
  path.join(outputDirectory, "config.json"),
  `${JSON.stringify(
    {
      version: 3,
      framework: { version: "contract" },
      routes: [
        artifactRoute(
          "/docs/.well-known/ard.json",
          "application/json; charset=utf-8",
          ardLink,
        ),
        artifactRoute(
          "/docs/.well-known/api-catalog",
          catalogType,
          catalogLink,
        ),
        artifactRoute(
          "/openapi.json",
          "application/json; charset=utf-8",
          '<https://developers.example.com/openapi.json>; rel="service-desc"; type="application/json"',
        ),
        aliasRoute(
          "/.well-known/ard.json",
          "/docs/.well-known/ard.json",
          "application/json; charset=utf-8",
          ardLink,
        ),
        aliasRoute(
          "/.well-known/api-catalog",
          "/docs/.well-known/api-catalog",
          catalogType,
          catalogLink,
        ),
        {
          src: "/docs(?:/(.*))?",
          methods: ["GET", "HEAD"],
          middlewarePath: "zudoku-markdown",
          continue: true,
        },
        { handle: "filesystem" },
      ],
      overrides: {
        "docs/.well-known/ard.json": {
          contentType: "application/json; charset=utf-8",
        },
        "docs/.well-known/api-catalog": { contentType: catalogType },
        "openapi.json": { contentType: "application/json; charset=utf-8" },
      },
    },
    null,
    2,
  )}\n`,
);
