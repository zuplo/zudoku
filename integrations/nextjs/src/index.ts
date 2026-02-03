// @zudoku/nextjs - Next.js integration for Zudoku API documentation
import {
  getHtmlDocument,
  type ZudokuApiReferenceConfiguration,
} from "@zudoku/core";

export type { ZudokuApiReferenceConfiguration } from "@zudoku/core";

/**
 * Default configuration for the Next.js integration
 */
const DEFAULT_CONFIGURATION: Partial<ZudokuApiReferenceConfiguration> = {
  _integration: "nextjs",
};

/**
 * Next.js Route Handler for Zudoku API documentation
 *
 * @example App Router (app/docs/[[...slug]]/route.ts)
 * ```typescript
 * import { ZudokuApiReference } from '@zudoku/nextjs'
 *
 * export const GET = ZudokuApiReference({
 *   spec: {
 *     url: '/openapi.json'
 *   }
 * })
 * ```
 *
 * @example Pages Router (pages/api/docs.ts)
 * ```typescript
 * import { ZudokuApiReference } from '@zudoku/nextjs'
 *
 * export default ZudokuApiReference({
 *   spec: {
 *     url: '/openapi.json'
 *   }
 * })
 * ```
 */
export function ZudokuApiReference(
  givenConfiguration: ZudokuApiReferenceConfiguration,
): () => Response {
  const configuration = {
    ...DEFAULT_CONFIGURATION,
    ...givenConfiguration,
  };

  return () => {
    const html = getHtmlDocument(configuration);
    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  };
}

// Alias for compatibility
export { ZudokuApiReference as apiReference };

// Default export
export default ZudokuApiReference;
