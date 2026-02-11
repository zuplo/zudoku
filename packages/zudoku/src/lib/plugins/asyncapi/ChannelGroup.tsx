import * as RadixCollapsible from "@radix-ui/react-collapsible";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
  CopyIcon,
  MinusIcon,
  PlusIcon,
} from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { Button, Markdown } from "zudoku/components";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "zudoku/ui/Collapsible.js";
import { Frame, FrameHeader, FramePanel } from "zudoku/ui/Frame.js";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
} from "zudoku/ui/Item.js";
import { Heading } from "../../components/Heading.js";
import { PathRenderer } from "../../components/PathRenderer.js";
import type { SchemaObject } from "../../oas/parser/index.js";
import { SyntaxHighlight } from "../../ui/SyntaxHighlight.js";
import { cn } from "../../util/cn.js";
import { useCopyToClipboard } from "../../util/useCopyToClipboard.js";
import { ColorizedParam } from "../openapi/ColorizedParam.js";
import { ParamInfos } from "../openapi/ParamInfos.js";
import * as SidecarBox from "../openapi/SidecarBox.js";
import { SchemaView } from "../openapi/schema/SchemaView.js";
import { ChannelParametersDisplay } from "./components/ChannelParametersDisplay.js";
import { ProtocolBadge } from "./components/ProtocolBadge.js";
import { useAsyncApiConfig } from "./context.js";
import type { MessageResult, OperationResult } from "./graphql/queries.js";

export type ChannelGroupProps = {
  channelAddress: string;
  operations: OperationResult[];
};

/**
 * Groups operations by channel, showing send and receive together
 */
export const ChannelGroup = ({
  channelAddress,
  operations,
}: ChannelGroupProps) => {
  const { options } = useAsyncApiConfig();

  // Use the first operation for common data
  const primaryOp = operations[0];
  if (!primaryOp) return null;

  const slug = primaryOp.slug ?? primaryOp.operationId;
  const protocols = primaryOp.protocols;
  const channelTitle = primaryOp.channelTitle;
  const channelDescription = primaryOp.channelDescription;
  const channelParameters = primaryOp.channelParameters ?? [];

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
          <span className="text-neutral-900 dark:text-neutral-200">
            <PathRenderer
              path={channelAddress}
              renderParam={({ name }) => (
                <ColorizedParam
                  name={name}
                  backgroundOpacity="15%"
                  className="px-1"
                  slug={`${slug}-${name}`}
                />
              )}
            />
          </span>
        </div>

        {/* Channel Description */}
        {channelDescription && (
          <div className="col-span-full">
            <Markdown className="prose-sm" content={channelDescription} />
          </div>
        )}

        {/* Main Content */}
        <div
          className={cn(
            "flex flex-col gap-4",
            options?.disableSidecar && "col-span-full",
          )}
        >
          {/* Channel Parameters */}
          {channelParameters.length > 0 && (
            <ChannelParametersDisplay
              parameters={channelParameters}
              id={slug}
            />
          )}

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
            <MessagesSidecar operations={operations} />
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
const getActionIcon = (action: string, size = 16) => {
  switch (action) {
    case "send":
      return <ArrowUpIcon size={size} />;
    case "receive":
      return <ArrowDownIcon size={size} />;
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
  const [isOpen, setIsOpen] = useState(true);
  const sectionId = `${parentSlug}/${operation.action}`;
  const label = capitalize(operation.action);
  const icon = getActionIcon(operation.action);

  // Count messages, expanding oneOf schemas
  const messageCount = operation.messages.reduce((count, msg) => {
    const payload = msg.payload as SchemaObject | null;
    if (payload?.oneOf && Array.isArray(payload.oneOf)) {
      return count + payload.oneOf.length;
    }
    return count + 1;
  }, 0);
  const messageText = messageCount === 1 ? "message" : "messages";

  // Flatten messages (expand oneOf schemas)
  type LocalFlattenedMessage = {
    key: string;
    title: string;
    description: string | null;
    summary: string | null;
    schema: SchemaObject | null;
  };
  const flattenedMessages: LocalFlattenedMessage[] = operation.messages.flatMap(
    (msg, msgIdx) => {
      const payload = msg.payload as SchemaObject | null;
      if (payload?.oneOf && Array.isArray(payload.oneOf)) {
        return (payload.oneOf as SchemaObject[]).map((opt, optIdx) => ({
          key: `${msg.name ?? msgIdx}-${opt.title ?? optIdx}`,
          title: opt.title ?? "Message",
          description: opt.description ?? null,
          summary: null as string | null,
          schema: opt as SchemaObject | null,
        }));
      }
      return [
        {
          key: msg.name ?? `message-${msgIdx}`,
          title: msg.title ?? msg.name ?? "Message",
          description: null as string | null,
          summary: msg.summary,
          schema: payload,
        },
      ];
    },
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Frame>
        <FrameHeader className="p-0">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-xl"
            >
              <Heading
                level={3}
                id={sectionId}
                registerNavigationAnchor
                className="flex items-center gap-2 text-base font-semibold"
              >
                {label}
                <span className="font-normal text-muted-foreground text-sm">
                  ({messageCount} {messageText})
                </span>
              </Heading>
              <div className="flex items-center gap-2">
                {icon && (
                  <span
                    className={cn(
                      "p-1.5 rounded",
                      getActionColors(operation.action),
                    )}
                  >
                    {icon}
                  </span>
                )}
                <ChevronsDownUpIcon
                  size={16}
                  className={cn(
                    "text-muted-foreground transition-transform",
                    !isOpen && "hidden",
                  )}
                />
                <ChevronsUpDownIcon
                  size={16}
                  className={cn(
                    "text-muted-foreground transition-transform",
                    isOpen && "hidden",
                  )}
                />
              </div>
            </button>
          </CollapsibleTrigger>
        </FrameHeader>
        <CollapsibleContent>
          <FramePanel className="p-0! rounded-t-none">
            <ItemGroup>
              {flattenedMessages.map((msg, index) => (
                <Fragment key={msg.key}>
                  {index > 0 && <ItemSeparator />}
                  <MessageItem
                    title={msg.title}
                    description={msg.description}
                    summary={msg.summary}
                    schema={msg.schema}
                  />
                </Fragment>
              ))}
            </ItemGroup>
          </FramePanel>
        </CollapsibleContent>
      </Frame>
    </Collapsible>
  );
};

/**
 * Message item using OpenAPI Item components
 */
const MessageItem = ({
  title,
  description,
  summary,
  schema,
}: {
  title: string;
  description: string | null;
  summary: string | null;
  schema: SchemaObject | null;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const isCollapsible =
    schema &&
    (schema.type === "object" ||
      schema.oneOf ||
      schema.anyOf ||
      schema.allOf ||
      schema.properties);

  // Show description in header
  const descriptionText = description ?? summary;

  // Schema without description (to avoid showing it twice in SchemaView)
  const schemaWithoutDescription = useMemo(() => {
    if (!schema) return null;
    const { description: _desc, ...rest } = schema;
    return rest as SchemaObject;
  }, [schema]);

  return (
    <Item>
      <ItemContent className="gap-y-2">
        <div>
          <ItemTitle className="inline me-2">
            {isCollapsible ? (
              <button
                onClick={() => setIsOpen(!isOpen)}
                type="button"
                className="hover:underline"
              >
                <code>{title}</code>
              </button>
            ) : (
              <code>{title}</code>
            )}
          </ItemTitle>
          {schema && (
            <ParamInfos className="inline" schema={schema as SchemaObject} />
          )}
        </div>
        {descriptionText && (
          <Markdown className="prose-sm" content={descriptionText} />
        )}
      </ItemContent>

      {isCollapsible && (
        <ItemActions className="self-start">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle schema"
          >
            {isOpen ? <MinusIcon size={16} /> : <PlusIcon size={16} />}
          </Button>
        </ItemActions>
      )}

      {isCollapsible && schemaWithoutDescription && (
        <RadixCollapsible.Root
          open={isOpen}
          onOpenChange={setIsOpen}
          className={cn("w-full", !isOpen && "contents")}
        >
          <RadixCollapsible.Content asChild>
            <ItemContent>
              <SchemaView schema={schemaWithoutDescription} />
            </ItemContent>
          </RadixCollapsible.Content>
        </RadixCollapsible.Root>
      )}
    </Item>
  );
};

/**
 * Represents a flattened message item (either a regular message or a oneOf option)
 */
type FlattenedMessageItem = {
  title: string;
  summary: string | null;
  contentType: string | null;
  payload: Record<string, unknown> | null;
  matchingExamples: Array<{
    name: string | null;
    summary: string | null;
    payload: unknown;
  }>;
  action: string;
};

/**
 * Find the const value from a schema's properties (used to match examples)
 */
const findConstValue = (
  schema: Record<string, unknown>,
): { key: string; value: unknown } | null => {
  const properties = schema.properties as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (!properties) return null;

  for (const [key, prop] of Object.entries(properties)) {
    if (prop.const !== undefined) {
      return { key, value: prop.const };
    }
  }
  return null;
};

/**
 * Filter examples that match a specific const value
 */
const filterMatchingExamples = (
  examples: MessageResult["examples"],
  constInfo: { key: string; value: unknown } | null,
): Array<{ name: string | null; summary: string | null; payload: unknown }> => {
  if (!examples || examples.length === 0) return [];

  if (!constInfo) {
    // No const to match - return all examples
    return examples.map((ex) => ({
      name: ex.name,
      summary: ex.summary,
      payload: ex.payload,
    }));
  }

  // Filter examples where payload[key] matches the const value
  return examples
    .filter((ex) => {
      if (!ex.payload || typeof ex.payload !== "object") return false;
      const payload = ex.payload as Record<string, unknown>;
      return payload[constInfo.key] === constInfo.value;
    })
    .map((ex) => ({
      name: ex.name,
      summary: ex.summary,
      payload: ex.payload,
    }));
};

/**
 * Sidecar showing all messages in a flat list
 */
const MessagesSidecar = ({ operations }: { operations: OperationResult[] }) => {
  // Collect all messages from all operations, flattening oneOf schemas
  const allMessages = useMemo(() => {
    const messages: FlattenedMessageItem[] = [];

    operations.forEach((op) => {
      op.messages.forEach((msg) => {
        const payload = msg.payload as Record<string, unknown> | null;

        // If the payload has oneOf, flatten each option into a separate item
        if (payload?.oneOf && Array.isArray(payload.oneOf)) {
          const options = payload.oneOf as Array<Record<string, unknown>>;
          options.forEach((opt) => {
            // Find const value in this option to match examples
            const constInfo = findConstValue(opt);
            const matchingExamples = filterMatchingExamples(
              msg.examples,
              constInfo,
            );

            messages.push({
              title: (opt.title as string) ?? "Message",
              summary: (opt.description as string) ?? null,
              contentType: msg.contentType,
              payload: opt,
              matchingExamples,
              action: op.action,
            });
          });
        } else {
          // Regular message - all examples match
          const matchingExamples = (msg.examples ?? []).map((ex) => ({
            name: ex.name,
            summary: ex.summary,
            payload: ex.payload,
          }));

          messages.push({
            title: msg.title ?? msg.name ?? "Message",
            summary: msg.summary,
            contentType: msg.contentType,
            payload,
            matchingExamples,
            action: op.action,
          });
        }
      });
    });

    return messages;
  }, [operations]);

  if (allMessages.length === 0) {
    return null;
  }

  return (
    <SidecarBox.Root>
      <SidecarBox.Head className="text-xs">
        <span className="font-medium">Messages</span>
      </SidecarBox.Head>
      <SidecarBox.Body className="p-0">
        <div className="divide-y divide-border">
          {allMessages.map((message, index) => (
            <MessageListItem
              key={`${message.action}-${message.title}-${index}`}
              message={message}
            />
          ))}
        </div>
      </SidecarBox.Body>
    </SidecarBox.Root>
  );
};

/**
 * Individual message item in the flat list
 */
const MessageListItem = ({ message }: { message: FlattenedMessageItem }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, copyToClipboard] = useCopyToClipboard();

  const example = useMemo(() => {
    // Try matching examples first
    if (message.matchingExamples.length > 0) {
      return message.matchingExamples[0]?.payload;
    }

    // Try schema examples
    const payload = message.payload;
    if (payload) {
      if (Array.isArray(payload.examples) && payload.examples.length > 0) {
        return payload.examples[0];
      }
      if (payload.example !== undefined) return payload.example;

      // Generate from schema
      return generateExampleFromSchema(payload);
    }

    return null;
  }, [message]);

  const exampleJson = example ? JSON.stringify(example, null, 2) : null;

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
            message.action === "send"
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
              : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
          )}
        >
          {message.action === "send" ? (
            <ArrowUpIcon size={12} />
          ) : (
            <ArrowDownIcon size={12} />
          )}
        </span>

        {/* Message title */}
        <span className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">
          {message.title}
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
