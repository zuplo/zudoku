import { Head, Heading } from "zudoku/components";
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
        <Head>
          <title>Playground</title>
        </Head>
        <div className="flex flex-col gap-4">
          <Heading level={1}>Playground</Heading>
          <p className="text-muted-foreground">
            The GraphQL playground is disabled for this schema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-(--padding-content-top)">
      <Head>
        <title>Playground</title>
      </Head>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Heading level={1}>Playground</Heading>
          <p className="text-muted-foreground">
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
    </div>
  );
};
