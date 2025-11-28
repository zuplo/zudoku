import { useSuspenseQuery } from "@tanstack/react-query";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { InlineCode } from "../../components/InlineCode.js";
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
    >
      {isCopied ? (
        <CheckIcon className="text-green-600" size={14} />
      ) : (
        <CopyIcon size={14} strokeWidth={1.3} />
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
  const firstServer = servers.at(0);

  if (!firstServer) return null;

  return (
    <div className="flex items-center gap-1.5 flex-nowrap">
      <span className="font-medium text-sm">Endpoint</span>
      {servers.length > 1 ? (
        <SimpleSelect
          className="font-mono text-xs border-input bg-transparent dark:bg-input/30 dark:hover:bg-input/50 py-1.5 max-w-[450px] truncate"
          onChange={(e) =>
            startTransition(() => setSelectedServer(e.target.value))
          }
          value={selectedServer}
          showChevrons={servers.length > 1}
          options={servers.map((server) => ({
            value: server.url,
            label: server.url,
          }))}
        />
      ) : (
        <InlineCode className="text-xs px-2 py-1.5" selectOnClick>
          {firstServer.url}
        </InlineCode>
      )}

      <CopyButton url={servers.length > 1 ? selectedServer : firstServer.url} />
    </div>
  );
};
