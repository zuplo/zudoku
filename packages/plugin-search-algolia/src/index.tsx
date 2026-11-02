import type { DocSearchModalProps } from "@docsearch/modal";
import { lazy } from "react";
import { createPlugin } from "zudoku";
import { ClientOnly } from "zudoku/components";
import "@docsearch/css";

const DocSearchWrapper = lazy(() => import("./DocSearchWrapper.js"));

export const algoliaSearchPlugin = createPlugin(
  (config: DocSearchModalProps) => ({
    renderSearch: ({ isOpen, onClose }) => (
      <ClientOnly>
        <DocSearchWrapper isOpen={isOpen} onClose={onClose} config={config} />
      </ClientOnly>
    ),
  }),
);
