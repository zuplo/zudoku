import type { DocSearchRef } from "@docsearch/core";
import type { DocSearchModalProps } from "@docsearch/modal";
import { lazy, useEffect, useRef } from "react";
import { createPlugin } from "zudoku";
import { ClientOnly } from "zudoku/components";
import "@docsearch/css";

const DocSearchWrapper = lazy(async () => {
  const [{ DocSearch }, { DocSearchModal }] = await Promise.all([
    import("@docsearch/core"),
    import("@docsearch/modal"),
  ]);

  const Wrapper = ({
    isOpen,
    onClose,
    config,
  }: {
    isOpen: boolean;
    onClose: () => void;
    config: DocSearchModalProps;
  }) => {
    const ref = useRef<DocSearchRef>(null);

    useEffect(() => {
      if (isOpen) ref.current?.open();
    }, [isOpen]);

    return (
      <DocSearch
        ref={ref}
        onClose={onClose}
        keyboardShortcuts={{
          // handled by Zudoku
          "Ctrl/Cmd+K": false,
          "/": false,
        }}
      >
        <DocSearchModal {...config} />
      </DocSearch>
    );
  };

  return { default: Wrapper };
});

export const algoliaSearchPlugin = createPlugin(
  (config: DocSearchModalProps) => ({
    renderSearch: ({ isOpen, onClose }) => (
      <ClientOnly>
        <DocSearchWrapper isOpen={isOpen} onClose={onClose} config={config} />
      </ClientOnly>
    ),
  }),
);
