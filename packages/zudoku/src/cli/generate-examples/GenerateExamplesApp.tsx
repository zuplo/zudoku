import { MultiSelect } from "@inkjs/ui";
import { Box, Text, useApp, useInput } from "ink";
import fs from "node:fs/promises";
import { useEffect, useState } from "react";
import type { OpenAPIDocument } from "../../lib/oas/parser/index.js";
import { generateSchemaExample } from "../../lib/plugins/openapi/util/generateSchemaExample.js";
import { insertExampleIntoJson } from "./insertExampleIntoJson.js";
import { insertExampleIntoYaml } from "./insertExampleIntoYaml.js";
import { openEditor } from "./openEditor.js";

interface GenerateExamplesAppProps {
  schema: OpenAPIDocument;
  inputPath: string;
  outputPath: string;
  originalContent: string;
}

interface SchemaLocation {
  path: string[];
  name: string;
  schema: any;
  type: "component" | "parameter" | "response" | "requestBody";
}

type SchemaType = "component" | "parameter" | "response" | "requestBody";

const SCHEMA_TYPE_OPTIONS = [
  { label: "Components", value: "component" },
  { label: "Parameters", value: "parameter" },
  { label: "Responses", value: "response" },
  { label: "Request Bodies", value: "requestBody" },
];

export function GenerateExamplesApp({
  schema,
  inputPath,
  outputPath,
  originalContent,
}: GenerateExamplesAppProps) {
  const { exit } = useApp();
  const [currentStep, setCurrentStep] = useState<
    | "type-selection"
    | "traversing"
    | "interactive"
    | "editing"
    | "saving"
    | "complete"
  >("type-selection");
  const [selectedTypes, setSelectedTypes] = useState<SchemaType[]>([
    "response",
    "requestBody",
  ]);
  const [schemaLocations, setSchemaLocations] = useState<SchemaLocation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exampleUpdates, setExampleUpdates] = useState<Map<string, any>>(
    new Map(),
  );

  // Handle type selection
  const handleTypeSelection = (selectedValues: string[]) => {
    setSelectedTypes(selectedValues as SchemaType[]);
    setCurrentStep("traversing");
  };

  // Traverse the schema to find all schema objects
  useEffect(() => {
    if (currentStep !== "traversing") return;

    const locations: SchemaLocation[] = [];

    // Components schemas
    if (selectedTypes.includes("component") && schema.components?.schemas) {
      Object.entries(schema.components.schemas).forEach(([name, schemaObj]) => {
        locations.push({
          path: ["components", "schemas", name],
          name,
          schema: schemaObj,
          type: "component",
        });
      });
    }

    // Path parameters and responses
    if (schema.paths) {
      Object.entries(schema.paths).forEach(([pathName, pathItem]) => {
        if (!pathItem) return;

        // Parameters
        if (selectedTypes.includes("parameter") && pathItem.parameters) {
          pathItem.parameters.forEach((param: any, index: number) => {
            if (param.schema) {
              locations.push({
                path: ["paths", pathName, "parameters", index.toString()],
                name: `${pathName} - ${param.name || `param-${index}`}`,
                schema: param.schema,
                type: "parameter",
              });
            }
          });
        }

        // Operations
        [
          "get",
          "post",
          "put",
          "delete",
          "patch",
          "options",
          "head",
          "trace",
        ].forEach((method) => {
          const operation = pathItem[method as keyof typeof pathItem];
          if (operation && typeof operation === "object") {
            // Operation parameters
            if (
              selectedTypes.includes("parameter") &&
              "parameters" in operation &&
              operation.parameters
            ) {
              operation.parameters.forEach((param: any, index: number) => {
                if (param.schema) {
                  locations.push({
                    path: [
                      "paths",
                      pathName,
                      method,
                      "parameters",
                      index.toString(),
                    ],
                    name: `${method.toUpperCase()} ${pathName} - ${param.name || `param-${index}`}`,
                    schema: param.schema,
                    type: "parameter",
                  });
                }
              });
            }

            // Request body
            if (
              selectedTypes.includes("requestBody") &&
              "requestBody" in operation &&
              operation.requestBody?.content
            ) {
              Object.entries(operation.requestBody.content).forEach(
                ([contentType, content]) => {
                  if (content.schema) {
                    locations.push({
                      path: [
                        "paths",
                        pathName,
                        method,
                        "requestBody",
                        "content",
                        contentType,
                      ],
                      name: `${method.toUpperCase()} ${pathName} - Request Body (${contentType})`,
                      schema: content.schema,
                      type: "requestBody",
                    });
                  }
                },
              );
            }

            // Responses
            if (
              selectedTypes.includes("response") &&
              "responses" in operation &&
              operation.responses
            ) {
              Object.entries(operation.responses).forEach(
                ([statusCode, response]) => {
                  if (response.content) {
                    Object.entries(response.content).forEach(
                      ([contentType, content]) => {
                        if (content.schema) {
                          locations.push({
                            path: [
                              "paths",
                              pathName,
                              method,
                              "responses",
                              statusCode,
                              "content",
                              contentType,
                            ],
                            name: `${method.toUpperCase()} ${pathName} - ${statusCode} Response (${contentType})`,
                            schema: content.schema,
                            type: "response",
                          });
                        }
                      },
                    );
                  }
                },
              );
            }
          }
        });
      });
    }

    setSchemaLocations(locations);
    setCurrentStep("interactive");
  }, [schema, selectedTypes, currentStep]);

  const currentLocation = schemaLocations[currentIndex];
  const generatedExample = currentLocation
    ? generateSchemaExample(currentLocation.schema, currentLocation.name)
    : null;

  useInput(
    (
      input: string,
      key: { return: boolean; escape: boolean; tab: boolean },
    ) => {
      if (currentStep === "interactive" && currentLocation) {
        if (key.return) {
          // Accept generated example
          addExampleUpdate(currentLocation.path, generatedExample);
          nextSchema();
        } else if (input === "e" || input === "E") {
          // Open editor for custom value
          setCurrentStep("editing");
          openEditor(generatedExample)
            .then((customValue) => {
              // Successfully got custom value from editor
              addExampleUpdate(currentLocation.path, customValue);
              nextSchema();
            })
            .catch((error) => {
              // Handle different error cases
              if (error.message === "Editor was closed without saving") {
                // User cancelled, don't add any example
                setCurrentStep("interactive");
              } else if (error.message === "Invalid JSON in editor") {
                // Show error and stay on current schema
                // eslint-disable-next-line no-console
                console.error(
                  "Error: Invalid JSON format. Please fix the JSON and try again.",
                );
                setCurrentStep("interactive");
              } else {
                // Other errors (editor not found, etc.)
                // eslint-disable-next-line no-console
                console.error("Editor error:", error.message);
                setCurrentStep("interactive");
              }
            });
        } else if (key.escape) {
          // Skip this schema
          nextSchema();
        } else if (input === "n" || input === "N") {
          // Jump to next example
          nextSchema();
        } else if (input === "p" || input === "P") {
          // Jump to previous example
          previousSchema();
        }
      }
    },
  );

  const addExampleUpdate = (schemaPath: string[], value: any) => {
    const pathKey = schemaPath.join(".");
    // eslint-disable-next-line no-console
    console.log(
      `Adding example for ${pathKey}:`,
      JSON.stringify(value, null, 2),
    );
    setExampleUpdates((prev) => new Map(prev).set(pathKey, value));
  };

  const nextSchema = () => {
    if (currentIndex < schemaLocations.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentStep("interactive");
    } else {
      setCurrentStep("saving");
      void saveSchema();
    }
  };

  const previousSchema = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCurrentStep("interactive");
    }
  };

  const saveSchema = async () => {
    try {
      let updatedContent = originalContent;

      // eslint-disable-next-line no-console
      console.log(`Applying ${exampleUpdates.size} example updates:`);
      for (const [pathKey, exampleValue] of exampleUpdates) {
        // eslint-disable-next-line no-console
        console.log(`  ${pathKey}:`, JSON.stringify(exampleValue, null, 2));
      }

      // Apply example updates to the original content
      for (const [pathKey, exampleValue] of exampleUpdates) {
        const pathParts = pathKey.split(".");

        // For JSON files, we need to insert the example property
        if (inputPath.endsWith(".json")) {
          updatedContent = insertExampleIntoJson(
            updatedContent,
            pathParts,
            exampleValue,
          );
        } else if (inputPath.endsWith(".yaml") || inputPath.endsWith(".yml")) {
          updatedContent = await insertExampleIntoYaml(
            updatedContent,
            pathParts,
            exampleValue,
          );
        }
      }

      await fs.writeFile(outputPath, updatedContent, "utf-8");
      setCurrentStep("complete");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to save schema:", error);
      exit(new Error("Failed to save schema"));
    }
  };

  if (currentStep === "type-selection") {
    return (
      <Box flexDirection="column" gap={1} padding={1}>
        <Box>
          <Text>🫳 </Text>
          <Text color="yellow" backgroundColor="magenta" bold>
            {` Zudoku Example Generator `}
          </Text>
        </Box>
        <Box>
          <Text>
            Choose which types of schemas you want to add examples to:
          </Text>
        </Box>

        <Box>
          <MultiSelect
            options={SCHEMA_TYPE_OPTIONS}
            defaultValue={["response", "requestBody"]}
            onSubmit={handleTypeSelection}
          />
        </Box>

        <Box marginTop={1}>
          <Text color="gray">
            Press Space to select/deselect, Enter to continue
          </Text>
        </Box>
      </Box>
    );
  }

  if (currentStep === "traversing") {
    return (
      <Box>
        <Text>Analyzing OpenAPI schema...</Text>
      </Box>
    );
  }

  if (currentStep === "editing") {
    return (
      <Box flexDirection="column">
        <Text>Opening editor for custom example...</Text>
        <Text>Edit the JSON and save to continue.</Text>
      </Box>
    );
  }

  if (currentStep === "saving") {
    return (
      <Box>
        <Text>Saving schema to {outputPath}...</Text>
      </Box>
    );
  }

  if (currentStep === "complete") {
    return (
      <Box flexDirection="column">
        <Text color="green">✓ Schema saved successfully!</Text>
        <Text>Output: {outputPath}</Text>
        <Text>Total schemas processed: {schemaLocations.length}</Text>
        <Text>Examples added: {exampleUpdates.size}</Text>
        <Text>Types selected: {selectedTypes.join(", ")}</Text>
      </Box>
    );
  }

  if (!currentLocation) {
    return (
      <Box>
        <Text>No schemas found for the selected types.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" gap={1} padding={1}>
      <Box>
        <Text color="cyan" bold>
          Schema {currentIndex + 1} of {schemaLocations.length}
        </Text>
      </Box>

      <Box>
        <Text color="yellow" bold>
          {currentLocation.name}
        </Text>
        <Text color="gray"> ({currentLocation.type})</Text>
      </Box>

      <Box marginBottom={2} padding={1} borderStyle="round" borderColor="gray">
        <Text>{JSON.stringify(generatedExample, null, 2)}</Text>
      </Box>

      <Box flexDirection="column" marginBottom={2}>
        <Text>
          Press <Text bold>Enter</Text> to accept example
        </Text>
        <Text>
          Press <Text bold>Escape</Text> to skip
        </Text>
        <Text>
          Press <Text bold>e</Text> to edit in editor
        </Text>
        <Text>
          Press <Text bold>n</Text> to jump to next example
        </Text>
        <Text>
          Press <Text bold>p</Text> to jump to previous example
        </Text>
      </Box>
    </Box>
  );
}
