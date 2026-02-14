import { CheckIcon, CopyIcon, EyeIcon } from "lucide-react";
import { useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "zudoku/ui/HoverCard.js";
import { Input } from "zudoku/ui/Input.js";
import { NativeSelect, NativeSelectOption } from "zudoku/ui/NativeSelect.js";
import { Button } from "../../ui/Button.js";
import { cn } from "../../util/cn.js";
import type { Server } from "./graphql/graphql.js";
import { useSelectedServer } from "./state.js";

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
    >
      {isCopied ? (
        <CheckIcon className="text-green-600" size={14} />
      ) : (
        <CopyIcon size={14} strokeWidth={1.3} />
      )}
    </Button>
  );
};

const ResolvedUrlPreview = ({ url }: { url: string }) => (
  <HoverCard openDelay={0}>
    <HoverCardTrigger asChild>
      <Button variant="ghost" size="icon-xs">
        <EyeIcon size={14} />
      </Button>
    </HoverCardTrigger>
    <HoverCardContent className="w-fit max-w-xl flex items-center justify-between gap-2">
      <pre className="text-xs font-mono whitespace-pre-wrap break-all">
        {url}
      </pre>
      <CopyButton url={url} />
    </HoverCardContent>
  </HoverCard>
);

export const Endpoint = ({ servers }: { servers: Server[] }) => {
  const {
    selectedServer,
    selectedServerTemplate,
    selectedServerVariables,
    templateSegments,
    setSelectedServer,
    setSelectedServerVariable,
  } = useSelectedServer(servers);

  if (servers.length === 0) return null;

  const selectedServerDefinition = servers.find(
    (server) => server.url === selectedServerTemplate,
  );
  const templateVariables = selectedServerDefinition?.variables ?? [];

  return (
    <div className="border rounded-lg p-3">
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-sm">Endpoint</span>
          {servers.length > 1 && (
            <NativeSelect
              className="field-sizing-content truncate py-1 w-fit h-fit text-sm"
              value={selectedServerTemplate}
              onChange={(e) => setSelectedServer(e.target.value)}
            >
              {servers.map((server, index) => (
                <NativeSelectOption key={server.url} value={server.url}>
                  {server.description ?? `Server ${index + 1}`}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          )}
        </div>
        {selectedServerDefinition?.description && (
          <div className="text-xs text-muted-foreground">
            {selectedServerDefinition.description}
          </div>
        )}

        {templateVariables.length > 0 ? (
          <div className="font-mono text-xs flex flex-wrap items-center gap-0.5">
            {templateSegments.map((segment, index) => {
              if (segment.type === "text") {
                return (
                  // biome-ignore lint/suspicious/noArrayIndexKey: index should be stable
                  <span key={`text-${index}`} className="whitespace-pre-wrap">
                    {segment.value}
                  </span>
                );
              }

              const variable = templateVariables.find(
                (item) => item.name === segment.name,
              );
              const variableValue = selectedServerVariables[segment.name] ?? "";

              if (variable?.enumValues && variable.enumValues.length > 0) {
                return (
                  <select
                    key={`var-${segment.name}-${index}`}
                    className={cn(
                      "field-sizing-content max-w-42 border-x-0 border-t-0 border-b rounded-none font-mono text-xs!",
                      "dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                    )}
                    value={variableValue}
                    onChange={(e) => {
                      setSelectedServerVariable(segment.name, e.target.value);
                    }}
                  >
                    {variable.enumValues.map((enumValue) => (
                      <option key={enumValue} value={enumValue}>
                        {enumValue}
                      </option>
                    ))}
                  </select>
                );
              }

              return (
                <Input
                  key={`var-${segment.name}-${index}`}
                  className="field-sizing-content w-fit max-w-36 h-fit px-1 py-0.5 border-x-0 border-t-0 border-b rounded-none font-mono text-xs!"
                  value={variableValue}
                  onChange={(e) => {
                    setSelectedServerVariable(segment.name, e.target.value);
                  }}
                />
              );
            })}
            <ResolvedUrlPreview url={selectedServer} />
          </div>
        ) : (
          <div className="font-mono text-xs flex flex-wrap items-center py-1">
            {selectedServer}
          </div>
        )}
      </div>
    </div>
  );
};
