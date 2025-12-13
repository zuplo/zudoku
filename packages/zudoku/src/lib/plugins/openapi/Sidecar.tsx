import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "react-router";
import { useZudoku } from "zudoku/hooks";
import { Badge } from "zudoku/ui/Badge.js";
import { NativeSelect, NativeSelectOption } from "zudoku/ui/NativeSelect.js";
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
  globalSelectedServer,
  shouldLazyHighlight,
}: {
  operation: OperationsFragmentFragment;
  selectedResponse?: string;
  globalSelectedServer?: string;
  shouldLazyHighlight?: boolean;
}) => {
  const { options } = useOasConfig();
  const auth = useAuthState();
  const context = useZudoku();

  const methodTextColor = methodForColor(operation.method);

  const [searchParams, setSearchParams] = useSearchParams();
  const [, startTransition] = useTransition();

  const supportedLanguages = options?.supportedLanguages ?? EXAMPLE_LANGUAGES;

  const preferredLang =
    searchParams.get("lang") ?? options?.examplesLanguage ?? "shell";

  const selectedLang =
    supportedLanguages.find((lang) => lang.value === preferredLang)?.value ??
    supportedLanguages.at(0)?.value ??
    "shell";

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
          className="py-px px-0.5"
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
  const selectedServer =
    globalSelectedServer || operation.servers.at(0)?.url || "";

  const httpSnippetCode = useMemo<string | undefined>(() => {
    const converted = options?.generateCodeSnippet?.({
      selectedLang,
      selectedServer,
      context,
      operation,
      example: currentExampleCode,
      auth,
    });

    if (converted) return converted;

    const snippet = createHttpSnippet({
      operation,
      selectedServer,
      exampleBody: currentExampleCode
        ? {
            mimeType: selectedContent?.mediaType ?? "application/json",
            text: JSON.stringify(currentExampleCode, null, 2),
          }
        : { mimeType: selectedContent?.mediaType ?? "application/json" },
    });

    return getConverted(snippet, selectedLang);
  }, [
    currentExampleCode,
    operation,
    selectedServer,
    selectedLang,
    selectedContent,
    options,
    auth,
    context,
  ]);

  const [ref, isOnScreen] = useOnScreen({ rootMargin: "200px 0px 200px 0px" });

  const showPlayground =
    isOnScreen &&
    (operation.extensions["x-explorer-enabled"] === true ||
      operation.extensions["x-zudoku-playground-enabled"] === true ||
      (operation.extensions["x-explorer-enabled"] === undefined &&
        operation.extensions["x-zudoku-playground-enabled"] === undefined &&
        !options?.disablePlayground));

  const hasResponseExamples = operation.responses.some((response) =>
    response.content?.some((content) => (content.examples?.length ?? 0) > 0),
  );

  return (
    <aside
      ref={ref}
      className="flex flex-col sticky top-(--scroll-padding) gap-4"
      data-pagefind-ignore="all"
    >
      <SidecarBox.Root>
        <SidecarBox.Head className="py-1.5">
          <div className="flex items-center flex-wrap gap-2 justify-between w-full">
            <span className="font-mono wrap-break-word leading-6 space-x-1">
              <Badge
                variant="outline"
                className={cn(
                  methodTextColor,
                  "px-1.5 rounded-md border-none bg-current/7 dark:bg-current/15",
                )}
              >
                {operation.method.toUpperCase()}
              </Badge>
              {path}
            </span>
            <div className="flex items-center gap-1">
              <NativeSelect
                className="py-0.5 h-fit max-w-32 truncate bg-background"
                value={selectedLang}
                onChange={(e) => {
                  startTransition(() => {
                    setSearchParams((prev) => {
                      prev.set("lang", e.target.value);
                      return prev;
                    });
                  });
                }}
              >
                {supportedLanguages.map((language) => (
                  <NativeSelectOption
                    key={language.value}
                    value={language.value}
                  >
                    {language.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {showPlayground && (
                <PlaygroundDialogWrapper
                  servers={operation.servers.map((server) => server.url)}
                  operation={operation}
                  examples={requestBodyContent ?? undefined}
                />
              )}
            </div>
          </div>
        </SidecarBox.Head>
        <SidecarBox.Body>
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

      {hasResponseExamples ? (
        <ResponsesSidecarBox
          isOnScreen={isOnScreen}
          shouldLazyHighlight={shouldLazyHighlight}
          selectedResponse={selectedResponse}
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
      ) : (
        <ResponsesSidecarBox
          isGenerated
          isOnScreen={isOnScreen}
          shouldLazyHighlight={shouldLazyHighlight}
          selectedResponse={selectedResponse}
          responses={operation.responses.map((response) => ({
            ...response,
            content: response.content?.map((content) => ({
              ...content,
              examples: content.schema
                ? [{ name: "", value: generateSchemaExample(content.schema) }]
                : content.examples,
            })),
          }))}
        />
      )}
    </aside>
  );
};
