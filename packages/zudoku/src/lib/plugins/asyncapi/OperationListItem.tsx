import { useMemo, useState } from "react";
import { NativeSelect, NativeSelectOption } from "zudoku/ui/NativeSelect.js";
import { Separator } from "zudoku/ui/Separator.js";
import { Heading } from "../../components/Heading.js";
import { Markdown } from "../../components/Markdown.js";
import { cn } from "../../util/cn.js";
import type { MediaTypeObject } from "../openapi/graphql/graphql.js";
import * as SidecarBox from "../openapi/SidecarBox.js";
import { SidecarExamples } from "../openapi/SidecarExamples.js";
import { MessageView } from "./components/MessageView.js";
import { OperationBadge } from "./components/OperationBadge.js";
import { ProtocolBadge } from "./components/ProtocolBadge.js";
import { useAsyncApiConfig } from "./context.js";
import type { MessageResult, OperationResult } from "./graphql/queries.js";

type OperationListItemProps = {
  operation: OperationResult;
  serverUrl?: string;
};

/**
 * Component for displaying a single AsyncAPI operation
 * Follows the same pattern as OpenAPI's OperationListItem
 */
export const OperationListItem = ({
  operation,
  serverUrl,
}: OperationListItemProps) => {
  const { options } = useAsyncApiConfig();
  const slug = operation.slug ?? operation.operationId;
  const summary = operation.summary ?? operation.operationId;

  return (
    <div>
      <div
        className={cn(
          "grid grid-cols-1 lg:grid-cols-[minmax(0,4fr)_minmax(0,3fr)] gap-x-8 gap-y-4 items-start",
        )}
      >
        <Heading
          level={2}
          id={slug}
          registerNavigationAnchor
          className="break-all col-span-full"
        >
          {summary}
        </Heading>

        {/* Action and Channel Address Row */}
        <div className="text-sm flex flex-wrap items-center gap-2 font-mono col-span-full">
          <OperationBadge action={operation.action} />
          {operation.protocols.map((protocol) => (
            <ProtocolBadge key={protocol} protocol={protocol} />
          ))}
          <div className="flex items-center gap-1 max-w-full truncate">
            {serverUrl && (
              <span className="text-neutral-400 dark:text-neutral-500 truncate">
                {serverUrl.replace(/\/$/, "")}
              </span>
            )}
            <span className="text-neutral-900 dark:text-neutral-200">
              {operation.channelAddress ?? ""}
            </span>
          </div>
        </div>

        {/* Main Content */}
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

          {/* Messages */}
          {operation.messages.length > 0 && (
            <>
              <Separator className="my-4" />
              <div>
                <Heading level={3} id={`${slug}/messages`}>
                  {operation.action === "send"
                    ? "Message to Send"
                    : "Message to Receive"}
                </Heading>
                <div className="mt-4 space-y-4">
                  {operation.messages.map((msg, idx) => (
                    <MessageView
                      key={msg.name ?? `message-${idx}`}
                      message={msg}
                      messageName={msg.name ?? msg.title ?? undefined}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {!options?.disableSidecar && (
          <div className="lg:sticky lg:top-4">
            <AsyncAPISidecar
              operation={operation}
              messages={operation.messages}
            />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Simple sidecar component showing message examples
 */
const AsyncAPISidecar = ({
  operation,
  messages,
}: {
  operation: OperationResult;
  messages: MessageResult[];
}) => {
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(0);
  const [selectedExampleIndex, setSelectedExampleIndex] = useState(0);
  const selectedMessage = messages[selectedMessageIndex];

  const payload = selectedMessage?.payload as
    | Record<string, unknown>
    | undefined;
  const content = useMemo<MediaTypeObject[]>(() => {
    if (!selectedMessage) return [];

    const messageExamples =
      selectedMessage.examples
        ?.map((example, index) => {
          const value = example.payload;
          if (value === undefined) return null;

          return {
            name: example.name ?? `Example ${index + 1}`,
            summary: example.summary ?? null,
            value,
          };
        })
        .filter((example): example is NonNullable<typeof example> =>
          Boolean(example),
        ) ?? [];

    const schemaExamples = [
      ...(Array.isArray(payload?.examples)
        ? (payload.examples as unknown[]).map((value, index) => ({
            name: `Schema example ${index + 1}`,
            summary: null,
            value,
          }))
        : []),
      ...(payload?.example !== undefined
        ? [{ name: "Schema example", summary: null, value: payload.example }]
        : []),
    ];

    const generatedExample = payload
      ? generateExampleFromSchema(payload)
      : undefined;

    const examples =
      messageExamples.length > 0
        ? messageExamples
        : schemaExamples.length > 0
          ? schemaExamples
          : generatedExample !== null && generatedExample !== undefined
            ? [
                {
                  name: "Generated example",
                  summary: "Auto-generated from payload schema",
                  value: generatedExample,
                },
              ]
            : [];

    return [
      {
        mediaType: selectedMessage.contentType ?? "application/json",
        examples,
      } as MediaTypeObject,
    ];
  }, [payload, selectedMessage]);

  const safeExampleIndex = Math.min(
    selectedExampleIndex,
    Math.max((content[0]?.examples?.length ?? 1) - 1, 0),
  );

  return (
    <div className="space-y-4">
      {/* Connection info */}
      <div className="rounded-lg border overflow-hidden">
        <div className="px-4 py-2.5 border-b bg-muted/50">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Connection
          </span>
        </div>
        <div className="p-4 space-y-3">
          {/* Protocols */}
          <div className="flex items-start gap-3">
            <span className="text-xs text-muted-foreground w-16 pt-0.5">
              Protocol
            </span>
            <div className="flex flex-wrap gap-1.5">
              {operation.protocols.length > 0 ? (
                operation.protocols.map((protocol) => (
                  <ProtocolBadge key={protocol} protocol={protocol} size="sm" />
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  Not specified
                </span>
              )}
            </div>
          </div>

          {/* Channel */}
          {operation.channelAddress && (
            <div className="flex items-start gap-3">
              <span className="text-xs text-muted-foreground w-16 pt-0.5">
                Channel
              </span>
              <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded break-all">
                {operation.channelAddress}
              </code>
            </div>
          )}

          {/* Action */}
          <div className="flex items-start gap-3">
            <span className="text-xs text-muted-foreground w-16 pt-0.5">
              Action
            </span>
            <OperationBadge action={operation.action} size="sm" />
          </div>
        </div>
      </div>

      {content.length > 0 &&
        content[0]?.examples &&
        content[0].examples.length > 0 && (
          <SidecarBox.Root>
            <SidecarBox.Head className="text-xs flex justify-between items-center">
              <span className="font-medium">Example Payload</span>
              {messages.length > 1 && (
                <NativeSelect
                  className="text-xs h-fit py-1 max-w-48 bg-background"
                  value={selectedMessageIndex.toString()}
                  onChange={(e) => {
                    setSelectedMessageIndex(Number(e.target.value));
                    setSelectedExampleIndex(0);
                  }}
                >
                  {messages.map((message, index) => {
                    const key = message.name ?? message.title ?? `msg-${index}`;
                    return (
                      <NativeSelectOption key={key} value={index.toString()}>
                        {message.title ??
                          message.name ??
                          message.summary ??
                          `Message ${index + 1}`}
                      </NativeSelectOption>
                    );
                  })}
                </NativeSelect>
              )}
            </SidecarBox.Head>
            <SidecarExamples
              content={content}
              selectedContentIndex={0}
              selectedExampleIndex={safeExampleIndex}
              onExampleChange={({ exampleIndex }) =>
                setSelectedExampleIndex(exampleIndex)
              }
              description={selectedMessage?.summary ?? undefined}
              isOnScreen
            />
          </SidecarBox.Root>
        )}
    </div>
  );
};

/**
 * Generate a simple example from a JSON Schema
 */
const generateExampleFromSchema = (
  schema: Record<string, unknown>,
): unknown => {
  if (!schema || typeof schema !== "object") return null;

  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;

  switch (schema.type) {
    case "object": {
      const properties = schema.properties as
        | Record<string, Record<string, unknown>>
        | undefined;
      if (!properties) return {};
      const result: Record<string, unknown> = {};
      for (const [key, prop] of Object.entries(properties)) {
        result[key] = generateExampleFromSchema(prop);
      }
      return result;
    }
    case "array": {
      const items = schema.items as Record<string, unknown> | undefined;
      if (!items) return [];
      return [generateExampleFromSchema(items)];
    }
    case "string": {
      const enumValues = schema.enum as unknown[] | undefined;
      return enumValues?.[0] ?? "string";
    }
    case "number":
    case "integer":
      return 0;
    case "boolean":
      return true;
    default:
      return null;
  }
};
