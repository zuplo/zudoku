import {
  getHtmlDocument,
  type ZudokuApiReferenceConfiguration,
} from "@zudoku/core";
import type {
  FastifyPluginCallback,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import fp from "fastify-plugin";

export type { ZudokuApiReferenceConfiguration } from "@zudoku/core";

export type ZudokuFastifyOptions = {
  /** Route prefix for the documentation (default: '/docs') */
  routePrefix?: string;
  /** Zudoku configuration */
  configuration: ZudokuApiReferenceConfiguration;
};

/**
 * Default configuration for the Fastify integration
 */
const DEFAULT_CONFIGURATION: Partial<ZudokuApiReferenceConfiguration> = {
  _integration: "fastify",
};

const getRoutePrefix = (routePrefix?: string): string => {
  const prefix = routePrefix ?? "/docs";
  return prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
};

/**
 * Fastify plugin to serve Zudoku API documentation
 *
 * @example
 * ```typescript
 * import Fastify from 'fastify'
 * import zudokuFastify from '@zudoku/fastify'
 *
 * const app = Fastify()
 *
 * app.register(zudokuFastify, {
 *   routePrefix: '/docs',
 *   configuration: {
 *     spec: {
 *       url: '/openapi.json'
 *     }
 *   }
 * })
 * ```
 */
const zudokuFastifyPlugin: FastifyPluginCallback<ZudokuFastifyOptions> = (
  fastify,
  options,
  done,
) => {
  const { configuration: givenConfiguration, routePrefix } = options;

  const configuration = {
    ...DEFAULT_CONFIGURATION,
    ...givenConfiguration,
  };

  const prefix = getRoutePrefix(routePrefix);

  // Serve the documentation at the route prefix
  fastify.get(
    `${prefix}/`,
    async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply
        .header("Content-Type", "text/html; charset=utf-8")
        .send(getHtmlDocument(configuration));
    },
  );

  // Redirect without trailing slash to with trailing slash
  fastify.get(prefix, async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.redirect(`${prefix}/`, 301);
  });

  done();
};

const zudokuFastify = fp(zudokuFastifyPlugin, {
  name: "@zudoku/fastify",
});

export { zudokuFastify, zudokuFastify as default };
