import type {
  InkeepBaseSettings,
  InkeepComponentInstance,
  InkeepJS,
  InkeepSettings,
} from "@inkeep/cxkit-types";
import { useEffect, useMemo, useState } from "react";
import { ClientOnly } from "../../components/ClientOnly.js";
import type { ZudokuPlugin } from "../../core/plugins.js";
import {
  aiChatSettings,
  baseSettings,
  modalSettings,
  searchSettings,
} from "./inkeep.js";

declare global {
  interface Window {
    Inkeep: InkeepJS | undefined;
  }
}

const InkeepSearch = ({
  isOpen,
  onClose,
  settings,
}: {
  isOpen: boolean;
  onClose: () => void;
  settings: InkeepBaseSettings;
}) => {
  const config = useMemo<InkeepSettings>(
    () => ({
      baseSettings: {
        ...baseSettings,
        ...settings,
        colorMode: {
          sync: {
            target: "html",
            attributes: ["class"],
            isDarkMode: (attrs) => attrs.class?.includes("dark") ?? false,
          },
        },
      },
      modalSettings: {
        ...modalSettings,
        onOpenChange: (newOpen: boolean) => {
          if (!newOpen) onClose();
        },
      },
      searchSettings,
      aiChatSettings,
    }),
    [onClose, settings],
  );
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
  settings: InkeepBaseSettings,
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
