import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import bs58 from "bs58";
import { createBuilder, mergeConfig } from "vite";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const SENTINEL = "SENTINEL_VALUE_DO_NOT_SHIP";
const BRANDING_KEY = "import.meta.env.ZUPLO_DEV_PORTAL_ZUPLO_BRANDING";
const DEPLOYMENT_NAME_KEY = "import.meta.env.ZUPLO_PUBLIC_DEPLOYMENT_NAME";

const packageRoot = path.resolve(import.meta.dirname, "../..");

const sentinelJson = JSON.stringify({
  deploymentName: SENTINEL,
  entitlements: { devPortalZuploBranding: true },
  accountName: SENTINEL,
});

const encodeSystemConfigurations = (value: Record<string, string>) =>
  bs58.encode(Buffer.from(JSON.stringify(value), "utf8"));

// Load a fresh copy of the Vite config module after the environment is set.
const loadGetViteConfig = async () => {
  vi.resetModules();
  const { getViteConfig } = await import("./config.js");
  return getViteConfig;
};

let fixtureDir: string;

const getDefine = async () => {
  const getViteConfig = await loadGetViteConfig();
  const config = await getViteConfig(fixtureDir, {
    mode: "production",
    command: "build",
  });
  return config.define ?? {};
};

const clearZuploEnv = () => {
  vi.stubEnv("ZUPLO_DEPLOYMENT_NAME", "");
  vi.stubEnv("ZUPLO_SYSTEM_CONFIGURATIONS", "");
  vi.stubEnv("ZUPLO_DEV_PORTAL_ZUPLO_BRANDING", "");
};

beforeAll(async () => {
  fixtureDir = await mkdtemp(path.join(tmpdir(), "zudoku-client-env-"));
  await mkdir(path.join(fixtureDir, "node_modules"), { recursive: true });

  // A config without docs: markdown files are globbed relative to the working
  // directory, which the test runner doesn't point at the fixture.
  await writeFile(
    path.join(fixtureDir, "zudoku.config.ts"),
    `export default { site: { title: "Fixture" } };\n`,
  );

  await symlink(packageRoot, path.join(fixtureDir, "node_modules/zudoku"));
  for (const dep of ["react", "react-dom"]) {
    await symlink(
      path.join(packageRoot, "node_modules", dep),
      path.join(fixtureDir, "node_modules", dep),
    );
  }
});

afterAll(async () => {
  await rm(fixtureDir, { recursive: true, force: true });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Zuplo build settings in the Vite define map", () => {
  it("ignores ZUPLO_BUILD_CONFIG", async () => {
    clearZuploEnv();
    vi.stubEnv("ZUPLO_BUILD_CONFIG", sentinelJson);
    const define = await getDefine();

    expect(
      Object.keys(define).filter((key) => key.includes("ZUPLO_BUILD_CONFIG")),
    ).toEqual([]);
    for (const [key, value] of Object.entries(define)) {
      expect(String(value), key).not.toContain(SENTINEL);
    }
    expect(define[BRANDING_KEY]).toBeUndefined();
    expect(define[DEPLOYMENT_NAME_KEY]).toBeUndefined();
  });

  it("does not define the raw env vars", async () => {
    clearZuploEnv();
    vi.stubEnv("ZUPLO_DEPLOYMENT_NAME", "my-deployment");
    vi.stubEnv("ZUPLO_DEV_PORTAL_ZUPLO_BRANDING", "true");
    const define = await getDefine();

    expect(define).not.toHaveProperty("process.env.ZUPLO_DEPLOYMENT_NAME");
    expect(define).not.toHaveProperty("import.meta.env.ZUPLO_DEPLOYMENT_NAME");
    expect(define).not.toHaveProperty(
      "process.env.ZUPLO_DEV_PORTAL_ZUPLO_BRANDING",
    );
  });

  it.each([
    ["true", "true"],
    ["false", "false"],
    ["", undefined],
    ["yes", undefined],
    ["TRUE", undefined],
  ])(
    "maps ZUPLO_DEV_PORTAL_ZUPLO_BRANDING=%j to %j",
    async (value, expected) => {
      clearZuploEnv();
      vi.stubEnv("ZUPLO_DEV_PORTAL_ZUPLO_BRANDING", value);
      const define = await getDefine();

      expect(define[BRANDING_KEY]).toBe(expected);
    },
  );

  it("leaves branding undefined when ZUPLO_DEV_PORTAL_ZUPLO_BRANDING is unset", async () => {
    clearZuploEnv();
    delete process.env.ZUPLO_DEV_PORTAL_ZUPLO_BRANDING;
    const define = await getDefine();

    expect(define[BRANDING_KEY]).toBeUndefined();
  });

  it("prefers ZUPLO_DEPLOYMENT_NAME over ZUPLO_SYSTEM_CONFIGURATIONS", async () => {
    clearZuploEnv();
    vi.stubEnv("ZUPLO_DEPLOYMENT_NAME", "from-env");
    vi.stubEnv(
      "ZUPLO_SYSTEM_CONFIGURATIONS",
      encodeSystemConfigurations({ __ZUPLO_DEPLOYMENT_NAME: "from-system" }),
    );
    const define = await getDefine();

    expect(define[DEPLOYMENT_NAME_KEY]).toBe(JSON.stringify("from-env"));
  });

  it("falls back to ZUPLO_SYSTEM_CONFIGURATIONS for the deployment name", async () => {
    clearZuploEnv();
    vi.stubEnv(
      "ZUPLO_SYSTEM_CONFIGURATIONS",
      encodeSystemConfigurations({ __ZUPLO_DEPLOYMENT_NAME: "from-system" }),
    );
    const define = await getDefine();

    expect(define[DEPLOYMENT_NAME_KEY]).toBe(JSON.stringify("from-system"));
  });
});

describe("Zuplo build settings in the client build", () => {
  it(
    "applies the branding value and ignores ZUPLO_BUILD_CONFIG",
    { timeout: 180_000 },
    async () => {
      clearZuploEnv();
      vi.stubEnv("ZUPLO_BUILD_CONFIG", sentinelJson);
      vi.stubEnv("ZUPLO_DEV_PORTAL_ZUPLO_BRANDING", "false");
      const getViteConfig = await loadGetViteConfig();

      const outDir = path.join(fixtureDir, "dist");
      const viteConfig = await getViteConfig(fixtureDir, {
        mode: "production",
        command: "build",
      });
      const builder = await createBuilder(
        mergeConfig(viteConfig, { logLevel: "silent", build: { outDir } }),
      );
      const client = builder.environments.client;
      if (!client) throw new Error("Client environment is missing");
      await builder.build(client);

      const files = (await readdir(outDir, { recursive: true }))
        .map((file) => path.join(outDir, file))
        .filter((file) => /\.(js|mjs|css|html|json|map)$/.test(file));

      const jsFiles = files.filter((file) => file.endsWith(".js"));
      expect(jsFiles.length).toBeGreaterThan(0);

      const contents = await Promise.all(
        files.map(
          async (file) => [file, await readFile(file, "utf-8")] as const,
        ),
      );
      for (const [file, content] of contents) {
        expect(content.includes(SENTINEL), file).toBe(false);
      }

      expect(
        contents.some(([, content]) =>
          /showPoweredBy:\s*(?:!1|false)\b/.test(content),
        ),
      ).toBe(true);
    },
  );
});
