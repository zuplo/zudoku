import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  type FormEvent,
  type KeyboardEvent,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "zudoku";
import { Link, Markdown } from "zudoku/components";
import { useZudoku } from "zudoku/hooks";
import {
  ArrowUpIcon,
  ArrowUpRightIcon,
  FileTextIcon,
  InfoIcon,
  RefreshCwIcon,
  SparklesIcon,
  SquareIcon,
  Trash2Icon,
  XIcon,
} from "zudoku/icons";
import { Button } from "zudoku/ui/Button.js";
import {
  getAssistantBlocks,
  prettifyUrl,
  toInternalPath,
} from "./messageBlocks.js";
import { getZuploDeploymentUrl, resolveDocsContext } from "./site.js";
import type { ResolvedZudokuAiOptions } from "./types.js";

const getMessageText = (message: UIMessage) =>
  message.parts.map((part) => (part.type === "text" ? part.text : "")).join("");

const linkClassName =
  "inline-flex max-w-full items-center gap-1.5 self-start rounded-md border bg-muted/40 px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

const SourceLink = ({ url, title }: { url: string; title?: string }) => {
  const internal = toInternalPath(url);
  const content = (
    <>
      <FileTextIcon className="size-3.5 shrink-0" />
      <span className="truncate">{title ?? prettifyUrl(url)}</span>
    </>
  );
  return internal ? (
    <Link to={internal} className={linkClassName}>
      {content}
    </Link>
  ) : (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={linkClassName}
    >
      {content}
    </a>
  );
};

const LinkButton = ({
  url,
  label,
  description,
}: {
  url: string;
  label: string;
  description?: string;
}) => (
  <div className="flex flex-col items-start gap-1.5">
    {description && (
      <p className="text-sm text-muted-foreground">{description}</p>
    )}
    <Button asChild size="sm" variant="outline">
      <a href={url} target="_blank" rel="noopener noreferrer">
        {label}
        <ArrowUpRightIcon />
      </a>
    </Button>
  </div>
);

const ThinkingIndicator = () => (
  <div className="flex gap-1" role="status" aria-label="Assistant is thinking">
    {[0, 150, 300].map((delay) => (
      <span
        key={delay}
        className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
        style={{ animationDelay: `${delay}ms` }}
      />
    ))}
  </div>
);

const Avatar = () => (
  <div className="flex size-7 shrink-0 items-center justify-center rounded-full border bg-muted">
    <SparklesIcon className="size-3.5 text-primary" />
  </div>
);

const ChatMessage = ({ message }: { message: UIMessage }) => {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground">
          {getMessageText(message)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5">
      <Avatar />
      <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
        {getAssistantBlocks(message).map((block) => {
          if (block.kind === "source") {
            return (
              <SourceLink key={block.key} url={block.url} title={block.title} />
            );
          }
          if (block.kind === "link") {
            return (
              <LinkButton
                key={block.key}
                url={block.url}
                label={block.label}
                description={block.description}
              />
            );
          }
          return (
            <Suspense
              key={block.key}
              fallback={
                <div className="whitespace-pre-wrap text-sm">{block.text}</div>
              }
            >
              <Markdown
                content={block.text}
                className="prose-sm max-w-none break-words text-sm"
              />
            </Suspense>
          );
        })}
      </div>
    </div>
  );
};

export const AskAiChat = ({
  options,
  open,
  onClose,
}: {
  options: ResolvedZudokuAiOptions;
  open: boolean;
  onClose: () => void;
}) => {
  const {
    api,
    title,
    greeting,
    placeholder,
    suggestions,
    headers,
    credentials,
  } = options;

  const basePath = useZudoku().options.basePath;

  // The docs site URL is forwarded to the backend as `zudokuUrl` so the agent
  // knows which documentation to answer from (agent-z fetches that site's
  // llms.txt index and reads pages from it). Zuplo projects expose a deployment
  // URL that is used even on localhost; otherwise we fall back to the current
  // origin + base path (and disable the chat on localhost).
  const { docs: zudokuUrl, isUnavailable } = useMemo(
    () => resolveDocsContext(basePath, getZuploDeploymentUrl()),
    [basePath],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api,
        headers,
        credentials,
        body: { zudokuUrl },
      }),
    [api, headers, credentials, zudokuUrl],
  );

  const {
    messages,
    sendMessage,
    status,
    error,
    stop,
    regenerate,
    setMessages,
  } = useChat({ transport, experimental_throttle: 50 });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isBusy = status === "submitted" || status === "streaming";

  const submit = (value: string) => {
    const text = value.trim();
    if (!text || isBusy || isUnavailable) return;
    setInput("");
    void sendMessage({ text });
  };

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!open || !element) return;
    // Reading messages/status keeps the answer pinned to the bottom as new
    // messages arrive and tokens stream in.
    if (messages.length === 0 && status !== "submitted") return;
    element.scrollTop = element.scrollHeight;
  }, [open, messages, status]);

  if (!open || typeof document === "undefined") return null;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit(input);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit(input);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="false"
      aria-label={title}
      className={cn(
        "fixed z-50 flex flex-col overflow-hidden rounded-xl border bg-background text-foreground shadow-2xl",
        "inset-x-3 bottom-3 top-20",
        "sm:inset-x-auto sm:top-auto sm:inset-e-4 sm:bottom-4 sm:h-[min(680px,calc(100dvh-2rem))] sm:w-[420px]",
        "animate-in fade-in slide-in-from-bottom-4 duration-200",
      )}
    >
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <SparklesIcon className="size-4 text-primary" />
        <span className="text-sm font-semibold">{title}</span>
        <div className="ms-auto flex items-center gap-0.5">
          {messages.length > 0 && (
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              onClick={() => setMessages([])}
              title="Clear conversation"
              aria-label="Clear conversation"
            >
              <Trash2Icon />
            </Button>
          )}
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            onClick={onClose}
            aria-label="Close"
          >
            <XIcon />
          </Button>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4"
      >
        {isUnavailable ? (
          <div className="flex items-start gap-2.5 rounded-lg border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
            <InfoIcon className="mt-0.5 size-4 shrink-0" />
            <p>
              The assistant isn't available on{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                localhost
              </code>
              . Deploy your documentation to a public URL to start chatting.
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2.5">
              <Avatar />
              <p className="pt-1 text-sm text-muted-foreground">{greeting}</p>
            </div>
            {suggestions && suggestions.length > 0 && (
              <div className="flex flex-col items-start gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => submit(suggestion)}
                    className="rounded-lg border bg-muted/40 px-3 py-1.5 text-start text-sm transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}

        {status === "submitted" && (
          <div className="flex gap-2.5">
            <Avatar />
            <div className="pt-2">
              <ThinkingIndicator />
            </div>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <span>Something went wrong. Please try again.</span>
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() => regenerate()}
            >
              <RefreshCwIcon />
              Retry
            </Button>
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="border-t p-3">
        <div className="flex items-end gap-2 rounded-xl border bg-background px-3 py-2 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            disabled={isUnavailable}
            placeholder={
              isUnavailable ? "Unavailable on localhost" : placeholder
            }
            className="max-h-32 flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed field-sizing-content"
          />
          {isBusy ? (
            <Button
              type="button"
              size="icon-sm"
              variant="secondary"
              onClick={() => stop()}
              aria-label="Stop generating"
            >
              <SquareIcon className="fill-current" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon-sm"
              disabled={!input.trim() || isUnavailable}
              aria-label="Send message"
            >
              <ArrowUpIcon />
            </Button>
          )}
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          AI-generated answers may be inaccurate.
        </p>
      </form>
    </div>,
    document.body,
  );
};
