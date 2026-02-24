import slugify from "@sindresorhus/slugify";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Helmet } from "@zudoku/react-helmet-async";
import {
  BracesIcon,
  ExternalLinkIcon,
  FileTextIcon,
  GlobeIcon,
  MailIcon,
  ScaleIcon,
  ServerIcon,
  TagIcon,
  UserIcon,
  WebhookIcon,
} from "lucide-react";
import { Link } from "react-router";
import { Markdown } from "../../components/Markdown.js";
import { PagefindSearchMeta } from "../../components/PagefindSearchMeta.js";
import { Badge } from "../../ui/Badge.js";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../ui/Card.js";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "../../ui/Item.js";
import { ApiHeader } from "./ApiHeader.js";
import { useCreateQuery } from "./client/useCreateQuery.js";
import { useOasConfig } from "./context.js";
import { graphql } from "./graphql/index.js";
import { useWarmupSchema } from "./util/useWarmupSchema.js";

const SchemaInfoQuery = graphql(/* GraphQL */ `
  query SchemaInfo($input: JSON!, $type: SchemaType!) {
    schema(input: $input, type: $type) {
      servers {
        url
        description
      }
      license {
        name
        url
        identifier
      }
      termsOfService
      externalDocs {
        description
        url
      }
      contact {
        name
        url
        email
      }
      description
      summary
      title
      url
      version
      tags {
        name
        description
      }
      components {
        schemas {
          name
        }
      }
      webhooks {
        name
        method
        summary
        description
      }
    }
  }
`);

export const SchemaInfo = () => {
  const { input, type } = useOasConfig();
  const query = useCreateQuery(SchemaInfoQuery, { input, type });
  const result = useSuspenseQuery(query);
  const {
    data: { schema },
  } = result;
  const title = schema.title;
  const description = schema.description;

  useWarmupSchema();

  const hasContact =
    schema.contact?.name || schema.contact?.email || schema.contact?.url;
  const hasServers = schema.servers.length > 0;
  const hasInfoLinks =
    schema.license || schema.termsOfService || schema.externalDocs;

  const tags = schema.tags.flatMap(({ name, description }) =>
    name ? { name, description } : [],
  );

  return (
    <div
      className="pt-(--padding-content-top)"
      data-pagefind-filter="section:openapi"
      data-pagefind-meta="section:openapi"
    >
      <PagefindSearchMeta name="category">{title}</PagefindSearchMeta>
      <Helmet>
        {title && <title>{title}</title>}
        {description && <meta name="description" content={description} />}
      </Helmet>

      <div className="mb-8 flex flex-col gap-6">
        <div className="flex justify-between gap-4">
          <ApiHeader heading={title} headingId="description" />
        </div>
        <Card>
          <CardContent className="flex flex-col gap-4">
            {schema.summary && (
              <p className="text-lg text-muted-foreground">{schema.summary}</p>
            )}
            {schema.description && (
              <Markdown
                className="max-w-3/4 prose-img:max-w-prose prose-sm"
                content={schema.description}
              />
            )}
          </CardContent>
          {hasInfoLinks && (
            <CardFooter className="flex flex-wrap gap-6 text-sm">
              {schema.license && (
                <a
                  href={schema.license.url ?? undefined}
                  className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  {...(schema.license.url
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  <ScaleIcon size={14} />
                  {schema.license.name}
                  {schema.license.url && <ExternalLinkIcon size={12} />}
                </a>
              )}
              {schema.termsOfService && (
                <a
                  href={schema.termsOfService}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <FileTextIcon size={14} />
                  Terms of Service
                  <ExternalLinkIcon size={12} />
                </a>
              )}
              {schema.externalDocs && (
                <a
                  href={schema.externalDocs.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <FileTextIcon size={14} />
                  {schema.externalDocs.description ?? "Documentation"}
                  <ExternalLinkIcon size={12} />
                </a>
              )}
            </CardFooter>
          )}
        </Card>
        {(hasContact || hasServers) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hasContact && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                    <UserIcon size={14} />
                    Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm">
                  {schema.contact?.name && (
                    <span className="font-medium">{schema.contact.name}</span>
                  )}
                  {schema.contact?.email && (
                    <a
                      href={`mailto:${schema.contact.email}`}
                      className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <MailIcon size={14} />
                      {schema.contact.email}
                    </a>
                  )}
                  {schema.contact?.url && (
                    <a
                      href={schema.contact.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <GlobeIcon size={14} />
                      {schema.contact.url}
                    </a>
                  )}
                </CardContent>
              </Card>
            )}
            {hasServers && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                    <ServerIcon size={14} />
                    Servers
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-sm">
                  {schema.servers.map((server) => (
                    <div key={server.url} className="flex items-start gap-2">
                      <span className="mt-1.5 size-2 rounded-full bg-emerald-500 shrink-0" />
                      <div className="truncate">
                        <code className="text-xs">{server.url}</code>
                        {server.description && (
                          <p className="text-muted-foreground text-xs">
                            {server.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
        {tags.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground mb-4">
              <TagIcon size={14} />
              Tags
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tags.map((tag) => (
                <Item key={tag.name} variant="outline" asChild>
                  <Link to={slugify(tag.name)}>
                    <ItemContent>
                      <ItemTitle>{tag.name}</ItemTitle>
                      {tag.description && (
                        <ItemDescription>
                          <Markdown
                            components={{ p: ({ children }) => children }}
                            content={tag.description}
                            className="prose-sm text-pretty"
                          />
                        </ItemDescription>
                      )}
                    </ItemContent>
                  </Link>
                </Item>
              ))}
            </div>
          </div>
        )}
        {(schema.components?.schemas?.length ?? 0) > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground mb-4">
              <BracesIcon size={14} />
              Schemas
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
              {schema.components?.schemas?.map((s) => (
                <Item key={s.name} variant="outline" title={s.name} asChild>
                  <Link to={`~schemas#${slugify(s.name)}`}>
                    <span className="text-sm font-medium leading-snug truncate">
                      {s.name}
                    </span>
                  </Link>
                </Item>
              ))}
            </div>
          </div>
        )}
        {schema.webhooks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground mb-4">
              <WebhookIcon size={14} />
              Webhooks
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schema.webhooks.map((webhook) => (
                <Item
                  key={`${webhook.name}-${webhook.method}`}
                  variant="outline"
                >
                  <ItemContent>
                    <ItemTitle>{webhook.name}</ItemTitle>
                    {(webhook.summary || webhook.description) && (
                      <ItemDescription>
                        {webhook.summary ?? webhook.description}
                      </ItemDescription>
                    )}
                  </ItemContent>
                  <ItemActions>
                    <Badge variant="muted" className="text-[10px] font-mono">
                      {webhook.method}
                    </Badge>
                  </ItemActions>
                </Item>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
