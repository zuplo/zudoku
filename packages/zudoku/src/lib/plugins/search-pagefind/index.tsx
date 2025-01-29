import { ClientOnly } from "../../components/ClientOnly.js";
import type { ZudokuPlugin } from "../../core/plugins.js";
import { PagefindSearch } from "./PagefindSearch.js";

export const pagefindSearchPlugin = (settings: unknown): ZudokuPlugin => {
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
          <PagefindSearch
            isOpen={isOpen}
            onClose={onClose}
            settings={settings}
          />
        </ClientOnly>
      );
    },
  };
};
