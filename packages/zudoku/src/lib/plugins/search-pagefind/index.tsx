import type { ZudokuConfig } from "../../../config/validators/validate.js";
import { ClientOnly } from "../../components/ClientOnly.js";
import type { ZudokuPlugin } from "../../core/plugins.js";
import { PagefindSearch } from "./PagefindSearch.js";

export type PagefindOptions = Extract<
  ZudokuConfig["search"],
  { type: "pagefind" }
> & { basePath?: string };

export const pagefindSearchPlugin = (
  options: PagefindOptions,
): ZudokuPlugin => {
  return {
    renderSearch: ({ isOpen, onClose }) => (
      <ClientOnly>
        <PagefindSearch isOpen={isOpen} onClose={onClose} options={options} />
      </ClientOnly>
    ),
  };
};
