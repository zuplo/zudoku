import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { LoadedConfig } from "../../config/config.js";
import type { OpenAPIDocument } from "../../lib/oas/parser/index.js";
import { flattenAllOfProcessor } from "../../lib/util/flattenAllOf.js";
import invariant from "../../lib/util/invariant.js";
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

  it("should handle multiple versions of the same schema with overriden path and label", async () => {
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
          input: [
            {
              input: schemaPathV2,
              label: "2.0.0 (latest)",
              path: "latest",
            },
            {
              input: schemaPath,
            },
          ],
        },
      ],
    };

    const manager = new SchemaManager({ storeDir, config, processors: [] });

    await manager.processAllSchemas();

    const schemas = manager.getSchemasForPath("test-api");
    expect(schemas).toHaveLength(2);
    expect(schemas?.[0]?.version).toBe("2.0.0"); // v2 first
    expect(schemas?.[0]?.label).toBe("2.0.0 (latest)");
    expect(schemas?.[0]?.path).toBe("latest");
    expect(schemas?.[1]?.version).toBe("1.0.0"); // v1 second
    expect(schemas?.[1]?.label).toBeUndefined(); // v1 second
    expect(schemas?.[1]?.path).toBe("1.0.0"); // v1 second
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

    expect(manager.getAllTrackedFiles().length).toBeGreaterThan(0);
    expect(manager.getAllTrackedFiles()).toContain(schemaPath);
  });

  it("should preserve $refs outside allOf while flattening allOf", async () => {
    const schemaWithRefs = {
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
      paths: {
        "/items": {
          get: {
            responses: {
              "200": {
                description: "Success",
                content: {
                  "application/json": {
                    // This $ref should be preserved (not inside allOf)
                    schema: { $ref: "#/components/schemas/Item" },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Base: { type: "object", properties: { id: { type: "string" } } },
          Item: {
            // allOf with $ref should be flattened
            allOf: [
              { $ref: "#/components/schemas/Base" },
              { type: "object", properties: { name: { type: "string" } } },
            ],
          },
          Container: {
            type: "object",
            // This $ref should be preserved (not inside allOf)
            properties: { item: { $ref: "#/components/schemas/Base" } },
          },
        },
      },
    } as OpenAPIDocument;

    const schemaPath = path.join(tempDir, "openapi.json");
    await fs.writeFile(schemaPath, JSON.stringify(schemaWithRefs));

    const config: LoadedConfig = {
      __meta: {
        rootDir: tempDir,
        moduleDir: path.join(tempDir, "node_modules"),
        mode: "module",
        dependencies: [],
        configPath: path.join(tempDir, "zudoku.config.ts"),
      },
      apis: [{ type: "file", path: "test-api", input: schemaPath }],
    };

    const manager = new SchemaManager({
      storeDir,
      config,
      processors: [flattenAllOfProcessor],
    });

    await manager.processAllSchemas();
    const processedFile = manager.schemaMap.get(schemaPath);

    invariant(processedFile, "Processed file not found");
    const generatedCode = await fs.readFile(processedFile.filePath, "utf-8");

    expect(generatedCode).toContain("__refMap");
    expect(generatedCode).toContain("#/components/schemas/Base");
    expect(generatedCode).toContain("#/components/schemas/Item");
    expect(generatedCode).not.toContain('"allOf"');
  });
});
