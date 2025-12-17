import { Heading } from "zudoku/components";
import { GraphQLPlayground } from "../components/GraphQLPlayground.js";
import { useGraphQLWorkbench } from "../components/GraphQLWorkbench.js";
import { useGraphQLSchema } from "../context.js";

export const PlaygroundPage = () => {
  const { options, schema } = useGraphQLSchema();
  const { operation, updateWorkbenchOperation } = useGraphQLWorkbench();
  const endpoint = options.playground?.endpoint;

  if (options.playground?.enabled === false) {
    return (
      <div className="pt-(--padding-content-top)">
        <Heading level={1}>Playground</Heading>
        <p className="mt-4 text-muted-foreground">
          The GraphQL playground is disabled for this schema.
        </p>
      </div>
    );
  }

  return (
    <div className="pt-(--padding-content-top)">
      <div className="mb-6">
        <Heading level={1}>Playground</Heading>
        <p className="mt-3 text-muted-foreground">
          Explore the schema, compose operations, and send live GraphQL
          requests.
        </p>
      </div>
      <GraphQLPlayground
        endpoint={endpoint}
        headers={options.playground?.headers}
        schema={{ __schema: schema }}
        operation={operation}
        onOperationChange={updateWorkbenchOperation}
        className="h-[calc(100vh-var(--padding-content-top)-8rem)] min-h-[640px]"
      />
    </div>
  );
};
