import { joinUrl } from "../util/joinUrl.js";
import { useZudoku } from "./context/ZudokuContext.js";

/**
 * Blockquote linking to /llms.txt for AI agent discoverability (AFDocs llms-txt-directive).
 * @see https://afdocs.dev/checks/content-discoverability.html#llms-txt-directive
 */
export const LlmsTxtDirective = () => {
  const { options } = useZudoku();

  if (options.site?.llmsTxtDirective === false) {
    return null;
  }

  const href = joinUrl(options.basePath, "/llms.txt");

  return (
    <blockquote className="sr-only" cite={href}>
      <p>
        For the complete documentation index, see <a href={href}>llms.txt</a>
      </p>
    </blockquote>
  );
};
