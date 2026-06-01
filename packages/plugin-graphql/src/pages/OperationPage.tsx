import { useMemo, useState } from "react";
import { Head } from "zudoku/components";
import { PlayIcon } from "zudoku/icons";
import { Link } from "zudoku/router";
import { Button } from "zudoku/ui/Button.js";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "zudoku/ui/Collapsible.js";
import * as SidecarBox from "zudoku/ui/SidecarBox.js";
import { SyntaxHighlight } from "zudoku/ui/SyntaxHighlight.js";
import { DetailPageHeader } from "../components/DetailPageHeader.js";
import { ExpandableType } from "../components/ExpandableType.js";
import { FieldList } from "../components/FieldList.js";
import { useGraphQLWorkbench } from "../components/GraphQLWorkbench.js";
import { SectionTitle } from "../components/SectionTitle.js";
import { useGraphQLSchema } from "../context.js";
import { generateGraphQLOperation } from "../util/generateOperation.js";
import { typeMetadata } from "../util/types.js";

type OperationType = "query" | "mutation" | "subscription";

type OperationPageProps = {
  kind: string;
  name: string;
};

export const OperationPage = ({ kind, name }: OperationPageProps) => {
  const { index, options, basePath } = useGraphQLSchema();
  const apiTitle = options.title ?? "GraphQL API";

  const operationType = kind as OperationType;
  const meta = typeMetadata[operationType];
  const operation = index
    .operationFields(operationType)
    .find((f) => f.name === name);

  const generatedOperation = useMemo(
    () =>
      operation
        ? generateGraphQLOperation({ field: operation, operationType, index })
        : undefined,
    [operation, operationType, index],
  );
  const playgroundEnabled = options.playground?.enabled !== false;

  if (!operation || !generatedOperation) {
    return <div>Operation not found: {name}</div>;
  }

  return (
    <div className="pt-(--padding-content-top)">
      <Head>
        <title>
          {meta ? `${operation.name} · ${meta.label}` : operation.name}
        </title>
      </Head>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 flex flex-col gap-8">
          <DetailPageHeader
            eyebrow={<Link to={basePath}>{apiTitle}</Link>}
            name={operation.name}
            label={meta?.labelSingular.toLowerCase()}
            description={operation.description}
            isDeprecated={operation.isDeprecated}
            deprecationReason={operation.deprecationReason}
          />

          <div className="flex flex-col gap-6">
            {operation.args && operation.args.length > 0 && (
              <div className="flex flex-col">
                <SectionTitle label="Arguments" />
                <FieldList fields={operation.args} />
              </div>
            )}

            <ExpandableType type={operation.type} label="Return Type" />
          </div>
        </div>

        <aside className="min-w-0 xl:sticky xl:top-(--scroll-padding) xl:self-start">
          <OperationSidecar
            document={generatedOperation.document}
            variablesJson={generatedOperation.variablesJson}
            playgroundEnabled={playgroundEnabled}
            operationName={generatedOperation.operationName}
          />
        </aside>
      </div>
    </div>
  );
};

const OperationSidecar = ({
  document,
  variablesJson,
  playgroundEnabled,
  operationName,
}: {
  document: string;
  variablesJson: string;
  playgroundEnabled: boolean;
  operationName: string;
}) => {
  const { openWorkbench } = useGraphQLWorkbench();
  const [variablesOpen, setVariablesOpen] = useState(false);
  const hasVariables = variablesJson !== "{}";

  return (
    <SidecarBox.Root>
      <SidecarBox.Head className="text-xs justify-between py-1.5">
        <span className="font-medium">Example</span>
        <div className="flex items-center gap-1.5">
          {playgroundEnabled && (
            <Button
              variant="outline"
              size="xs"
              onClick={() =>
                openWorkbench({
                  query: document,
                  variables: variablesJson,
                  label: operationName,
                })
              }
            >
              <PlayIcon size={14} fill="currentColor" aria-hidden="true" />
              Test
            </Button>
          )}
        </div>
      </SidecarBox.Head>
      <SidecarBox.Body className="p-0">
        <SyntaxHighlight
          embedded
          code={document}
          language="graphql"
          showLanguageIndicator={false}
          className="max-h-50 text-xs overflow-auto"
        />
      </SidecarBox.Body>
      {hasVariables && (
        <SidecarBox.Footer className="text-muted-foreground">
          <Collapsible open={variablesOpen} onOpenChange={setVariablesOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 text-xs font-medium">
              Show Variables
              <span className="text-muted-foreground">
                {variablesOpen ? "Hide" : "Show"}
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SyntaxHighlight
                embedded
                code={variablesJson}
                language="json"
                showCopy="never"
                showLanguageIndicator={false}
                className="mt-1 border rounded max-h-50 text-xs overflow-auto"
              />
            </CollapsibleContent>
          </Collapsible>
        </SidecarBox.Footer>
      )}
    </SidecarBox.Root>
  );
};
