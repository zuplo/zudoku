import { spawnSync } from "node:child_process";
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { copyVercelStaticOutput } from "./build.js";

describe("Vercel static output", () => {
  const tempDirs: string[] = [];
  const fixtureDirectory = fileURLToPath(
    new URL("./__fixtures__/vercel-contract", import.meta.url),
  );
  const repositoryRoot = fileURLToPath(new URL("../../../..", import.meta.url));

  afterEach(async () => {
    await Promise.all(
      tempDirs
        .splice(0)
        .map((dir) => rm(dir, { recursive: true, force: true })),
    );
  });

  it("copies dist into Build Output without removing portable output", async () => {
    const rootDir = await mkdtemp(
      path.join(os.tmpdir(), "zudoku-vercel-copy-test-"),
    );
    tempDirs.push(rootDir);
    const portableArtifact = path.join(rootDir, "dist/.well-known/ard.json");
    await mkdir(path.dirname(portableArtifact), { recursive: true });
    await writeFile(portableArtifact, '{"entries":[]}');

    await copyVercelStaticOutput(rootDir);

    await expect(readFile(portableArtifact, "utf-8")).resolves.toBe(
      '{"entries":[]}',
    );
    await expect(
      readFile(
        path.join(rootDir, ".vercel/output/static/.well-known/ard.json"),
        "utf-8",
      ),
    ).resolves.toBe('{"entries":[]}');
  });

  it("survives finalization by the pinned Vercel CLI", async () => {
    const rootDir = await mkdtemp(
      path.join(os.tmpdir(), "zudoku-vercel-contract-"),
    );
    tempDirs.push(rootDir);
    await cp(fixtureDirectory, rootDir, { recursive: true });
    await mkdir(path.join(rootDir, ".vercel"), { recursive: true });
    await writeFile(
      path.join(rootDir, ".vercel/project.json"),
      `${JSON.stringify(
        {
          orgId: "team_zudoku_contract",
          projectId: "prj_zudoku_contract",
          projectName: "zudoku-vercel-contract",
          settings: {
            buildCommand: "node build.mjs",
            devCommand: null,
            framework: null,
            installCommand: null,
            nodeVersion: "24.x",
            outputDirectory: null,
            rootDirectory: null,
          },
        },
        null,
        2,
      )}\n`,
    );

    const vercelBinary = path.join(repositoryRoot, "node_modules/.bin/vercel");
    const result = spawnSync(vercelBinary, ["build", "--yes", "--no-color"], {
      cwd: rootDir,
      encoding: "utf8",
      env: {
        ...process.env,
        CI: "1",
        VERCEL_TELEMETRY_DISABLED: "1",
      },
      timeout: 120_000,
    });
    expect(result.status, result.stderr || result.stdout).toBe(0);

    const outputDirectory = path.join(rootDir, ".vercel/output");
    const output = JSON.parse(
      await readFile(path.join(outputDirectory, "config.json"), "utf8"),
    );
    const routes: Array<Record<string, unknown>> = output.routes;
    const findRoute = (src: string) =>
      routes.find((route) => route.src === src);
    const scopedArd = findRoute("^/docs/\\.well-known/ard\\.json/?$");
    const rootArd = findRoute("^/\\.well-known/ard\\.json/?$");
    const scopedCatalog = findRoute("^/docs/\\.well-known/api-catalog/?$");
    const rootCatalog = findRoute("^/\\.well-known/api-catalog/?$");

    for (const route of [scopedArd, rootArd, scopedCatalog, rootCatalog]) {
      expect(route).toMatchObject({ methods: ["GET", "HEAD"] });
      expect(route?.headers).toMatchObject({
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=0, s-maxage=3600, must-revalidate",
      });
    }
    expect(scopedArd?.headers).toMatchObject({
      "Content-Type": "application/json; charset=utf-8",
      Link: expect.stringContaining('rel="ard"'),
    });
    expect(rootArd).toMatchObject({
      dest: "/docs/.well-known/ard.json",
    });
    expect(scopedCatalog?.headers).toMatchObject({
      "Content-Type":
        'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
      Link: expect.stringContaining('rel="api-catalog"'),
    });
    expect(rootCatalog).toMatchObject({
      dest: "/docs/.well-known/api-catalog",
    });

    expect(routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: "/docs(?:/(.*))?",
          middlewarePath: "zudoku-markdown",
        }),
        expect.objectContaining({
          src: "^/legacy$",
          status: 308,
          headers: expect.objectContaining({ Location: "/docs" }),
        }),
        expect.objectContaining({
          src: "^/docs$",
          headers: expect.objectContaining({
            "X-Zudoku-Contract": "true",
          }),
        }),
        expect.objectContaining({
          src: "^/project-rewrite$",
          dest: "/docs",
        }),
        { handle: "filesystem" },
      ]),
    );
    expect(output.overrides).toMatchObject({
      "docs/.well-known/ard.json": {
        contentType: "application/json; charset=utf-8",
      },
      "docs/.well-known/api-catalog": {
        contentType:
          'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
      },
      "openapi.json": {
        contentType: "application/json; charset=utf-8",
      },
    });

    await expect(
      readFile(
        path.join(outputDirectory, "static/docs/.well-known/ard.json"),
        "utf8",
      ),
    ).resolves.toBe('{"entries":[]}\n');
    await expect(
      readFile(path.join(rootDir, "dist/docs/.well-known/ard.json"), "utf8"),
    ).resolves.toBe('{"entries":[]}\n');
    await expect(
      readFile(
        path.join(
          outputDirectory,
          "functions/zudoku-markdown.func/.vc-config.json",
        ),
        "utf8",
      ),
    ).resolves.toContain('"runtime":"edge"');
  }, 120_000);
});
