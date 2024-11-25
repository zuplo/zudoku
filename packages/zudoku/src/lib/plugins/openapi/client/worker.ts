import { createServer } from "./createServer.js";

export type WorkerGraphQLMessage = { id: string; body: string };

const localServer = createServer();

const worker = self as unknown as SharedWorkerGlobalScope;

worker.addEventListener("connect", (event) => {
  const port = event.ports[0];

  port!.onmessage = async function (
    e: MessageEvent<{ id: string; body: string }>,
  ) {
    const response = await localServer.fetch(
      new Request("/__z/graphql", {
        method: "POST",
        body: e.data.body,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    port!.postMessage({
      id: e.data.id,
      body: await response.text(),
    } satisfies WorkerGraphQLMessage);
  };
});
