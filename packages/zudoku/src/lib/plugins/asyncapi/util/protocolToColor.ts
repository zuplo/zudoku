/**
 * Color mappings for AsyncAPI protocols
 * Following Tailwind CSS color classes
 */

export const protocolToColor: Record<string, { bg: string; text: string }> = {
  // WebSocket variants
  ws: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-300",
  },
  wss: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-300",
  },
  websocket: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-300",
  },

  // MQTT variants
  mqtt: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-300",
  },
  "mqtt+ssl": {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-300",
  },
  mqtts: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-300",
  },

  // Kafka
  kafka: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-300",
  },
  "kafka-secure": {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-300",
  },

  // AMQP (RabbitMQ)
  amqp: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
  },
  amqps: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
  },
  amqp1: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
  },

  // HTTP variants (for webhooks)
  http: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
  },
  https: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
  },

  // NATS
  nats: {
    bg: "bg-cyan-100 dark:bg-cyan-900/30",
    text: "text-cyan-700 dark:text-cyan-300",
  },

  // Redis
  redis: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-300",
  },

  // JMS
  jms: {
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    text: "text-indigo-700 dark:text-indigo-300",
  },

  // SNS/SQS
  sns: {
    bg: "bg-pink-100 dark:bg-pink-900/30",
    text: "text-pink-700 dark:text-pink-300",
  },
  sqs: {
    bg: "bg-pink-100 dark:bg-pink-900/30",
    text: "text-pink-700 dark:text-pink-300",
  },

  // Google Pub/Sub
  googlepubsub: {
    bg: "bg-sky-100 dark:bg-sky-900/30",
    text: "text-sky-700 dark:text-sky-300",
  },
  pubsub: {
    bg: "bg-sky-100 dark:bg-sky-900/30",
    text: "text-sky-700 dark:text-sky-300",
  },

  // STOMP
  stomp: {
    bg: "bg-teal-100 dark:bg-teal-900/30",
    text: "text-teal-700 dark:text-teal-300",
  },
  stomps: {
    bg: "bg-teal-100 dark:bg-teal-900/30",
    text: "text-teal-700 dark:text-teal-300",
  },

  // Mercure
  mercure: {
    bg: "bg-violet-100 dark:bg-violet-900/30",
    text: "text-violet-700 dark:text-violet-300",
  },

  // Server-Sent Events
  sse: {
    bg: "bg-rose-100 dark:bg-rose-900/30",
    text: "text-rose-700 dark:text-rose-300",
  },
};

// Default colors for unknown protocols
const defaultColor = {
  bg: "bg-gray-100 dark:bg-gray-800/30",
  text: "text-gray-700 dark:text-gray-300",
};

/**
 * Get color classes for a given protocol
 */
export const getProtocolColor = (
  protocol: string,
): { bg: string; text: string } => {
  const normalizedProtocol = protocol.toLowerCase();
  return protocolToColor[normalizedProtocol] ?? defaultColor;
};

/**
 * Action (send/receive) color mapping
 */
export const actionToColor: Record<string, { bg: string; text: string }> = {
  send: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  receive: {
    bg: "bg-sky-100 dark:bg-sky-900/30",
    text: "text-sky-700 dark:text-sky-300",
  },
  publish: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  subscribe: {
    bg: "bg-sky-100 dark:bg-sky-900/30",
    text: "text-sky-700 dark:text-sky-300",
  },
};

/**
 * Get color classes for an action
 */
export const getActionColor = (
  action: string,
): { bg: string; text: string } => {
  const normalizedAction = action.toLowerCase();
  return actionToColor[normalizedAction] ?? defaultColor;
};
