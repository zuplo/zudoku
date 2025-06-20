# Fill Examples CLI Command

The `fill-examples` command provides an interactive way to add examples to OpenAPI schema properties that don't already have them. Unlike `generate-examples` which works at the schema level, this command works at the property level, finding individual properties within schemas that lack examples.

## Usage

```bash
zudoku fill-examples path/to/openapi.json
```

### Options

- `--file` (required): Path to the OpenAPI JSON/YAML file
- `--output` (optional): Output file path (defaults to overwriting the input file)

### Examples

```bash
# Fill missing examples and overwrite the original file
zudoku fill-examples openapi.json

# Fill missing examples and save to a new file
zudoku fill-examples openapi.json --output openapi-with-examples.json

# Works with YAML files too
zudoku fill-examples openapi.yaml
```

## Interactive Interface

The command provides a beautiful interactive CLI interface built with Ink that allows you to:

1. **Analyze the schema** - Automatically finds all properties without examples
2. **Review each property** found in your OpenAPI document that lacks an example
3. **See generated examples** using the `generateSchemaExample` function
4. **Accept generated examples** by pressing `Enter`
5. **Customize values** by pressing `e` to open your system's default editor
6. **Skip properties** by pressing `Escape`

### Property Detection

The command automatically finds properties without examples in:

- **Components schemas** (`components.schemas.*`) and their nested properties
- **Path parameters** (`paths.*.parameters.*.schema`) and their nested properties
- **Operation parameters** (`paths.*.{method}.parameters.*.schema`) and their nested properties
- **Request bodies** (`paths.*.{method}.requestBody.content.*.schema`) and their nested properties
- **Response bodies** (`paths.*.{method}.responses.*.content.*.schema`) and their nested properties

### Example Detection Logic

A property is considered to have an example if it has any of the following:

- `example` property
- `examples` object with a `default` key
- `const` property (constant values don't need examples)

### Controls

- **Enter**: Accept generated example
- **e**: Open editor for custom value
- **Escape**: Skip this property
- **n**: Jump to next property
- **p**: Jump to previous property

### System Editor

When you press `e` to customize a value, the command will:

1. Create a temporary JSON file with the generated example
2. Open your system's default editor (determined by `$EDITOR`, `$VISUAL`, or falls back to `nano`)
3. Wait for you to edit and save the file
4. Parse the JSON and use it as the custom example
5. Clean up the temporary file

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

## Difference from generate-examples

| Feature       | generate-examples                | fill-examples                              |
| ------------- | -------------------------------- | ------------------------------------------ |
| **Scope**     | Schema-level (entire schemas)    | Property-level (individual properties)     |
| **Target**    | Schemas without examples         | Properties within schemas without examples |
| **Selection** | Choose schema types to process   | Automatically finds all missing examples   |
| **Use case**  | Add examples to complete schemas | Fill gaps in existing schemas              |

## Example Output

After running the command, your OpenAPI schema will have `example` properties added to individual properties where you chose to add them:

```json
{
  "components": {
    "schemas": {
      "User": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "format": "int64",
            "example": 12345
          },
          "name": {
            "type": "string",
            "example": "John Doe"
          },
          "email": {
            "type": "string",
            "format": "email",
            "example": "john.doe@example.com"
          },
          "profile": {
            "type": "object",
            "properties": {
              "avatar": {
                "type": "string",
                "format": "uri",
                "example": "https://example.com/avatar.jpg"
              }
            }
          }
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
- `@inkjs/ui`: UI components for Ink

These are automatically installed when you install the zudoku package.
