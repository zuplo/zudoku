import type { OpenApiPluginOptions } from "../index.js";
import type { ContextOasSource, DynamicInput } from "../interfaces.js";
import { loadSpecification } from "../specification.js";

// Shared shape for anything that can emit a spec response. We keep the path so
// the router can match aliases (e.g. `/spec`) back to the canonical handler.
export type SpecRouteHandler = {
  path: string;
  createResponse: () => Promise<Response>;
};

// Figures out which schema input to use based on the plugin configuration and
// the currently selected version. File-based configs can expose multiple
// versions, so we need to look up the right entry (or fall back to the first).
// URL/raw configs are simple: we reuse their input directly.
const resolveSourceFromConfig = ({
  config,
  version,
}: {
  config: OpenApiPluginOptions;
  version?: string;
}): ContextOasSource => {
  if (config.type === "file") {
    const inputs = config.input as Record<string, DynamicInput>;
    const versions = Object.keys(inputs);

    const resolvedVersion = version ?? versions.at(0);
    if (!resolvedVersion) {
      throw new Response("Specification version is missing", { status: 404 });
    }
    const inputValue = inputs[resolvedVersion];

    return { type: "file", input: inputValue };
  }

  return {
    type: config.type,
    input: config.input as string,
  };
};

// Public helper consumed by both route loaders and the server. It loads the
// schema, serializes it, and wraps it in a `Response` with the appropriate
// headers so the file can be streamed or opened in a new tab.
export const createSpecResponse = async ({
  config,
  version,
}: {
  config: OpenApiPluginOptions;
  version?: string;
}) => {
  try {
    const source = resolveSourceFromConfig({ config, version });
    const specification = await loadSpecification({
      source,
      schemaImports: config.schemaImports,
    });
    return new Response(specification.content, {
      headers: {
        "Content-Type":
          specification.extension === "yaml"
            ? "application/yaml"
            : "application/json",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    throw new Response("Failed to prepare specification download", {
      status: 500,
    });
  }
};
