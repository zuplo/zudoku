import { ExternalLinkIcon } from "lucide-react";
import { Badge } from "zudoku/ui/Badge.js";
import { NativeSelect, NativeSelectOption } from "zudoku/ui/NativeSelect.js";
import { SyntaxHighlight } from "../../ui/SyntaxHighlight.js";
import { NonHighlightedCode } from "./components/NonHighlightedCode.js";
import type { MediaTypeObject } from "./graphql/graphql.js";
import * as SidecarBox from "./SidecarBox.js";

const formatForDisplay = (value: unknown): string | undefined => {
  if (value == null) return;
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
          <div className="p-4">
            <a
              href={selectedExample.externalValue}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              View External Example
              <ExternalLinkIcon className="size-3 inline-block ms-1 align-[-0.125em]" />
            </a>
          </div>
        ) : shouldLazyHighlight && !isOnScreen && formattedExample ? (
          <NonHighlightedCode code={formattedExample} />
        ) : formattedExample ? (
          <SyntaxHighlight
            embedded
            language={language}
            className="[--scrollbar-color:gray] rounded-none max-h-[200px] text-xs overflow-auto"
            code={formattedExample}
          />
        ) : (
          <div className="grid place-items-center text-xs text-muted-foreground min-h-18">
            No example specified for this content type
          </div>
        )}
        {selectedExample?.description && (
          <div className="border-t text-xs px-3 py-1.5 text-muted-foreground">
            {selectedExample.description}
          </div>
        )}
      </SidecarBox.Body>
      <SidecarBox.Footer className="text-xs">
        {description && (
          <div className="text-muted-foreground text-xs px-1 py-2">
            {description}
          </div>
        )}
        {(examples.length !== 0 || content.length !== 0) && (
          <div className="flex items-center gap-2 justify-between min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {content.length > 1 ? (
                <NativeSelect
                  className="text-xs h-fit py-1 truncate bg-background"
                  value={selectedContentIndex.toString()}
                  onChange={(e) =>
                    onExampleChange?.({
                      contentTypeIndex: Number(e.target.value),
                      exampleIndex: 0,
                    })
                  }
                >
                  {content.map((c, index) => (
                    <NativeSelectOption
                      key={c.mediaType}
                      value={index.toString()}
                    >
                      {c.mediaType}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              ) : (
                <Badge
                  className="text-[11px] font-mono font-normal"
                  variant="outline"
                >
                  {content[0]?.mediaType}
                </Badge>
              )}
            </div>
            {examples.length > 1 && (
              <NativeSelect
                className="text-xs h-fit py-1 truncate bg-background"
                value={selectedExampleIndex.toString()}
                onChange={(e) =>
                  onExampleChange?.({
                    contentTypeIndex: selectedContentIndex,
                    exampleIndex: Number(e.target.value),
                  })
                }
              >
                {examples.map((example, index) => (
                  <NativeSelectOption
                    key={
                      example.summary ||
                      example.name ||
                      example.description ||
                      `Example ${index + 1}`
                    }
                    value={index.toString()}
                  >
                    {example.summary ||
                      example.name ||
                      example.description ||
                      `Example ${index + 1}`}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </div>
        )}
      </SidecarBox.Footer>
    </>
  );
};
