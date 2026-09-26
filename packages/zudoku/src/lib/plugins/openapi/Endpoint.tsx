import { useSuspenseQuery } from "@tanstack/react-query";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { Input } from "zudoku/ui/Input.js";
import { Button } from "../../ui/Button.js";
import { useCreateQuery } from "./client/useCreateQuery.js";
import { useOasConfig } from "./context.js";
import { graphql } from "./graphql/index.js";
import { SimpleSelect } from "./SimpleSelect.js";
import { useSelectedServer } from "./state.js";
import { getServerLabel } from "./util/resolveServerUrl.js";

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
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 flex-nowrap">
        <span className="font-medium text-sm">Server</span>
        {servers.length > 1 && (
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
              label: getServerLabel(
                server,
                serverVariableOverrides[server.url],
              ),
            }))}
          />
        )}
        <CopyButton url={resolvedServer} />
      </div>
      {variables.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {variables.map((variable) => (
            <div
              key={variable.name}
              className="flex items-center gap-1.5 text-xs"
              title={variable.description ?? undefined}
            >
              <span className="text-muted-foreground font-mono">
                {variable.name}
              </span>
              {variable.enum && variable.enum.length > 0 ? (
                <SimpleSelect
                  className="font-mono text-xs border-input bg-transparent dark:bg-input/30 dark:hover:bg-input/50 py-1 max-w-40"
                  value={variableValues[variable.name] ?? variable.default}
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
                <Input
                  className="h-7 w-32 font-mono text-xs py-1"
                  value={variableValues[variable.name] ?? ""}
                  placeholder={variable.default}
                  aria-label={`Value for server variable ${variable.name}`}
                  onChange={(e) =>
                    startTransition(() =>
                      setVariable(variable.name, e.target.value),
                    )
                  }
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
