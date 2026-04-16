---
title: x-tagGroups
sidebar_icon: folder-tree
---

Use `x-tagGroups` to organize tags into named groups in the API navigation sidebar. Without this
extension, tags appear as a flat list. With tag groups, related tags are nested under group
headings.

## Location

The extension is added at the **Root Object** level — the outermost level of the OpenAPI
description.

| Option        | Type                 | Description                                |
| ------------- | -------------------- | ------------------------------------------ |
| `x-tagGroups` | `[Tag Group Object]` | Array of tag groups for navigation layout. |

## Tag Group Object

| Property | Type       | Required | Description                                  |
| -------- | ---------- | -------- | -------------------------------------------- |
| `name`   | `string`   | Yes      | Display name for the group in the sidebar.   |
| `tags`   | `[string]` | Yes      | Array of tag names to include in this group. |

## Example

```yaml
openapi: 3.1.0
info:
  title: Shipping API
  version: 1.0.0

tags:
  - name: Packages
  - name: Parcels
  - name: Letters
  - name: Tracking
  - name: Billing

x-tagGroups:
  - name: Shipment
    tags:
      - Packages
      - Parcels
      - Letters
  - name: Management
    tags:
      - Tracking
      - Billing
```

This produces a sidebar like:

```
Shipment
  ├── Packages
  ├── Parcels
  └── Letters
Management
  ├── Tracking
  └── Billing
```

Tags not included in any group are appended after the defined groups.
