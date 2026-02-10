import { useMemo, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
} from "zudoku/icons";
import { Separator } from "zudoku/ui/Separator.js";
import { Heading } from "../../components/Heading.js";
import { Markdown } from "../../components/Markdown.js";
import { SyntaxHighlight } from "../../ui/SyntaxHighlight.js";
import { cn } from "../../util/cn.js";
import { useCopyToClipboard } from "../../util/useCopyToClipboard.js";
import * as SidecarBox from "../openapi/SidecarBox.js";
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
 * Sidecar component showing messages in a flat list
 */
const AsyncAPISidecar = ({
  operation,
  messages,
}: {
  operation: OperationResult;
  messages: MessageResult[];
}) => {
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
                  <ProtocolBadge key={protocol} protocol={protocol} />
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

      {/* Messages list */}
      {messages.length > 0 && (
        <SidecarBox.Root>
          <SidecarBox.Head className="text-xs">
            <span className="font-medium">Messages</span>
          </SidecarBox.Head>
          <SidecarBox.Body className="p-0">
            <div className="divide-y divide-border">
              {messages.map((message, index) => (
                <MessageListItem
                  key={message.name ?? message.title ?? `msg-${index}`}
                  message={message}
                  action={operation.action}
                />
              ))}
            </div>
          </SidecarBox.Body>
        </SidecarBox.Root>
      )}
    </div>
  );
};

/**
 * Individual message item in the flat list
 */
const MessageListItem = ({
  message,
  action,
}: {
  message: MessageResult;
  action: "send" | "receive";
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, copyToClipboard] = useCopyToClipboard();

  const payload = message.payload as Record<string, unknown> | undefined;
  const example = useMemo(() => {
    // Try message examples first
    const messageExample = message.examples?.[0]?.payload;
    if (messageExample !== undefined) return messageExample;

    // Try schema examples
    if (Array.isArray(payload?.examples) && payload.examples.length > 0) {
      return payload.examples[0];
    }
    if (payload?.example !== undefined) return payload.example;

    // Generate from schema
    return payload ? generateExampleFromSchema(payload) : null;
  }, [message.examples, payload]);

  const exampleJson = example ? JSON.stringify(example, null, 2) : null;

  const messageName =
    message.title ?? message.name ?? message.summary ?? "Message";

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (exampleJson) {
      copyToClipboard(exampleJson);
    }
  };

  return (
    <div className="bg-background">
      <button
        type="button"
        className="w-full px-3 py-2.5 text-left flex items-center gap-2 hover:bg-accent/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Direction indicator */}
        <span
          className={cn(
            "flex items-center justify-center w-5 h-5 rounded-full shrink-0",
            action === "send"
              ? "bg-orange-500/20 text-orange-600 dark:text-orange-400"
              : "bg-green-500/20 text-green-600 dark:text-green-400",
          )}
        >
          {action === "send" ? (
            <ArrowUpIcon size={12} />
          ) : (
            <ArrowDownIcon size={12} />
          )}
        </span>

        {/* Message title */}
        <span className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">
          {messageName}
        </span>

        {/* Actions */}
        <ChevronDownIcon
          size={14}
          className={cn(
            "text-muted-foreground transition-transform shrink-0",
            isExpanded && "rotate-180",
          )}
        />
        <button
          type="button"
          className="p-1 hover:bg-accent rounded shrink-0"
          onClick={handleCopy}
          title="Copy to clipboard"
        >
          {isCopied ? (
            <CheckIcon size={14} className="text-green-500" />
          ) : (
            <CopyIcon size={14} className="text-muted-foreground" />
          )}
        </button>
      </button>

      {/* Expanded content */}
      {isExpanded && exampleJson && (
        <div className="px-3 pb-3 pt-0">
          <SyntaxHighlight
            embedded
            language="json"
            className="[--scrollbar-color:gray] rounded max-h-48 text-xs overflow-auto"
            code={exampleJson}
          />
        </div>
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
