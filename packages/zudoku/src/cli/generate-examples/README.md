# Generate Examples CLI Command

The `generate-examples` command provides an interactive way to add examples to OpenAPI schemas using the `generateSchemaExample` function.

## Usage

```bash
zudoku generate-examples path/to/openapi.json
```

### Options

- `--file` (required): Path to the OpenAPI JSON/YAML file
- `--output` (optional): Output file path (defaults to overwriting the input file)

### Examples

```bash
# Generate examples and overwrite the original file
zudoku generate-examples openapi.json

# Generate examples and save to a new file
zudoku generate-examples openapi.json --output openapi-with-examples.json

# Works with YAML files too
zudoku generate-examples openapi.yaml
```

## Interactive Interface

The command provides a beautiful interactive CLI interface built with Ink that allows you to:

1. **Select schema types** - Choose which types of schemas to process (defaults to Responses & Request Bodies)
2. **Review each schema** found in your OpenAPI document
3. **See generated examples** using the `generateSchemaExample` function
4. **Accept generated examples** by pressing `Tab`
5. **Customize values** by pressing `Enter` to open your system's default editor
6. **Skip schemas** by pressing `Escape`

### Type Selection

The first step allows you to choose which types of schemas you want to add examples to:

- **Components** - Schema definitions in `components.schemas`
- **Parameters** - Path and operation parameters
- **Responses** - Response bodies (default: selected)
- **Request Bodies** - Request body schemas (default: selected)

**Default Selection:** Responses and Request Bodies are selected by default as these are typically the most useful for API documentation.

### Controls

- **Space**: Select/deselect schema types (in type selection)
- **Enter**: Continue to next step (in type selection) or accept generated example
- **e**: Open editor for custom value
- **Escape**: Skip this schema
- **n**: Jump to next example
- **p**: Jump to previous example

### System Editor

When you press `Enter` to customize a value, the command will:

1. Create a temporary JSON file with the generated example
2. Open your system's default editor (determined by `$EDITOR`, `$VISUAL`, or falls back to `nano`)
3. Wait for you to edit and save the file
4. Parse the JSON and use it as the custom example
5. Clean up the temporary file

This provides a much better editing experience for complex JSON examples, similar to how git opens your editor for commit messages.

**Editor Priority:**

1. `$EDITOR` environment variable
2. `$VISUAL` environment variable
3. `nano` (fallback)

## File Preservation

The command **preserves your original file structure** and only adds `example` properties where you choose to add them. This means:

- **No dereferencing** - `$ref` values remain untouched
- **No schema modifications** - Only adds `example` properties
- **Format preservation** - Maintains original JSON/YAML formatting
- **Comments preserved** - YAML comments are maintained (when using YAML)

## Supported Schema Locations

The command automatically finds and processes schemas in:

- **Components schemas** (`components.schemas.*`)
- **Path parameters** (`paths.*.parameters.*.schema`)
- **Operation parameters** (`paths.*.{method}.parameters.*.schema`)
- **Request bodies** (`paths.*.{method}.requestBody.content.*.schema`)
- **Response bodies** (`paths.*.{method}.responses.*.content.*.schema`)

## Example Output

After running the command, your OpenAPI schema will have `example` properties added to schemas where you chose to add them:

```json
{
  "components": {
    "schemas": {
      "User": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "format": "int64"
          },
          "name": {
            "type": "string"
          },
          "email": {
            "type": "string",
            "format": "email"
          }
        },
        "example": {
          "id": 0,
          "name": "User",
          "email": "test@example.com"
        }
      }
    }
  }
}
```

## Supported File Formats

- **JSON** (`.json`) - Full support with proper formatting
- **YAML** (`.yaml`, `.yml`) - Full support with proper YAML parsing

## Dependencies

This command requires the following additional dependencies:

- `ink`: React for CLI
- `ink-text-input`: Text input component for Ink (no longer used, but kept for potential future use)
- `ink-select-input`: Select input component for Ink (no longer used, but kept for potential future use)

These are automatically installed when you install the zudoku package.
