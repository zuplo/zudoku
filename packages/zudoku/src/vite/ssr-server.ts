import { readFile } from "node:fs/promises";
import path from "node:path";
import cookieParser from "cookie-parser";
import type { NextFunction, Request, Response } from "express";
import express from "express";
import type { RouteObject } from "react-router";
import type { ZudokuConfig } from "../config/config.js";
import { loadZudokuConfig } from "../config/loader.js";
import type { BuildConfig } from "../config/validators/BuildSchema.js";
import {
  type AuthState,
  extractToken,
  validateToken,
} from "../lib/auth/jwt-validation.js";

/**
 * SSR Server for Zudoku with server-side authentication
 */
export async function createSSRServer(options: {
  dir: string;
  buildConfig?: BuildConfig;
}): Promise<express.Express> {
  const app = express();

  // Add cookie parser middleware
  app.use(cookieParser());

  // Security headers middleware
  app.use(securityHeadersMiddleware);

  const { config } = await loadZudokuConfig(
    { mode: "production", command: "build" },
    options.dir,
  );

  // Serve static assets BEFORE auth middleware (public files)
  const clientBuildPath = path.join(options.dir, "dist", "client");
  app.use(
    config.basePath ?? "/",
    express.static(clientBuildPath, { index: false }),
  );

  // Server-side authentication middleware
  const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // Check if the route is protected
      const pathname = req.path.replace(config.basePath ?? "", "") || "/";

      // Extract and validate token
      const token = extractToken(req, config);
      let authState: AuthState | null = null;

      if (token) {
        authState = await validateToken(token, config);
      }

      // Check if route is protected and evaluate authorization
      const protectionResult = await checkRouteProtection(
        pathname,
        config,
        authState,
      );

      if (protectionResult.isProtected) {
        if (!authState?.isLoggedIn) {
          // Not authenticated
          res.status(401).json({
            error: "Unauthorized",
            message: "Authentication required to access this resource",
          });
          return;
        }

        if (!protectionResult.isAuthorized) {
          // Authenticated but not authorized
          res.status(403).json({
            error: "Forbidden",
            message: "You do not have permission to access this resource",
          });
          return;
        }
      }

      // Store auth state in request for rendering
      (req as Request & { authState?: AuthState }).authState = authState || {
        isLoggedIn: false,
      };

      next();
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: Logging allowed here
      console.error("Auth middleware error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "An error occurred during authentication",
      });
    }
  };

  // SSR rendering middleware
  app.get("*", authMiddleware, async (req: Request, res: Response) => {
    try {
      // Import the server build
      const serverBuildPath = path.join(options.dir, "dist", "server");
      const serverEntryPath = path.join(serverBuildPath, "entry.server.js");

      // Check if server build exists
      try {
        await readFile(serverEntryPath);
      } catch {
        // biome-ignore lint/suspicious/noConsole: Logging allowed here
        console.error(
          "Server build not found at:",
          serverEntryPath,
          "\nDid you run `pnpm build` with SSR enabled?",
        );
        res
          .status(500)
          .send(
            "Server build missing. Please rebuild the application with SSR enabled.",
          );
        return;
      }

      const { render, getRoutesByConfig } = (await import(serverEntryPath)) as {
        render: (params: {
          template: string;
          request: Request;
          response: Response;
          routes: RouteObject[];
          basePath?: string;
          bypassProtection?: boolean;
          authState?: AuthState;
        }) => Promise<void>;
        getRoutesByConfig: (config: unknown) => RouteObject[];
      };

      // Load the HTML template
      const template = await readFile(
        path.join(clientBuildPath, "index.html"),
        "utf-8",
      );

      const routes = getRoutesByConfig(config);
      const authState = (req as Request & { authState?: AuthState }).authState;

      // Render the page with auth state
      await render({
        template,
        request: req,
        response: res,
        routes,
        basePath: config.basePath,
        bypassProtection: false, // Never bypass protection in SSR mode
        authState,
      });
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: Logging allowed here
      console.error("SSR Error:", error);

      // Send user-friendly error
      if (res.headersSent) {
        return;
      }

      res
        .status(500)
        .send(
          process.env.NODE_ENV === "production"
            ? "Internal Server Error"
            : `SSR Error: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
  });

  return app;
}

/**
 * Security headers middleware
 */
function securityHeadersMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "SAMEORIGIN");

  // Enable XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Enforce HTTPS (only in production)
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }

  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  next();
}

/**
 * Check if a route is protected and if user is authorized
 */
async function checkRouteProtection(
  pathname: string,
  config: ZudokuConfig,
  authState: AuthState | null,
): Promise<{ isProtected: boolean; isAuthorized: boolean }> {
  if (!config.protectedRoutes) {
    return { isProtected: false, isAuthorized: true };
  }

  // Handle array of paths (simple string matching)
  if (Array.isArray(config.protectedRoutes)) {
    const isProtected = config.protectedRoutes.some((route) => {
      if (typeof route === "string") {
        return matchPath(pathname, route);
      }
      return false;
    });

    return {
      isProtected,
      isAuthorized: isProtected ? authState?.isLoggedIn === true : true,
    };
  }

  // Handle object with path keys and callback handlers
  if (typeof config.protectedRoutes === "object") {
    for (const [route, handler] of Object.entries(config.protectedRoutes)) {
      if (matchPath(pathname, route)) {
        // Route is protected
        if (!authState?.isLoggedIn) {
          // Not authenticated
          return { isProtected: true, isAuthorized: false };
        }

        // Evaluate custom authorization callback
        if (typeof handler === "function") {
          try {
            // Create context-like object for callback
            const context = {
              auth: {
                isLoggedIn: authState.isLoggedIn,
                profile: authState.profile,
              },
              context: {
                // Add minimal context - can be expanded later
                pathname,
              },
            };

            const authorized = await Promise.resolve(handler(context as never));
            return { isProtected: true, isAuthorized: authorized === true };
          } catch (error) {
            // biome-ignore lint/suspicious/noConsole: Logging allowed here
            console.error("Protected route callback error:", error);
            return { isProtected: true, isAuthorized: false };
          }
        }

        // Handler is boolean or true
        return {
          isProtected: true,
          isAuthorized: handler === true,
        };
      }
    }
  }

  return { isProtected: false, isAuthorized: true };
}

/**
 * Simple path matching (supports basic wildcards)
 */
function matchPath(pathname: string, pattern: string): boolean {
  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".")
    .replace(/\//g, "\\/");

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(pathname);
}

/**
 * Start the SSR server
 */
export async function startSSRServer(options: {
  dir: string;
  port?: number;
  host?: string;
  buildConfig?: BuildConfig;
}) {
  const app = await createSSRServer(options);
  const port = options.port ?? options.buildConfig?.ssr?.port ?? 3001;
  const host = options.host ?? options.buildConfig?.ssr?.host ?? "0.0.0.0";

  return new Promise<{ port: number; host: string }>((resolve) => {
    const server = app.listen(port, host, () => {
      // biome-ignore lint/suspicious/noConsole: Logging allowed here
      console.log(`✓ Zudoku SSR server listening on http://${host}:${port}`);
      resolve({ port, host });
    });

    // Graceful shutdown
    const shutdown = () => {
      // biome-ignore lint/suspicious/noConsole: Logging allowed here
      console.log("\nShutting down SSR server gracefully...");
      server.close(() => {
        // biome-ignore lint/suspicious/noConsole: Logging allowed here
        console.log("SSR server shut down complete");
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  });
}
