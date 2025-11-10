import {
  type ComponentType,
  type LazyExoticComponent,
  lazy,
  Suspense,
  type SVGProps,
} from "react";

type Language = {
  pattern: RegExp;
  icon: LazyExoticComponent<ComponentType<SVGProps<SVGSVGElement>>>;
  width?: number;
};

const Languages: Record<string, Language> = {
  typescript: {
    pattern: /^(ts|typescript)$/,
    icon: lazy(() => import("../assets/language-icons/typescript.js")),
    width: 15,
  },
  javascript: {
    pattern: /^(js|javascript)$/,
    icon: lazy(() => import("../assets/language-icons/javascript.js")),
  },
  react: {
    pattern: /^(react|tsx|jsx)$/,
    icon: lazy(() => import("../assets/language-icons/react.js")),
    width: 22,
  },
  markdown: {
    pattern: /^(md|markdown)$/,
    icon: lazy(() => import("../assets/language-icons/markdown.js")),
    width: 22,
  },
  mdx: {
    pattern: /^mdx$/,
    icon: lazy(() => import("../assets/language-icons/mdx.js")),
    width: 28,
  },
  java: {
    pattern: /^(java)$/,
    icon: lazy(() => import("../assets/language-icons/java.js")),
    width: 22,
  },
  json: {
    pattern: /^jsonc?$/,
    icon: lazy(() => import("../assets/language-icons/json.js")),
  },
  yaml: {
    pattern: /^yaml$/,
    icon: lazy(() => import("../assets/language-icons/yaml.js")),
  },
  toml: {
    pattern: /^toml$/,
    icon: lazy(() => import("../assets/language-icons/toml.js")),
  },
  shell: {
    pattern: /^(shell|bash|sh|zsh|term|terminal|ansi)$/,
    icon: lazy(() => import("../assets/language-icons/shell.js")),
  },
  python: {
    pattern: /^(py|python)$/,
    icon: lazy(() => import("../assets/language-icons/python.js")),
  },
  csharp: {
    pattern: /^(cs|csharp|vb)$/,
    icon: lazy(() => import("../assets/language-icons/csharp.js")),
    width: 20,
  },
  rust: {
    pattern: /^(rs|rust)$/,
    icon: lazy(() => import("../assets/language-icons/rust.js")),
    width: 20,
  },
  ruby: {
    pattern: /^(rb|ruby)$/,
    icon: lazy(() => import("../assets/language-icons/ruby.js")),
  },
  php: {
    pattern: /^php$/,
    icon: lazy(() => import("../assets/language-icons/php.js")),
    width: 24,
  },
  html: {
    pattern: /^html?$/,
    icon: lazy(() => import("../assets/language-icons/html.js")),
    width: 15,
  },
  css: {
    pattern: /^css$/,
    icon: lazy(() => import("../assets/language-icons/css.js")),
  },
  objectivec: {
    pattern: /^(objc|objectivec)$/,
    icon: lazy(() => import("../assets/language-icons/objectivec.js")),
    width: 16,
  },
  swift: {
    pattern: /^swift$/,
    icon: lazy(() => import("../assets/language-icons/swift.js")),
  },
  go: {
    pattern: /^go$/,
    icon: lazy(() => import("../assets/language-icons/go.js")),
    width: 28,
  },
  xml: {
    pattern: /^xml$/,
    icon: lazy(() => import("../assets/language-icons/xml.js")),
  },
  kotlin: {
    pattern: /^(kt|kotlin)$/,
    icon: lazy(() => import("../assets/language-icons/kotlin.js")),
    width: 14,
  },
  graphql: {
    pattern: /^(gql|graphql)$/,
    icon: lazy(() => import("../assets/language-icons/graphql.js")),
  },
  zig: {
    pattern: /^zig$/,
    icon: lazy(() => import("../assets/language-icons/zig.js")),
    width: 28,
  },
  scala: {
    pattern: /^scala$/,
    icon: lazy(() => import("../assets/language-icons/scala.js")),
    width: 18,
  },
  dart: {
    pattern: /^dart$/,
    icon: lazy(() => import("../assets/language-icons/dart.js")),
    width: 20,
  },
  ocaml: {
    pattern: /^ocaml$/,
    icon: lazy(() => import("../assets/language-icons/ocaml.js")),
    width: 20,
  },
  c: {
    pattern: /^c$/,
    icon: lazy(() => import("../assets/language-icons/c.js")),
    width: 20,
  },
  cpp: {
    pattern: /^(cpp|c\+\+)$/,
    icon: lazy(() => import("../assets/language-icons/cpp.js")),
    width: 20,
  },
  commonlisp: {
    pattern: /^(clisp|common-lisp|lisp|cl|commonlisp)$/,
    icon: lazy(() => import("../assets/language-icons/commonlisp.js")),
    width: 18,
  },
  elixir: {
    pattern: /^elixir$/,
    icon: lazy(() => import("../assets/language-icons/elixir.js")),
    width: 18,
  },
  powershell: {
    pattern: /^(pshell|powershell|ps1)$/,
    icon: lazy(() => import("../assets/language-icons/powershell.js")),
    width: 18,
  },
};

export const LanguageIcon = ({ language }: { language?: string }) => {
  if (!language) return null;

  const Lang = Object.values(Languages).find((l) => l.pattern.test(language));

  if (!Lang) return null;

  const size = Lang.width ?? 18;

  return (
    <Suspense fallback={<div style={{ width: size, height: "1em" }} />}>
      <Lang.icon className="h-auto" style={{ width: size }} />
    </Suspense>
  );
};
