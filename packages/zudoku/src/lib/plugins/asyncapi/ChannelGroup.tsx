import * as RadixCollapsible from "@radix-ui/react-collapsible";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
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
import type { SchemaObject } from "../../oas/parser/index.js";
import { cn } from "../../util/cn.js";
import type { MediaTypeObject } from "../openapi/graphql/graphql.js";
import { ParamInfos } from "../openapi/ParamInfos.js";
import * as SidecarBox from "../openapi/SidecarBox.js";
import { SidecarExamples } from "../openapi/SidecarExamples.js";
import { SchemaView } from "../openapi/schema/SchemaView.js";
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
            "flex flex-col gap-4",
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
  const flattenedMessages = operation.messages.flatMap((msg, msgIdx) => {
    const payload = msg.payload as SchemaObject | null;
    if (payload?.oneOf && Array.isArray(payload.oneOf)) {
      return (payload.oneOf as SchemaObject[]).map((opt, optIdx) => ({
        key: `${msg.name ?? msgIdx}-${opt.title ?? optIdx}`,
        title: opt.title ?? "Message",
        description: opt.description,
        summary: null as string | null,
        schema: opt,
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
  });

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
 * Build MediaTypeObject content array for SidecarExamples
 */
const buildExamplesContent = (
  item: FlattenedMessageItem,
): MediaTypeObject[] => {
  const payload = item.payload;
  const examples: Array<{
    name?: string;
    summary?: string;
    description?: string;
    value: unknown;
  }> = [];

  // Add matching examples from the message
  if (item.matchingExamples.length > 0) {
    item.matchingExamples.forEach((ex, idx) => {
      examples.push({
        name: ex.name ?? undefined,
        summary: ex.summary ?? undefined,
        value: ex.payload,
      });
    });
  }

  // If no matching examples, check schema-level examples
  if (examples.length === 0 && payload) {
    if (Array.isArray(payload.examples) && payload.examples.length > 0) {
      (payload.examples as unknown[]).forEach((ex, idx) => {
        examples.push({
          name: `Example ${idx + 1}`,
          value: ex,
        });
      });
    } else if (payload.example !== undefined) {
      examples.push({
        name: "Example",
        value: payload.example,
      });
    }
  }

  // If still no examples, generate one from schema
  if (examples.length === 0 && payload) {
    const generated = generateExampleFromSchema(payload);
    if (generated !== null) {
      examples.push({
        name: "Example",
        value: generated,
      });
    }
  }

  return [
    {
      mediaType: item.contentType ?? "application/json",
      examples,
    } as MediaTypeObject,
  ];
};

/**
 * Sidecar showing messages with examples, organized by action
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

  // Group messages by action
  const messagesByAction = useMemo(() => {
    const grouped: Record<string, FlattenedMessageItem[]> = {};
    allMessages.forEach((msg) => {
      if (!grouped[msg.action]) {
        grouped[msg.action] = [];
      }
      grouped[msg.action].push(msg);
    });
    return grouped;
  }, [allMessages]);

  // Get ordered actions (send first, then receive)
  const orderedActions = useMemo(() => {
    const actions = Object.keys(messagesByAction);
    return actions.sort((a, b) => {
      if (a === "send") return -1;
      if (b === "send") return 1;
      if (a === "receive") return -1;
      if (b === "receive") return 1;
      return a.localeCompare(b);
    });
  }, [messagesByAction]);

  if (allMessages.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {orderedActions.map((action) => (
        <ActionMessageGroup
          key={action}
          action={action}
          messages={messagesByAction[action]}
        />
      ))}
    </div>
  );
};

/**
 * Group of messages for a specific action (send/receive)
 */
const ActionMessageGroup = ({
  action,
  messages,
}: {
  action: string;
  messages: FlattenedMessageItem[];
}) => {
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(0);
  const [selectedExampleIndex, setSelectedExampleIndex] = useState(0);

  const selectedMessage = messages[selectedMessageIndex];
  const content = useMemo(
    () => (selectedMessage ? buildExamplesContent(selectedMessage) : []),
    [selectedMessage],
  );

  const actionLabel =
    action === "send"
      ? "Send"
      : action === "receive"
        ? "Receive"
        : capitalize(action);
  const ActionIcon = action === "send" ? ArrowUpIcon : ArrowDownIcon;

  return (
    <Collapsible className="group/collapsible" defaultOpen>
      <SidecarBox.Root>
        <SidecarBox.Head className="text-xs flex justify-between items-center">
          <span className="flex items-center gap-2 font-medium">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="size-fit px-1 py-1 -my-1"
                aria-label={`Toggle ${actionLabel} examples`}
              >
                <ChevronsDownUpIcon className="size-[1em] group-data-[state=closed]/collapsible:hidden" />
                <ChevronsUpDownIcon className="size-[1em] group-data-[state=open]/collapsible:hidden" />
              </Button>
            </CollapsibleTrigger>
            <span className={cn("p-1 rounded", getActionColors(action))}>
              <ActionIcon size={12} />
            </span>
            {actionLabel}
          </span>
          {messages.length > 1 && (
            <select
              value={selectedMessageIndex}
              onChange={(e) => {
                setSelectedMessageIndex(Number(e.target.value));
                setSelectedExampleIndex(0);
              }}
              className="text-xs bg-background border rounded px-2 py-1 max-w-[140px] truncate"
            >
              {messages.map((msg, idx) => (
                <option key={`${msg.title}-${idx}`} value={idx}>
                  {msg.title}
                </option>
              ))}
            </select>
          )}
        </SidecarBox.Head>
        <CollapsibleContent>
          {messages.length === 1 && (
            <div className="px-3 py-1.5 border-b text-xs font-medium text-foreground/80">
              {selectedMessage?.title}
            </div>
          )}
          <SidecarExamples
            content={content}
            selectedContentIndex={0}
            selectedExampleIndex={selectedExampleIndex}
            onExampleChange={({ exampleIndex }) =>
              setSelectedExampleIndex(exampleIndex)
            }
            isOnScreen
            description={selectedMessage?.summary ?? undefined}
          />
        </CollapsibleContent>
      </SidecarBox.Root>
    </Collapsible>
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
