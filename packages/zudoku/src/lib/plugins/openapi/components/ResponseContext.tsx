import { createContext, use } from "react";
import type { OperationsFragmentFragment } from "../graphql/graphql.js";

export type ResponseItem = OperationsFragmentFragment["responses"][number];

export const ResponseContext = createContext<ResponseItem | null>(null);
export const useResponseContext = () => use(ResponseContext);
