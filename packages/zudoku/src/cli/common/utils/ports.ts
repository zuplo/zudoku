import net, { Socket } from "net";

export function isPortAvailable(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket: Socket = new net.Socket();

    socket.connect(port, host);

    socket.on("connect", () => {
      // If we can connect, that means that the port is not free
      socket.destroy(); // Close the socket
      resolve(false);
    });

    socket.on("error", () => {
      // If we cannot connect, that means that the port is not free
      socket.destroy(); // Close the socket
      resolve(true);
    });
  });
}
