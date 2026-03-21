import { useSuspenseQuery } from "@tanstack/react-query";
import { Helmet } from "@zudoku/react-helmet-async";
import {
  BracesIcon,
  GlobeIcon,
  InfoIcon,
  KeyRoundIcon,
  LockIcon,
  MailIcon,
  ShieldCheckIcon,
  TagIcon,
  WebhookIcon,
} from "lucide-react";
import type { PropsWithChildren, ReactNode } from "react";
import { Link } from "react-router";
import { Separator } from "zudoku/ui/Separator.js";
import { Markdown } from "../../components/Markdown.js";
import { PagefindSearchMeta } from "../../components/PagefindSearchMeta.js";
import { Badge } from "../../ui/Badge.js";
import { Button } from "../../ui/Button.js";
import { Card, CardContent } from "../../ui/Card.js";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "../../ui/Item.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/Popover.js";
import { slugify } from "../../util/slugify.js";
import { ApiHeader } from "./ApiHeader.js";
import { useCreateQuery } from "./client/useCreateQuery.js";
import { useOasConfig } from "./context.js";
import type {
  SchemaInfoQuery as SchemaInfoQueryType,
  SecuritySchemeType,
} from "./graphql/graphql.js";
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
        securitySchemes {
          name
          type
          description
          in
          paramName
          scheme
          bearerFormat
          openIdConnectUrl
          flows {
            implicit {
              authorizationUrl
              scopes {
                name
                description
              }
            }
            password {
              tokenUrl
              scopes {
                name
                description
              }
            }
            clientCredentials {
              tokenUrl
              scopes {
                name
                description
              }
            }
            authorizationCode {
              authorizationUrl
              tokenUrl
              scopes {
                name
                description
              }
            }
          }
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

const InfoLink = ({
  href,
  icon,
  children,
}: PropsWithChildren<{ href?: string; icon?: ReactNode }>) => (
  <a
    href={href}
    className="inline-flex items-center gap-2 opacity-65 hover:opacity-100 [&_svg]:shrink-0 [&_svg]:size-3.5"
    target="_blank"
    rel="noopener noreferrer"
  >
    {icon}
    <span className="truncate grow-0">{children}</span>
  </a>
);

const InfoCardContent = ({
  schema,
}: {
  schema: SchemaInfoQueryType["schema"];
}) => {
  const hasInfoLinks = !!(
    schema.license ||
    schema.termsOfService ||
    schema.externalDocs
  );
  const hasContact = !!(
    schema.contact?.name ||
    schema.contact?.email ||
    schema.contact?.url
  );
  const hasServers = schema.servers.length > 0;

  return (
    <CardContent className="flex flex-col gap-3 text-sm">
      {hasInfoLinks && (
        <div className="flex flex-col gap-1.5">
          {schema.license && (
            <InfoLink href={schema.license.url ?? undefined}>
              {schema.license.name}
            </InfoLink>
          )}
          {schema.termsOfService && (
            <InfoLink href={schema.termsOfService}>Terms of Service</InfoLink>
          )}
          {schema.externalDocs && (
            <InfoLink href={schema.externalDocs.url}>
              {schema.externalDocs.description ?? "Documentation"}
            </InfoLink>
          )}
        </div>
      )}
      {hasInfoLinks && (hasContact || hasServers) && <Separator />}
      {hasContact && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Contact
          </span>
          {schema.contact?.name && <span>{schema.contact.name}</span>}
          {schema.contact?.email && (
            <InfoLink
              href={`mailto:${schema.contact.email}`}
              icon={<MailIcon />}
            >
              {schema.contact.email}
            </InfoLink>
          )}
          {schema.contact?.url && (
            <InfoLink href={schema.contact.url} icon={<GlobeIcon />}>
              {schema.contact.url}
            </InfoLink>
          )}
        </div>
      )}
      {hasContact && hasServers && <Separator />}
      {hasServers && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Servers
          </span>
          {schema.servers.map((server) => (
            <div key={server.url}>
              <code className="text-xs select-all break-all">{server.url}</code>
              {server.description && (
                <p className="text-muted-foreground text-xs">
                  {server.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </CardContent>
  );
};

const securitySchemeIcon = (type: SecuritySchemeType) => {
  switch (type) {
    case "apiKey":
      return <KeyRoundIcon size={14} />;
    case "http":
      return <LockIcon size={14} />;
    case "oauth2":
      return <ShieldCheckIcon size={14} />;
    case "openIdConnect":
      return <ShieldCheckIcon size={14} />;
    case "mutualTLS":
      return <LockIcon size={14} />;
  }
};

const securitySchemeDescription = (scheme: {
  type: SecuritySchemeType;
  in?: string | null;
  paramName?: string | null;
  scheme?: string | null;
  bearerFormat?: string | null;
  openIdConnectUrl?: string | null;
}) => {
  switch (scheme.type) {
    case "apiKey":
      return `API Key in ${scheme.in ?? "header"} (${scheme.paramName ?? "key"})`;
    case "http":
      return scheme.scheme === "bearer"
        ? `Bearer token${scheme.bearerFormat ? ` (${scheme.bearerFormat})` : ""}`
        : `HTTP ${scheme.scheme ?? "authentication"}`;
    case "oauth2":
      return "OAuth 2.0 authorization";
    case "openIdConnect":
      return "OpenID Connect";
    case "mutualTLS":
      return "Mutual TLS authentication";
  }
};

export const SchemaInfo = () => {
  const { input, type, options } = useOasConfig();
  const query = useCreateQuery(SchemaInfoQuery, { input, type });
  const {
    data: { schema },
  } = useSuspenseQuery(query);
  const { title, description } = schema;

  useWarmupSchema();

  const hasCardContent = !!(
    schema.contact?.name ||
    schema.contact?.email ||
    schema.contact?.url ||
    schema.servers.length > 0 ||
    schema.license ||
    schema.termsOfService ||
    schema.externalDocs
  );

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

      <div className="mb-8 flex flex-col gap-4">
        <ApiHeader heading={title} headingId="description" />

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_minmax(250px,380px)] gap-8">
          {hasCardContent && (
            <div className="xl:hidden sticky top-(--top-nav-height) lg:top-(--scroll-padding) z-10 row-start-1 col-start-1 justify-self-end self-start">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shadow-sm rounded-full"
                  >
                    <InfoIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="xl:hidden w-full max-w-full md:max-w-sm"
                >
                  <InfoCardContent schema={schema} />
                </PopoverContent>
              </Popover>
            </div>
          )}
          <div className="flex flex-col gap-6 row-start-1 col-start-1">
            {schema.summary && (
              <p className="text-lg text-muted-foreground">{schema.summary}</p>
            )}
            {schema.description && (
              <Markdown
                className="prose-img:max-w-prose prose-sm max-w-full lg:max-w-2xl"
                content={schema.description}
              />
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
                            <ItemDescription asChild>
                              <Markdown
                                components={{
                                  // Because the description is wrapped in a <p> and a <Link> already
                                  p: ({ children }) => children,
                                  a: (props) => <span {...props} />,
                                }}
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
            {options?.enableSecurity &&
              (schema.components?.securitySchemes?.length ?? 0) > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground mb-4">
                    <LockIcon size={14} />
                    Security Schemes
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {schema.components?.securitySchemes?.map((scheme) => (
                      <Item key={scheme.name} variant="outline">
                        <ItemContent>
                          <ItemTitle className="flex items-center gap-2">
                            {securitySchemeIcon(scheme.type)}
                            {scheme.name}
                          </ItemTitle>
                          <ItemDescription>
                            {scheme.description ??
                              securitySchemeDescription(scheme)}
                          </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                          <Badge
                            variant="muted"
                            className="text-[10px] font-mono"
                          >
                            {scheme.type}
                          </Badge>
                        </ItemActions>
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
                        <Badge
                          variant="muted"
                          className="text-[10px] font-mono"
                        >
                          {webhook.method}
                        </Badge>
                      </ItemActions>
                    </Item>
                  ))}
                </div>
              </div>
            )}
          </div>
          {hasCardContent && (
            <div className="hidden xl:block">
              <Card className="sticky top-(--scroll-padding)">
                <InfoCardContent schema={schema} />
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
