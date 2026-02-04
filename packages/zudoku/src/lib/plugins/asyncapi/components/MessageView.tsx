import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "zudoku/ui/Accordion.js";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "zudoku/ui/Frame.js";
import type { MessageObject } from "../../../asyncapi/types.js";
import { Markdown } from "../../../components/Markdown.js";

type MessageViewProps = {
  message: MessageObject;
  messageName?: string;
  defaultOpen?: boolean;
};

/**
 * Component for displaying an AsyncAPI message with its payload schema
 */
export const MessageView = ({
  message,
  messageName,
  defaultOpen = false,
}: MessageViewProps) => {
  const title = message.title ?? message.name ?? messageName;
  const hasPayload = message.payload && Object.keys(message.payload).length > 0;
  const hasHeaders = message.headers && Object.keys(message.headers).length > 0;

  return (
    <Frame>
      {title && (
        <FrameHeader>
          <FrameTitle>{title}</FrameTitle>
          {message.summary && (
            <FrameDescription>{message.summary}</FrameDescription>
          )}
        </FrameHeader>
      )}
      <FramePanel>
        <div className="space-y-4">
          {message.description && (
            <Markdown
              className="text-sm leading-relaxed text-muted-foreground"
              content={message.description}
            />
          )}

          {message.contentType && (
            <div className="text-sm">
              <span className="text-muted-foreground">Content Type: </span>
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                {message.contentType}
              </code>
            </div>
          )}

          {(hasPayload || hasHeaders) && (
            <Accordion
              type="multiple"
              defaultValue={defaultOpen ? ["payload", "headers"] : []}
              className="space-y-2"
            >
              {hasPayload && (
                <AccordionItem value="payload" className="border-none">
                  <AccordionTrigger className="text-sm font-medium py-2 hover:no-underline">
                    Payload
                  </AccordionTrigger>
                  <AccordionContent>
                    <PayloadSchemaView
                      schema={message.payload as Record<string, unknown>}
                    />
                  </AccordionContent>
                </AccordionItem>
              )}

              {hasHeaders && (
                <AccordionItem value="headers" className="border-none">
                  <AccordionTrigger className="text-sm font-medium py-2 hover:no-underline">
                    Headers
                  </AccordionTrigger>
                  <AccordionContent>
                    <PayloadSchemaView
                      schema={message.headers as Record<string, unknown>}
                    />
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          )}

          {message.tags && message.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {message.tags.map((tag) => (
                <span
                  key={tag.name}
                  className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </FramePanel>
    </Frame>
  );
};

/**
 * Simple schema display component with support for oneOf/anyOf schemas
 */
const PayloadSchemaView = ({
  schema,
  depth = 0,
}: {
  schema: Record<string, unknown> | undefined;
  depth?: number;
}) => {
  if (!schema || Object.keys(schema).length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No schema defined
      </div>
    );
  }

  // Handle oneOf schemas - display each option separately
  if (schema.oneOf && Array.isArray(schema.oneOf)) {
    const options = schema.oneOf as Array<Record<string, unknown>>;
    return (
      <div className="space-y-3">
        <div className="text-xs text-muted-foreground font-medium">
          One of the following message types:
        </div>
        {options.map((option) => {
          const title = option.title as string | undefined;
          const description = option.description as string | undefined;
          const key = title ?? JSON.stringify(option).slice(0, 50);
          return (
            <div key={key} className="rounded border bg-card overflow-hidden">
              {(title || description) && (
                <div className="px-3 py-2 border-b bg-muted/30">
                  {title && <div className="font-medium text-sm">{title}</div>}
                  {description && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {description}
                    </div>
                  )}
                </div>
              )}
              <div className="p-3">
                <PayloadSchemaView schema={option} depth={depth + 1} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Handle anyOf schemas similarly
  if (schema.anyOf && Array.isArray(schema.anyOf)) {
    const options = schema.anyOf as Array<Record<string, unknown>>;
    return (
      <div className="space-y-3">
        <div className="text-xs text-muted-foreground font-medium">
          Any of the following:
        </div>
        {options.map((option) => {
          const title = option.title as string | undefined;
          const key = title ?? JSON.stringify(option).slice(0, 50);
          return (
            <div key={key} className="rounded border bg-card overflow-hidden">
              {title && (
                <div className="px-3 py-2 border-b bg-muted/30">
                  <div className="font-medium text-sm">{title}</div>
                </div>
              )}
              <div className="p-3">
                <PayloadSchemaView schema={option} depth={depth + 1} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // For object schemas, show properties
  if (schema.type === "object" && schema.properties) {
    const properties = schema.properties as Record<
      string,
      Record<string, unknown>
    >;
    const required = (schema.required as string[]) ?? [];

    return (
      <div className="space-y-2">
        {Object.entries(properties).map(([name, prop]) => (
          <div
            key={name}
            className="border-b border-border last:border-0 pb-2 last:pb-0"
          >
            <div className="flex items-baseline gap-2 flex-wrap">
              <code className="text-sm font-mono font-medium">{name}</code>
              {required.includes(name) && (
                <span className="text-xs text-red-500">required</span>
              )}
              {prop.type != null ? (
                <span className="text-xs text-muted-foreground">
                  {String(prop.type)}
                </span>
              ) : prop.const != null ? (
                <span className="text-xs text-muted-foreground">
                  const: <code>{JSON.stringify(prop.const)}</code>
                </span>
              ) : null}
              {Array.isArray(prop.enum) && (
                <span className="text-xs text-muted-foreground">
                  enum: {(prop.enum as unknown[]).map(String).join(" | ")}
                </span>
              )}
            </div>
            {prop.description != null && (
              <p className="text-xs text-muted-foreground mt-1">
                {String(prop.description)}
              </p>
            )}
            {/* Recursively render nested objects */}
            {String(prop.type) === "object" &&
              prop.properties != null &&
              depth < 2 && (
                <div className="mt-2 ml-4 pl-2 border-l-2 border-border">
                  <PayloadSchemaView
                    schema={prop as Record<string, unknown>}
                    depth={depth + 1}
                  />
                </div>
              )}
          </div>
        ))}
      </div>
    );
  }

  // For basic types, show type info
  if (schema.type) {
    return (
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Type:</span>
        <code className="text-sm font-mono">{String(schema.type)}</code>
        {schema.format != null && (
          <span className="text-xs text-muted-foreground">
            (format: {String(schema.format)})
          </span>
        )}
        {schema.description != null && (
          <p className="text-xs text-muted-foreground mt-1 w-full">
            {String(schema.description)}
          </p>
        )}
      </div>
    );
  }

  // Fallback: show raw JSON (but only at top level to avoid excessive nesting)
  if (depth === 0) {
    return (
      <pre className="rounded border bg-card p-3 text-xs font-mono overflow-auto max-h-64">
        {JSON.stringify(schema, null, 2)}
      </pre>
    );
  }

  return null;
};

/**
 * Compact message list item for operation views
 */
export const MessageListItem = ({
  message,
  messageName,
}: {
  message: MessageObject;
  messageName?: string;
}) => {
  const title = message.title ?? message.name ?? messageName;

  return (
    <div className="flex items-start gap-3 p-3 rounded border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex-1 min-w-0">
        {title && <div className="font-medium text-sm truncate">{title}</div>}
        {message.summary && (
          <div className="text-xs text-muted-foreground truncate mt-0.5">
            {message.summary}
          </div>
        )}
        {message.contentType && (
          <code className="text-xs text-muted-foreground mt-1 block">
            {message.contentType}
          </code>
        )}
      </div>
    </div>
  );
};
