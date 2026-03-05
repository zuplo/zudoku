import type { MDXComponents } from "mdx/types.js";
import { lazy, Suspense } from "react";
import { Link } from "zudoku/components";
import { Alert } from "zudoku/ui/Alert.js";
import { AnchorLink } from "../components/AnchorLink.js";
import { Framed } from "../components/Framed.js";
import { Heading } from "../components/Heading.js";
import { InlineCode } from "../components/InlineCode.js";
import { HIGHLIGHT_CODE_BLOCK_CLASS } from "../shiki-constants.js";
import { Badge } from "../ui/Badge.js";
import { Button } from "../ui/Button.js";
import { Callout } from "../ui/Callout.js";
import { CodeBlock } from "../ui/CodeBlock.js";
import { CodeTabPanel } from "../ui/CodeTabPanel.js";
import { Stepper } from "../ui/Stepper.js";
import { cn } from "./cn.js";

// Lazy-loaded to avoid pulling shiki/mermaid into the initial bundle.
const SyntaxHighlight = lazy(() => import("../ui/SyntaxHighlight.js"));
const Mermaid = lazy(() => import("../components/Mermaid.js"));
const CodeTabs = lazy(() =>
  import("../ui/CodeTabs.js").then((m) => ({ default: m.CodeTabs })),
);

export type MdxComponentsType = Readonly<MDXComponents> | null | undefined;

export const MdxComponents = {
  img: ({ node, ...props }) => {
    if (/\.(mp4|webm|mov|avi)$/.test(props.src ?? "")) {
      return (
        // biome-ignore lint/a11y/useMediaCaption: No in control of the caption here
        <video
          src={props.src}
          controls
          playsInline
          autoPlay
          loop
          className={cn("rounded-lg", props.className)}
        />
      );
    }
    return (
      <img
        alt={props.alt}
        {...props}
        className={cn("rounded-lg", props.className)}
      />
    );
  },
  Framed,
  h1: ({ children, id }) => (
    <Heading level={1} id={id}>
      {children}
    </Heading>
  ),
  h2: ({ children, id }) => (
    <Heading level={2} id={id}>
      {children}
    </Heading>
  ),
  h3: ({ children, id }) => (
    <Heading level={3} id={id}>
      {children}
    </Heading>
  ),
  h4: ({ children, id }) => (
    <Heading level={4} id={id}>
      {children}
    </Heading>
  ),
  h5: ({ children, id }) => (
    <Heading level={5} id={id}>
      {children}
    </Heading>
  ),
  h6: ({ children, id }) => (
    <Heading level={6} id={id}>
      {children}
    </Heading>
  ),
  a: ({ href, node, ...props }) =>
    href && !href.startsWith("http") ? (
      <AnchorLink to={href} relative="path" {...props} />
    ) : (
      <a href={href} target="_blank" {...props} rel="noreferrer" />
    ),
  Link,
  Alert,
  Badge,
  Button,
  Callout,
  Stepper,
  Mermaid: (props) => (
    <Suspense>
      <Mermaid {...props} />
    </Suspense>
  ),
  SyntaxHighlight: (props) => (
    <Suspense>
      <SyntaxHighlight {...props} />
    </Suspense>
  ),
  tip: (props) => <Callout type="tip" {...props} />,
  info: (props) => <Callout type="info" {...props} />,
  note: (props) => <Callout type="note" {...props} />,
  caution: (props) => <Callout type="caution" {...props} />,
  warning: (props) => <Callout type="caution" {...props} />,
  danger: (props) => <Callout type="danger" {...props} />,
  CodeTabs: (props) => (
    <Suspense>
      <CodeTabs {...props} />
    </Suspense>
  ),
  CodeTabPanel,
  pre: (props) => (
    <pre className={cn("not-prose my-4", props.className)} {...props} />
  ),
  code: ({
    className,
    node: _node,
    children,
    title,
    icon,
    inline,
    showLineNumbers,
    ...props
  }) => {
    const match = className?.match(/language-(\w+)/);

    if (inline === "true" || inline === true) {
      return (
        <InlineCode className={cn(className, "inline")}>{children}</InlineCode>
      );
    }

    return (
      <CodeBlock
        language={match?.[1]}
        icon={icon}
        showLanguageIndicator
        showLineNumbers={showLineNumbers}
        title={title}
      >
        <code className={cn(className, HIGHLIGHT_CODE_BLOCK_CLASS)} {...props}>
          {children}
        </code>
      </CodeBlock>
    );
  },
} satisfies MdxComponentsType;
