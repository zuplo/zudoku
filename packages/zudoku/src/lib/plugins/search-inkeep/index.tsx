import type {
  InkeepAIChatSettings,
  InkeepBaseSettings,
  InkeepComponentInstance,
  InkeepJS,
  InkeepModalSettings,
  InkeepSearchSettings,
  InkeepSettings,
} from "@inkeep/cxkit-types";
import { useEffect, useMemo, useState } from "react";
import { ClientOnly } from "../../components/ClientOnly.js";
import type { ZudokuPlugin } from "../../core/plugins.js";
import {
  aiChatSettings as defaultAiChatSettings,
  baseSettings as defaultBaseSettings,
  modalSettings as defaultModalSettings,
  searchSettings as defaultSearchSettings,
} from "./inkeep.js";

declare global {
  interface Window {
    Inkeep: InkeepJS | undefined;
  }
}

export type InkeepSearchPluginOptions = InkeepBaseSettings & {
  // Discriminator from the Zudoku `search` config; not passed to Inkeep
  type?: "inkeep";
  searchSettings?: InkeepSearchSettings;
  aiChatSettings?: InkeepAIChatSettings;
  modalSettings?: InkeepModalSettings;
};

const InkeepSearch = ({
  isOpen,
  onClose,
  settings,
}: {
  isOpen: boolean;
  onClose: () => void;
  settings: InkeepSearchPluginOptions;
}) => {
  const config = useMemo<InkeepSettings>(() => {
    const {
      type: _type,
      searchSettings,
      aiChatSettings,
      modalSettings,
      ...baseSettings
    } = settings;

    return {
      baseSettings: {
        ...defaultBaseSettings,
        ...baseSettings,
        colorMode: {
          sync: {
            target: "html",
            attributes: ["class"],
            isDarkMode: (attrs) => attrs.class?.includes("dark") ?? false,
          },
          ...baseSettings.colorMode,
        },
      },
      modalSettings: {
        ...defaultModalSettings,
        ...modalSettings,
        onOpenChange: (newOpen: boolean) => {
          modalSettings?.onOpenChange?.(newOpen);
          if (!newOpen) onClose();
        },
      },
      searchSettings: {
        ...defaultSearchSettings,
        ...searchSettings,
      },
      aiChatSettings: {
        ...defaultAiChatSettings,
        ...aiChatSettings,
      },
    };
  }, [onClose, settings]);
  const [searchInstance, setSearchInstance] = useState<
    InkeepComponentInstance | undefined
  >(
    typeof window !== "undefined" && window.Inkeep?.ModalSearchAndChat
      ? window.Inkeep.ModalSearchAndChat(config)
      : undefined,
  );

  useEffect(() => {
    if (searchInstance) return;

    const checkInkeep = setInterval(() => {
      if (typeof window !== "undefined" && window.Inkeep?.ModalSearchAndChat) {
        const inkeep = window.Inkeep.ModalSearchAndChat(config);
        setSearchInstance(inkeep);
        clearInterval(checkInkeep);
      }
    }, 100);

    return () => clearInterval(checkInkeep);
  }, [config, searchInstance]);

  useEffect(() => {
    if (!searchInstance) return;

    searchInstance.update({ modalSettings: { isOpen } });
  }, [isOpen, searchInstance]);

  return null;
};

export const inkeepSearchPlugin = (
  settings: InkeepSearchPluginOptions,
): ZudokuPlugin => {
  return {
    getHead: () => {
      return (
        <script
          type="module"
          src="https://cdn.jsdelivr.net/npm/@inkeep/cxkit-js@0.5.90/+esm"
          defer
        />
      );
    },
    renderSearch: ({ isOpen, onClose }) => {
      return (
        <ClientOnly>
          <InkeepSearch isOpen={isOpen} onClose={onClose} settings={settings} />
        </ClientOnly>
      );
    },
  };
};
