interface CreateWebhookData {
  url: string;
  events: string[];
  active?: boolean;
}

// ---------- helpers ----------

function mapEventToJsEnum(e: string): string | null {
  switch (e) {
    case "shipment.created":
      return "WebhookEvent.ShipmentCreated";
    case "shipment.in_transit":
      return "WebhookEvent.ShipmentInTransit";
    case "shipment.delivered":
      return "WebhookEvent.ShipmentDelivered";
    case "shipment.exception":
      return "WebhookEvent.ShipmentException";
    default:
      return null;
  }
}

function mapEventToPythonEnum(e: string): string | null {
  switch (e) {
    case "shipment.created":
      return "WebhookEvent.SHIPMENT_CREATED";
    case "shipment.in_transit":
      return "WebhookEvent.SHIPMENT_IN_TRANSIT";
    case "shipment.delivered":
      return "WebhookEvent.SHIPMENT_DELIVERED";
    case "shipment.exception":
      return "WebhookEvent.SHIPMENT_EXCEPTION";
    default:
      return null;
  }
}

function mapEventToJavaEnum(e: string): string | null {
  switch (e) {
    case "shipment.created":
      return "WebhookEvent.SHIPMENT_CREATED";
    case "shipment.in_transit":
      return "WebhookEvent.SHIPMENT_IN_TRANSIT";
    case "shipment.delivered":
      return "WebhookEvent.SHIPMENT_DELIVERED";
    case "shipment.exception":
      return "WebhookEvent.SHIPMENT_EXCEPTION";
    default:
      return null;
  }
}

function escapeJava(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function escapeJs(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
}

function escapePython(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

// ---------- entrypoint ----------

export function generateWebhookCodeSnippet(
  lang: string,
  selectedServer: string,
  operationId?: string | null,
  exampleBody?: unknown,
): string | false {
  switch (operationId) {
    case "registerWebhook":
      return generateForRegisterWebhook(
        lang,
        selectedServer,
        exampleBody as CreateWebhookData,
      );
    case "listWebhooks":
      return generateForListWebhooks(lang, selectedServer);
    default:
      return false;
  }
}

// ---------- register webhook ----------

function generateForRegisterWebhook(
  lang: string,
  selectedServer: string,
  webhookData: CreateWebhookData,
): string | false {
  switch (lang) {
    case "js":
      return generateJsForRegisterWebhook(selectedServer, webhookData);
    case "python":
      return generatePythonForRegisterWebhook(selectedServer, webhookData);
    case "java":
      return generateJavaForRegisterWebhook(selectedServer, webhookData);
    default:
      return false;
  }
}

function generateJsForRegisterWebhook(
  selectedServer: string,
  webhookData: CreateWebhookData,
): string {
  const url = escapeJs(webhookData.url);
  const events = webhookData.events
    .map(mapEventToJsEnum)
    .filter((e): e is string => Boolean(e))
    .join(", ");

  const activeSetter =
    webhookData.active !== undefined
      ? `,\n  active: ${webhookData.active}`
      : "";

  return `
import { WebhookClient, WebhookEvent } from "@cosmocargo/webhooks";

const client = new WebhookClient({
  apiKey: "YOUR_API_KEY",
  baseUrl: "${escapeJs(selectedServer)}"
});

const created = await client.registerWebhook({
  url: "${url}",
  events: [${events}],${activeSetter}
});
  `.trim();
}

function generatePythonForRegisterWebhook(
  selectedServer: string,
  webhookData: CreateWebhookData,
): string {
  const url = escapePython(webhookData.url);
  const events = webhookData.events
    .map(mapEventToPythonEnum)
    .filter((e): e is string => Boolean(e))
    .join(", ");

  const activeSetter =
    webhookData.active !== undefined
      ? `,\n  active=${webhookData.active ? "True" : "False"}`
      : "";

  return `
from cosmocargo_webhooks import WebhookClient, WebhookEvent

client = WebhookClient(
  api_key="YOUR_API_KEY",
  base_url="${escapePython(selectedServer)}"
)

created = client.register_webhook(
  url="${url}",
  events=[${events}],${activeSetter}
)
  `.trim();
}

function generateJavaForRegisterWebhook(
  selectedServer: string,
  webhookData: CreateWebhookData,
): string {
  const escapedUrl = escapeJava(webhookData.url);

  const eventsEnum = webhookData.events
    .map(mapEventToJavaEnum)
    .filter((e): e is string => Boolean(e))
    .join(",\n      ");

  const activeSetter =
    webhookData.active !== undefined
      ? `\n    .active(${webhookData.active})`
      : "";

  return `
import java.util.EnumSet;
import com.cosmocargo.webhooks.WebhookClient;
import com.cosmocargo.webhooks.Webhook;
import com.cosmocargo.webhooks.WebhookEvent;

WebhookClient client = WebhookClient.builder()
  .apiKey("YOUR_API_KEY")
  .baseUrl("${escapeJava(selectedServer)}")
  .build();

Webhook created = client.registerWebhook(
  WebhookClient.RegisterWebhookRequest.builder()
    .url("${escapedUrl}")
    .events(EnumSet.of(
      ${eventsEnum}
    ))${activeSetter}
    .build()
);
  `.trim();
}

// ---------- list webhooks ----------

function generateForListWebhooks(
  lang: string,
  selectedServer: string,
): string | false {
  switch (lang) {
    case "js":
      return generateJsForListWebhooks(selectedServer);
    case "python":
      return generatePythonForListWebhooks(selectedServer);
    case "java":
      return generateJavaForListWebhooks(selectedServer);
    default:
      return false;
  }
}

function generateJavaForListWebhooks(selectedServer: string): string {
  return `
import java.util.List;
import com.cosmocargo.webhooks.WebhookClient;
import com.cosmocargo.webhooks.Webhook;

WebhookClient client = WebhookClient.builder()
  .apiKey("YOUR_API_KEY")
  .baseUrl("${escapeJava(selectedServer)}")
  .build();

List<Webhook> webhooks = client.listWebhooks();
  `.trim();
}

function generateJsForListWebhooks(selectedServer: string): string {
  return `
import { WebhookClient } from "@cosmocargo/webhooks";

const client = new WebhookClient({
  apiKey: "YOUR_API_KEY",
  baseUrl: "${escapeJs(selectedServer)}"
});

const webhooks = await client.listWebhooks();
  `.trim();
}

function generatePythonForListWebhooks(selectedServer: string): string {
  return `
from cosmocargo_webhooks import WebhookClient

client = WebhookClient(
  api_key="YOUR_API_KEY",
  base_url="${escapePython(selectedServer)}"
)

webhooks = client.list_webhooks()
  `.trim();
}
