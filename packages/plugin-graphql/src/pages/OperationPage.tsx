import { useMemo, useState } from "react";
import { Head, Heading, Markdown } from "zudoku/components";
import { PlayIcon } from "zudoku/icons";
import { Badge } from "zudoku/ui/Badge.js";
import { Button } from "zudoku/ui/Button.js";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "zudoku/ui/Collapsible.js";
import * as SidecarBox from "zudoku/ui/SidecarBox.js";
import { SyntaxHighlight } from "zudoku/ui/SyntaxHighlight.js";
import { ExpandableType } from "../components/ExpandableType.js";
import { InputFieldList } from "../components/FieldList.js";
import { useGraphQLWorkbench } from "../components/GraphQLWorkbench.js";
import { useGraphQLSchema } from "../context.js";
import { findOperationFields } from "../util/findType.js";
import { generateGraphQLOperation } from "../util/generateOperation.js";
import { typeMetadata } from "../util/types.js";

type OperationType = "query" | "mutation" | "subscription";

type OperationPageProps = {
  kind: string;
  name: string;
};

export const OperationPage = ({ kind, name }: OperationPageProps) => {
  const { schema, options } = useGraphQLSchema();

  const operationType = kind as OperationType;
  const meta = typeMetadata[operationType];
  const operation = findOperationFields(operationType, schema).find(
    (f) => f.name === name,
  );

  const generatedOperation = useMemo(
    () =>
      operation
        ? generateGraphQLOperation({ field: operation, operationType, schema })
        : undefined,
    [operation, operationType, schema],
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
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <Heading level={1}>{operation.name}</Heading>
            <Badge className={meta?.colorClass}>{meta?.labelSingular}</Badge>
          </div>

          {operation.description && (
            <div className="mt-4 text-muted-foreground">
              <Markdown content={operation.description} />
            </div>
          )}

          {operation.isDeprecated && (
            <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-destructive">
              <strong>Deprecated</strong>
              {operation.deprecationReason && (
                <span className="ml-2">{operation.deprecationReason}</span>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-6">
            <ExpandableType type={operation.type} label="Return Type" />

            {operation.args && operation.args.length > 0 && (
              <div>
                <Heading level={3} className="mb-2">
                  Arguments
                </Heading>
                <InputFieldList fields={operation.args} />
              </div>
            )}
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
          className="scrollbar rounded-none border-0 max-h-50 text-xs overflow-auto"
        />
        {hasVariables && (
          <Collapsible open={variablesOpen} onOpenChange={setVariablesOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 border-t px-3 py-2 text-xs font-medium hover:bg-muted/50"
              >
                Variables
                <span className="text-muted-foreground">
                  {variablesOpen ? "Hide" : "Show"}
                </span>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SyntaxHighlight
                embedded
                code={variablesJson}
                language="json"
                showCopy="never"
                showLanguageIndicator={false}
                className="scrollbar rounded-none border-0 border-t max-h-50 text-xs overflow-auto"
              />
            </CollapsibleContent>
          </Collapsible>
        )}
      </SidecarBox.Body>
    </SidecarBox.Root>
  );
};
