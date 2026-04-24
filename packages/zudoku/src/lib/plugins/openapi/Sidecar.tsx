import { ShieldCheckIcon, ShieldCogCornerIcon } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "react-router";
import { Button } from "zudoku/components";
import { useZudoku } from "zudoku/hooks";
import { Badge } from "zudoku/ui/Badge.js";
import { NativeSelect, NativeSelectOption } from "zudoku/ui/NativeSelect.js";
import { Popover, PopoverContent, PopoverTrigger } from "zudoku/ui/Popover.js";
import { SyntaxHighlight } from "zudoku/ui/SyntaxHighlight.js";
import { useAuthState } from "../../authentication/state.js";
import { useApiIdentities } from "../../components/context/ZudokuContext.js";
import { PathRenderer } from "../../components/PathRenderer.js";
import { cn } from "../../util/cn.js";
import { useOnScreen } from "../../util/useOnScreen.js";
import { ColorizedParam } from "./ColorizedParam.js";
import { NonHighlightedCode } from "./components/NonHighlightedCode.js";
import { useOasConfig } from "./context.js";
import { GeneratedExampleSidecarBox } from "./GeneratedExampleSidecarBox.js";
import type { OperationsFragmentFragment } from "./graphql/graphql.js";
import { graphql } from "./graphql/index.js";
import { AuthorizeDialog } from "./playground/AuthorizeDialog.js";
import { NO_IDENTITY, SECURITY_SCHEME_PREFIX } from "./playground/constants.js";
import IdentitySelector from "./playground/IdentitySelector.js";
import { useIdentityStore } from "./playground/rememberedIdentity.js";
import { useSecurityCredentialsStore } from "./playground/securityCredentialsStore.js";
import { PlaygroundDialogWrapper } from "./PlaygroundDialogWrapper.js";
import { RequestBodySidecarBox } from "./RequestBodySidecarBox.js";
import { ResponsesSidecarBox } from "./ResponsesSidecarBox.js";
import * as SidecarBox from "./SidecarBox.js";
import { createHttpSnippet, getConverted } from "./util/createHttpSnippet.js";
import { extractOperationSecuritySchemes } from "./util/extractOperationSecuritySchemes.js";
import { generateSchemaExample } from "./util/generateSchemaExample.js";
import { methodForColor } from "./util/methodToColor.js";
import { useResolvedAuth } from "./util/useResolvedAuth.js";

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

type CodeSample = {
  lang: string;
  label?: string;
  source: string;
};

const isCodeSample = (sample: unknown): sample is CodeSample => {
  if (typeof sample !== "object" || sample === null) return false;

  const { lang, label, source } = sample as {
    lang?: unknown;
    label?: unknown;
    source?: unknown;
  };

  return (
    typeof lang === "string" &&
    typeof source === "string" &&
    (label === undefined || typeof label === "string")
  );
};

const getCodeSamples = (
  extensions: Record<string, unknown> | null | undefined,
): CodeSample[] | undefined => {
  const samples =
    extensions?.["x-code-samples"] ?? extensions?.["x-codeSamples"];
  if (!Array.isArray(samples) || samples.length === 0) return undefined;

  const validSamples = samples.filter(isCodeSample);
  return validSamples.length > 0 ? validSamples : undefined;
};

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

  const codeSamples = getCodeSamples(operation.extensions);

  const supportedLanguages = codeSamples
    ? codeSamples.map((sample) => ({
        value: sample.lang,
        label: sample.label ?? sample.lang,
      }))
    : (options?.supportedLanguages ?? EXAMPLE_LANGUAGES);

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

  const securitySchemes = useMemo(
    () =>
      options?.disableSecurity
        ? []
        : extractOperationSecuritySchemes(operation),
    [operation, options?.disableSecurity],
  );

  const identities = useApiIdentities();
  const rememberedIdentity = useIdentityStore((s) => s.rememberedIdentity);
  const setRememberedIdentity = useIdentityStore(
    (s) => s.setRememberedIdentity,
  );
  const securityCredentials = useSecurityCredentialsStore((s) => s.credentials);

  const identityList = useMemo(() => identities.data ?? [], [identities.data]);

  const resolvedAuth = useResolvedAuth({
    operation,
    identityId: rememberedIdentity,
    identities: identityList,
  });

  const inapplicableSchemeName = useMemo(() => {
    if (!rememberedIdentity?.startsWith(SECURITY_SCHEME_PREFIX)) return;
    const name = rememberedIdentity.slice(SECURITY_SCHEME_PREFIX.length);
    return securitySchemes.some((s) => s.name === name) ? undefined : name;
  }, [rememberedIdentity, securitySchemes]);

  const hasAuthOptions = securitySchemes.length > 0 || identityList.length > 0;
  const [authPopoverOpen, setAuthPopoverOpen] = useState(false);
  const [authorizeSchemeName, setAuthorizeSchemeName] = useState<
    string | undefined
  >();

  const hasResolvedAuth =
    resolvedAuth.headers.length > 0 || resolvedAuth.queryString.length > 0;

  const httpSnippetCode = useMemo<string | undefined>(() => {
    if (codeSamples && !hasResolvedAuth) {
      const match = codeSamples.find((s) => s.lang === selectedLang);
      return match?.source;
    }

    const converted = options?.generateCodeSnippet?.({
      selectedLang,
      selectedServer,
      context,
      operation,
      example: currentExampleCode,
      auth,
      resolvedAuth,
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
      resolvedAuth,
    });

    return getConverted(snippet, selectedLang);
  }, [
    codeSamples,
    currentExampleCode,
    operation,
    selectedServer,
    selectedLang,
    selectedContent,
    options,
    auth,
    context,
    resolvedAuth,
    hasResolvedAuth,
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
            {showPlayground && (
              <PlaygroundDialogWrapper
                servers={operation.servers.map((server) => server.url)}
                operation={operation}
                examples={requestBodyContent ?? undefined}
              />
            )}
          </div>
        </SidecarBox.Head>
        <SidecarBox.Body>
          {shouldLazyHighlight && !isOnScreen ? (
            <NonHighlightedCode code={httpSnippetCode ?? ""} />
          ) : (
            <SyntaxHighlight
              embedded
              language={selectedLang}
              showLanguageIndicator={false}
              className="[--scrollbar-color:gray] rounded-none text-xs max-h-[200px]"
              // biome-ignore lint/style/noNonNullAssertion: code is guaranteed to be defined
              code={httpSnippetCode!}
            />
          )}
        </SidecarBox.Body>
        <SidecarBox.Footer className="text-xs self-end flex justify-between items-center gap-2">
          <NativeSelect
            className="text-xs h-fit py-1 max-w-32 truncate bg-background"
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
              <NativeSelectOption key={language.value} value={language.value}>
                {language.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {hasAuthOptions && (
            <Popover open={authPopoverOpen} onOpenChange={setAuthPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Select authentication"
                >
                  {hasResolvedAuth ? (
                    <ShieldCheckIcon className="size-4 text-green-600" />
                  ) : (
                    <ShieldCogCornerIcon className="size-4 text-muted-foreground" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="p-0 w-76 overflow-hidden">
                <div className="px-4 py-2.5 text-xs text-muted-foreground border-b bg-muted/40">
                  Selection syncs across endpoints that support it.
                </div>
                {inapplicableSchemeName && (
                  <div className="px-4 py-2.5 text-xs text-muted-foreground border-b bg-amber-500/10">
                    Selected <code>{inapplicableSchemeName}</code> isn't
                    supported for this endpoint.
                  </div>
                )}
                <IdentitySelector
                  value={
                    inapplicableSchemeName
                      ? NO_IDENTITY
                      : (rememberedIdentity ?? NO_IDENTITY)
                  }
                  identities={identityList}
                  setValue={(value) => {
                    setRememberedIdentity(value);
                    if (value.startsWith(SECURITY_SCHEME_PREFIX)) {
                      const schemeName = value.slice(
                        SECURITY_SCHEME_PREFIX.length,
                      );
                      if (!securityCredentials[schemeName]?.isAuthorized) {
                        setAuthPopoverOpen(false);
                        setAuthorizeSchemeName(schemeName);
                      }
                    }
                  }}
                  securitySchemes={
                    securitySchemes.length > 0 ? securitySchemes : undefined
                  }
                  securityCredentials={securityCredentials}
                  onConfigureScheme={(name) => {
                    setAuthPopoverOpen(false);
                    setAuthorizeSchemeName(name);
                  }}
                />
              </PopoverContent>
            </Popover>
          )}
          {authorizeSchemeName && (
            <AuthorizeDialog
              securitySchemes={securitySchemes.filter(
                (s) => s.name === authorizeSchemeName,
              )}
              open={Boolean(authorizeSchemeName)}
              onOpenChange={(open) => {
                if (!open) setAuthorizeSchemeName(undefined);
              }}
            />
          )}
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
