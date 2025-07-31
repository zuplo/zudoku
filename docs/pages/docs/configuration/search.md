---
title: Search
sidebar_icon: search-code
description:
  Learn how to configure and customize search functionality in Zudoku, including setup instructions
  for Pagefind and Inkeep providers, result transformation, and ranking options.
---

Zudoku offers search functionality that enhances user experience by enabling content discovery
across your site. When configured, a search bar will appear in the header, allowing users to quickly
find relevant information on any page.

We currently support two search providers:

- [Pagefind](https://pagefind.app/)
- [Inkeep](https://inkeep.com/)

## Pagefind

[Pagefind](https://pagefind.app/) is a lightweight, static search library that can be used to add
search to your Zudoku site without any external services.

To enable pagefind search, configure the `search` option in your configuration:

```typescript
{
  search: {
    type: "pagefind",
    // Optional: Maximum number of sub results per page
    maxSubResults: 3,
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

### Transforming/Filtering Search Results

You can transform or filter search results using the `transformResults` option. This function
receives the search result along with the current auth state and context, allowing you to:

- Filter results based on user permissions
- Modify result content
- Add custom results

The type of `result` is the same as
[the type returned by Pagefind's search API](https://github.com/CloudCannon/pagefind/blob/03552d041d9533b09563f6c50466b25d394ece64/pagefind_web_js/types/index.d.ts#L123-L160).

```typescript
{
  search: {
    type: "pagefind",
    transformResults: ({ result, auth, context }) => {
      // Return false to filter out the result
      if (!auth.isAuthenticated) return false;

      // Return true or undefined to keep the original result
      if (result.url.includes("/private/")) return true;

      // Return a modified result
      return {
        ...result,
        title: `${result.title} (${context.meta.title})`
      };
    }
  }
}
```

For more information about how Pagefind's ranking system works and how to customize it for your
content, see the [Pagefind ranking documentation](https://pagefind.app/docs/ranking/).

## Inkeep

[Inkeep](https://inkeep.com/) is an AI-powered search and chat platform that can index your
documentation and provide intelligent search capabilities to your users.

### Setting up Inkeep Integration

Before you can use Inkeep search in your Zudoku site, you need to set up an Inkeep integration and
have your site indexed. Here's how to get started:

#### 1. Create an Inkeep Account

1. Go to [Inkeep](https://inkeep.com/) and sign up for an account
2. Navigate to the [Inkeep Portal](https://portal.inkeep.com/)

#### 2. Set up Site Indexing

1. In the Inkeep Portal, create a new project or integration
2. Configure your site URL so Inkeep can crawl and index your documentation
3. Ensure your Zudoku site is deployed and publicly accessible for indexing
4. Wait for Inkeep to crawl and index your site content (this may take some time)

#### 3. Get Your Integration Credentials

To add Inkeep search to your site you will need to copy some variables from your
[Inkeep account setting](https://portal.inkeep.com/):

- API Key
- Integration ID
- Organization ID

#### 4. Configure Zudoku

Once you have your credentials and your site is indexed, you can configure the `search` option in
your [Zudoku Configuration](./overview.md):

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
