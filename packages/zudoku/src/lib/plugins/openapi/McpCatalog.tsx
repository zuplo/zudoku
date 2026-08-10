import { useSuspenseQuery } from "@tanstack/react-query";
import { Head } from "@unhead/react";
import { SearchIcon, XIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { Markdown } from "../../components/Markdown.js";
import { PagefindSearchMeta } from "../../components/PagefindSearchMeta.js";
import { useHotkey } from "../../hooks/useHotkey.js";
import { Badge } from "../../ui/Badge.js";
import { Button } from "../../ui/Button.js";
import { Card, CardContent, CardHeader } from "../../ui/Card.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/Dialog.js";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../../ui/InputGroup.js";
import { Kbd } from "../../ui/Kbd.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../../ui/Select.js";
import { ToggleGroup, ToggleGroupItem } from "../../ui/ToggleGroup.js";
import { ApiHeader } from "./ApiHeader.js";
import { useCreateQuery } from "./client/useCreateQuery.js";
import { useOasConfig } from "./context.js";
import { graphql } from "./graphql/index.js";
import {
  getMcpServerTitle,
  getMcpTools,
  type McpServerData,
} from "./mcp-configs.js";
import { MCPEndpoint } from "./MCPEndpoint.js";
import { MCP_SERVER_EXTENSION } from "./util/documentType.js";
import {
  sanitizeMarkdownForMetatag,
  stripMarkdown,
} from "./util/sanitizeMarkdownForMetatag.js";

export const GetMcpCatalogQuery = graphql(`
  query GetMcpCatalog($input: JSON!, $type: SchemaType!) {
    schema(input: $input, type: $type) {
      title
      description
      tags {
        name
        slug
        operations {
          slug
          summary
          description
          operationId
          path
          extensions
          servers {
            url
          }
        }
      }
    }
  }
`);

const ALL_SERVERS = "all";
const UNTAGGED_LABEL = "Other";
const MAX_VISIBLE_CHIPS = 6;

type McpServerEntry = {
  slug: string;
  title: string;
  description: string;
  operationPath: string;
  serverUrl?: string;
  summary?: string;
  data: McpServerData;
  tags: string[];
  toolCount: number;
};

const getAvatarLetter = (label: string) =>
  label.trim().charAt(0).toUpperCase() || "?";

const matchesQuery = (server: McpServerEntry, query: string) => {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    server.title.toLowerCase().includes(q) ||
    server.description.toLowerCase().includes(q) ||
    server.tags.some((tag) => tag.toLowerCase().includes(q))
  );
};

export const McpCatalog = () => {
  const { type, input } = useOasConfig();
  const query = useCreateQuery(GetMcpCatalogQuery, { type, input });
  const {
    data: { schema },
  } = useSuspenseQuery(query);

  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const activeTag = searchParams.get("tag") ?? ALL_SERVERS;
  const selectedSlug = searchParams.get("server");

  // Operations may carry more than one tag, so the same server can appear under
  // several tags. Collapse by slug and collect the tags it belongs to.
  const servers = useMemo(() => {
    const bySlug = new Map<string, McpServerEntry>();

    for (const tag of schema.tags) {
      const tagLabel = tag.name ?? UNTAGGED_LABEL;

      for (const operation of tag.operations) {
        const data: McpServerData | undefined =
          operation.extensions?.[MCP_SERVER_EXTENSION];

        // Everything without `x-mcp-server` is REST surface, which a catalog
        // document does not render.
        if (data === undefined) continue;

        const existing = bySlug.get(operation.slug);
        if (existing) {
          if (!existing.tags.includes(tagLabel)) existing.tags.push(tagLabel);
          continue;
        }

        bySlug.set(operation.slug, {
          slug: operation.slug,
          title: getMcpServerTitle(
            data,
            operation.summary,
            operation.operationId,
          ),
          description: operation.description ?? "",
          operationPath: operation.path,
          serverUrl: operation.servers.at(0)?.url,
          summary: operation.summary ?? undefined,
          data,
          tags: [tagLabel],
          toolCount: getMcpTools(data).length,
        });
      }
    }

    return [...bySlug.values()];
  }, [schema.tags]);

  const filterChips = useMemo(() => {
    const seen = new Set<string>();
    return servers.flatMap((server) =>
      server.tags.flatMap((tag) => {
        if (seen.has(tag)) return [];
        seen.add(tag);
        return [tag];
      }),
    );
  }, [servers]);

  const visibleServers = useMemo(
    () =>
      servers.filter(
        (server) =>
          (activeTag === ALL_SERVERS || server.tags.includes(activeTag)) &&
          matchesQuery(server, search),
      ),
    [servers, activeTag, search],
  );

  const selectedServer = servers.find((server) => server.slug === selectedSlug);

  useHotkey("slash", () => {
    inputRef.current?.focus();
    inputRef.current?.select();
  });

  const setParam = (
    key: string,
    value: string | undefined,
    replace: boolean,
  ) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        return next;
      },
      { replace },
    );
  };

  const title = schema.title;

  return (
    <div
      className="pt-(--padding-content-top) pb-12"
      data-pagefind-filter="section:openapi"
      data-pagefind-meta="section:openapi"
    >
      <PagefindSearchMeta name="category">{title}</PagefindSearchMeta>
      <Head>
        <title>{title}</title>
        {schema.description && (
          <meta
            name="description"
            content={sanitizeMarkdownForMetatag(schema.description)}
          />
        )}
      </Head>

      <div className="flex flex-col gap-6">
        <ApiHeader heading={title}>
          {schema.description && (
            <Markdown
              className="max-w-full prose-img:max-w-prose"
              content={schema.description}
            />
          )}
        </ApiHeader>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <InputGroup className="max-w-md">
            <InputGroupAddon align="inline-start">
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search MCP servers…"
              aria-label="Search MCP servers"
            />
            <InputGroupAddon align="inline-end">
              {search ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <XIcon className="size-4" />
                </button>
              ) : (
                <Kbd>/</Kbd>
              )}
            </InputGroupAddon>
          </InputGroup>

          {filterChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <ToggleGroup
                size="sm"
                variant="outline"
                aria-label="Filter by category"
                spacing={2}
                value={[activeTag]}
                onValueChange={(value: string[]) => {
                  const next = value.at(0) ?? ALL_SERVERS;
                  setParam(
                    "tag",
                    next === ALL_SERVERS ? undefined : next,
                    true,
                  );
                }}
              >
                <ToggleGroupItem value={ALL_SERVERS}>All</ToggleGroupItem>
                {filterChips.slice(0, MAX_VISIBLE_CHIPS).map((chip) => (
                  <ToggleGroupItem key={chip} value={chip}>
                    {chip}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {filterChips.length > MAX_VISIBLE_CHIPS && (
                <Select
                  value={activeTag}
                  onValueChange={(value) =>
                    setParam("tag", value || undefined, true)
                  }
                >
                  <SelectTrigger
                    size="sm"
                    aria-label="More category filters"
                    className="!h-7 min-w-7 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem]"
                  >
                    More
                  </SelectTrigger>
                  <SelectContent>
                    {filterChips.slice(MAX_VISIBLE_CHIPS).map((chip) => (
                      <SelectItem key={chip} value={chip}>
                        {chip}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>

        {servers.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground text-sm">
              This API is marked as an MCP catalog but does not describe any MCP
              servers yet.
            </p>
          </div>
        ) : visibleServers.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground text-sm">
              No MCP servers match your filters.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => {
                setSearch("");
                setParam("tag", undefined, true);
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleServers.map((server) => (
              <McpServerCard
                key={server.slug}
                server={server}
                onSelect={() => setParam("server", server.slug, false)}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(selectedServer)}
        onOpenChange={(open) => {
          if (!open) setParam("server", undefined, false);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedServer && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedServer.title}</DialogTitle>
                {selectedServer.description && (
                  <DialogDescription>
                    {stripMarkdown(selectedServer.description, 280)}
                  </DialogDescription>
                )}
              </DialogHeader>
              <MCPEndpoint
                serverUrl={selectedServer.serverUrl}
                operationPath={selectedServer.operationPath}
                summary={selectedServer.summary}
                data={selectedServer.data}
              />
              <McpToolList data={selectedServer.data} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const McpServerCard = ({
  server,
  onSelect,
}: {
  server: McpServerEntry;
  onSelect: () => void;
}) => (
  <button type="button" onClick={onSelect} className="group text-start">
    <Card className="h-full">
      <CardHeader className="flex items-start gap-3">
        <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg text-base font-semibold">
          {getAvatarLetter(server.title)}
        </div>
        <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
          <span className="font-semibold leading-tight">{server.title}</span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground line-clamp-2 text-sm">
          {stripMarkdown(server.description, 240)}
        </p>
        <div className="border-t mt-2 pt-2">
          <div className="mt-auto flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {server.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="muted" className="font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
            {/* Servers described only by `x-mcp-server: true` advertise no
                tools, so the counter is omitted rather than showing zero. */}
            {server.toolCount > 0 && (
              <span className="text-muted-foreground shrink-0 text-xs font-medium">
                {server.toolCount} {server.toolCount === 1 ? "tool" : "tools"}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  </button>
);

const McpToolList = ({ data }: { data: McpServerData }) => {
  const tools = getMcpTools(data);

  if (tools.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        This server does not publish a tool list. Connect it to see the tools it
        offers.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-sm font-medium">
        {tools.length} {tools.length === 1 ? "tool" : "tools"}
      </h4>
      <ul className="flex flex-col divide-y rounded-lg border">
        {tools.map((tool) => (
          <li key={tool.name} className="flex flex-col gap-0.5 p-3">
            <code className="font-mono text-sm">{tool.name}</code>
            {tool.description && (
              <span className="text-muted-foreground text-sm">
                {tool.description}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
