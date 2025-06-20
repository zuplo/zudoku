import { Box, Text, useApp, useInput } from "ink";
import fs from "node:fs/promises";
import { useEffect, useState } from "react";
import type { OpenAPIDocument } from "../../lib/oas/parser/index.js";
import { insertExampleIntoJson } from "../generate-examples/insertExampleIntoJson.js";
import { insertExampleIntoYaml } from "../generate-examples/insertExampleIntoYaml.js";

interface FillExamplesAppProps {
  schema: OpenAPIDocument;
  inputPath: string;
  outputPath: string;
  originalContent: string;
}

interface PropertyLocation {
  path: string[];
  name: string;
  schema: any;
  parentPath: string[];
  parentName: string;
  type: "component" | "parameter" | "response" | "requestBody";
}

export function FillExamplesApp({
  schema,
  inputPath,
  outputPath,
  originalContent,
}: FillExamplesAppProps) {
  const { exit } = useApp();
  const [currentStep, setCurrentStep] = useState<
    "traversing" | "interactive" | "saving" | "complete"
  >("traversing");
  const [propertyLocations, setPropertyLocations] = useState<
    PropertyLocation[]
  >([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exampleUpdates, setExampleUpdates] = useState<Map<string, any>>(
    new Map(),
  );
  const [currentInput, setCurrentInput] = useState("");

  // Check if a schema or property has an example
  const hasExample = (schemaObj: any): boolean => {
    if (!schemaObj || typeof schemaObj !== "object") return false;

    // Check for example property
    if (schemaObj.example !== undefined) return true;

    // Check for examples object with default
    if (
      schemaObj.examples &&
      typeof schemaObj.examples === "object" &&
      "default" in schemaObj.examples
    ) {
      return true;
    }

    // Check for const value
    if (schemaObj.const !== undefined) return true;

    return false;
  };

  // Recursively find properties without examples
  const findPropertiesWithoutExamples = (
    schemaObj: any,
    path: string[],
    parentPath: string[],
    parentName: string,
    type: PropertyLocation["type"],
  ): PropertyLocation[] => {
    const locations: PropertyLocation[] = [];

    if (!schemaObj || typeof schemaObj !== "object") {
      return locations;
    }

    // For object schemas with properties, check each property
    if (schemaObj.type === "object" && schemaObj.properties) {
      Object.entries(schemaObj.properties).forEach(([propName, propSchema]) => {
        if (typeof propSchema === "object") {
          const propPath = [...path, "properties", propName];

          // Check if this property itself needs an example
          if (!hasExample(propSchema)) {
            locations.push({
              path: propPath,
              name: propName,
              schema: propSchema,
              parentPath,
              parentName,
              type,
            });
          }

          // Recursively check nested properties
          locations.push(
            ...findPropertiesWithoutExamples(
              propSchema,
              propPath,
              parentPath,
              parentName,
              type,
            ),
          );
        }
      });
    }

    // For array schemas, check the items
    if (schemaObj.type === "array" && schemaObj.items) {
      const itemsPath = [...path, "items"];
      if (!hasExample(schemaObj.items)) {
        locations.push({
          path: itemsPath,
          name: "items",
          schema: schemaObj.items,
          parentPath,
          parentName,
          type,
        });
      }

      // Recursively check nested properties in array items
      locations.push(
        ...findPropertiesWithoutExamples(
          schemaObj.items,
          itemsPath,
          parentPath,
          parentName,
          type,
        ),
      );
    }

    return locations;
  };

  // Traverse the schema to find all properties without examples
  useEffect(() => {
    if (currentStep !== "traversing") return;

    const locations: PropertyLocation[] = [];

    // Components schemas
    if (schema.components?.schemas) {
      Object.entries(schema.components.schemas).forEach(([name, schemaObj]) => {
        const schemaPath = ["components", "schemas", name];

        // Check if the schema itself needs an example
        if (!hasExample(schemaObj)) {
          locations.push({
            path: schemaPath,
            name,
            schema: schemaObj,
            parentPath: [],
            parentName: "",
            type: "component",
          });
        }

        // Find properties without examples within this schema
        locations.push(
          ...findPropertiesWithoutExamples(
            schemaObj,
            schemaPath,
            schemaPath,
            name,
            "component",
          ),
        );
      });
    }

    // Path parameters and responses
    if (schema.paths) {
      Object.entries(schema.paths).forEach(([pathName, pathItem]) => {
        if (!pathItem) return;

        // Parameters
        if (pathItem.parameters) {
          pathItem.parameters.forEach((param: any, index: number) => {
            if (param.schema) {
              const paramPath = [
                "paths",
                pathName,
                "parameters",
                index.toString(),
              ];

              if (!hasExample(param.schema)) {
                locations.push({
                  path: [...paramPath, "schema"],
                  name: param.name || `param-${index}`,
                  schema: param.schema,
                  parentPath: paramPath,
                  parentName: `${pathName} - ${param.name || `param-${index}`}`,
                  type: "parameter",
                });
              }

              locations.push(
                ...findPropertiesWithoutExamples(
                  param.schema,
                  [...paramPath, "schema"],
                  paramPath,
                  `${pathName} - ${param.name || `param-${index}`}`,
                  "parameter",
                ),
              );
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
            if ("parameters" in operation && operation.parameters) {
              operation.parameters.forEach((param: any, index: number) => {
                if (param.schema) {
                  const paramPath = [
                    "paths",
                    pathName,
                    method,
                    "parameters",
                    index.toString(),
                  ];

                  if (!hasExample(param.schema)) {
                    locations.push({
                      path: [...paramPath, "schema"],
                      name: param.name || `param-${index}`,
                      schema: param.schema,
                      parentPath: paramPath,
                      parentName: `${method.toUpperCase()} ${pathName} - ${param.name || `param-${index}`}`,
                      type: "parameter",
                    });
                  }

                  locations.push(
                    ...findPropertiesWithoutExamples(
                      param.schema,
                      [...paramPath, "schema"],
                      paramPath,
                      `${method.toUpperCase()} ${pathName} - ${param.name || `param-${index}`}`,
                      "parameter",
                    ),
                  );
                }
              });
            }

            // Request body
            if ("requestBody" in operation && operation.requestBody?.content) {
              Object.entries(operation.requestBody.content).forEach(
                ([contentType, content]) => {
                  if (content.schema) {
                    const bodyPath = [
                      "paths",
                      pathName,
                      method,
                      "requestBody",
                      "content",
                      contentType,
                    ];

                    if (!hasExample(content.schema)) {
                      locations.push({
                        path: [...bodyPath, "schema"],
                        name: `Request Body (${contentType})`,
                        schema: content.schema,
                        parentPath: bodyPath,
                        parentName: `${method.toUpperCase()} ${pathName} - Request Body (${contentType})`,
                        type: "requestBody",
                      });
                    }

                    locations.push(
                      ...findPropertiesWithoutExamples(
                        content.schema,
                        [...bodyPath, "schema"],
                        bodyPath,
                        `${method.toUpperCase()} ${pathName} - Request Body (${contentType})`,
                        "requestBody",
                      ),
                    );
                  }
                },
              );
            }

            // Responses
            if ("responses" in operation && operation.responses) {
              Object.entries(operation.responses).forEach(
                ([statusCode, response]) => {
                  if (response.content) {
                    Object.entries(response.content).forEach(
                      ([contentType, content]) => {
                        if (content.schema) {
                          const responsePath = [
                            "paths",
                            pathName,
                            method,
                            "responses",
                            statusCode,
                            "content",
                            contentType,
                          ];

                          if (!hasExample(content.schema)) {
                            locations.push({
                              path: [...responsePath, "schema"],
                              name: `${statusCode} Response (${contentType})`,
                              schema: content.schema,
                              parentPath: responsePath,
                              parentName: `${method.toUpperCase()} ${pathName} - ${statusCode} Response (${contentType})`,
                              type: "response",
                            });
                          }

                          locations.push(
                            ...findPropertiesWithoutExamples(
                              content.schema,
                              [...responsePath, "schema"],
                              responsePath,
                              `${method.toUpperCase()} ${pathName} - ${statusCode} Response (${contentType})`,
                              "response",
                            ),
                          );
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

    setPropertyLocations(locations);
    setCurrentStep("interactive");
  }, [schema, currentStep]);

  const currentLocation = propertyLocations[currentIndex];

  useInput(
    (
      input: string,
      key: {
        return: boolean;
        escape: boolean;
        tab: boolean;
        backspace: boolean;
      },
    ) => {
      if (currentStep === "interactive" && currentLocation) {
        if (key.return) {
          // Process the input
          if (currentInput.trim()) {
            try {
              // Try to parse as JSON first
              let parsedValue;
              try {
                parsedValue = JSON.parse(currentInput);
              } catch {
                // If not valid JSON, treat as string
                parsedValue = currentInput;
              }

              addExampleUpdate(currentLocation.path, parsedValue);
            } catch (error) {
              // If parsing fails, skip this property
              // eslint-disable-next-line no-console
              console.log("Invalid input, skipping property");
            }
          }
          // Always move to next property (skip if no input)
          nextProperty();
        } else if (key.escape) {
          // Skip this property
          nextProperty();
        } else if (key.backspace) {
          // Remove last character
          setCurrentInput((prev) => prev.slice(0, -1));
        } else if (input === "n" || input === "N") {
          // Jump to next property
          nextProperty();
        } else if (input === "p" || input === "P") {
          // Jump to previous property
          previousProperty();
        } else if (input && input.length === 1) {
          // Add character to input
          setCurrentInput((prev) => prev + input);
        }
      }
    },
  );

  const addExampleUpdate = (propertyPath: string[], value: any) => {
    const pathKey = propertyPath.join(".");
    // eslint-disable-next-line no-console
    console.log(
      `Adding example for ${pathKey}:`,
      JSON.stringify(value, null, 2),
    );
    setExampleUpdates((prev) => new Map(prev).set(pathKey, value));
  };

  const nextProperty = () => {
    if (currentIndex < propertyLocations.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentInput("");
      setCurrentStep("interactive");
    } else {
      setCurrentStep("saving");
      void saveSchema();
    }
  };

  const previousProperty = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCurrentInput("");
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

  if (currentStep === "traversing") {
    return (
      <Box>
        <Text>Analyzing OpenAPI schema for properties without examples...</Text>
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
        <Text>Total properties processed: {propertyLocations.length}</Text>
        <Text>Examples added: {exampleUpdates.size}</Text>
      </Box>
    );
  }

  if (!currentLocation) {
    return (
      <Box>
        <Text>No properties without examples found in the schema.</Text>
      </Box>
    );
  }

  const fullPath = currentLocation.path.join(".");

  return (
    <Box flexDirection="column" gap={1} padding={1}>
      <Box>
        <Text color="cyan" bold>
          Property {currentIndex + 1} of {propertyLocations.length}
        </Text>
      </Box>

      <Box>
        <Text color="yellow" bold>
          {currentLocation.name}
        </Text>
        <Text color="gray"> ({currentLocation.type})</Text>
      </Box>

      <Box>
        <Text color="blue" bold>
          Path:{" "}
        </Text>
        <Text color="gray">{fullPath}</Text>
      </Box>

      {currentLocation.parentName && (
        <Box>
          <Text color="gray">Parent: {currentLocation.parentName}</Text>
        </Box>
      )}

      <Box marginBottom={2} padding={1} borderStyle="round" borderColor="gray">
        <Text>Schema: {JSON.stringify(currentLocation.schema, null, 2)}</Text>
      </Box>

      <Box flexDirection="column" marginBottom={2}>
        <Text>
          Enter example value for <Text bold>{currentLocation.name}</Text>:
        </Text>
        <Box padding={1} borderStyle="round" borderColor="blue">
          <Text>{currentInput || " "}</Text>
          <Text color="blue">|</Text>
        </Box>
      </Box>

      <Box flexDirection="column" marginBottom={2}>
        <Text>
          Press <Text bold>Enter</Text> to save example (or skip if empty)
        </Text>
        <Text>
          Press <Text bold>Escape</Text> to skip this property
        </Text>
        <Text>
          Press <Text bold>n</Text> to jump to next property
        </Text>
        <Text>
          Press <Text bold>p</Text> to jump to previous property
        </Text>
        <Text>
          Press <Text bold>Backspace</Text> to delete last character
        </Text>
      </Box>
    </Box>
  );
}
