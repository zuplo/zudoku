import slugify from "@sindresorhus/slugify";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Helmet } from "@zudoku/react-helmet-async";
import { Link, useNavigate } from "react-router";
import { Callout } from "zudoku/components";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "zudoku/ui/Select.js";
import { Heading } from "../../components/Heading.js";
import { Markdown } from "../../components/Markdown.js";
import { PagefindSearchMeta } from "../../components/PagefindSearchMeta.js";
import { useCreateQuery } from "./client/useCreateQuery.js";
import { useOasConfig } from "./context.js";
import { DownloadSchemaButton } from "./DownloadSchemaButton.js";
import { Endpoint } from "./Endpoint.js";
import { graphql } from "./graphql/index.js";

const SchemaWarmupQuery = graphql(/* GraphQL */ `
  query SchemaWarmup($input: JSON!, $type: SchemaType!) {
    schema(input: $input, type: $type) {
      openapi
    }
  }
`);

const SchemaInfoQuery = graphql(/* GraphQL */ `
  query SchemaInfo($input: JSON!, $type: SchemaType!) {
    schema(input: $input, type: $type) {
      servers {
        url
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
    }
  }
`);

export const SchemaInfo = () => {
  const { input, type, versions, version, options } = useOasConfig();
  const query = useCreateQuery(SchemaInfoQuery, {
    input,
    type,
  });
  const result = useSuspenseQuery(query);
  const {
    data: { schema },
  } = result;
  // Global server selection for the dropdown UI
  const title = schema.title;
  const description = schema.description;
  const navigate = useNavigate();

  // This is to warmup (i.e. load the schema in the background) the schema on the client, if the page has been rendered on the server
  const warmupQuery = useCreateQuery(SchemaWarmupQuery, { input, type });
  useQuery({
    ...warmupQuery,
    enabled: typeof window !== "undefined",
    notifyOnChangeProps: [],
  });

  const hasMultipleVersions = Object.entries(versions).length > 1;

  const showVersions =
    options?.showVersionSelect === "always" ||
    (hasMultipleVersions && options?.showVersionSelect !== "hide");

  const currentVersion = version != null ? versions[version] : undefined;
  const downloadUrl =
    typeof input === "string"
      ? type === "url"
        ? input
        : currentVersion?.downloadUrl
      : undefined;

  const helmetTitle = title;

  return (
    <div
      className="pt-(--padding-content-top)"
      data-pagefind-filter="section:openapi"
      data-pagefind-meta="section:openapi"
    >
      <PagefindSearchMeta name="category">{title}</PagefindSearchMeta>
      <Helmet>
        {helmetTitle && <title>{helmetTitle}</title>}
        {description && <meta name="description" content={description} />}
      </Helmet>

      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row justify-around items-start sm:items-end mb-4">
          <div className="flex flex-col flex-1 gap-2">
            <Heading
              level={1}
              id="description"
              registerNavigationAnchor
              className="mb-0"
            >
              {title}
              {showVersions && (
                <span className="text-xl text-muted-foreground ms-1.5">
                  {" "}
                  ({schema.version})
                </span>
              )}
            </Heading>
            <Endpoint />
          </div>
          <div className="flex flex-col gap-4 sm:items-end">
            <div className="flex gap-2 items-center">
              {showVersions && (
                <Select
                  onValueChange={(version) =>
                    // biome-ignore lint/style/noNonNullAssertion: is guaranteed to be defined
                    navigate(versions[version]!.path)
                  }
                  defaultValue={version}
                  disabled={!hasMultipleVersions}
                >
                  <SelectTrigger className="w-[180px]" size="sm">
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(versions).map(([version, { label }]) => (
                      <SelectItem key={version} value={version}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {options?.schemaDownload?.enabled && downloadUrl && (
                <DownloadSchemaButton downloadUrl={downloadUrl} />
              )}
            </div>
          </div>
        </div>
        <div>
          <Callout icon={false} type="note">
            {schema.contact?.email && (
              <div>
                <b>{schema.contact?.name ?? "Contact"}</b>:{" "}
                <a href={`mailto: ${schema.contact.email}`}>
                  {schema.contact.email}
                </a>
              </div>
            )}
            {schema.contact?.url && (
              <div>
                <b>URL</b>:{" "}
                <a href={schema.contact.url}>{schema.contact.url}</a>
              </div>
            )}
            {schema.license && (
              <div>
                <b>License</b>:{" "}
                {schema.license.url ? (
                  <a href={schema.license.url}>{schema.license.name}</a>
                ) : (
                  schema.license.name
                )}
              </div>
            )}
            {schema.termsOfService && (
              <div>
                <b>Terms of Service</b>:{" "}
                <a href={schema.termsOfService}>{schema.termsOfService}</a>
              </div>
            )}
            {schema.externalDocs && (
              <div>
                <b>Read more</b>:{" "}
                <a href={schema.externalDocs.url}>{schema.externalDocs.url}</a>
              </div>
            )}
          </Callout>

          {schema.description && (
            <Markdown
              className="max-w-full prose-img:max-w-prose border-border lg:pt-5 pb-10"
              content={schema.description}
            />
          )}
        </div>
        <Heading level={2}>Tags</Heading>
        {schema.tags.map((tag) => (
          <div key={tag.name} className="p-3">
            {tag.name && (
              <Heading level={3}>
                <Link to={slugify(tag.name)}>{tag.name}</Link>
              </Heading>
            )}
            {tag.description && (
              <Markdown
                className="max-w-full prose-img:max-w-prose border-border pb-3"
                content={tag.description}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
