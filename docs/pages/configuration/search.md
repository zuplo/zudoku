---
title: Search
sidebar_icon: search-code
---

Zudoku offers search functionality that enhances user experience by enabling content discovery across your site. When configured, a search bar will appear in the header, allowing users to quickly find relevant information on any page.

We currently support two search providers:

- [Pagefind](https://pagefind.app/)
- [Inkeep](https://inkeep.com/)

## Pagefind

[Pagefind](https://pagefind.app/) is a lightweight, static search library that can be used to add search to your Zudoku site without any external services.

:::caution

While functional for production use, the Pagefind integration is still work in progress and will be improved in future releases and become the default search provider.

:::

To enable pagefind search, configure the `search` option in your configuration:

```typescript
{
  search: {
    type: "pagefind",
    // Optional: Maximum number of sub results per page
    maxSubResults: 3
    // Optional: Configure search result ranking (defaults shown below)
    ranking: {
      termFrequency: 0.8,
      pageLength: 0.6,
      termSimilarity: 1.2,
      termSaturation: 1.2,
    },
  }
}
```

For more information about how Pagefind's ranking system works and how to customize it for your content, see the [Pagefind ranking documentation](https://pagefind.app/docs/ranking/).

## Inkeep

To add Inkeep search to your site you will need to copy some variables from your [Inkeep account setting](https://portal.inkeep.com/):

- API Key
- Integration ID
- Organization ID

With these you can then configure the `search` option in [Zudoku Configuration](./overview.md):

```typescript
{
  // ...
  search: {
    type: "inkeep",
    apiKey: "<your-api-key>",
    integrationId: "<your-integration-id>",
    organizationId: "<your-organization-id>",
    primaryBrandColor: "#26D6FF",
    organizationDisplayName: "Your Organization Name",
  }
  // ...
}
```
