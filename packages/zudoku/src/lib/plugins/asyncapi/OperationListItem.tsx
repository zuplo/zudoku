import { Badge } from "zudoku/ui/Badge.js";
import { Separator } from "zudoku/ui/Separator.js";
import type { EnrichedOperation } from "../../asyncapi/parser/operations.js";
import type { ChannelObject, MessageObject } from "../../asyncapi/types.js";
import { Heading } from "../../components/Heading.js";
import { Markdown } from "../../components/Markdown.js";
import { cn } from "../../util/cn.js";
import { MessageView } from "./components/MessageView.js";
import { OperationBadge } from "./components/OperationBadge.js";
import { ProtocolBadge } from "./components/ProtocolBadge.js";

type OperationListItemProps = {
  operation: EnrichedOperation;
  channel?: ChannelObject;
  serverUrl?: string;
};

/**
 * Component for displaying a single AsyncAPI operation
 */
export const OperationListItem = ({
  operation,
  channel,
  serverUrl,
}: OperationListItemProps) => {
  const slug = operation.operationId;
  const summary = operation.summary ?? operation.title ?? operation.operationId;
  const isDeprecated = operation.deprecated === true;

  // Get messages from operation or channel
  const messages = getMessages(operation, channel);

  return (
    <div>
      {isDeprecated && (
        <Badge variant="muted" className="text-xs mb-4">
          deprecated
        </Badge>
      )}
      <div
        className={cn(
          "grid grid-cols-1 lg:grid-cols-[minmax(0,4fr)_minmax(0,3fr)] gap-x-8 gap-y-4 items-start",
          isDeprecated && "opacity-50 transition hover:opacity-100",
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
              {operation.channelAddress ?? channel?.address ?? ""}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col gap-4">
          {operation.description && (
            <Markdown
              className="max-w-full prose-img:max-w-prose"
              content={operation.description}
            />
          )}

          {/* Channel Description (if different from operation) */}
          {channel?.description &&
            channel.description !== operation.description && (
              <>
                <Separator className="my-2" />
                <div>
                  <Heading level={3} id={`${slug}/channel`}>
                    Channel
                  </Heading>
                  <Markdown
                    className="text-sm text-muted-foreground mt-2"
                    content={channel.description}
                  />
                </div>
              </>
            )}

          {/* Channel Parameters */}
          {channel?.parameters &&
            Object.keys(channel.parameters).length > 0 && (
              <>
                <Separator className="my-2" />
                <div>
                  <Heading level={3} id={`${slug}/parameters`}>
                    Parameters
                  </Heading>
                  <div className="mt-2 space-y-2">
                    {Object.entries(channel.parameters).map(([name, param]) => (
                      <div
                        key={name}
                        className="flex items-start gap-3 p-3 rounded border bg-card"
                      >
                        <code className="text-sm font-mono font-medium text-primary">
                          {`{${name}}`}
                        </code>
                        <div className="flex-1">
                          {param.description && (
                            <p className="text-sm text-muted-foreground">
                              {param.description}
                            </p>
                          )}
                          {param.enum && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {param.enum.map((value) => (
                                <code
                                  key={value}
                                  className="text-xs bg-muted px-1.5 py-0.5 rounded"
                                >
                                  {value}
                                </code>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

          {/* Messages */}
          {messages.length > 0 && (
            <>
              <Separator className="my-4" />
              <div>
                <Heading level={3} id={`${slug}/messages`}>
                  {operation.action === "send"
                    ? "Message to Send"
                    : "Message to Receive"}
                </Heading>
                <div className="mt-4 space-y-4">
                  {messages.map((msg, idx) => (
                    <MessageView
                      key={msg.name ?? `message-${idx}`}
                      message={msg}
                      messageName={msg.name}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Tags */}
          {operation.tags && operation.tags.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="flex flex-wrap gap-2">
                {operation.tags.map((tag) => (
                  <Badge key={tag.name} variant="secondary">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sidecar area - placeholder for code examples */}
        <div className="lg:sticky lg:top-4">
          <AsyncAPISidecar
            operation={operation}
            channel={channel}
            messages={messages}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Get messages from operation or channel
 */
const getMessages = (
  operation: EnrichedOperation,
  channel?: ChannelObject,
): MessageObject[] => {
  const messages: MessageObject[] = [];

  // Get messages from operation
  if (operation.messages) {
    for (const msg of operation.messages) {
      if (typeof msg === "object" && msg !== null) {
        // Check if it's a $ref or actual message
        if ("$ref" in msg) {
          // Would need to resolve reference - for now skip
        } else {
          messages.push(msg as MessageObject);
        }
      }
    }
  }

  // If no operation messages, try channel messages
  if (messages.length === 0 && channel?.messages) {
    for (const [name, msg] of Object.entries(channel.messages)) {
      if (typeof msg === "object" && msg !== null) {
        messages.push({ ...msg, name: msg.name ?? name } as MessageObject);
      }
    }
  }

  return messages;
};

/**
 * Simple sidecar component showing message examples
 */
const AsyncAPISidecar = ({
  operation,
  channel,
  messages,
}: {
  operation: EnrichedOperation;
  channel?: ChannelObject;
  messages: MessageObject[];
}) => {
  const firstMessage = messages[0];

  // Generate example based on payload schema if no explicit example
  const examplePayload =
    firstMessage?.payload?.examples?.[0] ??
    firstMessage?.examples?.[0]?.payload ??
    (firstMessage?.payload
      ? generateExampleFromSchema(firstMessage.payload)
      : null);

  return (
    <div className="space-y-4">
      {/* Connection info */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          Connection
        </div>
        <div className="space-y-1 text-sm font-mono">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Protocol:</span>
            <span>{operation.protocols.join(", ") || "Not specified"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Channel:</span>
            <span className="truncate">
              {operation.channelAddress ?? channel?.address ?? "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Example payload */}
      {examplePayload && (
        <div className="rounded-lg border bg-muted/50 overflow-hidden">
          <div className="px-4 py-2 border-b bg-muted/80">
            <span className="text-xs font-medium text-muted-foreground">
              Example Payload
            </span>
          </div>
          <pre className="p-4 text-xs font-mono overflow-auto max-h-64">
            {typeof examplePayload === "string"
              ? examplePayload
              : JSON.stringify(examplePayload, null, 2)}
          </pre>
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
    case "string":
      return schema.enum?.[0] ?? "string";
    case "number":
    case "integer":
      return 0;
    case "boolean":
      return true;
    default:
      return null;
  }
};
