/**
 * Valid badge colors for navigation
 */
export type BadgeColor =
  | "green"
  | "blue"
  | "yellow"
  | "red"
  | "purple"
  | "indigo"
  | "gray"
  | "outline";

/**
 * Color mapping for AsyncAPI actions (send/receive)
 * Used for navigation badges
 */
export const ActionColorMap: Record<string, BadgeColor> = {
  send: "green",
  receive: "blue",
  publish: "green",
  subscribe: "blue",
};

/**
 * Color mapping for AsyncAPI protocols
 * Used for navigation badges in the sidebar
 */
export const ProtocolColorMap: Record<string, BadgeColor> = {
  ws: "purple",
  wss: "purple",
  websocket: "purple",
  mqtt: "green",
  mqtts: "green",
  kafka: "yellow",
  amqp: "blue",
  amqps: "blue",
  http: "indigo",
  https: "indigo",
  jms: "red",
  stomp: "gray",
};

/**
 * Get a display label for a protocol
 */
export const getProtocolLabel = (protocol: string): string => {
  const labels: Record<string, string> = {
    ws: "WSS",
    wss: "WSS",
    websocket: "WSS",
    mqtt: "MQTT",
    mqtts: "MQTT",
    kafka: "KAFKA",
    amqp: "AMQP",
    amqps: "AMQP",
    http: "HTTP",
    https: "HTTP",
    jms: "JMS",
    stomp: "STOMP",
  };
  return labels[protocol.toLowerCase()] ?? protocol.toUpperCase();
};
