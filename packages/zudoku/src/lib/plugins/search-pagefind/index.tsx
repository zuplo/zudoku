import type { ZudokuConfig } from "../../../config/validators/validate.js";
import type { ZudokuPlugin } from "../../core/plugins.js";
import { PagefindSearch } from "./PagefindSearch.js";

export type PagefindOptions = Extract<
  ZudokuConfig["search"],
  { type: "pagefind" }
>;

export const pagefindSearchPlugin = (
  options: PagefindOptions,
): ZudokuPlugin => {
  return {
    renderSearch: ({ isOpen, onClose }) => (
      <PagefindSearch isOpen={isOpen} onClose={onClose} options={options} />
    ),
  };
};
