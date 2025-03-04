import { useQuery } from "@tanstack/react-query";
import { ChevronRightIcon } from "lucide-react";
import { Fragment, useState } from "react";
import { Callout } from "zudoku/ui/Callout.js";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "zudoku/ui/Collapsible.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "zudoku/ui/Select.js";
import { Card } from "../../../../ui/Card.js";
import { SyntaxHighlight } from "../../../../ui/SyntaxHighlight.js";
import { convertToTypes } from "./convertToTypes.js";

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

const humanFileSize = (bytes: number) => {
  const exponent = Math.floor(Math.log(bytes) / Math.log(1000.0));
  const decimal = (bytes / Math.pow(1000.0, exponent)).toFixed(
    exponent ? 2 : 0,
  );
  return `${decimal} ${exponent ? `${"kMGTPEZY"[exponent - 1]}B` : "B"}`;
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

const sortHeadersByRelevance = (
  headers: Array<[string, string]>,
): Array<[string, string]> => {
  const priorityOrder = [
    "Content-Type",
    "Content-Length",
    "Authorization",
    "X-RateLimit-Remaining",
    "X-RateLimit-Limit",
    "Cache-Control",
    "ETag",
  ].map((key) => key.toLowerCase());

  return [...headers].sort(([keyA], [keyB]) => {
    const indexA = priorityOrder.indexOf(keyA.toLowerCase());
    const indexB = priorityOrder.indexOf(keyB.toLowerCase());
    if (indexA === indexB) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
};

const SYNTAX_HIGHLIGHT_MAX_SIZE_THRESHOLD = 64_000;

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
      return convertToTypes(JSON.parse(beautifiedBody));
    },
    enabled: view === "types",
  });

  const sortedHeaders = sortHeadersByRelevance([...headers]);
  const shouldDisableHighlighting = size > SYNTAX_HIGHLIGHT_MAX_SIZE_THRESHOLD;

  return (
    <div className="flex flex-col gap-2 h-full overflow-auto max-h-[calc(100vh-220px)] ">
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center gap-2 hover:text-primary group">
          <ChevronRightIcon className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-[90deg]" />
          <span className="font-semibold">Headers</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid grid-cols-[auto,1fr] gap-x-8 gap-y-1 pl-1.5 pt-2 font-mono text-xs">
            {sortedHeaders.slice(0, 5).map(([key, value]) => (
              <Fragment key={key}>
                <div className="text-primary whitespace-pre">{key}</div>
                <div className="break-all">{value}</div>
              </Fragment>
            ))}
            {sortedHeaders.length > 5 && (
              <Collapsible className="col-span-full grid-cols-subgrid grid">
                <CollapsibleTrigger className="col-span-2 text-xs text-muted-foreground hover:text-primary flex items-center gap-1 py-1">
                  <ChevronRightIcon className="h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-[90deg]" />
                  Show {sortedHeaders.length - 5} more headers
                </CollapsibleTrigger>
                <CollapsibleContent className="col-span-full grid grid-cols-subgrid gap-x-8 gap-y-1 ">
                  {sortedHeaders.slice(5).map(([key, value]) => (
                    <Fragment key={key}>
                      <div className="text-primary whitespace-pre">{key}</div>
                      <div className="break-all">{value}</div>
                    </Fragment>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Card className="shadow-none">
        {shouldDisableHighlighting && (
          <Callout type="info" className="my-0 p-2">
            Code highlight is disabled for responses larger than{" "}
            {humanFileSize(SYNTAX_HIGHLIGHT_MAX_SIZE_THRESHOLD)}
          </Callout>
        )}
        <SyntaxHighlight
          language={
            view === "types"
              ? "typescript"
              : view === "raw"
                ? jsonContent
                  ? "plain"
                  : detectedLanguage
                : "json"
          }
          showCopy="always"
          disabled={shouldDisableHighlighting}
          noBackground
          className="overflow-x-auto p-4 text-xs max-h-[calc(83.333vh-180px)]"
          code={
            (view === "raw"
              ? body
              : view === "types"
                ? types.data?.lines.join("\n")
                : beautifiedBody) ?? ""
          }
        />
      </Card>
      <div className="flex gap-2 justify-between items-center">
        <div className="flex text-xs gap-2 border bg-muted rounded-md p-2 items-center h-8 font-mono divide-x">
          <div>
            <span className="text-muted-foreground">Status</span> {status}{" "}
            {statusCodeMap[status] ?? ""}
          </div>
          <div>
            <span className="text-muted-foreground">Time</span>{" "}
            {time.toFixed(0)}ms
          </div>
          <div>
            <span className="text-muted-foreground">Size</span>{" "}
            {humanFileSize(size)}
          </div>
        </div>
        {jsonContent && (
          <div>
            <Select
              value={view}
              onValueChange={(value) => setView(value as "formatted" | "raw")}
            >
              <SelectTrigger className="min-w-32">
                <SelectValue placeholder="View" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="formatted">Formatted</SelectItem>
                <SelectItem value="raw">Raw</SelectItem>
                <SelectItem value="types">Types</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
};
