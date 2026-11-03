import { DocSearch, type DocSearchRef } from "@docsearch/core";
import { DocSearchModal, type DocSearchModalProps } from "@docsearch/modal";
import { useEffect, useRef } from "react";

const DocSearchWrapper = ({
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

export default DocSearchWrapper;
