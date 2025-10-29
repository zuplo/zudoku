import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "react-router";
import { useZudoku } from "zudoku/hooks";
import { useAuthState } from "../../authentication/state.js";
import { PathRenderer } from "../../components/PathRenderer.js";
import type { SchemaObject } from "../../oas/parser/index.js";
import { SyntaxHighlight } from "../../ui/SyntaxHighlight.js";
import { cn } from "../../util/cn.js";
import { useOnScreen } from "../../util/useOnScreen.js";
import { CollapsibleCode } from "./CollapsibleCode.js";
import { ColorizedParam } from "./ColorizedParam.js";
import { useOasConfig } from "./context.js";
import type { OperationsFragmentFragment } from "./graphql/graphql.js";
import { graphql } from "./graphql/index.js";
import { PlaygroundDialogWrapper } from "./PlaygroundDialogWrapper.js";
import { RequestBodySidecarBox } from "./RequestBodySidecarBox.js";
import { ResponsesSidecarBox } from "./ResponsesSidecarBox.js";
import * as SidecarBox from "./SidecarBox.js";
import { SimpleSelect } from "./SimpleSelect.js";
import { useSelectedServer } from "./state.js";
import { createHttpSnippet, getConverted } from "./util/createHttpSnippet.js";
import { generateSchemaExample } from "./util/generateSchemaExample.js";
import { methodForColor } from "./util/methodToColor.js";

export const GetServerQuery = graphql(/* GraphQL */ `
  query getServerQuery($input: JSON!, $type: SchemaType!) {
    schema(input: $input, type: $type) {
      url
      servers {
        url
      }
    }
  }
`);

const EXAMPLE_LANGUAGES = [
  { value: "shell", label: "cURL" },
  { value: "js", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "go", label: "Go" },
  { value: "csharp", label: "C#" },
  { value: "kotlin", label: "Kotlin" },
  { value: "objc", label: "Objective-C" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "swift", label: "Swift" },
];

export const Sidecar = ({
  operation,
  selectedResponse,
  onSelectResponse,
  globalSelectedServer,
}: {
  operation: OperationsFragmentFragment;
  selectedResponse?: string;
  onSelectResponse: (response: string) => void;
  globalSelectedServer?: string;
}) => {
  const { options } = useOasConfig();
  const auth = useAuthState();
  const context = useZudoku();

  const methodTextColor = methodForColor(operation.method);

  const [searchParams, setSearchParams] = useSearchParams();
  const [, startTransition] = useTransition();
  const [selectedExample, setSelectedExample] = useState<unknown>();

  const selectedLang =
    searchParams.get("lang") ?? options?.examplesLanguage ?? "shell";

  const requestBodyContent = operation.requestBody?.content;

  const transformedRequestBodyContent =
    requestBodyContent && options?.transformExamples
      ? options.transformExamples({
          auth,
          type: "request",
          operation,
          content: requestBodyContent,
          context,
        })
      : requestBodyContent;

  const path = (
    <PathRenderer
      path={operation.path}
      renderParam={({ name }) => (
        <ColorizedParam
          name={name}
          backgroundOpacity="0"
          // same as in `ParameterListItem`
          slug={`${operation.slug}-${name}`}
        >
          {`{${name}}`}
        </ColorizedParam>
      )}
    />
  );

  // Manual server selection takes precedence over the server hierarchy.
  // If no manual selection, fall back to operation's first server (already respects operation > path > global hierarchy)
  const selectedServer = globalSelectedServer || operation.servers.at(0)?.url || "";

  const code = useMemo(() => {
    const exampleBody =
      selectedExample ??
      (transformedRequestBodyContent?.[0]?.schema
        ? generateSchemaExample(
            transformedRequestBodyContent[0].schema as SchemaObject,
          )
        : undefined);

    const snippet = createHttpSnippet({
      operation,
      selectedServer,
      exampleBody: exampleBody
        ? {
            mimeType: "application/json",
            text: JSON.stringify(exampleBody, null, 2),
          }
        : { mimeType: "application/json" },
    });

    return getConverted(snippet, selectedLang);
  }, [
    selectedExample,
    transformedRequestBodyContent,
    operation,
    selectedServer,
    selectedLang,
  ]);
  const [ref, isOnScreen] = useOnScreen({ rootMargin: "200px 0px 200px 0px" });

  const showPlayground =
    isOnScreen &&
    (operation.extensions["x-explorer-enabled"] === true ||
      operation.extensions["x-zudoku-playground-enabled"] === true ||
      (operation.extensions["x-explorer-enabled"] === undefined &&
        operation.extensions["x-zudoku-playground-enabled"] === undefined &&
        !options?.disablePlayground));

  return (
    <aside
      ref={ref}
      className="flex flex-col overflow-hidden sticky top-(--scroll-padding) gap-4"
      data-pagefind-ignore="all"
    >
      <SidecarBox.Root>
        <SidecarBox.Head className="flex justify-between items-center flex-nowrap py-2.5 gap-2 text-xs">
          <span className="font-mono break-words leading-6">
            <span className={cn("font-semibold", methodTextColor)}>
              {operation.method.toUpperCase()}
            </span>
            &nbsp;
            {path}
          </span>
          {showPlayground && (
            <PlaygroundDialogWrapper
              servers={operation.servers.map((server) => server.url)}
              operation={operation}
              examples={requestBodyContent ?? undefined}
            />
          )}
        </SidecarBox.Head>
        {isOnScreen && (
          <>
            <SidecarBox.Body className="p-0">
              <CollapsibleCode>
                <SyntaxHighlight
                  embedded
                  language={selectedLang}
                  noBackground
                  className="[--scrollbar-color:gray] rounded-none text-xs max-h-[500px]"
                  // biome-ignore lint/style/noNonNullAssertion: code is guaranteed to be defined
                  code={code!}
                />
              </CollapsibleCode>
            </SidecarBox.Body>
            <SidecarBox.Footer className="flex items-center text-xs gap-2 justify-end py-2.5">
              <span>Show example in</span>
              <SimpleSelect
                className="self-start max-w-[150px]"
                value={selectedLang}
                onChange={(e) => {
                  startTransition(() => {
                    setSearchParams((prev) => {
                      prev.set("lang", e.target.value);
                      return prev;
                    });
                  });
                }}
                options={EXAMPLE_LANGUAGES}
              />
            </SidecarBox.Footer>
          </>
        )}
      </SidecarBox.Root>
      {isOnScreen && transformedRequestBodyContent && (
        <RequestBodySidecarBox
          content={transformedRequestBodyContent}
          onExampleChange={setSelectedExample}
        />
      )}
      {isOnScreen && operation.responses.length > 0 && (
        <ResponsesSidecarBox
          selectedResponse={selectedResponse}
          onSelectResponse={onSelectResponse}
          responses={operation.responses.map((response) => ({
            ...response,
            content:
              response.content && options?.transformExamples
                ? options.transformExamples({
                    auth,
                    type: "response",
                    context,
                    operation,
                    content: response.content,
                  })
                : response.content,
          }))}
        />
      )}
    </aside>
  );
};
