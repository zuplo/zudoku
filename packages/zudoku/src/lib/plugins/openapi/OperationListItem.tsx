import { useState } from "react";
import { Badge } from "zudoku/ui/Badge.js";
import { NativeSelect, NativeSelectOption } from "zudoku/ui/NativeSelect.js";
import { Separator } from "zudoku/ui/Separator.js";
import { Heading } from "../../components/Heading.js";
import { Markdown } from "../../components/Markdown.js";
import { PagefindSearchMeta } from "../../components/PagefindSearchMeta.js";
import { cn } from "../../util/cn.js";
import { renderIf } from "../../util/renderIf.js";
import { ResponseContent } from "./components/ResponseContent.js";
import { SelectOnClick } from "./components/SelectOnClick.js";
import { useOasConfig } from "./context.js";
import { type FragmentType, useFragment } from "./graphql/index.js";
import type { RequestExampleSelection } from "./interfaces.js";
import { MCPEndpoint } from "./MCPEndpoint.js";
import { OperationsFragment } from "./OperationList.js";
import { ParameterList } from "./ParameterList.js";
import { SchemaView } from "./schema/SchemaView.js";
import { withBinaryMediaType } from "./schema/utils.js";
import { SecurityRequirements } from "./SecurityRequirements.js";
import { Sidecar } from "./Sidecar.js";
import { useResolvedServerUrl } from "./state.js";
import { getGraphQLEndpoint } from "./util/graphqlEndpoint.js";
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
  const groupedParameters = Object.groupBy(
    operation.parameters ?? [],
    (param) => param.in,
  );
  const { options } = useOasConfig();

  // Manual server selection takes precedence over the server hierarchy.
  // If no manual selection, fall back to operation's first server (already respects operation > path > global hierarchy)
  const fallbackServerUrl = useResolvedServerUrl(operation.servers.at(0));
  const displayServerUrl = globalSelectedServer || fallbackServerUrl;

  const first = operation.responses.at(0);
  const [selectedResponse, setSelectedResponse] = useState(first?.statusCode);
  const requestContent = operation.requestBody?.content ?? [];
  const [requestExampleSelection, setSelectedRequestExample] =
    useState<RequestExampleSelection>({
      mediaType: requestContent.at(0)?.mediaType,
      exampleIndex: 0,
    });
  // The stored media type goes stale when this item re-renders with different
  // content (e.g. switching API versions keeps the same slug), so fall back to
  // the first content type instead of dropping the request body.
  const selectedRequestContent =
    requestContent.find(
      (content) => content.mediaType === requestExampleSelection.mediaType,
    ) ?? requestContent.at(0);
  const selectedRequestExample: RequestExampleSelection =
    selectedRequestContent?.mediaType === requestExampleSelection.mediaType
      ? requestExampleSelection
      : { mediaType: selectedRequestContent?.mediaType, exampleIndex: 0 };
  const hasMultipleRequestContentTypes = requestContent.length > 1;
  // Keep the section (and its selector) visible when the selected content type
  // has no schema, so readers can still switch to another one.
  const showRequestBody =
    hasMultipleRequestContentTypes || Boolean(selectedRequestContent?.schema);
  const isMCPEndpoint = operation.extensions?.["x-mcp-server"] !== undefined;
  const graphqlEndpoint = getGraphQLEndpoint(operation);
  const isGraphQLEndpoint = graphqlEndpoint !== undefined;

  const heading = (
    <Heading
      level={2}
      id={operation.slug}
      registerNavigationAnchor
      className={cn("break-all", !isGraphQLEndpoint && "col-span-full")}
    >
      {operation.summary}
    </Heading>
  );

  const methodPathBlock = !isMCPEndpoint && (
    <div
      className={cn(
        "flex flex-col gap-1.5",
        !isGraphQLEndpoint && "col-span-full",
      )}
    >
      <div className="text-sm flex gap-2 font-mono">
        <span className={methodForColor(operation.method)}>
          {operation.method.toUpperCase()}
        </span>
        <SelectOnClick
          className="max-w-full truncate flex cursor-pointer"
          copyValue={`${displayServerUrl?.replace(/\/$/, "") ?? ""}${operation.path}`}
        >
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
      {!options?.disableSecurity && (
        <SecurityRequirements security={operation.security} />
      )}
    </div>
  );

  const description = operation.description && (
    <Markdown
      className="max-w-full prose-img:max-w-prose"
      content={operation.description}
    />
  );

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
        {isGraphQLEndpoint ? (
          <div className="flex flex-col gap-4 min-w-0">
            {heading}
            {methodPathBlock}
            {description}
          </div>
        ) : (
          <>
            {heading}
            {methodPathBlock}
            {isMCPEndpoint ? (
              <div className="col-span-full">
                <MCPEndpoint
                  serverUrl={displayServerUrl}
                  operationPath={operation.path}
                  summary={operation.summary ?? undefined}
                  data={operation.extensions?.["x-mcp-server"]}
                  disableAuthInstructions={options?.disableMcpAuthInstructions}
                />
              </div>
            ) : (
              <div
                className={cn(
                  "flex flex-col gap-4",
                  options?.disableSidecar && "col-span-full",
                )}
              >
                {description}
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
                {renderIf(showRequestBody, () => (
                  <>
                    <Separator className="my-4" />
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
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
                        {hasMultipleRequestContentTypes && (
                          <NativeSelect
                            aria-label="Request body content type"
                            className="text-xs h-fit py-1 max-w-full truncate bg-background"
                            value={selectedRequestExample.mediaType}
                            onChange={(event) =>
                              setSelectedRequestExample({
                                mediaType: event.target.value,
                                exampleIndex: 0,
                              })
                            }
                          >
                            {requestContent.map((content) => (
                              <NativeSelectOption
                                key={content.mediaType}
                                value={content.mediaType}
                              >
                                {content.mediaType}
                              </NativeSelectOption>
                            ))}
                          </NativeSelect>
                        )}
                      </div>
                      {selectedRequestContent?.schema ? (
                        <SchemaView
                          key={selectedRequestContent.mediaType}
                          schema={withBinaryMediaType(
                            selectedRequestContent.schema,
                            selectedRequestContent.mediaType,
                          )}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No schema defined for this content type.
                        </p>
                      )}
                    </div>
                  </>
                ))}
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
          </>
        )}

        {renderIf(!options?.disableSidecar && !isMCPEndpoint, () => {
          const sidecar = (
            <Sidecar
              selectedResponse={selectedResponse}
              operation={operation}
              globalSelectedServer={globalSelectedServer}
              shouldLazyHighlight={shouldLazyHighlight}
              selectedRequestExample={selectedRequestExample}
              onRequestExampleChange={setSelectedRequestExample}
            />
          );
          return isGraphQLEndpoint ? (
            <div className="min-w-0">{sidecar}</div>
          ) : (
            sidecar
          );
        })}
      </div>
    </div>
  );
};
