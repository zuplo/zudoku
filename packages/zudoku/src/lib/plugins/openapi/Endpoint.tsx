import { useSuspenseQuery } from "@tanstack/react-query";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "../../ui/Button.js";
import { useCreateQuery } from "./client/useCreateQuery.js";
import { useOasConfig } from "./context.js";
import { graphql } from "./graphql/index.js";
import { SimpleSelect } from "./SimpleSelect.js";
import { useSelectedServer } from "./state.js";

const ServersQuery = graphql(/* GraphQL */ `
  query ServersQuery($input: JSON!, $type: SchemaType!) {
    schema(input: $input, type: $type) {
      url
      servers {
        url
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
  const { selectedServer, setSelectedServer } = useSelectedServer(
    result.data.schema.servers,
  );

  const { servers } = result.data.schema;

  if (servers.length <= 1) return null;

  return (
    <div className="flex items-center gap-1.5 flex-nowrap">
      <span className="font-medium text-sm">Server</span>
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
          label: server.url,
        }))}
      />
      <CopyButton url={selectedServer} />
    </div>
  );
};
