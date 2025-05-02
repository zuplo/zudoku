import { useSuspenseQuery } from "@tanstack/react-query";
import { HTTPSnippet } from "@zudoku/httpsnippet";
import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "react-router";
import { useZudoku } from "zudoku/components";
import { useAuthState } from "../../authentication/state.js";
import { PathRenderer } from "../../components/PathRenderer.js";
import type { SchemaObject } from "../../oas/parser/index.js";
import { SyntaxHighlight } from "../../ui/SyntaxHighlight.js";
import { cn } from "../../util/cn.js";
import { useOnScreen } from "../../util/useOnScreen.js";
import { useCreateQuery } from "./client/useCreateQuery.js";
import { CollapsibleCode } from "./CollapsibleCode.js";
import { ColorizedParam } from "./ColorizedParam.js";
import { useOasConfig } from "./context.js";
import { graphql } from "./graphql/index.js";
import type { OperationListItemResult } from "./OperationList.js";
import { PlaygroundDialogWrapper } from "./PlaygroundDialogWrapper.js";
import { RequestBodySidecarBox } from "./RequestBodySidecarBox.js";
import { ResponsesSidecarBox } from "./ResponsesSidecarBox.js";
import * as SidecarBox from "./SidecarBox.js";
import { SimpleSelect } from "./SimpleSelect.js";
import { useSelectedServer } from "./state.js";
import { generateSchemaExample } from "./util/generateSchemaExample.js";
import { methodForColor } from "./util/methodToColor.js";

const getConverted = (snippet: HTTPSnippet, option: string) => {
  let converted;
  switch (option) {
    case "shell":
      converted = snippet.convert("shell", "curl");
      break;
    case "js":
      converted = snippet.convert("javascript", "fetch");
      break;
    case "python":
      converted = snippet.convert("python", "requests");
      break;
    case "java":
      converted = snippet.convert("java", "okhttp");
      break;
    case "go":
      converted = snippet.convert("go", "native");
      break;
    case "csharp":
      converted = snippet.convert("csharp", "httpclient");
      break;
    case "kotlin":
      converted = snippet.convert("kotlin", "okhttp");
      break;
    case "objc":
      converted = snippet.convert("objc", "nsurlsession");
      break;
    case "php":
      converted = snippet.convert("php", "http2");
      break;
    case "ruby":
      converted = snippet.convert("ruby");
      break;
    case "swift":
      converted = snippet.convert("swift");
      break;
    default:
      converted = snippet.convert("shell");
      break;
  }

  return converted ? converted[0] : "";
};

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
}: {
  operation: OperationListItemResult;
  selectedResponse?: string;
  onSelectResponse: (response: string) => void;
}) => {
  const { input, type, options } = useOasConfig();
  const auth = useAuthState();
  const query = useCreateQuery(GetServerQuery, { input, type });
  const result = useSuspenseQuery(query);
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

  const { selectedServer } = useSelectedServer(result.data.schema.servers);

  const code = useMemo(() => {
    const example =
      selectedExample ??
      (transformedRequestBodyContent?.[0]?.schema
        ? generateSchemaExample(
            transformedRequestBodyContent[0].schema as SchemaObject,
          )
        : undefined);

    const snippet = new HTTPSnippet({
      method: operation.method.toLocaleUpperCase(),
      url:
        selectedServer +
        operation.path.replaceAll("{", ":").replaceAll("}", ""),
      postData: example
        ? {
            text: JSON.stringify(example, null, 2),
            mimeType: "application/json",
          }
        : ({} as any),
      headers: [{ name: "Content-Type", value: "application/json" }],
      queryString: [],
      httpVersion: "",
      cookies: [],
      headersSize: 0,
      bodySize: 0,
    });

    return getConverted(snippet, selectedLang);
  }, [
    selectedExample,
    transformedRequestBodyContent,
    operation.method,
    operation.path,
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
      className="flex flex-col overflow-hidden sticky top-[--scroll-padding] gap-4"
      data-pagefind-ignore="all"
    >
      <SidecarBox.Root>
        <SidecarBox.Head className="flex justify-between items-center flex-nowrap py-2.5 gap-2 text-xs">
          <span className="font-mono break-words leading-6">
            <span className={cn("font-semibold", methodTextColor)}>
              {operation.method.toLocaleUpperCase()}
            </span>
            &nbsp;
            {path}
          </span>
          {showPlayground && (
            <PlaygroundDialogWrapper
              servers={result.data.schema.servers.map((server) => server.url)}
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
                  language={selectedLang}
                  noBackground
                  className="[--scrollbar-color:gray] text-xs max-h-[500px] p-2"
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
