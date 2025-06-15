import { valueToEstree } from "estree-util-value-to-estree";
import type { MdxjsEsm } from "mdast-util-mdx";

export const exportMdxjsConst = (name: string, value: unknown): MdxjsEsm => ({
  type: "mdxjsEsm",
  value: "",
  data: {
    estree: {
      type: "Program",
      sourceType: "module",
      body: [
        {
          type: "ExportNamedDeclaration",
          attributes: [],
          declaration: {
            type: "VariableDeclaration",
            kind: "const",
            declarations: [
              {
                type: "VariableDeclarator",
                id: { type: "Identifier", name },
                init: valueToEstree(value),
              },
            ],
          },
          specifiers: [],
          source: null,
        },
      ],
    },
  },
});
