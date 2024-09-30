import { useState } from "react";
import { Heading } from "../../components/Heading.js";
import { Markdown, ProseClasses } from "../../components/Markdown.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/Tabs.js";
import { groupBy } from "../../util/groupBy.js";
import { renderIf } from "../../util/renderIf.js";
import { OperationsFragment } from "./OperationList.js";
import { ParameterList } from "./ParameterList.js";
import { Sidecar } from "./Sidecar.js";
import { FragmentType, useFragment } from "./graphql/index.js";
import { SchemaView } from "./schema/SchemaView.js";

export const PARAM_GROUPS = ["path", "query", "header", "cookie"] as const;
export type ParameterGroup = (typeof PARAM_GROUPS)[number];

export const OperationListItem = ({
  operationFragment,
}: {
  operationFragment: FragmentType<typeof OperationsFragment>;
}) => {
  const operation = useFragment(OperationsFragment, operationFragment);
  const groupedParameters = groupBy(
    operation.parameters ?? [],
    (param) => param.in,
  );

  const first = operation.responses.at(0);
  const [selectedResponse, setSelectedResponse] = useState(first?.statusCode);

  return (
    <div
      key={operation.operationId}
      className="grid grid-cols-1 lg:grid-cols-[4fr_3fr] gap-8 items-start border-b-2 mb-16 pb-16"
    >
      <div className="flex flex-col gap-4">
        <Heading level={2} id={operation.slug} registerSidebarAnchor>
          {operation.summary}
        </Heading>
        {operation.description && (
          <Markdown
            className={`${ProseClasses} max-w-full prose-img:max-w-prose`}
            content={operation.description}
          />
        )}
        {operation.parameters && operation.parameters.length > 0 && (
          <>
            {PARAM_GROUPS.flatMap((group) =>
              groupedParameters[group]?.length ? (
                <ParameterList
                  key={group}
                  id={operation.slug}
                  parameters={groupedParameters[group]}
                  group={group}
                />
              ) : (
                []
              ),
            )}
          </>
        )}
        {renderIf(operation.requestBody?.content?.at(0)?.schema, (schema) => (
          <div className="mt-4 flex flex-col gap-4">
            <Heading
              level={3}
              className="capitalize"
              id={`${operation.slug}/request-body`}
              registerSidebarAnchor
            >
              Request Body
            </Heading>
            <SchemaView schema={schema} />
          </div>
        ))}
        {operation.responses.length > 0 && (
          <>
            <Heading
              level={3}
              className="capitalize mt-8 pt-8 border-t"
              id={`${operation.slug}/responses`}
              registerSidebarAnchor
            >
              Responses
            </Heading>
            <Tabs
              onValueChange={(value) => setSelectedResponse(value)}
              value={selectedResponse}
            >
              {operation.responses.length > 1 && (
                <TabsList>
                  {operation.responses.map((response) => (
                    <TabsTrigger
                      value={response.statusCode}
                      key={response.statusCode}
                      title={response.description ?? undefined}
                    >
                      {response.statusCode}
                    </TabsTrigger>
                  ))}
                </TabsList>
              )}
              <ul className="list-none m-0 px-0">
                {operation.responses.map((response) => (
                  <TabsContent
                    value={response.statusCode}
                    key={response.statusCode}
                  >
                    <SchemaView
                      schema={
                        response.content?.find((content) => content.schema)
                          ?.schema
                      }
                    />
                  </TabsContent>
                ))}
              </ul>
            </Tabs>
          </>
        )}
      </div>

      <Sidecar
        selectedResponse={selectedResponse}
        onSelectResponse={setSelectedResponse}
        operation={operation}
      />
    </div>
  );
};
