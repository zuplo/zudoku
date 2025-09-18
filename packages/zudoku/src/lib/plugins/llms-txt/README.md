# LLMs.txt Plugin for Zudoku

This plugin automatically generates `llms.txt` and `llms-full.txt` pages from your Zudoku
documentation markdown files, following the [llms.txt specification](https://llmstxt.org/).

## Features

- **Automatic Discovery**: Scans all markdown files in your docs directory
- **llms.txt Generation**: Creates a basic `llms.txt` file with links to documentation pages
- **llms-full.txt Generation**: Creates a full version with embedded content
- **Customizable**: Add custom sections, modify title and description
- **Standards Compliant**: Follows the official llms.txt specification

## Installation

The plugin is included with Zudoku. Simply configure it in your `zudoku.config.ts`:

```typescript
import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  // ... other config
  llmsTxt: {
    title: "My Documentation",
    description: "Comprehensive documentation for developers and users",
    customSections: [
      {
        title: "API Reference",
        items: [
          {
            title: "REST API",
            url: "/api/rest",
            description: "Complete REST API documentation",
          },
        ],
      },
      {
        title: "Optional",
        optional: true,
        items: [
          {
            title: "Legacy API",
            url: "/api/legacy",
            description: "Deprecated API for backward compatibility",
          },
        ],
      },
    ],
  },
};

export default config;
```

## Configuration Options

### `title` (optional)

The main title for your llms.txt file. Defaults to "Documentation".

### `description` (optional)

A brief description that appears in a blockquote at the top of the file.

### `includeOptionalSection` (optional)

Whether to include optional sections in the basic `llms.txt` variant. Defaults to `false`.

### `customSections` (optional)

Array of custom sections to add to the llms.txt file.

#### Section Properties

- `title`: Section heading
- `items`: Array of links with title, url, and optional description
- `optional`: If true, only included in full variant (unless `includeOptionalSection` is true)

## Generated Routes

When configured, the plugin automatically creates two routes:

- `/llms.txt` - Basic version with links to documentation
- `/llms-full.txt` - Extended version with full content embedded

## Example Output

### Basic llms.txt

```text
# My Documentation

> Comprehensive documentation for developers and users

## Documentation

- [Introduction](/introduction): Getting started guide
- [Configuration](/config): How to configure the application
- [API Guide](/api): Using our APIs

## API Reference

- [REST API](/api/rest): Complete REST API documentation
```

### Full llms-full.txt

The full version includes the same structure plus the complete content of all markdown files at the
end.

## Use Cases

- **LLM Training**: Provide structured access to your documentation for language models
- **AI Tools**: Enable AI assistants to better understand your project structure
- **Documentation Discovery**: Offer a machine-readable overview of your docs
- **Integration**: Allow other tools to programmatically access your documentation

## Specification Compliance

This plugin generates files that comply with the [llms.txt specification](https://llmstxt.org/),
making them compatible with various AI tools and services that support this standard.
