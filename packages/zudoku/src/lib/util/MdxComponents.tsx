import type { MDXComponents } from "mdx/types.js";
import { Link } from "zudoku/components";
import { AnchorLink } from "../components/AnchorLink.js";
import { Framed } from "../components/Framed.js";
import { Heading } from "../components/Heading.js";
import { InlineCode } from "../components/InlineCode.js";
import { Mermaid } from "../components/Mermaid.js";
import { HIGHLIGHT_CODE_BLOCK_CLASS } from "../shiki.js";
import { Button } from "../ui/Button.js";
import { Callout } from "../ui/Callout.js";
import { CodeBlock } from "../ui/CodeBlock.js";
import { Stepper } from "../ui/Stepper.js";
import { SyntaxHighlight } from "../ui/SyntaxHighlight.js";
import { cn } from "./cn.js";

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
  Button,
  Callout,
  Stepper,
  Mermaid,
  SyntaxHighlight,
  tip: (props) => <Callout type="tip" {...props} />,
  info: (props) => <Callout type="info" {...props} />,
  note: (props) => <Callout type="note" {...props} />,
  caution: (props) => <Callout type="caution" {...props} />,
  warning: (props) => <Callout type="caution" {...props} />,
  danger: (props) => <Callout type="danger" {...props} />,
  pre: (props) => (
    <pre className={cn("not-prose my-4", props.className)} {...props} />
  ),
  code: ({
    className,
    node: _node,
    children,
    title,
    inline,
    showLineNumbers,
    ...props
  }) => {
    const match = className?.match(/language?-(\w+)/);

    if (inline === "true" || inline === true) {
      return (
        <InlineCode className={cn(className, "inline")}>{children}</InlineCode>
      );
    }

    return (
      <CodeBlock
        language={match?.[1]}
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
