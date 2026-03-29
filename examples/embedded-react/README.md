# Zudoku Embedded Example

This example demonstrates how to embed Zudoku API documentation into a React application.

## Overview

This is a simple React + Vite application that shows different ways to embed Zudoku:

1. **URL-based**: Loading OpenAPI specs from a URL
2. **String-based**: Using raw OpenAPI YAML/JSON strings
3. **Object-based**: Using parsed OpenAPI objects
4. **Dynamic**: Switching between different API specs

## Getting Started

```bash
# Install dependencies
pnpm install

# Run the development server
pnpm dev
```

Then open http://localhost:5173 in your browser.

## Key Files

- `src/App.tsx` - Main application demonstrating various embedding approaches
- `src/examples/` - Individual examples for different use cases

## Features Demonstrated

- ✅ Loading OpenAPI specs from URLs
- ✅ Embedding raw OpenAPI specifications
- ✅ Using parsed JSON/YAML objects
- ✅ Dynamic API spec switching
- ✅ Custom configuration options
- ✅ Theme customization

## Integration Notes

1. Import the `ZudokuEmbedded` component from `zudoku/components`
2. Import the CSS file: `import "zudoku/main.css"`
3. Provide an OpenAPI specification (URL, string, or object)
4. Customize with optional configuration

See the code in `src/App.tsx` for complete examples.
