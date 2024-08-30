import { createHighlighter, makeSingletonHighlighter } from "shiki";
import { bundledLanguages } from "shiki/bundle/web";

const getHighlighter = makeSingletonHighlighter(createHighlighter);

type CodeProps = {
  code: string;
  lang: string;
};

export const codeToHtml = async ({ code, lang }: CodeProps) => {
  const highlighter = await getHighlighter({
    themes: ["github-dark"],
    langs: Object.keys(bundledLanguages),
  });

  return highlighter.codeToHtml(code, {
    lang,
    theme: "github-dark",
    colorReplacements: { "#24292e": "transparent" },
  });
};

export default async function Code({
  code,
  lang,
  className,
}: CodeProps & { className?: string }) {
  const __html = await codeToHtml({ code, lang });

  return (
    <div
      className={`overflow-auto ${className}`}
      dangerouslySetInnerHTML={{ __html }}
    />
  );
}
