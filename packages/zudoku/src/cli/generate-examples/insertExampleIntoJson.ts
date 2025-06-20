export const insertExampleIntoJson = (
  content: string,
  pathParts: string[],
  exampleValue: any,
): string => {
  // Parse the JSON to get the structure
  const schema = JSON.parse(content);

  // eslint-disable-next-line no-console
  console.log(`Inserting example into path: ${pathParts.join(".")}`);

  // Navigate to the target location
  let current: any = schema;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const key = pathParts[i];
    if (key && current[key] !== undefined) {
      current = current[key];
    } else {
      // eslint-disable-next-line no-console
      console.log(`Path not found: ${pathParts.join(".")}`);
      return content; // Path doesn't exist, return original
    }
  }

  // Add the example to the target schema
  const lastKey = pathParts[pathParts.length - 1];
  if (lastKey && current[lastKey]) {
    // eslint-disable-next-line no-console
    console.log(
      `Adding example to ${lastKey}:`,
      JSON.stringify(exampleValue, null, 2),
    );
    current[lastKey] = {
      ...current[lastKey],
      example: exampleValue,
    };
  } else {
    // eslint-disable-next-line no-console
    console.log(`Target schema not found: ${lastKey}`);
  }

  return JSON.stringify(schema, null, 2);
};
