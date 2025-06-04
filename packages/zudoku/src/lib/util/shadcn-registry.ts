import z from "zod";

// Based on https://ui.shadcn.com/schema/registry-item.json
export const ShadcnRegistryItemSchema = z.object({
  name: z.string(),
  type: z.enum([
    "registry:lib",
    "registry:block",
    "registry:component",
    "registry:ui",
    "registry:hook",
    "registry:theme",
    "registry:page",
    "registry:file",
    "registry:style",
  ]),
  description: z.string().optional(),
  title: z.string().optional(),
  author: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  devDependencies: z.array(z.string()).optional(),
  registryDependencies: z.array(z.string()).optional(),
  cssVars: z
    .object({
      theme: z.record(z.string()).optional(),
      light: z.record(z.string()).optional(),
      dark: z.record(z.string()).optional(),
    })
    .optional(),
  css: z.record(z.any()).optional(),
  meta: z.record(z.any()).optional(),
  docs: z.string().optional(),
  categories: z.array(z.string()).optional(),
  extends: z.string().optional(),
});

export type ShadcnRegistryItem = z.infer<typeof ShadcnRegistryItemSchema>;

/**
 * Fetches and validates a ShadCN registry theme
 */
export async function fetchShadcnRegistryTheme(
  url: string,
): Promise<ShadcnRegistryItem> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch theme: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    // Validate against the official schema
    const result = ShadcnRegistryItemSchema.safeParse(data);
    if (!result.success) {
      throw new Error(`Invalid registry item: ${result.error.message}`);
    }

    // Ensure it's a style registry item
    if (result.data.type !== "registry:style") {
      throw new Error(`Expected registry:style, got ${result.data.type}`);
    }

    return result.data;
  } catch (error) {
    throw new Error(
      `Failed to fetch ShadCN registry theme from ${url}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
