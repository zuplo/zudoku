/**
 * Color mappings for AsyncAPI protocols using CSS custom properties.
 *
 * Users can customize these colors in their theme by overriding the CSS variables:
 * - --asyncapi-protocol-ws-bg / --asyncapi-protocol-ws-text
 * - --asyncapi-protocol-mqtt-bg / --asyncapi-protocol-mqtt-text
 * - --asyncapi-protocol-kafka-bg / --asyncapi-protocol-kafka-text
 * - --asyncapi-action-send-bg / --asyncapi-action-send-text
 * - --asyncapi-action-receive-bg / --asyncapi-action-receive-text
 * etc.
 */

type ProtocolColorKey =
  | "ws"
  | "mqtt"
  | "kafka"
  | "amqp"
  | "http"
  | "nats"
  | "redis"
  | "jms"
  | "sns"
  | "stomp"
  | "mercure"
  | "sse"
  | "default";

/**
 * CSS variable names for protocol colors
 * Maps protocol to its CSS variable prefix
 */
const protocolToVarPrefix: Record<string, ProtocolColorKey> = {
  ws: "ws",
  wss: "ws",
  websocket: "ws",
  mqtt: "mqtt",
  "mqtt+ssl": "mqtt",
  mqtts: "mqtt",
  kafka: "kafka",
  "kafka-secure": "kafka",
  amqp: "amqp",
  amqps: "amqp",
  amqp1: "amqp",
  http: "http",
  https: "http",
  nats: "nats",
  redis: "redis",
  jms: "jms",
  sns: "sns",
  sqs: "sns",
  googlepubsub: "http",
  pubsub: "http",
  stomp: "stomp",
  stomps: "stomp",
  mercure: "mercure",
  sse: "sse",
};

/**
 * Text color classes for protocols (matching OpenAPI method color style)
 */
const protocolTextColors: Record<ProtocolColorKey, string> = {
  ws: "text-purple-600", // purple
  mqtt: "text-green-600", // green
  kafka: "text-orange-600", // orange
  amqp: "text-amber-600", // amber
  http: "text-sky-600", // blue
  nats: "text-cyan-600", // cyan
  redis: "text-red-600", // red
  jms: "text-indigo-600", // indigo
  sns: "text-pink-600", // pink
  stomp: "text-teal-600", // teal
  mercure: "text-violet-600", // violet
  sse: "text-rose-600", // rose
  default: "text-gray-600", // gray
};

/**
 * Get text color class for protocol (matching OpenAPI method color style).
 */
export const getProtocolColor = (protocol: string): { textClass: string } => {
  const normalizedProtocol = protocol.toLowerCase();
  const varPrefix = protocolToVarPrefix[normalizedProtocol] ?? "default";
  const textClass = protocolTextColors[varPrefix];

  return {
    textClass,
  };
};

/**
 * Default action colors
 */
const defaultActionColors = {
  send: { bg: "#dcfce7", text: "#16a34a" }, // emerald/green
  receive: { bg: "#dbeafe", text: "#0284c7" }, // sky/blue
  default: { bg: "#f3f4f6", text: "#4b5563" }, // gray
};

/**
 * Get inline styles for action badge colors using CSS variables with fallbacks.
 */
export const getActionColor = (
  action: string,
): { bg: string; text: string; style: React.CSSProperties } => {
  const normalizedAction = action.toLowerCase();
  const actionKey =
    normalizedAction === "send" || normalizedAction === "publish"
      ? "send"
      : normalizedAction === "receive" || normalizedAction === "subscribe"
        ? "receive"
        : "default";

  const defaults =
    defaultActionColors[actionKey as keyof typeof defaultActionColors] ??
    defaultActionColors.default;

  return {
    bg: "",
    text: "",
    style: {
      backgroundColor: `var(--asyncapi-action-${actionKey}-bg, ${defaults.bg})`,
      color: `var(--asyncapi-action-${actionKey}-text, ${defaults.text})`,
    },
  };
};
