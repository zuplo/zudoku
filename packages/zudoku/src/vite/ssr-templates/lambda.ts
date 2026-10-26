import { createServer } from "zudoku/server";
import { lambda } from "zudoku/server/adapters/lambda";

export const handler = createServer({ adapter: lambda() });
