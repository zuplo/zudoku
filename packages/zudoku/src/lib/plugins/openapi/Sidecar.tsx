import { CheckIcon, CopyIcon } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "react-router";
import { useZudoku } from "zudoku/hooks";
import { Button } from "zudoku/ui/Button.js";
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
import { useSecurityState } from "./state/securityState.js";
import { generateAuthHeader } from "./util/authHelpers.js";
import { createHttpSnippet, getConverted } from "./util/createHttpSnippet.js";
import { generateSchemaExample } from "./util/generateSchemaExample.js";
import { methodForColor } from "./util/methodToColor.js";

const CodeWithMasking = ({
  displayCode,
  copyCode,
  language,
}: {
  displayCode: string;
  copyCode: string;
  language: string;
}) => {
  const [isCopied, setIsCopied] = useState(false);

  return (
    <div className="code-block-wrapper relative group bg-muted/50">
      <SyntaxHighlight
        embedded
        language={language}
        noBackground
        className="[--scrollbar-color:gray] rounded-none text-xs max-h-[500px]"
        code={displayCode}
      />
      <span className="absolute top-1.5 end-3 !text-[11px] font-mono text-muted-foreground transition group-hover:opacity-0">
        {language}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Copy code"
        title="Copy code"
        className="absolute top-2 end-2 p-2 transition hover:shadow-xs active:shadow-none active:inset-shadow-xs hover:outline outline-border rounded-md text-sm text-muted-foreground opacity-0 group-hover:opacity-100"
        disabled={isCopied}
        onClick={() => {
          setIsCopied(true);
          void navigator.clipboard.writeText(copyCode);
          setTimeout(() => setIsCopied(false), 2000);
        }}
      >
        {isCopied ? (
          <CheckIcon
            className="text-emerald-600"
            size={16}
            strokeWidth={2.5}
            absoluteStrokeWidth
          />
        ) : (
          <CopyIcon size={16} />
        )}
      </Button>
    </div>
  );
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

  // Get selected auth for this operation (using slug to match AuthorizationList)
  // Use Zustand selector to reactively subscribe to changes
  const selectedAuth = useSecurityState(
    (state) => state.selectedSchemes[operation.slug],
  );

  // Also subscribe to credentials to get real-time updates
  const credentials = useSecurityState((state) => state.credentials);

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
  const selectedServer =
    globalSelectedServer || operation.servers.at(0)?.url || "";

  const { displayCode, copyCode } = useMemo(() => {
    const exampleBody =
      selectedExample ??
      (transformedRequestBodyContent?.[0]?.schema
        ? generateSchemaExample(
            transformedRequestBodyContent[0].schema as SchemaObject,
          )
        : undefined);

    // Generate auth header based on selected security scheme
    // Use the latest credential value from the credentials store
    const credentialValue = selectedAuth
      ? credentials[selectedAuth.name]
      : undefined;

    // Generate real auth header for copying
    const realAuthHeader = generateAuthHeader(
      selectedAuth ?? null,
      credentialValue,
    );

    // Generate masked auth header for display
    const maskedValue = "••••••••";
    const maskedAuthHeader = realAuthHeader
      ? {
          ...realAuthHeader,
          value: realAuthHeader.value.replace(/[^:\s]+/g, (match) => {
            // Don't mask prefixes like "Bearer ", "Basic ", etc.
            if (match.match(/^(Bearer|Basic|Digest|OAuth)$/i)) return match;
            // For Cookie header, mask values after "="
            if (realAuthHeader.name === "Cookie") {
              return match.replace(/=([^;]+)/g, `=${maskedValue}`);
            }
            // Mask the actual credential value
            return maskedValue;
          }),
        }
      : undefined;

    const realSnippet = createHttpSnippet({
      operation,
      selectedServer,
      exampleBody: exampleBody
        ? {
            mimeType: "application/json",
            text: JSON.stringify(exampleBody, null, 2),
          }
        : { mimeType: "application/json" },
      authHeader: realAuthHeader,
    });

    const maskedSnippet = createHttpSnippet({
      operation,
      selectedServer,
      exampleBody: exampleBody
        ? {
            mimeType: "application/json",
            text: JSON.stringify(exampleBody, null, 2),
          }
        : { mimeType: "application/json" },
      authHeader: maskedAuthHeader,
    });

    return {
      displayCode: getConverted(maskedSnippet, selectedLang),
      copyCode: getConverted(realSnippet, selectedLang),
    };
  }, [
    selectedExample,
    transformedRequestBodyContent,
    operation,
    selectedServer,
    selectedLang,
    selectedAuth,
    credentials,
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
                <CodeWithMasking
                  displayCode={displayCode!}
                  copyCode={copyCode!}
                  language={selectedLang}
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
