import type {
  ChannelBindingsObject,
  ChannelObject,
  ServerObject,
} from "../types.js";

/**
 * Detect protocols from channel bindings
 */
export const detectProtocolsFromBindings = (
  bindings?: ChannelBindingsObject,
): string[] => {
  if (!bindings) return [];

  const protocols: string[] = [];

  // Check each binding type
  const knownProtocols = [
    "http",
    "ws",
    "kafka",
    "mqtt",
    "amqp",
    "sse",
    "jms",
    "sns",
    "sqs",
    "stomp",
    "redis",
    "nats",
  ];

  for (const protocol of knownProtocols) {
    // Check if binding exists and is not just the __$ref property
    if (
      bindings[protocol] &&
      typeof bindings[protocol] === "object" &&
      Object.keys(bindings[protocol] as object).length > 0
    ) {
      protocols.push(protocol);
    }
  }

  return protocols;
};

/**
 * Detect protocol from server URL scheme
 */
export const detectProtocolFromUrl = (url: string): string | null => {
  const match = url.match(/^(\w+):\/\//);
  if (!match) return null;

  const scheme = match[1].toLowerCase();

  // Map common URL schemes to protocol names
  const schemeToProtocol: Record<string, string> = {
    ws: "ws",
    wss: "ws",
    http: "http",
    https: "http",
    mqtt: "mqtt",
    mqtts: "mqtt",
    amqp: "amqp",
    amqps: "amqp",
    kafka: "kafka",
    redis: "redis",
    nats: "nats",
  };

  return schemeToProtocol[scheme] || scheme;
};

/**
 * Detect protocols from server objects
 */
export const detectProtocolsFromServers = (
  servers: Record<string, ServerObject> | undefined,
  serverRefs: string[] = [],
): string[] => {
  if (!servers) return [];

  const protocols = new Set<string>();

  for (const ref of serverRefs) {
    const serverName =
      typeof ref === "string" ? ref.replace("#/servers/", "") : ref;
    const server = servers[serverName];

    if (server) {
      // First try the explicit protocol field
      if (server.protocol) {
        protocols.add(server.protocol.toLowerCase());
      }
      // Then try to detect from host URL
      else if (server.host) {
        const detectedProtocol = detectProtocolFromUrl(server.host);
        if (detectedProtocol) {
          protocols.add(detectedProtocol);
        }
      }
    }
  }

  return Array.from(protocols);
};

/**
 * Detect all protocols from a channel
 */
export const detectProtocols = (
  channel: ChannelObject | undefined,
  servers: Record<string, ServerObject> | undefined,
  serverRefs: unknown[] = [],
): string[] => {
  const protocols = new Set<string>();

  // From channel bindings
  if (channel?.bindings) {
    detectProtocolsFromBindings(channel.bindings).forEach((p) =>
      protocols.add(p),
    );
  }

  // From server refs
  const refs = serverRefs
    .map((ref) => {
      if (typeof ref === "string") return ref;
      if (typeof ref === "object" && ref !== null && "$ref" in ref) {
        return (ref as { $ref: string }).$ref;
      }
      return null;
    })
    .filter((r): r is string => r !== null);

  detectProtocolsFromServers(servers, refs).forEach((p) => protocols.add(p));

  return Array.from(protocols);
};

/**
 * Normalize protocol names to standard format
 */
export const normalizeProtocol = (protocol: string): string => {
  const normalized = protocol.toLowerCase();

  // Map aliases to standard names
  const aliases: Record<string, string> = {
    wss: "ws",
    websocket: "ws",
    websockets: "ws",
    https: "http",
    mqtts: "mqtt",
    amqps: "amqp",
  };

  return aliases[normalized] || normalized;
};

/**
 * Get protocol display name
 */
export const getProtocolDisplayName = (protocol: string): string => {
  const displayNames: Record<string, string> = {
    ws: "WebSocket",
    http: "HTTP",
    mqtt: "MQTT",
    amqp: "AMQP",
    kafka: "Kafka",
    sse: "SSE",
    redis: "Redis",
    nats: "NATS",
    stomp: "STOMP",
    jms: "JMS",
    sns: "SNS",
    sqs: "SQS",
  };

  return displayNames[normalizeProtocol(protocol)] || protocol.toUpperCase();
};
