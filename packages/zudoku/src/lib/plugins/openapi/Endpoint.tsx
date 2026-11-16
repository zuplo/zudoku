import { useSuspenseQuery } from "@tanstack/react-query";
import { CheckIcon, CopyIcon, SlidersHorizontalIcon } from "lucide-react";
import { useEffect, useEffectEvent, useState, useTransition } from "react";
import { Input } from "zudoku/ui/Input.js";
import { Button } from "../../ui/Button.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/Popover.js";
import { useCreateQuery } from "./client/useCreateQuery.js";
import { useOasConfig } from "./context.js";
import { graphql } from "./graphql/index.js";
import { SimpleSelect } from "./SimpleSelect.js";
import { useSelectedServer } from "./state.js";
import {
  getServerLabel,
  getServerVariableValue,
  type ServerVariableDefinition,
} from "./util/resolveServerUrl.js";

const ServersQuery = graphql(/* GraphQL */ `
  query ServersQuery($input: JSON!, $type: SchemaType!) {
    schema(input: $input, type: $type) {
      url
      servers {
        url
        name
        description
        variables {
          name
          default
          enum
          description
        }
      }
    }
  }
`);

const CopyButton = ({ url }: { url: string }) => {
  const [isCopied, setIsCopied] = useState(false);

  return (
    <Button
      onClick={() => {
        void navigator.clipboard.writeText(url).then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        });
      }}
      variant="ghost"
      size="icon-xs"
      aria-label="Copy server URL"
    >
      {isCopied ? (
        <CheckIcon className="text-green-600" size={14} aria-hidden="true" />
      ) : (
        <CopyIcon size={14} strokeWidth={1.3} aria-hidden="true" />
      )}
    </Button>
  );
};

const COMMIT_DELAY_MS = 300;

// Free-text values are kept as a local draft and committed (debounced, on
// blur, or when the popover closes) so typing doesn't write to storage and
// re-render every operation on each keystroke.
const ServerVariableInput = ({
  name,
  placeholder,
  value,
  onCommit,
}: {
  name: string;
  placeholder: string;
  value: string;
  onCommit: (name: string, value: string) => void;
}) => {
  const [draft, setDraft] = useState(value);

  const commitDraft = useEffectEvent(() => {
    if (draft !== value) onCommit(name, draft);
  });

  useEffect(() => {
    if (draft === value) return;
    const timeout = setTimeout(commitDraft, COMMIT_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [draft, value]);

  // Flush a pending edit when the input unmounts (e.g. the popover closes)
  // before the debounce fires.
  useEffect(() => () => commitDraft(), []);

  return (
    <Input
      // 16px text on small screens keeps iOS Safari from zooming on focus
      className="h-9 sm:h-8 font-mono text-base sm:text-xs"
      value={draft}
      placeholder={placeholder}
      aria-label={`Value for server variable ${name}`}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== value) onCommit(name, draft);
      }}
    />
  );
};

const ServerVariablesPopover = ({
  resolvedServer,
  variables,
  variableValues,
  setVariable,
}: {
  resolvedServer: string;
  variables: ServerVariableDefinition[];
  variableValues: Record<string, string>;
  setVariable: (name: string, value: string) => void;
}) => {
  const [, startTransition] = useTransition();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Edit server variables"
          title="Edit server variables"
        >
          <SlidersHorizontalIcon
            size={14}
            strokeWidth={1.3}
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={16}
        className="w-80 max-w-(--radix-popover-content-available-width) max-h-(--radix-popover-content-available-height) overflow-y-auto flex flex-col gap-3"
      >
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Server variables</span>
          <code className="text-xs text-muted-foreground break-all">
            {resolvedServer}
          </code>
        </div>
        {variables.map((variable) => (
          <div key={variable.name} className="flex flex-col gap-1">
            <span className="font-mono text-xs font-medium">
              {variable.name}
            </span>
            {variable.enum && variable.enum.length > 0 ? (
              <SimpleSelect
                className="font-mono text-base sm:text-xs border-input bg-transparent dark:bg-input/30 dark:hover:bg-input/50 py-1.5"
                value={getServerVariableValue(variable, variableValues)}
                showChevrons
                aria-label={`Value for server variable ${variable.name}`}
                onChange={(e) =>
                  startTransition(() =>
                    setVariable(variable.name, e.target.value),
                  )
                }
                options={variable.enum.map((value) => ({
                  value,
                  label: value,
                }))}
              />
            ) : (
              <ServerVariableInput
                name={variable.name}
                placeholder={variable.default}
                value={variableValues[variable.name] ?? ""}
                onCommit={setVariable}
              />
            )}
            {variable.description && (
              <p className="text-xs text-muted-foreground">
                {variable.description}
              </p>
            )}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
};

export const Endpoint = () => {
  const { input, type } = useOasConfig();
  const query = useCreateQuery(ServersQuery, { input, type });
  const result = useSuspenseQuery(query);
  const [, startTransition] = useTransition();
  const { servers } = result.data.schema;
  const {
    selectedServer,
    setSelectedServer,
    resolvedServer,
    variables,
    variableValues,
    setVariable,
    serverVariableOverrides,
  } = useSelectedServer(servers);

  if (servers.length <= 1 && variables.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-nowrap">
      <span className="font-medium text-sm">Server</span>
      {servers.length > 1 ? (
        <SimpleSelect
          className="font-mono text-xs border-input bg-transparent dark:bg-input/30 dark:hover:bg-input/50 py-1.5 max-w-[450px] truncate"
          onChange={(e) =>
            startTransition(() => setSelectedServer(e.target.value))
          }
          value={selectedServer}
          showChevrons
          aria-label="Select server"
          options={servers.map((server) => ({
            value: server.url,
            label: getServerLabel(server, serverVariableOverrides[server.url]),
          }))}
        />
      ) : (
        <span className="font-mono text-xs min-w-0 max-w-[450px] truncate">
          {resolvedServer}
        </span>
      )}
      <CopyButton url={resolvedServer} />
      {variables.length > 0 && (
        <ServerVariablesPopover
          // Remount when switching servers so input drafts start from that
          // server's stored values.
          key={selectedServer}
          resolvedServer={resolvedServer}
          variables={variables}
          variableValues={variableValues}
          setVariable={setVariable}
        />
      )}
    </div>
  );
};
