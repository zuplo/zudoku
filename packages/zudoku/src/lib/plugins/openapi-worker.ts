export const initializeWorker = () => {
  const worker = new SharedWorker(
    new URL("./openapi/client/worker.ts", import.meta.url),
    { type: "module" },
  );
  // eslint-disable-next-line no-console
  worker.onerror = (e) => console.error(e);
  worker.port.start();

  return worker;
};
