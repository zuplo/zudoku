import { useState } from "react";
import { Badge } from "zudoku/ui/Badge.js";
import { Separator } from "zudoku/ui/Separator.js";
import { Heading } from "../../components/Heading.js";
import { Markdown } from "../../components/Markdown.js";
import { PagefindSearchMeta } from "../../components/PagefindSearchMeta.js";
import { cn } from "../../util/cn.js";
import { groupBy } from "../../util/groupBy.js";
import { renderIf } from "../../util/renderIf.js";
import { ResponseContent } from "./components/ResponseContent.js";
import { SelectOnClick } from "./components/SelectOnClick.js";
import { useOasConfig } from "./context.js";
import { type FragmentType, useFragment } from "./graphql/index.js";
import { MCPEndpoint } from "./MCPEndpoint.js";
import { OperationsFragment } from "./OperationList.js";
import { ParameterList } from "./ParameterList.js";
import { Sidecar } from "./Sidecar.js";
import { SchemaView } from "./schema/SchemaView.js";
import { methodForColor } from "./util/methodToColor.js";

const PARAM_GROUPS = ["path", "query", "header", "cookie"] as const;
export type ParameterGroup = (typeof PARAM_GROUPS)[number];

export const OperationListItem = ({
  operationFragment,
  globalSelectedServer,
  shouldLazyHighlight,
}: {
  operationFragment: FragmentType<typeof OperationsFragment>;
  globalSelectedServer?: string;
  shouldLazyHighlight?: boolean;
}) => {
  const operation = useFragment(OperationsFragment, operationFragment);
  const groupedParameters = groupBy(
    operation.parameters ?? [],
    (param) => param.in,
  );
  const { options } = useOasConfig();

  // Manual server selection takes precedence over the server hierarchy.
  // If no manual selection, fall back to operation's first server (already respects operation > path > global hierarchy)
  const displayServerUrl = globalSelectedServer || operation.servers.at(0)?.url;

  const first = operation.responses.at(0);
  const [selectedResponse, setSelectedResponse] = useState(first?.statusCode);
  const isMCPEndpoint = operation.extensions?.["x-mcp-server"] !== undefined;

  return (
    <div>
      {operation.deprecated && (
        <Badge variant="muted" className="text-xs mb-4">
          deprecated
        </Badge>
      )}
      <div
        key={operation.operationId}
        className={cn(
          "grid grid-cols-1 lg:grid-cols-[minmax(0,4fr)_minmax(0,3fr)] gap-x-8 gap-y-4 items-start",
          operation.deprecated && "opacity-50 transition hover:opacity-100",
        )}
      >
        <Heading
          level={2}
          id={operation.slug}
          registerNavigationAnchor
          className="break-all col-span-full"
        >
          {operation.summary}
        </Heading>
        {!isMCPEndpoint && (
          <div className="text-sm flex gap-2 font-mono col-span-full">
            <span className={methodForColor(operation.method)}>
              {operation.method.toUpperCase()}
            </span>
            <SelectOnClick className="max-w-full truncate flex cursor-pointer">
              {displayServerUrl && (
                <div className="text-neutral-400 dark:text-neutral-500 truncate">
                  {displayServerUrl.replace(/\/$/, "")}
                </div>
              )}
              <div className="text-neutral-900 dark:text-neutral-200">
                {operation.path}
              </div>
            </SelectOnClick>
          </div>
        )}

        {isMCPEndpoint ? (
          <div className="col-span-full">
            <MCPEndpoint
              serverUrl={displayServerUrl}
              summary={operation.summary ?? undefined}
              data={operation.extensions?.["x-mcp-server"]}
            />
          </div>
        ) : (
          <div
            className={cn(
              "flex flex-col gap-4",
              options?.disableSidecar && "col-span-full",
            )}
          >
            {operation.description && (
              <Markdown
                className="max-w-full prose-img:max-w-prose"
                content={operation.description}
              />
            )}
            {operation.parameters &&
              operation.parameters.length > 0 &&
              PARAM_GROUPS.flatMap((group) =>
                groupedParameters[group]?.length ? (
                  <ParameterList
                    key={group}
                    summary={operation.summary ?? undefined}
                    id={operation.slug}
                    parameters={groupedParameters[group]}
                    group={group}
                  />
                ) : (
                  []
                ),
              )}
            {renderIf(operation.requestBody?.content?.at(0)?.schema, () => (
              <Separator className="my-4" />
            ))}
            {renderIf(
              operation.requestBody?.content?.at(0)?.schema,
              (schema) => (
                <div className="flex flex-col gap-4">
                  <Heading
                    level={3}
                    className="capitalize flex items-center gap-2"
                    id={`${operation.slug}/request-body`}
                  >
                    {operation.summary && (
                      <PagefindSearchMeta>
                        {operation.summary} &rsaquo;{" "}
                      </PagefindSearchMeta>
                    )}
                    Request Body{" "}
                    {operation.requestBody?.required === false ? (
                      <Badge variant="muted">optional</Badge>
                    ) : (
                      ""
                    )}
                  </Heading>
                  <SchemaView schema={schema} />
                </div>
              ),
            )}
            <Separator className="my-4" />
            {operation.responses.length > 0 && (
              <>
                <Heading level={3} id={`${operation.slug}/responses`}>
                  {operation.summary && (
                    <PagefindSearchMeta>
                      {operation.summary} &rsaquo;{" "}
                    </PagefindSearchMeta>
                  )}
                  Responses
                </Heading>
                <ResponseContent
                  responses={operation.responses}
                  selectedResponse={selectedResponse}
                  onSelectResponse={setSelectedResponse}
                />
              </>
            )}
          </div>
        )}

        {renderIf(!options?.disableSidecar && !isMCPEndpoint, () => (
          <Sidecar
            selectedResponse={selectedResponse}
            operation={operation}
            globalSelectedServer={globalSelectedServer}
            shouldLazyHighlight={shouldLazyHighlight}
          />
        ))}
      </div>
    </div>
  );
};
