---
title: x-displayName
sidebar_icon: tag
---

Use `x-displayName` to override the display label for a tag in the API navigation and documentation.
By default, Zudoku uses the tag's `name` field. This extension lets you set a different
human-friendly label without changing the tag name used for grouping operations.

## Location

The extension is added at the **Tag Object** level.

| Option          | Type     | Description                                            |
| --------------- | -------- | ------------------------------------------------------ |
| `x-displayName` | `string` | Custom display name shown in the sidebar and headings. |

## Example

```yaml
tags:
  - name: ai-ops
    description: AI-powered operations
    x-displayName: AI Operations
  - name: user-mgmt
    description: User management endpoints
    x-displayName: User Management
```

Without `x-displayName`, the sidebar would show `ai-ops` and `user-mgmt`. With it, the sidebar
displays `AI Operations` and `User Management` instead.
