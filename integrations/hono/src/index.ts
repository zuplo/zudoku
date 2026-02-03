// @zudoku/hono - Hono middleware for Zudoku API documentation
import {
  getHtmlDocument,
  type ZudokuApiReferenceConfiguration,
} from "@zudoku/core";
import type { Context, Env, MiddlewareHandler } from "hono";

export type { ZudokuApiReferenceConfiguration } from "@zudoku/core";

/**
 * Default configuration for the Hono integration
 */
const DEFAULT_CONFIGURATION: Partial<ZudokuApiReferenceConfiguration> = {
  _integration: "hono",
};

/**
 * Optional custom theme CSS for Hono
 */
const customTheme = `
.dark-mode {
  color-scheme: dark;
}
`;

type ConfigurationOrResolver<E extends Env> =
  | ZudokuApiReferenceConfiguration
  | ((
      c: Context<E>,
    ) =>
      | ZudokuApiReferenceConfiguration
      | Promise<ZudokuApiReferenceConfiguration>);

/**
 * Hono middleware to serve Zudoku API documentation
 *
 * @example
 * ```typescript
 * import { Hono } from 'hono'
 * import { zudoku } from '@zudoku/hono'
 *
 * const app = new Hono()
 *
 * app.get('/docs', zudoku({
 *   spec: {
 *     url: '/openapi.json'
 *   }
 * }))
 * ```
 *
 * @example With dynamic configuration
 * ```typescript
 * app.get('/docs', zudoku((c) => ({
 *   spec: {
 *     url: c.req.query('spec') || '/openapi.json'
 *   }
 * })))
 * ```
 */
export function zudoku<E extends Env>(
  configOrResolver: ConfigurationOrResolver<E>,
): MiddlewareHandler<E> {
  return async (c) => {
    let resolvedConfig: ZudokuApiReferenceConfiguration;

    if (typeof configOrResolver === "function") {
      resolvedConfig = await configOrResolver(c);
    } else {
      resolvedConfig = configOrResolver;
    }

    const configuration = {
      ...DEFAULT_CONFIGURATION,
      ...resolvedConfig,
    };

    return c.html(getHtmlDocument(configuration, customTheme));
  };
}

// Alias for compatibility
export { zudoku as Zudoku };

// Also export as zudokuApiReference for consistency with other integrations
export { zudoku as zudokuApiReference };

// Default export
export default zudoku;
