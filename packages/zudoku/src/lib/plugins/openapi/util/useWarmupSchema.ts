import { useQuery } from "@tanstack/react-query";
import { useCreateQuery } from "../client/useCreateQuery.js";
import { useOasConfig } from "../context.js";
import { graphql } from "../graphql/index.js";

const SchemaWarmupQuery = graphql(/* GraphQL */ `
  query SchemaWarmup($input: JSON!, $type: SchemaType!) {
    schema(input: $input, type: $type) {
      openapi
    }
  }
`);

// Load the schema in the background on the client if schema was rendered on the server
export const useWarmupSchema = () => {
  const { input, type } = useOasConfig();
  const warmupQuery = useCreateQuery(SchemaWarmupQuery, { input, type });
  useQuery({
    ...warmupQuery,
    enabled: typeof window !== "undefined",
    notifyOnChangeProps: [],
  });
};
