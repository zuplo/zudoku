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
 * Default color values (used as CSS variable fallbacks)
 * Light mode colors - dark mode handled via CSS
 */
const defaultProtocolColors: Record<
  ProtocolColorKey,
  { bg: string; text: string }
> = {
  ws: { bg: "#f3e8ff", text: "#7c3aed" }, // purple
  mqtt: { bg: "#dcfce7", text: "#16a34a" }, // green
  kafka: { bg: "#ffedd5", text: "#ea580c" }, // orange
  amqp: { bg: "#fef3c7", text: "#d97706" }, // amber
  http: { bg: "#dbeafe", text: "#2563eb" }, // blue
  nats: { bg: "#cffafe", text: "#0891b2" }, // cyan
  redis: { bg: "#fee2e2", text: "#dc2626" }, // red
  jms: { bg: "#e0e7ff", text: "#4f46e5" }, // indigo
  sns: { bg: "#fce7f3", text: "#db2777" }, // pink
  stomp: { bg: "#ccfbf1", text: "#0d9488" }, // teal
  mercure: { bg: "#ede9fe", text: "#7c3aed" }, // violet
  sse: { bg: "#ffe4e6", text: "#e11d48" }, // rose
  default: { bg: "#f3f4f6", text: "#4b5563" }, // gray
};

/**
 * Get inline styles for protocol badge colors using CSS variables with fallbacks.
 * This allows theme customization via CSS custom properties.
 */
export const getProtocolColor = (
  protocol: string,
): { bg: string; text: string; style: React.CSSProperties } => {
  const normalizedProtocol = protocol.toLowerCase();
  const varPrefix = protocolToVarPrefix[normalizedProtocol] ?? "default";
  const defaults = defaultProtocolColors[varPrefix];

  return {
    bg: "", // Not using Tailwind classes anymore
    text: "",
    style: {
      backgroundColor: `var(--asyncapi-protocol-${varPrefix}-bg, ${defaults.bg})`,
      color: `var(--asyncapi-protocol-${varPrefix}-text, ${defaults.text})`,
    },
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
