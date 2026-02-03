// @zudoku/express - Express middleware for Zudoku API documentation

import {
  getHtmlDocument,
  type ZudokuApiReferenceConfiguration,
} from "@zudoku/core";
import type { Request, RequestHandler, Response } from "express";

export type { ZudokuApiReferenceConfiguration } from "@zudoku/core";

/**
 * Default configuration for the Express integration
 */
const DEFAULT_CONFIGURATION: Partial<ZudokuApiReferenceConfiguration> = {
  _integration: "express",
};

/**
 * Express middleware to serve Zudoku API documentation
 *
 * @example
 * ```typescript
 * import express from 'express'
 * import { zudokuApiReference } from '@zudoku/express'
 *
 * const app = express()
 *
 * app.use('/docs', zudokuApiReference({
 *   spec: {
 *     url: '/openapi.json'
 *   }
 * }))
 * ```
 */
export const zudokuApiReference = (
  givenConfiguration: ZudokuApiReferenceConfiguration,
): RequestHandler => {
  const configuration = {
    ...DEFAULT_CONFIGURATION,
    ...givenConfiguration,
  };

  return (_req: Request, res: Response) => {
    res.type("text/html").send(getHtmlDocument(configuration));
  };
};

// Also export as apiReference for compatibility with Scalar naming
export { zudokuApiReference as apiReference };

// Default export
export default zudokuApiReference;
