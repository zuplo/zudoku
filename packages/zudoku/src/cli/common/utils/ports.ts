import net from "node:net";

const isPortAvailable = (port: number) =>
  new Promise<boolean>((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once("error", () => resolve(false));
    server.listen(port, () => {
      server.close();
      resolve(true);
    });
  });

export async function findAvailablePort(startPort: number) {
  let port = startPort;
  for (; port < startPort + 1000; port++) {
    if (await isPortAvailable(port)) break;
  }

  return port;
}
