import { CheckIcon, CopyIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { useQuery } from "urql";
import { useSelectedServerStore } from "../../authentication/state.js";
import { InlineCode } from "../../components/InlineCode.js";
import { Button } from "../../ui/Button.js";
import { useOasConfig } from "./context.js";
import { graphql } from "./graphql/index.js";
import { SimpleSelect } from "./SimpleSelect.js";

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
      size="icon"
    >
      {isCopied ? (
        <CheckIcon className="text-green-600" size={14} />
      ) : (
        <CopyIcon size={14} strokeWidth={1.3} />
      )}
    </Button>
  );
};

const context = { suspense: true } as const;

export const Endpoint = () => {
  const [result] = useQuery({
    query: ServersQuery,
    variables: useOasConfig(),
    context,
  });
  const [, startTransition] = useTransition();
  const { selectedServer, setSelectedServer } = useSelectedServerStore();

  if (!result.data) return null;

  const { servers } = result.data.schema;

  if (servers.length === 1) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm">Endpoint:</span>
        <InlineCode className="text-xs px-2 py-1.5" selectOnClick>
          {servers[0].url}
        </InlineCode>
        <CopyButton url={servers[0].url} />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-medium text-sm">
        {servers.length > 1 ? "Endpoints" : "Endpoint"}:
      </span>

      <SimpleSelect
        className="font-mono text-xs bg-border/50 dark:bg-border/70 py-1.5 max-w-[450px] truncate"
        onChange={(e) =>
          startTransition(() => {
            setSelectedServer(e.target.value);
          })
        }
        value={selectedServer ?? result.data.schema.url}
        showChevrons={servers.length > 1}
        options={servers.map((server) => ({
          value: server.url,
          label: server.url,
        }))}
      />
      <CopyButton url={selectedServer ?? result.data.schema.url} />
    </div>
  );
};
