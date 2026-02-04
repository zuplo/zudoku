import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { NativeSelect, NativeSelectOption } from "zudoku/ui/NativeSelect.js";
import { Heading } from "../../components/Heading.js";
import { cn } from "../../util/cn.js";
import type { MediaTypeObject } from "../openapi/graphql/graphql.js";
import * as SidecarBox from "../openapi/SidecarBox.js";
import { SidecarExamples } from "../openapi/SidecarExamples.js";
import { MessageView } from "./components/MessageView.js";
import { ProtocolBadge } from "./components/ProtocolBadge.js";
import { useAsyncApiConfig } from "./context.js";
import type { MessageResult, OperationResult } from "./graphql/queries.js";

export type ChannelGroupProps = {
  channelAddress: string;
  operations: OperationResult[];
  serverUrl?: string;
};

/**
 * Groups operations by channel, showing send and receive together
 */
export const ChannelGroup = ({
  channelAddress,
  operations,
  serverUrl,
}: ChannelGroupProps) => {
  const { options } = useAsyncApiConfig();

  // Use the first operation for common data
  const primaryOp = operations[0];
  if (!primaryOp) return null;

  const slug = primaryOp.slug ?? primaryOp.operationId;
  const protocols = primaryOp.protocols;
  const channelTitle = primaryOp.channelTitle;

  return (
    <div>
      <div
        className={cn(
          "grid grid-cols-1 lg:grid-cols-[minmax(0,4fr)_minmax(0,3fr)] gap-x-8 gap-y-4 items-start",
        )}
      >
        {/* Channel Header */}
        <Heading
          level={2}
          id={slug}
          registerNavigationAnchor
          className="break-all col-span-full"
        >
          {channelTitle ?? channelAddress}
        </Heading>

        {/* Protocol and Address Row */}
        <div className="text-sm flex flex-wrap items-center gap-2 font-mono col-span-full">
          {protocols.map((protocol) => (
            <ProtocolBadge key={protocol} protocol={protocol} />
          ))}
          <div className="flex items-center gap-1 max-w-full truncate">
            {serverUrl && (
              <span className="text-neutral-400 dark:text-neutral-500 truncate">
                {serverUrl.replace(/\/$/, "")}
              </span>
            )}
            <span className="text-neutral-900 dark:text-neutral-200">
              {channelAddress}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div
          className={cn(
            "flex flex-col gap-6",
            options?.disableSidecar && "col-span-full",
          )}
        >
          {/* Operations */}
          {operations.map((operation) => (
            <OperationSection
              key={operation.operationId}
              operation={operation}
              parentSlug={slug}
            />
          ))}
        </div>

        {/* Sidecar */}
        {!options?.disableSidecar && (
          <div className="lg:sticky lg:top-4">
            <ChannelSidecar
              channelAddress={channelAddress}
              protocols={protocols}
              operations={operations}
            />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Capitalize first letter of a string
 */
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Get icon for an action type
 */
const getActionIcon = (action: string) => {
  switch (action) {
    case "send":
      return <ArrowUpIcon size={16} />;
    case "receive":
      return <ArrowDownIcon size={16} />;
    default:
      return null;
  }
};

/**
 * Get color classes for an action type
 */
const getActionColors = (action: string) => {
  switch (action) {
    case "send":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300";
    case "receive":
      return "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300";
  }
};

/**
 * Section for a single operation within a channel
 */
const OperationSection = ({
  operation,
  parentSlug,
}: {
  operation: OperationResult;
  parentSlug: string;
}) => {
  const sectionId = `${parentSlug}/${operation.action}`;
  const label = capitalize(operation.action);
  const icon = getActionIcon(operation.action);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-muted/30 border-b">
        <Heading
          level={3}
          id={sectionId}
          registerNavigationAnchor
          className="flex items-center gap-2 text-base font-semibold"
        >
          {icon && (
            <span
              className={cn("p-1 rounded", getActionColors(operation.action))}
            >
              {icon}
            </span>
          )}
          {label}
          {operation.summary && (
            <span className="font-normal text-muted-foreground">
              — {operation.summary}
            </span>
          )}
        </Heading>
      </div>

      <div className="p-4 space-y-4">
        {/* Messages */}
        {operation.messages.length > 0 && (
          <div className="space-y-3">
            {operation.messages.map((msg, idx) => (
              <MessageView
                key={msg.name ?? `message-${idx}`}
                message={msg}
                messageName={msg.name ?? msg.title ?? undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Sidecar showing connection info and examples for the channel
 */
const ChannelSidecar = ({
  channelAddress,
  protocols,
  operations,
}: {
  channelAddress: string;
  protocols: string[];
  operations: OperationResult[];
}) => {
  // Collect all messages from all operations
  const allMessages = useMemo(() => {
    const messages: Array<{
      message: MessageResult;
      action: string;
      label: string;
    }> = [];

    operations.forEach((op) => {
      op.messages.forEach((msg) => {
        messages.push({
          message: msg,
          action: op.action,
          label: `${capitalize(op.action)}: ${msg.title ?? msg.name ?? "Message"}`,
        });
      });
    });

    return messages;
  }, [operations]);

  const [selectedMessageIndex, setSelectedMessageIndex] = useState(0);
  const [selectedExampleIndex, setSelectedExampleIndex] = useState(0);

  const selectedItem = allMessages[selectedMessageIndex];
  const selectedMessage = selectedItem?.message;

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
              {protocols.length > 0 ? (
                protocols.map((protocol) => (
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
          <div className="flex items-start gap-3">
            <span className="text-xs text-muted-foreground w-16 pt-0.5">
              Channel
            </span>
            <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded break-all">
              {channelAddress}
            </code>
          </div>

          {/* Operations */}
          <div className="flex items-start gap-3">
            <span className="text-xs text-muted-foreground w-16 pt-0.5">
              Actions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {operations.map((op) => {
                const icon =
                  op.action === "send" ? (
                    <ArrowUpIcon size={12} />
                  ) : op.action === "receive" ? (
                    <ArrowDownIcon size={12} />
                  ) : null;
                return (
                  <span
                    key={op.operationId}
                    className={cn(
                      "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded",
                      getActionColors(op.action),
                    )}
                  >
                    {icon}
                    {capitalize(op.action)}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Message Examples */}
      {content.length > 0 &&
        content[0]?.examples &&
        content[0].examples.length > 0 && (
          <SidecarBox.Root>
            <SidecarBox.Head className="text-xs flex justify-between items-center">
              <span className="font-medium">Example Payload</span>
              {allMessages.length > 1 && (
                <NativeSelect
                  className="text-xs h-fit py-1 max-w-48 bg-background"
                  value={selectedMessageIndex.toString()}
                  onChange={(e) => {
                    setSelectedMessageIndex(Number(e.target.value));
                    setSelectedExampleIndex(0);
                  }}
                >
                  {allMessages.map((item, index) => (
                    <NativeSelectOption
                      key={`${item.action}-${item.message.name ?? index}`}
                      value={index.toString()}
                    >
                      {item.label}
                    </NativeSelectOption>
                  ))}
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

/**
 * Utility to group operations by channel address
 */
export const groupOperationsByChannel = (
  operations: OperationResult[],
): Map<string, OperationResult[]> => {
  const groups = new Map<string, OperationResult[]>();

  for (const op of operations) {
    const address = op.channelAddress ?? "unknown";
    const existing = groups.get(address) ?? [];
    groups.set(address, [...existing, op]);
  }

  return groups;
};
