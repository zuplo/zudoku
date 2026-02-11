import type { AsyncAPIDocument } from "../../../asyncapi/types.js";
import type { AsyncApiProcessorArg } from "../interfaces.js";
import { type RecordAny, traverse } from "./traverse.js";

interface RemoveChannelsOptions {
  // Channel definitions, e.g., { 'userSignup': true }
  channels?: Record<string, boolean>;
  shouldRemove?: (options: {
    channelId: string;
    channel: RecordAny;
  }) => boolean;
}

export const removeChannels =
  ({ channels = {}, shouldRemove }: RemoveChannelsOptions = {}) =>
  ({ schema }: AsyncApiProcessorArg) =>
    traverse(schema, (spec) => {
      if (!spec.channels) return spec;

      const updatedChannels: RecordAny = {};

      for (const [channelId, channel] of Object.entries(
        spec.channels as RecordAny,
      )) {
        // If the channel is explicitly marked for removal
        if (channels[channelId] === true) continue;

        // If the channel should be removed via shouldRemove callback
        if (shouldRemove?.({ channelId, channel: channel as RecordAny }))
          continue;

        updatedChannels[channelId] = channel;
      }

      return { ...spec, channels: updatedChannels };
    }) as AsyncAPIDocument;
