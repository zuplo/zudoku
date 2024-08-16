import type { InkeepWidgetBaseSettings } from "@inkeep/widgets";
import { lazy } from "react";
import { ClientOnly } from "../../components/ClientOnly.js";
import type { DevPortalPlugin } from "../../core/plugins.js";
import { aiChatSettings, baseSettings } from "./inkeep.js";

type PickedPluginInkeepBaseSettings =
  | "apiKey"
  | "integrationId"
  | "organizationId"
  | "primaryBrandColor"
  | "organizationDisplayName";

type PluginInkeepBaseSettings = Pick<
  InkeepWidgetBaseSettings,
  PickedPluginInkeepBaseSettings
>;

const Inkeep = lazy(() => import("./InkeepCustomTrigger.js"));

const InkeepSearch = ({
  prefilledQuery,
  isOpen,
  onClose,
  settings,
}: {
  isOpen: boolean;
  onClose: () => void;
  prefilledQuery?: string | null;
  settings: PluginInkeepBaseSettings;
}) => {
  return (
    <Inkeep
      isOpen={isOpen}
      onClose={onClose}
      baseSettings={{ ...baseSettings, ...settings }}
      aiChatSettings={aiChatSettings}
      searchSettings={{
        prefilledQuery: prefilledQuery || undefined,
      }}
    />
  );
};

export const inkeepSearchPlugin = (
  settings: PluginInkeepBaseSettings,
): DevPortalPlugin => {
  return {
    renderSearch: ({
      isOpen,
      onClose,
    }: {
      isOpen: boolean;
      onClose: () => void;
    }) => {
      return (
        <ClientOnly>
          <InkeepSearch isOpen={isOpen} onClose={onClose} settings={settings} />
        </ClientOnly>
      );
    },
  };
};
