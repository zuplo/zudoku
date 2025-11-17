import { SyntaxHighlight } from "../../ui/SyntaxHighlight.js";
import { NonHighlightedCode } from "./components/NonHighlightedCode.js";
import type { MediaTypeObject } from "./graphql/graphql.js";
import * as SidecarBox from "./SidecarBox.js";
import { SimpleSelect } from "./SimpleSelect.js";

const formatForDisplay = (value: unknown): string => {
  if (value == null) return "No example";
  if (typeof value === "string") return value.trim();
  return JSON.stringify(value, null, 2);
};

const getLanguage = (mediaType?: string): string => {
  if (!mediaType) return "plain";
  if (mediaType.endsWith("+json")) return "json";
  if (mediaType.endsWith("+xml")) return "xml";
  if (mediaType.endsWith("+yaml")) return "yaml";

  const languages: Record<string, string> = {
    "text/html": "html",
    "application/x-ndjson": "json",
    "application/json": "json",
    "application/xml": "xml",
    "application/x-yaml": "yaml",
    "text/csv": "csv",
    "application/javascript": "javascript",
    "application/graphql": "graphql",
  };
  return languages[mediaType] ?? "plain";
};

export type SidecarExamplesProps = {
  content: MediaTypeObject[];
  description?: string;
  selectedContentIndex: number;
  selectedExampleIndex: number;
  onExampleChange?: ({
    contentTypeIndex,
    exampleIndex,
  }: {
    contentTypeIndex: number;
    exampleIndex: number;
  }) => void;
  isOnScreen: boolean;
  shouldLazyHighlight?: boolean;
};

export const SidecarExamples = ({
  content,
  description,
  onExampleChange,
  selectedContentIndex,
  selectedExampleIndex,
  isOnScreen,
  shouldLazyHighlight,
}: SidecarExamplesProps) => {
  // Get example value, with fallback to schema-generated example
  const selectedContent = content[selectedContentIndex];
  const examples = selectedContent?.examples ?? [];
  const selectedExample = examples?.[selectedExampleIndex];

  const formattedExample = formatForDisplay(selectedExample?.value);
  const language = getLanguage(selectedContent?.mediaType);

  return (
    <>
      <SidecarBox.Body className="p-0">
        {selectedExample?.externalValue ? (
          <div className="p-2">
            <a
              href={selectedExample.externalValue}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              View External Example →
            </a>
          </div>
        ) : shouldLazyHighlight && !isOnScreen ? (
          <NonHighlightedCode code={formattedExample} />
        ) : (
          <SyntaxHighlight
            embedded
            language={language}
            className="[--scrollbar-color:gray] rounded-none max-h-[200px] text-xs overflow-auto"
            code={formattedExample}
          />
        )}
        {selectedExample?.description && (
          <div className="border-t text-xs px-3 py-1.5 text-muted-foreground">
            {selectedExample.description}
          </div>
        )}
      </SidecarBox.Body>
      <SidecarBox.Footer className="text-xs p-0 divide-y divide-border">
        {description && (
          <div className="text-muted-foreground text-xs px-3 py-2">
            {description}
          </div>
        )}
        {(examples.length !== 0 || content.length !== 0) && (
          <div className="flex items-center gap-2 justify-between min-w-0 px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              {content.length > 1 ? (
                <SimpleSelect
                  className="max-w-[200px]"
                  value={selectedContentIndex.toString()}
                  onChange={(e) =>
                    onExampleChange?.({
                      contentTypeIndex: Number(e.target.value),
                      exampleIndex: 0,
                    })
                  }
                  options={content.map((c, index) => ({
                    value: index.toString(),
                    label: c.mediaType,
                  }))}
                />
              ) : (
                <span className="font-mono text-[11px]">
                  {content[0]?.mediaType}
                </span>
              )}
            </div>
            {examples.length > 1 && (
              <div className="flex items-center gap-1">
                <SimpleSelect
                  className="max-w-[180px]"
                  value={selectedExampleIndex.toString()}
                  onChange={(e) =>
                    onExampleChange?.({
                      contentTypeIndex: selectedContentIndex,
                      exampleIndex: Number(e.target.value),
                    })
                  }
                  options={examples.map((example, index) => ({
                    value: index.toString(),
                    label:
                      example.summary ||
                      example.name ||
                      example.description ||
                      `Example ${index + 1}`,
                  }))}
                />
              </div>
            )}
          </div>
        )}
      </SidecarBox.Footer>
    </>
  );
};
