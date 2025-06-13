import { type MDXComponents } from "mdx/types.js";
import { CodeBlock } from "zudoku/ui/CodeBlock.js";
import { AnchorLink } from "../components/AnchorLink.js";
import { Framed } from "../components/Framed.js";
import { Heading } from "../components/Heading.js";
import { InlineCode } from "../components/InlineCode.js";
import { Button } from "../ui/Button.js";
import { Callout } from "../ui/Callout.js";
import { Stepper } from "../ui/Stepper.js";
import { SyntaxHighlight } from "../ui/SyntaxHighlight.js";
import { cn } from "./cn.js";

export type MdxComponentsType = Readonly<MDXComponents> | null | undefined;

export const MdxComponents = {
  img: ({ node, ...props }) => {
    if (/\.(mp4|webm|mov|avi)$/.test(props.src ?? "")) {
      return (
        <video
          src={props.src}
          controls
          playsInline
          autoPlay
          loop
          className={cn("my-8 rounded-lg", props.className)}
        />
      );
    }
    return (
      <img {...props} className={cn("my-8 rounded-lg", props.className)} />
    );
  },
  p: ({ children }) => (
    <p
      className={cn(
        "my-5 text-base leading-7 text-gray-700 dark:text-gray-300",
      )}
    >
      {children}
    </p>
  ),
  Framed,
  h1: ({ children, id }) => (
    <Heading
      level={1}
      id={id}
      className="mt-0 mb-12 text-4xl font-extrabold leading-tight text-gray-900 dark:text-gray-100"
    >
      {children}
    </Heading>
  ),
  h2: ({ children, id }) => (
    <Heading
      level={2}
      id={id}
      className="mt-12 mb-6 text-2xl font-bold leading-8 text-gray-900 dark:text-gray-100"
    >
      {children}
    </Heading>
  ),
  h3: ({ children, id }) => (
    <Heading
      level={3}
      id={id}
      className="mt-8 mb-4 text-xl font-semibold leading-7 text-gray-900 dark:text-gray-100"
    >
      {children}
    </Heading>
  ),
  h4: ({ children, id }) => (
    <Heading
      level={4}
      id={id}
      className="mt-6 mb-4 text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100"
    >
      {children}
    </Heading>
  ),
  h5: ({ children, id }) => (
    <Heading
      level={5}
      id={id}
      className="mt-6 mb-4 text-base font-semibold leading-6 text-gray-900 dark:text-gray-100"
    >
      {children}
    </Heading>
  ),
  h6: ({ children, id }) => (
    <Heading
      level={6}
      id={id}
      className="mt-6 mb-4 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100"
    >
      {children}
    </Heading>
  ),
  a: ({ href, node, ...props }) =>
    href && !href.startsWith("http") ? (
      <AnchorLink
        to={href}
        relative="path"
        className="font-medium text-violet-600 underline dark:text-violet-400"
        {...props}
      />
    ) : (
      <a
        href={href}
        target="_blank"
        className="font-medium text-violet-600 underline dark:text-violet-400"
        {...props}
        rel="noreferrer"
      />
    ),
  Button,
  Callout,
  Stepper,
  SyntaxHighlight,
  tip: (props) => <Callout type="tip" {...props} />,
  info: (props) => <Callout type="info" {...props} />,
  note: (props) => <Callout type="note" {...props} />,
  caution: (props) => <Callout type="caution" {...props} />,
  warning: (props) => <Callout type="caution" {...props} />,
  danger: (props) => <Callout type="danger" {...props} />,
  pre: (props) => <pre className={cn("my-4", props.className)} {...props} />,
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
        <InlineCode
          className={cn(
            "rounded bg-gray-100 px-1.5 py-0.5 text-sm font-semibold text-gray-900 dark:bg-gray-800 dark:text-gray-100",
            className,
            "inline",
          )}
        >
          {children}
        </InlineCode>
      );
    }

    return (
      <CodeBlock
        language={match?.[1]}
        showLanguageIndicator
        showLineNumbers={showLineNumbers}
        title={title}
      >
        <code className={cn(className, "not-inline")} {...props}>
          {children}
        </code>
      </CodeBlock>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="mt-8 mb-8 border-l-4 border-gray-300 pl-4 italic text-gray-700 dark:border-gray-700 dark:text-gray-300">
      {children}
    </blockquote>
  ),
  ul: ({ children }) => (
    <ul className="my-6 list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-6 list-decimal space-y-2 pl-6 text-gray-700 dark:text-gray-300">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="mt-2 mb-2">{children}</li>,
  hr: () => <hr className="my-10 border-gray-300 dark:border-gray-700" />,
  table: ({ children }) => (
    <div className="my-8 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-gray-300 dark:divide-gray-700">
      {children}
    </tbody>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
      {children}
    </td>
  ),
  kbd: ({ children }) => (
    <kbd className="rounded border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
      {children}
    </kbd>
  ),
  figure: ({ children }) => <figure className="my-8">{children}</figure>,
  figcaption: ({ children }) => (
    <figcaption className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
      {children}
    </figcaption>
  ),
  dl: ({ children }) => <dl className="my-6 space-y-4">{children}</dl>,
  dt: ({ children }) => (
    <dt className="font-semibold text-gray-900 dark:text-gray-100">
      {children}
    </dt>
  ),
  dd: ({ children }) => (
    <dd className="mt-1 pl-6 text-gray-700 dark:text-gray-300">{children}</dd>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900 dark:text-gray-100">
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em className="italic text-gray-700 dark:text-gray-300">{children}</em>
  ),
  del: ({ children }) => (
    <del className="text-gray-500 line-through dark:text-gray-400">
      {children}
    </del>
  ),
  picture: ({ children }) => (
    <picture className="my-8 block">{children}</picture>
  ),
  video: ({ children, ...props }) => (
    <video className="my-8 rounded-lg" {...props}>
      {children}
    </video>
  ),
  // Add support for lead paragraph
  lead: ({ children }) => (
    <p className="text-xl leading-8 text-gray-700 dark:text-gray-300">
      {children}
    </p>
  ),
} satisfies MdxComponentsType;
