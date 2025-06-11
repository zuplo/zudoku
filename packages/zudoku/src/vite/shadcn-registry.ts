import { z } from "zod";

// Taken and simplified from https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/schema.ts
const registryItemCssSchema = z.record(
  z.string(),
  z.lazy(() =>
    z.union([
      z.string(),
      z.record(
        z.string(),
        z.union([z.string(), z.record(z.string(), z.string())]),
      ),
    ]),
  ),
);

export type RegistryItemCss = z.infer<typeof registryItemCssSchema>;

const registryItemSchema = z.object({
  $schema: z.literal("https://ui.shadcn.com/schema/registry-item.json"),
  name: z.string(),
  type: z.enum(["registry:theme", "registry:style"]),
  cssVars: z
    .object({
      theme: z.record(z.string(), z.string()).optional(),
      light: z.record(z.string(), z.string()).optional(),
      dark: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
  css: registryItemCssSchema.optional(),
});

type RegistryItem = z.infer<typeof registryItemSchema>;

export const fetchShadcnRegistryItem = async (
  url: string,
): Promise<RegistryItem> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch shadcn registry item from ${url}`);
  }

  const data = await response.json();
  const result = registryItemSchema.parse(data);

  return result;
};
