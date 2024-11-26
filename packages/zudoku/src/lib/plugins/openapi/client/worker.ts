import { createServer } from "./createServer.js";

export type WorkerGraphQLMessage = { id: string; body: string };

const localServer = createServer();

const worker = self as unknown as SharedWorkerGlobalScope;

worker.addEventListener("connect", (event) => {
  const mainPort = event.ports[0];

  mainPort!.onmessage = (e) => {
    if (e.data.port) {
      const clientPort = e.data.port as MessagePort;

      clientPort.onmessage = async (
        event: MessageEvent<{ id: string; body: string }>,
      ) => {
        const { id, body } = event.data;

        const response = await localServer.fetch(
          new Request("/__z/graphql", {
            method: "POST",
            body,
            headers: {
              "Content-Type": "application/json",
            },
          }),
        );

        const responseBody = await response.text();

        clientPort.postMessage({
          id,
          body: responseBody,
        } as WorkerGraphQLMessage);
      };

      clientPort.start();
    }
  };

  mainPort!.start();
});
