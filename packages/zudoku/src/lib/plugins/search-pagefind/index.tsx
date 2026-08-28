import { lazy, useEffect, useState } from "react";
import type { ZudokuConfig } from "../../../config/validators/ZudokuConfig.js";
import type { ZudokuPlugin } from "../../core/plugins.js";

const PagefindSearch = lazy(() =>
  import("./PagefindSearch.js").then((module) => ({
    default: module.PagefindSearch,
  })),
);

const MountedPagefindSearch = ({
  isOpen,
  onClose,
  options,
}: {
  isOpen: boolean;
  onClose: () => void;
  options: PagefindOptions;
}) => {
  const [hasOpened, setHasOpened] = useState(isOpen);

  useEffect(() => {
    if (isOpen) setHasOpened(true);
  }, [isOpen]);

  if (!isOpen && !hasOpened) return null;

  return <PagefindSearch isOpen={isOpen} onClose={onClose} options={options} />;
};

export type PagefindOptions = Extract<
  ZudokuConfig["search"],
  { type: "pagefind" }
>;

export const pagefindSearchPlugin = (
  options: PagefindOptions,
): ZudokuPlugin => {
  return {
    renderSearch: ({ isOpen, onClose }) => (
      <MountedPagefindSearch
        isOpen={isOpen}
        onClose={onClose}
        options={options}
      />
    ),
  };
};
