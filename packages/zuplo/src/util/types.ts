// biome-ignore lint/suspicious/noExplicitAny: Allow any type
export type RecordAny = Record<string, any>;

export type JsonPrimitive = string | number | boolean | null;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = JsonPrimitive | JsonArray | JsonObject;
