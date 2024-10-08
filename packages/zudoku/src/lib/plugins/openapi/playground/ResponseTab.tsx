import { useState } from "react";
import { SyntaxHighlight } from "../../../components/SyntaxHighlight.js";
import { Card } from "../../../ui/Card.js";
import { SimpleSelect } from "../SimpleSelect.js";

const mimeTypeToLanguage = (mimeType: string) => {
  const mimeTypeMapping = {
    "application/json": "json",
    "text/json": "json",
    "text/html": "html",
    "text/css": "css",
    "text/javascript": "javascript",
    "application/xml": "xml",
    "application/xhtml+xml": "xhtml",
  };

  return Object.entries(mimeTypeMapping).find(([mime]) =>
    mimeType.includes(mime),
  )?.[1];
};

const detectLanguage = (headers: Headers) => {
  const contentType = headers.get("Content-Type") || "";
  return mimeTypeToLanguage(contentType);
};

const tryParseJson = (body: string) => {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return null;
  }
};

export const ResponseTab = ({
  body = "",
  headers,
}: {
  body?: string;
  headers: Headers;
}) => {
  const detectedLanguage = detectLanguage(headers);
  const jsonContent = tryParseJson(body);
  const beautifiedBody = jsonContent || body;
  const [view, setView] = useState<"formatted" | "raw">(
    jsonContent ? "formatted" : "raw",
  );

  return (
    <div className="flex flex-col gap-2">
      <Card className="shadow-none">
        <SyntaxHighlight
          language={
            view === "raw" ? (jsonContent ? "plain" : detectedLanguage) : "json"
          }
          noBackground
          // playground dialog has h-5/6 ≈ 83.333vh
          className="overflow-x-auto p-4 text-xs max-h-[calc(83.333vh-180px)]"
          code={view === "raw" ? body : beautifiedBody}
        />
      </Card>
      {jsonContent && (
        <div className="flex justify-end">
          <SimpleSelect
            value={view}
            onChange={(e) => setView(e.target.value as "formatted" | "raw")}
            options={[
              { value: "formatted", label: "Formatted" },
              { value: "raw", label: "Raw" },
            ]}
          />
        </div>
      )}
    </div>
  );
};
