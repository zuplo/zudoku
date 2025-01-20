import { useState } from "react";
import { SyntaxHighlight } from "../../components/SyntaxHighlight.js";
import { type SchemaObject } from "../../oas/graphql/index.js";
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

const formatExample = (example: unknown) => {
  if (example == null) return "No example";

  if (typeof example === "string" || typeof example !== "object") {
    return String(example).trim();
  }

  return JSON.stringify(example, null, 2);
};

const getLanguageForContentType = (mediaType?: string) =>
  mediaType
    ? ({
        "application/json": "json",
        "application/xml": "xml",
        "application/x-yaml": "yaml",
        "text/csv": "csv",
        "application/javascript": "javascript",
        "application/graphql": "graphql",
        "text/plain": "plain",
        "application/x-www-form-urlencoded": "plain",
        "multipart/form-data": "plain",
        "application/x-protobuf": "plain",
      }[mediaType] ?? "plain")
    : "plain";

const getExampleName = (example: Example) => {
  if (example.summary) return example.summary;
  if (example.name) return example.name;
  if (example.description) return example.description;
};

const getExampleValue = (example?: Example) => {
  if (!example) return undefined;

  if (example.value !== undefined) return example.value;
  if (example.externalValue) return example.externalValue;
  if (example.name) return example;
};

export interface UseExampleDisplayProps {
  content: Content;
  description?: string;
}

export const useSidecarExamples = ({
  content,
  description,
}: UseExampleDisplayProps) => {
  const [selectedContentTypeIndex, setSelectedContentTypeIndex] = useState(0);
  const [selectedExampleIndex, setSelectedExampleIndex] = useState(0);

  const selectedContent = content[selectedContentTypeIndex];
  const examples = (selectedContent?.examples ?? []) as Example[];
  const hasExamples = examples.length > 0;

  const selectedExample = hasExamples
    ? examples[selectedExampleIndex]
    : undefined;

  const example = hasExamples
    ? getExampleValue(selectedExample)
    : selectedContent?.schema
      ? generateSchemaExample(selectedContent.schema as SchemaObject)
      : undefined;

  const formattedExample = formatExample(example);
  const language = getLanguageForContentType(selectedContent?.mediaType);

  const SidecarBody = () => (
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
            copyable
            className="[--scrollbar-color:gray] text-xs max-h-[500px] p-2"
            code={formattedExample}
          />
        </CollapsibleCode>
      )}
      {selectedExample?.description && (
        <div className="border-t text-xs px-2 py-1">
          {selectedExample.description}
        </div>
      )}
    </SidecarBox.Body>
  );

  const SidebarFooter = () => (
    <SidecarBox.Footer className="flex items-center text-xs gap-2 justify-between py-1">
      <div className="flex items-center gap-2 min-w-0">
        {content.length > 1 ? (
          <div className="flex items-center gap-1">
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
          </div>
        ) : (
          <span className="font-mono text-[11px]">{content[0]?.mediaType}</span>
        )}
        {description && (
          <span className="text-muted-foreground truncate">{description}</span>
        )}
      </div>
      {examples.length > 1 && (
        <div className="flex items-center gap-1">
          <SimpleSelect
            className="max-w-[180px]"
            value={selectedExampleIndex.toString()}
            onChange={(e) => setSelectedExampleIndex(Number(e.target.value))}
            options={examples.map((example, index) => ({
              value: index.toString(),
              label: getExampleName(example) ?? `Example ${index + 1}`,
            }))}
          />
        </div>
      )}
    </SidecarBox.Footer>
  );

  return {
    SidecarBody,
    SidebarFooter,
    hasContent: hasExamples || content.length > 0,
  };
};
