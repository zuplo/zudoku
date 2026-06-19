import { Markdown } from "zudoku/components";

/**
 * Markdown for descriptions rendered inside a `<Link>`/`<a>` (cards, search
 * rows). Paragraphs render inline and links become spans, so we never nest
 * anchors or put a `<p>` inside an `<a>`, both of which break hydration.
 */
export const LinkSafeMarkdown = ({
  content,
  className,
}: {
  content: string;
  className?: string;
}) => (
  <Markdown
    content={content}
    className={className}
    components={{
      p: ({ children }) => children,
      a: ({ node, href, target, rel, ...props }) => <span {...props} />,
    }}
  />
);
