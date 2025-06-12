import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { LoadedConfig } from "../../config/config.js";
import { SchemaManager } from "./SchemaManager.js";

const mockSchema = {
  openapi: "3.0.0",
  info: {
    title: "Test API",
    version: "1.0.0",
  },
  paths: {},
};

describe("SchemaManager", () => {
  let tempDir: string;
  let storeDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "zudoku-test-"));
    storeDir = path.join(tempDir, "store");
    await fs.mkdir(storeDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("should process schema and store it", async () => {
    const schemaPath = path.join(tempDir, "openapi.json");
    await fs.writeFile(schemaPath, JSON.stringify(mockSchema));

    const config: LoadedConfig = {
      __meta: {
        rootDir: tempDir,
        moduleDir: path.join(tempDir, "node_modules"),
        mode: "module",
        dependencies: [],
        configPath: path.join(tempDir, "zudoku.config.ts"),
      },
      apis: [
        {
          type: "file",
          path: "test-api",
          input: schemaPath,
        },
      ],
    };

    const manager = new SchemaManager({ storeDir, config, processors: [] });

    await manager.processAllSchemas();

    const latestSchema = manager.getLatestSchema("test-api");
    expect(latestSchema).toBeDefined();
    expect(latestSchema?.version).toBe("1.0.0");
  });

  it("should handle multiple versions of the same schema", async () => {
    const schemaPath = path.join(tempDir, "openapi.json");
    const schemaPathV2 = path.join(tempDir, "openapi-v2.json");

    await fs.writeFile(schemaPath, JSON.stringify(mockSchema));
    await fs.writeFile(
      schemaPathV2,
      JSON.stringify({
        ...mockSchema,
        info: { ...mockSchema.info, version: "2.0.0" },
      }),
    );

    const config: LoadedConfig = {
      __meta: {
        rootDir: tempDir,
        moduleDir: path.join(tempDir, "node_modules"),
        mode: "module",
        dependencies: [],
        configPath: path.join(tempDir, "zudoku.config.ts"),
      },
      apis: [
        {
          type: "file",
          path: "test-api",
          input: [schemaPathV2, schemaPath], // v2 first, then v1
        },
      ],
    };

    const manager = new SchemaManager({ storeDir, config, processors: [] });

    await manager.processAllSchemas();

    const schemas = manager.getSchemasForPath("test-api");
    expect(schemas).toHaveLength(2);
    expect(schemas?.[0]?.version).toBe("2.0.0"); // v2 first
    expect(schemas?.[1]?.version).toBe("1.0.0"); // v1 second
  });

  it("should track processed files", async () => {
    const schemaPath = path.join(tempDir, "openapi.json");
    await fs.writeFile(schemaPath, JSON.stringify(mockSchema));

    const config: LoadedConfig = {
      __meta: {
        rootDir: tempDir,
        moduleDir: path.join(tempDir, "node_modules"),
        mode: "module",
        dependencies: [],
        configPath: path.join(tempDir, "zudoku.config.ts"),
      },
      apis: [
        {
          type: "file",
          path: "test-api",
          input: schemaPath,
        },
      ],
    };

    const manager = new SchemaManager({ storeDir, config, processors: [] });

    await manager.processAllSchemas();

    expect(manager.trackedFiles.size).toBeGreaterThan(0);
    expect(manager.trackedFiles.has(schemaPath)).toBe(true);
  });
});
