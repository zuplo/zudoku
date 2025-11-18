import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "react-router";
import { useZudoku } from "zudoku/hooks";
import { SyntaxHighlight } from "zudoku/ui/SyntaxHighlight.js";
import { useAuthState } from "../../authentication/state.js";
import { PathRenderer } from "../../components/PathRenderer.js";
import { cn } from "../../util/cn.js";
import { useOnScreen } from "../../util/useOnScreen.js";
import { ColorizedParam } from "./ColorizedParam.js";
import { NonHighlightedCode } from "./components/NonHighlightedCode.js";
import { useOasConfig } from "./context.js";
import { GeneratedExampleSidecarBox } from "./GeneratedExampleSidecarBox.js";
import type { OperationsFragmentFragment } from "./graphql/graphql.js";
import { graphql } from "./graphql/index.js";
import { PlaygroundDialogWrapper } from "./PlaygroundDialogWrapper.js";
import { RequestBodySidecarBox } from "./RequestBodySidecarBox.js";
import { ResponsesSidecarBox } from "./ResponsesSidecarBox.js";
import * as SidecarBox from "./SidecarBox.js";
import { SimpleSelect } from "./SimpleSelect.js";
import { createHttpSnippet, getConverted } from "./util/createHttpSnippet.js";
import { generateSchemaExample } from "./util/generateSchemaExample.js";
import { methodForColor } from "./util/methodToColor.js";
import { resolveServerVariables } from "./util/resolveServerVariables.js";

export const GetServerQuery = graphql(/* GraphQL */ `
  query getServerQuery($input: JSON!, $type: SchemaType!) {
    schema(input: $input, type: $type) {
      url
      servers {
        url
        variables
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
  shouldLazyHighlight,
}: {
  operation: OperationsFragmentFragment;
  selectedResponse?: string;
  onSelectResponse: (response: string) => void;
  globalSelectedServer?: string;
  shouldLazyHighlight?: boolean;
}) => {
  const { options } = useOasConfig();
  const auth = useAuthState();
  const context = useZudoku();

  const methodTextColor = methodForColor(operation.method);

  const [searchParams, setSearchParams] = useSearchParams();
  const [, startTransition] = useTransition();

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

  const [selectedRequestExample, setSelectedRequestExample] = useState<{
    contentTypeIndex: number;
    exampleIndex: number;
  }>({
    contentTypeIndex: 0,
    exampleIndex: 0,
  });

  const selectedContent = transformedRequestBodyContent?.at(
    selectedRequestExample.contentTypeIndex,
  );
  const currentExample = selectedContent?.examples?.at(
    selectedRequestExample.exampleIndex,
  );

  const selectedLang =
    searchParams.get("lang") ?? options?.examplesLanguage ?? "shell";

  const currentExampleCode = currentExample
    ? (currentExample?.value ?? currentExample)
    : selectedContent?.schema
      ? generateSchemaExample(selectedContent?.schema)
      : undefined;

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
  const firstServer = operation.servers.at(0);
  const selectedServerUrl = globalSelectedServer || firstServer?.url || "";
  const selectedServer = resolveServerVariables(
    selectedServerUrl,
    firstServer?.variables,
  );

  const httpSnippetCode = useMemo<string | undefined>(() => {
    const snippet = createHttpSnippet({
      operation,
      selectedServer,
      exampleBody: currentExampleCode
        ? {
            mimeType: "application/json",
            text: JSON.stringify(currentExampleCode, null, 2),
          }
        : { mimeType: "application/json" },
    });

    return getConverted(snippet, selectedLang);
  }, [operation, selectedServer, selectedLang, currentExampleCode]);

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
          <span className="font-mono wrap-break-word leading-6">
            <span className={cn("font-semibold", methodTextColor)}>
              {operation.method.toUpperCase()}
            </span>
            &nbsp;
            {path}
          </span>
          {showPlayground && (
            <PlaygroundDialogWrapper
              servers={operation.servers.map((server) =>
                resolveServerVariables(server.url, server.variables),
              )}
              operation={operation}
              examples={requestBodyContent ?? undefined}
            />
          )}
        </SidecarBox.Head>
        <SidecarBox.Body className="p-0">
          {shouldLazyHighlight && !isOnScreen ? (
            <NonHighlightedCode code={httpSnippetCode ?? ""} />
          ) : (
            <SyntaxHighlight
              embedded
              language={selectedLang}
              className="[--scrollbar-color:gray] rounded-none text-xs max-h-[200px]"
              // biome-ignore lint/style/noNonNullAssertion: code is guaranteed to be defined
              code={httpSnippetCode!}
            />
          )}
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
      </SidecarBox.Root>

      {transformedRequestBodyContent && currentExample ? (
        <RequestBodySidecarBox
          content={transformedRequestBodyContent}
          onExampleChange={(selected) => {
            setSelectedRequestExample(selected);
          }}
          selectedContentIndex={selectedRequestExample.contentTypeIndex}
          selectedExampleIndex={selectedRequestExample.exampleIndex}
          isOnScreen={isOnScreen}
          shouldLazyHighlight={shouldLazyHighlight}
        />
      ) : transformedRequestBodyContent && currentExampleCode ? (
        <GeneratedExampleSidecarBox
          isOnScreen={isOnScreen}
          shouldLazyHighlight={shouldLazyHighlight}
          code={JSON.stringify(currentExampleCode, null, 2)}
        />
      ) : null}

      {operation.responses.length > 0 && (
        <ResponsesSidecarBox
          isOnScreen={isOnScreen}
          shouldLazyHighlight={shouldLazyHighlight}
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
