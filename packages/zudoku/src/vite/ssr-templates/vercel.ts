import { createServer } from "zudoku/server";
import { vercel } from "zudoku/server/adapters/vercel";

const handler = createServer({ adapter: vercel() });

export const GET = handler;
export const POST = handler;
export const DELETE = handler;
