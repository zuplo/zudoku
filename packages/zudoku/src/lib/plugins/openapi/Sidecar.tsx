import { HTTPSnippet } from "@zudoku/httpsnippet";
import { Fragment, useMemo, useTransition } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "urql";
import { useSelectedServerStore } from "../../authentication/state.js";
import { TextColorMap } from "../../components/navigation/SidebarBadge.js";
import { SyntaxHighlight } from "../../components/SyntaxHighlight.js";
import type { SchemaObject } from "../../oas/parser/index.js";
import { cn } from "../../util/cn.js";
import { ColorizedParam } from "./ColorizedParam.js";
import { useOasConfig } from "./context.js";
import { graphql } from "./graphql/index.js";
import type { OperationListItemResult } from "./OperationList.js";
import { PlaygroundDialogWrapper } from "./PlaygroundDialogWrapper.js";
import { RequestBodySidecarBox } from "./RequestBodySidecarBox.js";
import { ResponsesSidecarBox } from "./ResponsesSidecarBox.js";
import * as SidecarBox from "./SidecarBox.js";
import { SimpleSelect } from "./SimpleSelect.js";
import { generateSchemaExample } from "./util/generateSchemaExample.js";

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

const context = { suspense: true };

const methodToColor = {
  get: TextColorMap.green,
  post: TextColorMap.blue,
  put: TextColorMap.yellow,
  delete: TextColorMap.red,
  patch: TextColorMap.purple,
  options: TextColorMap.indigo,
  head: TextColorMap.gray,
  trace: TextColorMap.gray,
};

export const Sidecar = ({
  operation,
  selectedResponse,
  onSelectResponse,
}: {
  operation: OperationListItemResult;
  selectedResponse?: string;
  onSelectResponse: (response: string) => void;
}) => {
  const oasConfig = useOasConfig();
  const [result] = useQuery({
    query: GetServerQuery,
    variables: oasConfig,
    context,
  });
  const methodTextColor =
    methodToColor[
      operation.method.toLocaleLowerCase() as keyof typeof methodToColor
    ] ?? TextColorMap.gray;

  const [searchParams, setSearchParams] = useSearchParams();
  const [, startTransition] = useTransition();

  const selectedLang = searchParams.get("lang") ?? "shell";

  const requestBodyContent = operation.requestBody?.content;

  const path = operation.path.split("/").map((part, i, arr) => {
    const isParam =
      (part.startsWith("{") && part.endsWith("}")) || part.startsWith(":");
    const paramName = isParam ? part.replace(/[:{}]/g, "") : undefined;

    return (
      // eslint-disable-next-line react/no-array-index-key
      <Fragment key={part + i}>
        {paramName ? (
          <ColorizedParam
            name={paramName}
            backgroundOpacity="0"
            // same as in `ParameterListItem`
            slug={`${operation.slug}-${paramName.toLocaleLowerCase()}`}
          >
            {part}
          </ColorizedParam>
        ) : (
          part
        )}
        {i < arr.length - 1 ? "/" : null}
        <wbr />
      </Fragment>
    );
  });

  const { selectedServer } = useSelectedServerStore();

  const code = useMemo(() => {
    const example = requestBodyContent?.[0]?.schema
      ? generateSchemaExample(requestBodyContent[0].schema as SchemaObject)
      : undefined;

    const snippet = new HTTPSnippet({
      method: operation.method.toLocaleUpperCase(),
      url:
        (selectedServer ?? result.data?.schema.url ?? "") +
        operation.path.replaceAll("{", ":").replaceAll("}", ""),
      postData: example
        ? {
            text: JSON.stringify(example, null, 2),
            mimeType: "application/json",
          }
        : ({} as any),
      headers: [],
      queryString: [],
      httpVersion: "",
      cookies: [],
      headersSize: 0,
      bodySize: 0,
    });

    return getConverted(snippet, selectedLang);
  }, [
    selectedServer,
    selectedLang,
    operation.method,
    operation.path,
    requestBodyContent,
  ]);

  return (
    <aside className="flex flex-col overflow-hidden sticky top-[--scroll-padding] gap-4">
      <SidecarBox.Root>
        <SidecarBox.Head className="flex justify-between items-center flex-nowrap py-3 gap-2 text-xs">
          <span className="font-mono break-words">
            <span className={cn("font-semibold", methodTextColor)}>
              {operation.method.toLocaleUpperCase()}
            </span>
            &nbsp;
            {path}
          </span>
          <PlaygroundDialogWrapper
            server={result.data?.schema.url ?? ""}
            servers={
              result.data?.schema.servers.map((server) => server.url) ?? []
            }
            operation={operation}
          />
        </SidecarBox.Head>
        <SidecarBox.Body className="max-h-[480px] p-0">
          <SyntaxHighlight
            language={selectedLang}
            noBackground
            className="text-xs p-2"
            code={code}
          />
        </SidecarBox.Body>
        <SidecarBox.Footer className="flex items-center text-xs gap-2 justify-end py-1">
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
            options={[
              { value: "shell", label: "cURL" },
              { value: "js", label: "Javascript" },
              { value: "python", label: "Python" },
              { value: "java", label: "Java" },
              { value: "go", label: "Go" },
              { value: "csharp", label: "C#" },
              { value: "kotlin", label: "Kotlin" },
              { value: "objc", label: "Objective C" },
              { value: "php", label: "PHP" },
              { value: "ruby", label: "Ruby" },
              { value: "swift", label: "Swift" },
            ]}
          />
        </SidecarBox.Footer>
      </SidecarBox.Root>
      {requestBodyContent && (
        <RequestBodySidecarBox content={requestBodyContent} />
      )}
      {operation.responses.length > 0 && (
        <ResponsesSidecarBox
          selectedResponse={selectedResponse}
          onSelectResponse={onSelectResponse}
          responses={operation.responses}
        />
      )}
    </aside>
  );
};
