import { useEffect, useMemo, useRef, useState } from "react";
import { ClientOnly } from "../../components/ClientOnly.js";
import type { ZudokuPlugin } from "../../core/plugins.js";
import { aiChatSettings, baseSettings } from "./inkeep.js";

interface PluginInkeepBaseSettings {
  apiKey?: string;
  integrationId: string;
  organizationId: string;
  organizationDisplayName?: string;
  primaryBrandColor: string;
}

interface InkeepEmbedConfig {
  componentType: string;
  targetElement: HTMLElement;
  properties: unknown;
}

interface InkeepWidget {
  render: (config: InkeepEmbedConfig & { isOpen: boolean }) => void;
}

declare global {
  let Inkeep: () => {
    embed: (config: InkeepEmbedConfig) => InkeepWidget;
  };
}

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
  const ref = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<InkeepWidget | null>(null);
  const [isInkeepAvailable, setIsInkeepAvailable] = useState(
    typeof Inkeep !== "undefined",
  );

  const config: InkeepEmbedConfig = useMemo(
    () => ({
      componentType: "CustomTrigger",
      targetElement: ref.current!,
      properties: {
        isOpen,
        onClose,
        onOpen: undefined,
        baseSettings: { ...baseSettings, ...settings },
        searchSettings: {
          prefilledQuery: prefilledQuery || undefined,
        },
        aiChatSettings,
      },
    }),
    [isOpen, onClose, prefilledQuery, settings, ref],
  );

  useEffect(() => {
    if (isInkeepAvailable) return;

    const checkInkeep = setInterval(() => {
      if (typeof Inkeep !== "undefined") {
        setIsInkeepAvailable(true);
        clearInterval(checkInkeep);
      }
    }, 100);

    return () => clearInterval(checkInkeep);
  }, [isInkeepAvailable]);

  useEffect(() => {
    if (!isInkeepAvailable || widgetRef.current) return;

    widgetRef.current = Inkeep().embed(config);
  }, [config, isInkeepAvailable]);

  useEffect(() => {
    widgetRef.current?.render({ ...config, isOpen });
  }, [config, isOpen]);

  return <div ref={ref} />;
};

export const inkeepSearchPlugin = (
  settings: PluginInkeepBaseSettings,
): ZudokuPlugin => {
  return {
    getHead: () => {
      return (
        <script
          type="module"
          src="https://unpkg.com/@inkeep/uikit-js@0.3.19/dist/embed.js"
          defer
        />
      );
    },
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
