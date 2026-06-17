import { createContext, use } from "react";
import type { SchemaObject } from "../../../oas/parser/index.js";

export const SchemaViewContext = createContext<SchemaObject | null>(null);
export const useSchemaViewContext = () => use(SchemaViewContext);
