import { writeFileSync } from "fs";
import { zodToJsonSchema } from "zod-to-json-schema";
import { CommonConfigSchema } from "../src/config/validators/common";

const jsonSchema = zodToJsonSchema(CommonConfigSchema, "dev-portal-json");

writeFileSync("../dev-portal.schema.json", JSON.stringify(jsonSchema, null, 2));
