export const insertExampleIntoYaml = async (
  content: string,
  pathParts: string[],
  exampleValue: any,
): Promise<string> => {
  // Use proper YAML parser for better handling
  const yaml = await import("yaml");
  const schema = yaml.parse(content);

  // Navigate to the target location
  let current: any = schema;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const key = pathParts[i];
    if (key && current[key] !== undefined) {
      current = current[key];
    } else {
      return content; // Path doesn't exist, return original
    }
  }

  // Add the example to the target schema
  const lastKey = pathParts[pathParts.length - 1];
  if (lastKey && current[lastKey]) {
    current[lastKey] = {
      ...current[lastKey],
      example: exampleValue,
    };
  }

  return yaml.stringify(schema, { indent: 2 });
};
