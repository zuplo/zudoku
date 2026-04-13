import type { ResponseItem } from "../graphql/graphql.js";
import { generateSchemaExample } from "./generateSchemaExample.js";

const responseHasExamples = (response: ResponseItem): boolean =>
  response.content?.some((content) => (content.examples?.length ?? 0) > 0) ??
  false;

/**
 * For each response, if it has explicit examples keep them as-is.
 * Otherwise generate an example from the schema.
 * This ensures responses without explicit examples still get
 * auto-generated previews even when sibling responses have examples.
 */
export const resolveResponseExamples = (
  responses: ResponseItem[],
): ResponseItem[] =>
  responses.map((response) => {
    if (responseHasExamples(response)) {
      return response;
    }

    return {
      ...response,
      content: response.content?.map((content) => ({
        ...content,
        examples: content.schema
          ? [{ name: "", value: generateSchemaExample(content.schema) }]
          : content.examples,
      })),
    };
  });
