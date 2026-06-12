export {
  getPresetPlugin,
  type PresetPluginDescriptor,
  type PresetPluginId,
  presetPlugins,
} from "../config/preset-registry.js";
export { generateConfig } from "./generate.js";
export { buildSpecJsonSchema } from "./json-schema.js";
export {
  CONFIG_SPEC_SCHEMA_URL,
  CONFIG_SPEC_VERSION,
  type ConfigSpec,
  ConfigSpecSchema,
  parseSpecSchemaVersion,
  validateSpec,
} from "./spec.js";
