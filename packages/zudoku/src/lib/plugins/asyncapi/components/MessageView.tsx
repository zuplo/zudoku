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
                    <PayloadSchemaView schema={message.payload} />
                  </AccordionContent>
                </AccordionItem>
              )}

              {hasHeaders && (
                <AccordionItem value="headers" className="border-none">
                  <AccordionTrigger className="text-sm font-medium py-2 hover:no-underline">
                    Headers
                  </AccordionTrigger>
                  <AccordionContent>
                    <PayloadSchemaView schema={message.headers} />
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
 * Simple schema display component
 */
const PayloadSchemaView = ({ schema }: { schema: Record<string, unknown> }) => {
  if (!schema || Object.keys(schema).length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No schema defined
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
      <div className="space-y-2 rounded border bg-card p-3">
        {Object.entries(properties).map(([name, prop]) => (
          <div
            key={name}
            className="border-b border-border last:border-0 pb-2 last:pb-0"
          >
            <div className="flex items-baseline gap-2">
              <code className="text-sm font-mono font-medium">{name}</code>
              {required.includes(name) && (
                <span className="text-xs text-red-500">required</span>
              )}
              {prop.type && (
                <span className="text-xs text-muted-foreground">
                  {String(prop.type)}
                </span>
              )}
            </div>
            {prop.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {String(prop.description)}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }

  // For basic types, show type info
  if (schema.type) {
    return (
      <div className="rounded border bg-card p-3">
        <div className="flex items-baseline gap-2">
          <span className="text-sm text-muted-foreground">Type:</span>
          <code className="text-sm font-mono">{String(schema.type)}</code>
        </div>
        {schema.description && (
          <p className="text-xs text-muted-foreground mt-1">
            {String(schema.description)}
          </p>
        )}
      </div>
    );
  }

  // Fallback: show raw JSON
  return (
    <pre className="rounded border bg-card p-3 text-xs font-mono overflow-auto max-h-64">
      {JSON.stringify(schema, null, 2)}
    </pre>
  );
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
