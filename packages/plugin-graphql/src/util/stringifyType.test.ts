import { buildSchema, introspectionFromSchema } from "graphql";
import { describe, expect, it } from "vitest";
import { findQueryFields } from "./findType.js";
import { stringifyType } from "./stringifyType.js";
import { type TypeWrapper, unwrapType } from "./unwrapType.js";

const typeRefs = [
  "String",
  "String!",
  "[String]",
  "[String]!",
  "[String!]",
  "[String!]!",
  "[[String]]",
  "[[String]!]",
  "[[String!]]",
  "[[String!]!]",
  "[[String!]!]!",
];

const fields = findQueryFields(
  introspectionFromSchema(
    buildSchema(
      `type Query {\n${typeRefs.map((ref, i) => `  field${i}: ${ref}`).join("\n")}\n}`,
    ),
  ).__schema,
);

describe("stringifyType", () => {
  it.each(typeRefs.map((ref, i) => [ref, i] as const))(
    "prints %s like the SDL",
    (ref, i) => {
      const field = fields.find((field) => field.name === `field${i}`);
      if (!field) throw new Error(`Expected field${i} to exist`);

      const wrappers: TypeWrapper[] = [];
      const unwrapped = unwrapType(field.type, wrappers);

      expect(stringifyType(unwrapped.name, wrappers)).toBe(ref);
    },
  );
});
