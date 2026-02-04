import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { NativeSelect, NativeSelectOption } from "zudoku/ui/NativeSelect.js";
import { Heading } from "../../components/Heading.js";
import { Markdown } from "../../components/Markdown.js";
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

  const sendOp = operations.find((op) => op.action === "send");
  const receiveOp = operations.find((op) => op.action === "receive");

  // Use the first operation for common data
  const primaryOp = sendOp ?? receiveOp;
  if (!primaryOp) return null;

  const slug = primaryOp.slug ?? primaryOp.operationId;
  const protocols = primaryOp.protocols;
  const channelTitle = primaryOp.channelTitle;

  // Combine descriptions from both operations if different
  const description = sendOp?.description || receiveOp?.description;

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
          {description && (
            <Markdown
              className="max-w-full prose-img:max-w-prose"
              content={description}
            />
          )}

          {/* Send Operation */}
          {sendOp && (
            <OperationSection
              operation={sendOp}
              parentSlug={slug}
              icon={<ArrowUpIcon size={16} />}
              label="Send"
              messageLabel="Message to Send"
            />
          )}

          {/* Receive Operation */}
          {receiveOp && (
            <OperationSection
              operation={receiveOp}
              parentSlug={slug}
              icon={<ArrowDownIcon size={16} />}
              label="Receive"
              messageLabel="Message to Receive"
            />
          )}
        </div>

        {/* Sidecar */}
        {!options?.disableSidecar && (
          <div className="lg:sticky lg:top-4">
            <ChannelSidecar
              channelAddress={channelAddress}
              protocols={protocols}
              sendOp={sendOp}
              receiveOp={receiveOp}
            />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Section for a single operation (send or receive) within a channel
 */
const OperationSection = ({
  operation,
  parentSlug,
  icon,
  label,
  messageLabel,
}: {
  operation: OperationResult;
  parentSlug: string;
  icon: React.ReactNode;
  label: string;
  messageLabel: string;
}) => {
  const sectionId = `${parentSlug}/${operation.action}`;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-muted/30 border-b">
        <Heading
          level={3}
          id={sectionId}
          registerNavigationAnchor
          className="flex items-center gap-2 text-base font-semibold"
        >
          <span
            className={cn(
              "p-1 rounded",
              operation.action === "send"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
            )}
          >
            {icon}
          </span>
          {label}
          {operation.summary && (
            <span className="font-normal text-muted-foreground">
              — {operation.summary}
            </span>
          )}
        </Heading>
      </div>

      <div className="p-4 space-y-4">
        {operation.description &&
          operation.description !== operation.summary && (
            <Markdown
              className="text-sm text-muted-foreground"
              content={operation.description}
            />
          )}

        {/* Messages */}
        {operation.messages.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              {messageLabel}
            </h4>
            <div className="space-y-3">
              {operation.messages.map((msg, idx) => (
                <MessageView
                  key={msg.name ?? `message-${idx}`}
                  message={msg}
                  messageName={msg.name ?? msg.title ?? undefined}
                />
              ))}
            </div>
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
  sendOp,
  receiveOp,
}: {
  channelAddress: string;
  protocols: string[];
  sendOp?: OperationResult;
  receiveOp?: OperationResult;
}) => {
  // Collect all messages from both operations
  const allMessages = useMemo(() => {
    const messages: Array<{
      message: MessageResult;
      action: "send" | "receive";
      label: string;
    }> = [];

    sendOp?.messages.forEach((msg) => {
      messages.push({
        message: msg,
        action: "send",
        label: `Send: ${msg.title ?? msg.name ?? "Message"}`,
      });
    });

    receiveOp?.messages.forEach((msg) => {
      messages.push({
        message: msg,
        action: "receive",
        label: `Receive: ${msg.title ?? msg.name ?? "Message"}`,
      });
    });

    return messages;
  }, [sendOp, receiveOp]);

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
              {sendOp && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  <ArrowUpIcon size={12} />
                  Send
                </span>
              )}
              {receiveOp && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                  <ArrowDownIcon size={12} />
                  Receive
                </span>
              )}
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
