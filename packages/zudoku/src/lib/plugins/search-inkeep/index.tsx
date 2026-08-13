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

// All settings are intersected with Record<string, unknown> and passed through
// as-is, so settings added in newer Inkeep versions can be used before they
// appear in the type definitions.
export type InkeepSearchPluginOptions = InkeepBaseSettings &
  Record<string, unknown> & {
    // Discriminator from the Zudoku `search` config; not passed to Inkeep
    type?: "inkeep";
    searchSettings?: InkeepSearchSettings & Record<string, unknown>;
    aiChatSettings?: InkeepAIChatSettings & Record<string, unknown>;
    modalSettings?: InkeepModalSettings & Record<string, unknown>;
  };

const InkeepSearch = ({
  isOpen,
  onOpen,
  onClose,
  settings,
}: {
  isOpen: boolean;
  onOpen: () => void;
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
          // The modal is controlled through `isOpen`, so Inkeep never opens or
          // closes itself: it only reports what it wants (Escape, a
          // `triggerSelector` click, or a `shortcutKey` if one was configured).
          // Both directions have to be mirrored back into Zudoku's state,
          // otherwise those interactions do nothing at all.
          if (newOpen) {
            onOpen();
          } else {
            onClose();
          }
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
  }, [onClose, onOpen, settings]);

  const [searchInstance, setSearchInstance] =
    useState<InkeepComponentInstance>();

  useEffect(() => {
    let instance: InkeepComponentInstance | undefined;

    // Every call mounts another widget into the DOM, so this must happen in an
    // effect and never during render.
    const createInstance = () => {
      instance = window.Inkeep?.ModalSearchAndChat?.(config);
      if (instance) setSearchInstance(instance);

      return Boolean(instance);
    };

    const removeInstance = () => {
      const created = instance;
      if (!created) return;

      instance = undefined;
      // Defer so we never unmount synchronously mid-render (StrictMode).
      setTimeout(() => created.unmount(), 0);
    };

    // The Inkeep script is loaded deferred, so poll until it is available
    if (createInstance()) return removeInstance;

    const checkInkeep = setInterval(() => {
      if (createInstance()) clearInterval(checkInkeep);
    }, 100);

    return () => {
      clearInterval(checkInkeep);
      removeInstance();
    };
  }, [config]);

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
    renderSearch: ({ isOpen, onOpen, onClose }) => {
      return (
        <ClientOnly>
          <InkeepSearch
            isOpen={isOpen}
            onOpen={onOpen}
            onClose={onClose}
            settings={settings}
          />
        </ClientOnly>
      );
    },
  };
};
