---
title: Build an agent-ready developer portal
sidebar_icon: bot
description:
  Publish truthful API and MCP discovery while keeping runtime and external responsibilities
  explicit.
---

Zudoku already publishes per-page Markdown, `llms.txt`, `llms-full.txt`, and a sitemap when their
ordinary documentation options are enabled. The bundled agentic plugin adds API and MCP discovery
without asking you to configure protocol filenames or choose a primary API.

```tsx title="zudoku.config.tsx"
import { agenticPlugin } from "zudoku/plugins/agentic";

const config = {
  canonicalUrlOrigin: "https://developers.example.com",
  docs: {
    publishMarkdown: true,
    llms: { llmsTxt: true, llmsTxtFull: true },
  },
  plugins: [agenticPlugin()],
};
```

`canonicalUrlOrigin` is recommended on every deployment. On Vercel, Zudoku can use
`VERCEL_PROJECT_PRODUCTION_URL` when it is not configured. Origin-bound discovery is skipped with a
build warning when neither value is available.

## What the plugin publishes

The plugin uses the final processed OpenAPI document for file and raw inputs. It inspects URL inputs
at build time for their title and MCP extensions, while continuing to link to the authoritative
configured URL. It then:

- publishes one API at `/openapi.json`, or multiple API versions at deterministic
  `/openapi/<api-path>/<version>.json` paths;
- publishes ARD v0.91 at `/.well-known/ard.json`;
- publishes an RFC 9727 API catalog at `/.well-known/api-catalog`;
- adds API and MCP sections to Zudoku's existing `llms.txt` output; and
- derives MCP entries from root `x-mcp` and operation `x-mcp-server` extensions.

Unknown authentication, tools, transport details, representative queries, pricing, ratings, and
capabilities are omitted rather than guessed. Incomplete optional metadata produces a build warning.
Protected API reference routes are excluded from every public discovery output.

All configured APIs are discoverable unless you opt one out. An explicit publication path is a
root-relative canonical alias for that API; it does not hide other configured APIs.

```tsx title="zudoku.config.tsx"
const config = {
  apis: [
    {
      type: "file",
      input: "./openapi.yaml",
      path: "api",
      publish: { path: "/openapi.json" },
    },
    {
      type: "file",
      input: "./internal.yaml",
      path: "internal",
      discoverable: false,
    },
  ],
};
```

An MCP extension can similarly set `discoverable: false`. Declare real tool names in the existing
`tools` array when they are known; an absent list remains absent in ARD. Root `x-mcp` discovery also
requires the extension's standard `protocolVersion` field. Malformed extensions are skipped with a
build warning instead of making the portal claim unsupported behavior.

## Site metadata is ordinary configuration

Open Graph and JSON-LD are core metadata, independent of the agentic plugin:

```tsx title="zudoku.config.tsx"
const config = {
  metadata: {
    description: "Build with the Example APIs",
    openGraph: {
      type: "website",
      image: "https://developers.example.com/og.png",
    },
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Example",
        url: "https://example.com",
      },
    ],
  },
};
```

Only publish truthful structured data. Zudoku safely serializes JSON-LD, but it cannot supply your
organization identity, pricing, reviews, ratings, or trust claims.

## Vercel

Generated Build Output API v3 routes include discovery aliases, exact content types, CORS, cache
policy, `Link` headers, and GET/HEAD behavior. A source `vercel.json` only needs the build contract:

```json title="vercel.json"
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": null,
  "buildCommand": "pnpm run build",
  "outputDirectory": null
}
```

For another hosting provider or a portal mounted below an origin path, route the two origin-root
well-known URLs to the scoped files in the build output. Zudoku fails a Vercel build when an
authored redirect, rewrite, or static file would shadow a generated discovery route.

## Responsibility matrix

| Check                            | Treatment                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| Wikipedia/Wikidata               | **Documented:** external notability and registry work                                 |
| Brand search discoverability     | **Documented:** indexing, citations, and consistent identity                          |
| Developer-resource discovery     | **Automatic/configurable:** Markdown and LLM outputs plus generated API/MCP links     |
| AI crawler policy                | **Documented:** author your own `robots.txt`; Zudoku does not impose a policy         |
| ChatGPT app listing              | **Documented:** external submission                                                   |
| ARD                              | **Automatic:** `agenticPlugin()`                                                      |
| npm/PyPI SDK                     | **Documented:** package generation and publication                                    |
| Agent Plugin manifest            | **Documented:** repository/package-owned manifest                                     |
| skills.sh listing                | **Documented:** external publication                                                  |
| Published OpenAPI                | **Automatic/configurable:** schema download, canonical publisher, and plugin defaults |
| Developer portal                 | **Automatic:** Zudoku                                                                 |
| JSON-LD                          | **Configurable:** `metadata.jsonLd`                                                   |
| Accessible pricing               | **Documented:** truthful product content                                              |
| Agent instructions               | **Configurable:** `docs.llms.instructions`                                            |
| Sitemap                          | **Configurable:** sitemap generator                                                   |
| Agent Skills index               | **Documented:** publish only real skills                                              |
| A2A card                         | **Documented:** requires an actual A2A runtime                                        |
| `pricing.md`                     | **Documented/existing:** author the page; Markdown publication serves it              |
| MCP discovery                    | **Automatic when declared:** `x-mcp` and `x-mcp-server` feed ARD and `llms.txt`       |
| `?mode=agent`                    | **Documented:** scanner-specific runtime view                                         |
| Markdown URL fallback            | **Automatic:** `.md` twins and `index.md`                                             |
| skills.sh quality                | **Documented:** skill authoring and validation                                        |
| JSON-LD `sameAs`                 | **Configurable:** ordinary JSON-LD                                                    |
| Organization completeness        | **Configurable:** truthful JSON-LD fields                                             |
| Schema type breadth              | **Configurable:** ordinary JSON-LD; never invent reviews or ratings                   |
| RFC 9727 catalog                 | **Automatic:** `agenticPlugin()`                                                      |
| Content without JavaScript       | **Automatic:** SSR and prerendered HTML                                               |
| NLWeb schema feeds               | **Documented:** runtime/content-feed ownership                                        |
| HTTP `Link` headers              | **Automatic:** Markdown and generated discovery relations                             |
| Modular `llms.txt`               | **Configurable:** each base-path deployment gets its scoped file                      |
| Metadata completeness            | **Configurable:** canonical, language, Open Graph, and description                    |
| Trust pages                      | **Documented:** meaningful About, Contact, and Privacy content                        |
| Markdown agent docs              | **Automatic:** explicit Markdown outputs                                              |
| Markdown negotiation             | **Automatic:** `Accept: text/markdown` negotiation                                    |
| Bot-UA Markdown                  | **Documented:** optional host behavior; `Accept` negotiation is canonical             |
| Reachable public API             | **Documented:** API runtime ownership                                                 |
| MCP runtime/manifest             | **Documented:** runtime ownership; discovery comes from OpenAPI                       |
| OAuth 2.0                        | **Documented:** authorization-server ownership                                        |
| Scoped permissions               | **Configurable:** OpenAPI security schemes and schema audit                           |
| WebMCP                           | **Documented:** application behavior and consent                                      |
| JSON API errors                  | **Documented:** API runtime contract                                                  |
| Agent-auth metadata              | **Documented:** resource/auth-server ownership                                        |
| CLI                              | **Documented:** external package publication                                          |
| Multi-language SDKs              | **Documented:** external package generation/publication                               |
| Onboarding friction              | **Documented:** keys, free tier, and sandbox product decisions                        |
| Web Bot Auth                     | **Documented:** cryptographic runtime deployment                                      |
| RFC 9728 metadata                | **Documented:** resource-server ownership                                             |
| `auth.md`                        | **Documented:** owner-authored authentication workflow                                |
| `auth.md` structure              | **Documented:** version-pinned format guidance                                        |
| Agent-auth endpoint reachability | **Documented:** live endpoint ownership                                               |
| MCP server card                  | **Documented:** publish only a real conforming card                                   |
| Product and docs MCP coverage    | **Documented:** implement both runtimes; the plugin surfaces declared servers         |
| Sandbox                          | **Documented:** product/runtime responsibility                                        |
| Schema complexity                | **Configurable:** OpenAPI quality audit                                               |
| Function-calling compatibility   | **Configurable:** OpenAPI quality audit                                               |
| `WWW-Authenticate` hint          | **Documented:** API runtime behavior                                                  |
| NLWeb `/ask`                     | **Documented:** runtime implementation                                                |
| NLWeb streaming                  | **Documented:** runtime streaming                                                     |
| Agent-friendly 404               | **Automatic:** real status and Markdown recovery links                                |
