import { useQuery } from "@tanstack/react-query";
import { ChevronRightIcon } from "lucide-react";

import { Fragment, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "zudoku/ui/Collapsible.js";
import { SyntaxHighlight } from "../../../../components/SyntaxHighlight.js";
import { Card } from "../../../../ui/Card.js";
import { SimpleSelect } from "../../SimpleSelect.js";

const statusCodeMap: Record<number, string> = {
  200: "OK",
  201: "Created",
  202: "Accepted",
  204: "No Content",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  500: "Internal Server Error",
};

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

const detectLanguage = (headers: Array<[string, string]>) => {
  const contentType =
    headers.find(([key, value]) => key === "Content-Type")?.[1] || "";
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
  status,
  time,
  size,
  url,
}: {
  body?: string;
  headers: Array<[string, string]>;
  status: number;
  time: number;
  size: number;
  url: string;
}) => {
  const detectedLanguage = detectLanguage(headers);
  const jsonContent = tryParseJson(body);
  const beautifiedBody = jsonContent || body;
  const [view, setView] = useState<"formatted" | "raw" | "types">(
    jsonContent ? "formatted" : "raw",
  );

  const types = useQuery({
    queryKey: ["types", beautifiedBody],
    queryFn: async () => {
      // console.log("queryFn");
      const { convertJsonToTs } = await import("@typeweaver/json2ts");

      const interfaceName =
        url
          .split("/")
          .pop()
          ?.replace(/[^a-zA-Z0-9]/g, "")
          .replace(/^[a-z]/, (letter) => letter.toUpperCase()) +
        (status >= 400 ? "ErrorResponse" : "Response");

      return convertJsonToTs(JSON.parse(beautifiedBody), interfaceName);
    },
    enabled: view === "types",
  });

  return (
    <div className="flex flex-col gap-2 h-full overflow-y-scroll">
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2 hover:text-primary">
          <ChevronRightIcon className="h-4 w-4" />
          <span className="font-semibold">Headers</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card
            // playground dialog has h-5/6 ≈ 83.333vh
            className="h-92 overflow-y-auto grid grid-cols-2 w-full gap-2.5 font-mono text-xs shadow-none p-4"
          >
            <div className="font-semibold">Key</div>
            <div className="font-semibold">Value</div>
            {headers.map(([key, value]) => (
              <Fragment key={key}>
                <div>{key}</div>
                <div className="break-words">{value}</div>
              </Fragment>
            ))}
          </Card>
        </CollapsibleContent>
      </Collapsible>

      <Card className="shadow-none">
        <SyntaxHighlight
          language={
            view === "types"
              ? "typescript "
              : view === "raw"
                ? jsonContent
                  ? "plain"
                  : detectedLanguage
                : "json"
          }
          noBackground
          // playground dialog has h-5/6 ≈ 83.333vh
          className="overflow-x-auto p-4 text-xs max-h-[calc(83.333vh-180px)]"
          code={
            (view === "raw"
              ? body
              : view === "types"
                ? types.data
                : beautifiedBody) ?? ""
          }
        />
      </Card>
      <div className="flex gap-2 justify-between">
        <div className="flex text-xs gap-6 border bg-muted rounded-md p-2 g">
          <div>
            Status: {status} {statusCodeMap[status] ?? ""}
          </div>
          <div>Time: {time.toFixed(0)}ms</div>
          <div>Size: {size} B</div>
        </div>
        {jsonContent && (
          <SimpleSelect
            value={view}
            onChange={(e) => setView(e.target.value as "formatted" | "raw")}
            options={[
              { value: "formatted", label: "Formatted" },
              { value: "raw", label: "Raw" },
              { value: "types", label: "Types" },
            ]}
          />
        )}
      </div>
    </div>
  );
};
