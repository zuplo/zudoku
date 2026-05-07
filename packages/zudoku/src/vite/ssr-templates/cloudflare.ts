import { createServer } from "zudoku/server";
import { cloudflare } from "zudoku/server/adapters/cloudflare";

// Requires `run_worker_first = ["/_protected/*"]` in wrangler.toml. Without
// it, the assets binding serves the chunks directly and skips the gate.
export default createServer({ adapter: cloudflare() });
