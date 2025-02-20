import { useEffect, useMemo, useState } from "react";
import { SchemaObject } from "../../oas/parser/index.js";
import { SyntaxHighlight } from "../../ui/SyntaxHighlight.js";
import { CollapsibleCode } from "./CollapsibleCode.js";
import type { OperationListItemResult } from "./OperationList.js";
import * as SidecarBox from "./SidecarBox.js";
import { SimpleSelect } from "./SimpleSelect.js";
import { generateSchemaExample } from "./util/generateSchemaExample.js";

export type Content = NonNullable<
  NonNullable<OperationListItemResult["requestBody"]>["content"]
>;
export type Example = NonNullable<
  NonNullable<Content[number]["examples"]>
>[number];

const formatForDisplay = (value: unknown): string => {
  if (value == null) return "No example";
  if (typeof value === "string") return value.trim();
  return JSON.stringify(value, null, 2);
};

const getLanguage = (mediaType?: string): string => {
  if (!mediaType) return "plain";
  const languages: Record<string, string> = {
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
  content: Content;
  description?: string;
  onExampleChange?: (example: unknown) => void;
};

export const SidecarExamples = ({
  content,
  description,
  onExampleChange,
}: SidecarExamplesProps) => {
  const [selectedContentTypeIndex, setSelectedContentTypeIndex] = useState(0);
  const [selectedExampleIndex, setSelectedExampleIndex] = useState(0);

  // Get the effective content (handle single item array case)
  const effectiveContent =
    Array.isArray(content) && content.length === 1
      ? content[0]
      : content[selectedContentTypeIndex];

  // Get example value, with fallback to schema-generated example
  const examples = effectiveContent?.examples ?? [];
  const selectedExample = examples[selectedExampleIndex];

  const exampleValue = useMemo(() => {
    if (selectedExample) {
      // If it's a wrapped example with a value field, use that
      return "value" in selectedExample
        ? selectedExample.value
        : selectedExample;
    } else if (effectiveContent?.schema) {
      // No example provided, generate one from schema
      return generateSchemaExample(effectiveContent.schema as SchemaObject);
    }
  }, [selectedExample, effectiveContent?.schema]);

  useEffect(() => {
    if (!exampleValue) return;

    onExampleChange?.(exampleValue);
  }, [exampleValue, onExampleChange]);

  const formattedExample = formatForDisplay(exampleValue);
  const language = getLanguage(effectiveContent?.mediaType);

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
        ) : (
          <CollapsibleCode>
            <SyntaxHighlight
              language={language}
              noBackground
              className="[--scrollbar-color:gray] text-xs max-h-[500px] p-2"
              code={formattedExample}
            />
          </CollapsibleCode>
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
                  value={selectedContentTypeIndex.toString()}
                  onChange={(e) =>
                    setSelectedContentTypeIndex(Number(e.target.value))
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
                    setSelectedExampleIndex(Number(e.target.value))
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
