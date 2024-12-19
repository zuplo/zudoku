---
title: Search
sidebar_icon: search-code
---

It is possible to add search to a Zudoku powered site. It will appear in the top navigation and persist across all pages.

## Configuration

At this time, only [Inkeep](https://inkeep.com/) is supported.

### Inkeep

To add search to your site you will need to copy some variables from your [Inkeep account setting](https://portal.inkeep.com/):

- API Key
- Integration ID
- Organization ID

With these you can then configure the `search` option in [Zudoku Configuration](./overview.md):

```typescript
{
  // ...
  search: {
    type: "inkeep"
    apiKey: "<your-api-key>",
    integrationId: "<your-integration-id>",
    organizationId: "<your-organization-id>",
    primaryBrandColor: "#26D6FF",
    organizationDisplayName: "Your Organization Name",
  }
  // ...
}
```
