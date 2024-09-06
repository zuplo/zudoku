// import { Context } from "@sentry/node/types/integrations/context.js";
import { PostHog } from "posthog-node";
import { POST_HOG_CAPTURE_KEY } from "../constants.js";
import { machineId } from "../machine-id/lib.js";

interface IdentifyMessageV1 {
  distinctId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties?: Record<string | number, any>;
  disableGeoip?: boolean;
}

interface EventMessageV1 extends IdentifyMessageV1 {
  event: string;
  groups?: Record<string, string | number>;
  sendFeatureFlags?: boolean;
  timestamp?: Date;
}

interface ZuploEventMessage extends Omit<EventMessageV1, "distinctId"> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  argv: any;
}

let _postHog: PostHog | undefined;
// let _context: Context | undefined;

function init(): PostHog | undefined {
  if (process.env.ZUDOKU_DO_NOT_TRACK || !POST_HOG_CAPTURE_KEY) {
    return undefined;
  }

  _postHog = new PostHog(POST_HOG_CAPTURE_KEY, {
    host: "https://app.posthog.com",
    flushAt: 1,
    flushInterval: 1,
  });

  // // Use the additional information from sentry for the OS, CPU, etc
  // // This is a bit of a hack since this is not an official API from sentry
  // _context = (
  //   getDefaultIntegrations({}).filter(
  //     (integration) => integration.name == "Context",
  //   ) as Context[]
  // )[0];

  return _postHog;
}

// A convenience wrapper so that callers do not have to inject the distincId for each call to capture
export async function captureEvent({
  event,
  properties,
  groups,
  sendFeatureFlags,
  timestamp,
  disableGeoip,
}: ZuploEventMessage): Promise<void> {
  if (_postHog === undefined) {
    init();
  }

  if (_postHog) {
    properties = properties ?? {};
    properties.$set_once = properties.$set_once ?? {};

    // Nice to have: set information if this is in CI
    if (process.env.CI) {
      properties["ci"] = process.env.CI;
    }

    // // Nice to have: set information about the machine
    // await _context?.addContext(properties);

    _postHog.capture({
      distinctId: machineId(),
      event,
      properties,
      groups,
      sendFeatureFlags,
      timestamp,
      disableGeoip,
    });
  }
}

export async function shutdownAnalytics(): Promise<void> {
  return _postHog?.shutdown();
}
