import { NextFunction, Request, Response } from "express";
import path from "node:path";
import { ViteDevServer } from "vite";

export const errorMiddleware =
  (server: ViteDevServer) =>
  (err: Error, req: Request, res: Response, next: NextFunction) => {
    server.ssrFixStacktrace(err);
    const error = {
      message: err.message,
      stack: err.stack,
    };

    res.statusCode = 500;
    res.end(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <title>Error</title>
            <script type="module">
              const error = ${JSON.stringify(error).replace(/</g, "\\u003c")}
              try {
                const { ErrorOverlay } = await import(${JSON.stringify(path.posix.join(server.config.base, "/@vite/client"))})
                document.body.appendChild(new ErrorOverlay(error))
              } catch (err) {
               console.log(err)
                const h = (tag, text) => {
                  const el = document.createElement(tag)
                  el.textContent = text
                  return el
                }
                document.body.appendChild(h('h1', 'Internal Server Error'))
                document.body.appendChild(h('h2', error.message))
                document.body.appendChild(h('pre', error.stack))
                document.body.appendChild(h('p', '(Error overlay failed to load)'))
              }
            </script>
          </head>
          <body>
          </body>
        </html>
      `);
  };
