import * as TabsPrimitive from "@radix-ui/react-tabs";
import {
  Children,
  isValidElement,
  type PropsWithChildren,
  type ReactNode,
  useMemo,
  useRef,
  useState,
} from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { LanguageIcon } from "../components/LanguageIcon.js";
import { parseMetaString } from "../shiki.js";
import { cn } from "../util/cn.js";
import { syncZustandState } from "../util/syncZustandState.js";
import {
  CopyCodeButton,
  codeBlockClass,
  codeBlockContentClass,
  codeBlockHeaderClass,
} from "./CodeBlock.js";
import { type CodeTabPanelProps, CodeTabPanel } from "./CodeTabPanel.js";
import { HighlightedCode } from "./SyntaxHighlight.js";

export { CodeTabPanel, type CodeTabPanelProps };

type CodeTabSyncState = {
  tabs: Record<string, string>;
  setTab: (key: string, value: string) => void;
};

const useCodeTabSyncStore = create<CodeTabSyncState>()(
  persist(
    (set) => ({
      tabs: {},
      setTab: (key, value) =>
        set((state) => ({ tabs: { ...state.tabs, [key]: value } })),
    }),
    {
      name: "zudoku-code-tabs",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

syncZustandState(useCodeTabSyncStore);

// Uses displayName instead of reference equality to survive HMR module reloads
const isCodeTabPanel = (
  child: ReactNode,
): child is React.ReactElement<CodeTabPanelProps> =>
  isValidElement(child) &&
  (child.type as typeof CodeTabPanel).displayName === CodeTabPanel.displayName;

type CodeTabsProps = PropsWithChildren<{
  syncKey?: string;
  hideIcon?: boolean;
}>;

export const CodeTabs = ({
  children,
  syncKey,
  hideIcon = false,
}: CodeTabsProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [localTab, setLocalTab] = useState(0);
  const syncedTabKey = useCodeTabSyncStore((s) =>
    syncKey ? s.tabs[syncKey] : undefined,
  );
  const setSyncedTab = useCodeTabSyncStore((s) => s.setTab);

  const panels = useMemo(() => {
    return Children.toArray(children)
      .filter(isCodeTabPanel)
      .map(({ props }, i) => {
        const meta = props.meta ? parseMetaString(props.meta) : {};
        const metaIcon = typeof meta.icon === "string" ? meta.icon : undefined;
        const metaTitle = typeof meta.title === "string" ? meta.title : undefined;
        return {
          ...props,
          icon: props.icon ?? metaIcon,
          title: props.title ?? metaTitle,
          showLineNumbers: meta.showLineNumbers === true,
          label: metaTitle ?? props.title ?? props.language ?? `Tab ${i + 1}`,
        };
      });
  }, [children]);

  const syncedIndex = syncedTabKey
    ? panels.findIndex((p) => p.label === syncedTabKey)
    : -1;

  const activeIndex = Math.min(
    Math.max(0, syncKey ? syncedIndex : localTab),
    panels.length - 1,
  );

  const setActiveIndex = (i: number) => {
    const panel = panels[i];
    if (syncKey && panel) {
      setSyncedTab(syncKey, panel.label);
    } else {
      setLocalTab(i);
    }
  };

  const activePanel = panels.at(activeIndex);

  return (
    <TabsPrimitive.Root
      value={String(activeIndex)}
      onValueChange={(value) => setActiveIndex(Number(value))}
      className={codeBlockClass}
    >
      <div className={codeBlockHeaderClass}>
        <TabsPrimitive.List className="flex items-center gap-1 flex-1 text-sm w-full px-1.5">
          {panels.map((panel, i) => (
            <TabsPrimitive.Trigger
              key={`${i}-${panel.label}`}
              value={String(i)}
              className={cn(
                "relative flex items-center gap-1.5 px-2 py-1 text-sm",
                "after:transition after:absolute after:opacity-0 data-[state=active]:after:opacity-100",
                "after:h-0.5 after:-inset-x-0.5 after:-bottom-0.5 after:bg-foreground after:rounded",
                "text-muted-foreground hover:text-foreground data-[state=active]:text-foreground",
              )}
            >
              {!hideIcon && (
                <LanguageIcon language={panel.icon ?? panel.language} />
              )}
              {panel.label}
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>
        <CopyCodeButton contentRef={contentRef} />
      </div>
      <div
        ref={contentRef}
        className={cn(
          codeBlockContentClass,
          activePanel?.showLineNumbers && "line-numbers",
        )}
      >
        {panels.map((panel, i) => (
          <TabsPrimitive.Content key={`${i}-${panel.label}`} value={String(i)}>
            <HighlightedCode
              code={panel.code}
              language={panel.language}
              meta={panel.meta}
            />
          </TabsPrimitive.Content>
        ))}
      </div>
    </TabsPrimitive.Root>
  );
};
