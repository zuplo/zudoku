import { useMemo, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "zudoku/icons";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "zudoku/ui/Collapsible.js";
import type { MessageObject } from "../../../asyncapi/types.js";
import { Heading } from "../../../components/Heading.js";
import { Markdown } from "../../../components/Markdown.js";
import { cn } from "../../../util/cn.js";
import type { OperationResult } from "../graphql/queries.js";
import { ProtocolBadge } from "./ProtocolBadge.js";

/**
 * Represents a flattened message from oneOf/anyOf expansion
 */
type FlattenedMessage = {
  title: string;
  description?: string;
  payload: Record<string, unknown>;
  originalMessage: MessageObject;
};

type ChannelOperation = {
  action: "send" | "receive";
  operationId: string;
  summary?: string;
  description?: string;
  messages: MessageObject[];
};

type ChannelViewProps = {
  channelAddress: string;
  channelDescription?: string;
  operations: ChannelOperation[];
  protocols: string[];
  serverUrl?: string;
};

/**
 * Flatten messages - expand oneOf/anyOf schemas into individual message items
 */
const flattenMessages = (ops: ChannelOperation[]): FlattenedMessage[] => {
  const result: FlattenedMessage[] = [];

  for (const op of ops) {
    for (const msg of op.messages) {
      const payload = msg.payload as Record<string, unknown> | undefined;

      // Check if payload has oneOf or anyOf
      if (payload?.oneOf && Array.isArray(payload.oneOf)) {
        // Expand oneOf into individual messages
        for (const option of payload.oneOf as Array<Record<string, unknown>>) {
          const title =
            (option.title as string) ?? msg.title ?? msg.name ?? "Message";
          result.push({
            title,
            description:
              (option.description as string) ?? msg.description ?? undefined,
            payload: option,
            originalMessage: msg,
          });
        }
      } else if (payload?.anyOf && Array.isArray(payload.anyOf)) {
        // Expand anyOf into individual messages
        for (const option of payload.anyOf as Array<Record<string, unknown>>) {
          const title =
            (option.title as string) ?? msg.title ?? msg.name ?? "Message";
          result.push({
            title,
            description:
              (option.description as string) ?? msg.description ?? undefined,
            payload: option,
            originalMessage: msg,
          });
        }
      } else {
        // Regular message without oneOf/anyOf
        result.push({
          title: msg.title ?? msg.name ?? "Message",
          description: msg.description ?? undefined,
          payload: payload ?? {},
          originalMessage: msg,
        });
      }
    }
  }

  return result;
};

/**
 * Component for displaying a channel with grouped Send/Receive operations
 */
export const ChannelView = ({
  channelAddress,
  channelDescription,
  operations,
  protocols,
  serverUrl,
}: ChannelViewProps) => {
  const [selectedMessage, setSelectedMessage] = useState<{
    message: FlattenedMessage;
    action: "send" | "receive";
  } | null>(null);

  const sendOperations = useMemo(
    () => operations.filter((op) => op.action === "send"),
    [operations],
  );
  const receiveOperations = useMemo(
    () => operations.filter((op) => op.action === "receive"),
    [operations],
  );

  // Collect all messages grouped by action (with oneOf/anyOf flattened)
  const sendMessages = useMemo(
    () => flattenMessages(sendOperations),
    [sendOperations],
  );
  const receiveMessages = useMemo(
    () => flattenMessages(receiveOperations),
    [receiveOperations],
  );

  const channelTitle =
    channelAddress?.split("/").pop() ??
    channelAddress?.replace(/^\//, "") ??
    "Channel";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6">
      {/* Main Content */}
      <div>
        <Heading level={2} id={channelAddress} registerNavigationAnchor>
          {channelTitle.charAt(0).toUpperCase() + channelTitle.slice(1)}
        </Heading>

        {channelDescription && (
          <Markdown
            className="text-muted-foreground mt-2 mb-4"
            content={channelDescription}
          />
        )}

        {/* Server URL Bar */}
        <div className="flex items-center gap-2 p-3 rounded-lg border bg-card mb-6">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {protocols.map((protocol) => (
              <ProtocolBadge key={protocol} protocol={protocol} />
            ))}
            <code className="text-sm font-mono truncate">
              {serverUrl && (
                <span className="text-muted-foreground">
                  {serverUrl.replace(/\/$/, "")}
                </span>
              )}
              <span className="text-foreground font-medium">
                {channelAddress}
              </span>
            </code>
          </div>
        </div>

        {/* Send Section */}
        {sendMessages.length > 0 && (
          <OperationSection
            action="send"
            messages={sendMessages}
            onMessageSelect={(msg) =>
              setSelectedMessage({ message: msg, action: "send" })
            }
            selectedMessage={
              selectedMessage?.action === "send"
                ? selectedMessage.message
                : null
            }
          />
        )}

        {/* Receive Section */}
        {receiveMessages.length > 0 && (
          <OperationSection
            action="receive"
            messages={receiveMessages}
            onMessageSelect={(msg) =>
              setSelectedMessage({ message: msg, action: "receive" })
            }
            selectedMessage={
              selectedMessage?.action === "receive"
                ? selectedMessage.message
                : null
            }
          />
        )}
      </div>

      {/* Messages Sidebar */}
      <div className="lg:sticky lg:top-4 h-fit">
        <MessagesSidebar
          sendMessages={sendMessages}
          receiveMessages={receiveMessages}
          selectedMessage={selectedMessage?.message ?? null}
          onMessageSelect={(msg, action) =>
            setSelectedMessage({ message: msg, action })
          }
        />
      </div>
    </div>
  );
};

/**
 * Collapsible section for Send or Receive operations
 */
const OperationSection = ({
  action,
  messages,
  onMessageSelect,
  selectedMessage,
}: {
  action: "send" | "receive";
  messages: FlattenedMessage[];
  onMessageSelect: (message: FlattenedMessage) => void;
  selectedMessage: FlattenedMessage | null;
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-4">
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDownIcon size={16} />
          ) : (
            <ChevronRightIcon size={16} />
          )}
          <span className="font-medium">
            {action === "send" ? "Send" : "Receive"}
          </span>
          <span className="text-xs text-muted-foreground">
            ({messages.length} message{messages.length !== 1 ? "s" : ""})
          </span>
        </div>
        <span
          className={cn(
            "flex items-center justify-center w-6 h-6 rounded-full",
            action === "send"
              ? "bg-orange-500/20 text-orange-500"
              : "bg-green-500/20 text-green-500",
          )}
        >
          {action === "send" ? (
            <ArrowUpIcon size={14} />
          ) : (
            <ArrowDownIcon size={14} />
          )}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-2 pl-6">
          {messages.map((message) => {
            // Create a stable key from title and payload structure
            const payloadKey = JSON.stringify(
              Object.keys(message.payload).slice(0, 3),
            );
            const key = `${message.title}-${payloadKey}`;
            return (
              <MessageItem
                key={key}
                message={message}
                onSelect={() => onMessageSelect(message)}
                isSelected={selectedMessage === message}
              />
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

/**
 * Individual message item with expandable payload
 */
const MessageItem = ({
  message,
  onSelect,
  isSelected,
}: {
  message: FlattenedMessage;
  onSelect: () => void;
  isSelected: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { title, description, payload } = message;
  const hasPayload = payload && Object.keys(payload).length > 0;
  const propertyCount =
    payload?.type === "object" && payload.properties
      ? Object.keys(payload.properties as Record<string, unknown>).length
      : 0;

  return (
    <div
      className={cn(
        "rounded-lg border bg-card transition-colors",
        isSelected && "ring-2 ring-primary",
      )}
    >
      <button
        type="button"
        className="w-full p-3 text-left flex items-start gap-3 hover:bg-accent/30 transition-colors"
        onClick={() => {
          onSelect();
          setIsExpanded(!isExpanded);
        }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{title}</span>
            {payload?.type != null && (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                type:{String(payload.type)}
              </code>
            )}
            {propertyCount > 0 && (
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? "hide" : "show"} {propertyCount} properties
                {isExpanded ? (
                  <ChevronDownIcon size={12} />
                ) : (
                  <ChevronRightIcon size={12} />
                )}
              </button>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </button>

      {isExpanded && hasPayload && (
        <div className="border-t px-3 py-2 bg-muted/30">
          <PayloadProperties payload={payload} />
        </div>
      )}
    </div>
  );
};

/**
 * Display payload properties in a structured way with expandable nested objects
 */
const PayloadProperties = ({
  payload,
  depth = 0,
}: {
  payload: Record<string, unknown>;
  depth?: number;
}) => {
  if (payload.type !== "object" || !payload.properties) {
    return (
      <pre className="text-xs font-mono overflow-auto max-h-48">
        {JSON.stringify(payload, null, 2)}
      </pre>
    );
  }

  const properties = payload.properties as Record<
    string,
    Record<string, unknown>
  >;
  const required = (payload.required as string[]) ?? [];

  return (
    <div className="space-y-1">
      {Object.entries(properties).map(([name, prop]) => (
        <PropertyItem
          key={name}
          name={name}
          prop={prop}
          isRequired={required.includes(name)}
          depth={depth}
        />
      ))}
    </div>
  );
};

/**
 * Individual property item with support for expanding nested objects
 */
const PropertyItem = ({
  name,
  prop,
  isRequired,
  depth,
}: {
  name: string;
  prop: Record<string, unknown>;
  isRequired: boolean;
  depth: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isNestedObject =
    prop.type === "object" && prop.properties !== undefined;
  const nestedPropertyCount = isNestedObject
    ? Object.keys(prop.properties as Record<string, unknown>).length
    : 0;

  return (
    <div className="text-xs">
      <div className="flex items-start gap-2">
        <code className="font-mono font-medium text-primary">{name}</code>
        {isRequired && <span className="text-red-500 text-[10px]">*</span>}
        <span className="text-muted-foreground">
          {prop.type
            ? String(prop.type)
            : prop.const !== undefined
              ? "const"
              : "any"}
        </span>
        {prop.const !== undefined && (
          <code className="text-muted-foreground">
            {JSON.stringify(prop.const)}
          </code>
        )}
        {Array.isArray(prop.enum) && (
          <span className="text-muted-foreground">
            ({(prop.enum as unknown[]).map(String).join(" | ")})
          </span>
        )}
        {isNestedObject && depth < 3 && (
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground flex items-center gap-0.5"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "hide" : "show"} {nestedPropertyCount} properties
            {isExpanded ? (
              <ChevronDownIcon size={10} />
            ) : (
              <ChevronRightIcon size={10} />
            )}
          </button>
        )}
      </div>
      {prop.description != null && (
        <p className="text-muted-foreground mt-0.5 ml-0">
          {String(prop.description)}
        </p>
      )}
      {isExpanded && isNestedObject && depth < 3 && (
        <div className="mt-1 ml-4 pl-2 border-l-2 border-border">
          <PayloadProperties
            payload={prop as Record<string, unknown>}
            depth={depth + 1}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Sidebar showing all messages grouped by action
 */
const MessagesSidebar = ({
  sendMessages,
  receiveMessages,
  selectedMessage,
  onMessageSelect,
}: {
  sendMessages: FlattenedMessage[];
  receiveMessages: FlattenedMessage[];
  selectedMessage: FlattenedMessage | null;
  onMessageSelect: (
    message: FlattenedMessage,
    action: "send" | "receive",
  ) => void;
}) => {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/30">
        <span className="font-medium text-sm">Messages</span>
      </div>
      <div className="divide-y">
        {sendMessages.map((msg, idx) => (
          <SidebarMessageItem
            key={`send-${msg.title}-${idx}`}
            message={msg}
            action="send"
            isSelected={selectedMessage === msg}
            onSelect={() => onMessageSelect(msg, "send")}
          />
        ))}
        {receiveMessages.map((msg, idx) => (
          <SidebarMessageItem
            key={`receive-${msg.title}-${idx}`}
            message={msg}
            action="receive"
            isSelected={selectedMessage === msg}
            onSelect={() => onMessageSelect(msg, "receive")}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Individual message item in the sidebar
 */
const SidebarMessageItem = ({
  message,
  action,
  isSelected,
  onSelect,
}: {
  message: FlattenedMessage;
  action: "send" | "receive";
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { title, payload } = message;

  return (
    <div>
      <button
        type="button"
        className={cn(
          "w-full px-4 py-2.5 text-left flex items-center gap-2 hover:bg-accent/50 transition-colors",
          isSelected && "bg-accent",
        )}
        onClick={() => {
          onSelect();
          setIsExpanded(!isExpanded);
        }}
      >
        <span
          className={cn(
            "flex items-center justify-center w-5 h-5 rounded-full",
            action === "send"
              ? "bg-orange-500/20 text-orange-500"
              : "bg-green-500/20 text-green-500",
          )}
        >
          {action === "send" ? (
            <ArrowUpIcon size={12} />
          ) : (
            <ArrowDownIcon size={12} />
          )}
        </span>
        <span className="text-sm flex-1 truncate">{title}</span>
        <ChevronDownIcon
          size={14}
          className={cn(
            "text-muted-foreground transition-transform",
            isExpanded && "rotate-180",
          )}
        />
      </button>
      {isExpanded && Object.keys(payload).length > 0 && (
        <div className="px-4 py-2 bg-muted/50 border-t">
          <PayloadPreview payload={payload} />
        </div>
      )}
    </div>
  );
};

/**
 * Simple payload preview for the sidebar
 */
const PayloadPreview = ({ payload }: { payload: Record<string, unknown> }) => {
  const generatePreview = (
    schema: Record<string, unknown>,
  ): Record<string, unknown> => {
    if (schema.type === "object" && schema.properties) {
      const props = schema.properties as Record<
        string,
        Record<string, unknown>
      >;
      const result: Record<string, unknown> = {};
      for (const [key, prop] of Object.entries(props)) {
        if (prop.type === "string") {
          result[key] = "<string>";
        } else if (prop.type === "number" || prop.type === "integer") {
          result[key] = 0;
        } else if (prop.type === "boolean") {
          result[key] = true;
        } else if (prop.type === "array") {
          result[key] = [];
        } else if (prop.type === "object") {
          result[key] = generatePreview(prop);
        } else {
          result[key] = `<${String(prop.type ?? "any")}>`;
        }
      }
      return result;
    }
    return {};
  };

  const preview = generatePreview(payload);

  return (
    <pre className="text-xs font-mono text-muted-foreground overflow-auto max-h-32">
      {JSON.stringify(preview, null, 2)}
    </pre>
  );
};

/**
 * Group operations by channel address
 */
export const groupOperationsByChannel = (
  operations: OperationResult[],
): Map<string, ChannelOperation[]> => {
  const grouped = new Map<string, ChannelOperation[]>();

  for (const op of operations) {
    const channelAddress = op.channelAddress ?? "default";
    const existing = grouped.get(channelAddress) ?? [];

    existing.push({
      action: op.action,
      operationId: op.operationId,
      summary: op.summary ?? undefined,
      description: op.description ?? undefined,
      messages: op.messages.map((m) => ({
        name: m.name ?? undefined,
        title: m.title ?? undefined,
        summary: m.summary ?? undefined,
        description: m.description ?? undefined,
        contentType: m.contentType ?? undefined,
        payload: m.payload ?? undefined,
        headers: m.headers ?? undefined,
        examples: m.examples?.map((ex) => ({
          name: ex.name ?? undefined,
          summary: ex.summary ?? undefined,
          headers: ex.headers ?? undefined,
          payload: ex.payload ?? undefined,
        })),
      })) as MessageObject[],
    });

    grouped.set(channelAddress, existing);
  }

  return grouped;
};
