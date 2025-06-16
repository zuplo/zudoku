import { useQuery } from "@tanstack/react-query";
import {
  CornerDownLeftIcon,
  CornerDownRightIcon,
  DownloadIcon,
  PlusCircleIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "zudoku/ui/Button.js";
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
import { humanFileSize } from "../../../../util/humanFileSize.js";
import {
  CollapsibleHeader,
  CollapsibleHeaderTrigger,
} from "../CollapsibleHeader.js";
import { convertToTypes } from "./convertToTypes.js";
import { Highlight } from "./Highlight.js";

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

const MAX_HEADERS_TO_SHOW = 3;

export const ResponseTab = ({
  body = "",
  headers,
  status,
  time,
  request,
  size,
  url,
  isBinary = false,
  fileName,
  blob,
}: {
  body?: string;
  headers: Array<[string, string]>;
  status: number;
  time: number;
  request: {
    method: string;
    url: string;
    headers: Array<[string, string]>;
    body?: string;
  };
  size: number;
  url: string;
  isBinary?: boolean;
  fileName?: string;
  blob?: Blob;
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
    enabled: view === "types" && !isBinary,
  });

  const handleDownload = () => {
    if (blob && fileName) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const sortedHeaders = sortHeadersByRelevance([...headers]);

  return (
    <>
      <Collapsible defaultOpen>
        <CollapsibleHeaderTrigger>
          <CornerDownLeftIcon size={16} />
          <CollapsibleHeader className="col-span-2">
            Header Request
          </CollapsibleHeader>
        </CollapsibleHeaderTrigger>
        <CollapsibleContent>
          <div className="grid grid-cols-2 gap-x-6 text-sm">
            {request.headers
              .slice(0, MAX_HEADERS_TO_SHOW)
              .map(([key, value]) => (
                <div
                  key={key}
                  className="grid-cols-subgrid grid border-b col-span-full px-4 py-2 items-center"
                >
                  <div className="">{key}</div>
                  <div className="break-all">{value}</div>
                </div>
              ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible defaultOpen>
        <CollapsibleHeaderTrigger>
          <CornerDownRightIcon size={16} />
          <CollapsibleHeader className="col-span-2">
            Header Response
          </CollapsibleHeader>
        </CollapsibleHeaderTrigger>
        <CollapsibleContent>
          <div className="grid grid-cols-2 gap-x-6 text-sm">
            {sortedHeaders.slice(0, MAX_HEADERS_TO_SHOW).map(([key, value]) => (
              <div
                key={key}
                className="grid-cols-subgrid grid border-b col-span-full px-4 h-10 items-center"
              >
                <div className="">{key}</div>
                <div className="break-all line-clamp-1">{value}</div>
              </div>
            ))}
            {sortedHeaders.length > MAX_HEADERS_TO_SHOW && (
              <Collapsible className="col-span-full grid-cols-subgrid grid group">
                <CollapsibleTrigger className="data-[state=open]:hidden justify-center col-span-2 text-xs text-muted-foreground hover:text-primary border-b h-8 flex items-center gap-2">
                  <span>
                    Show {sortedHeaders.length - MAX_HEADERS_TO_SHOW} more
                    headers
                  </span>
                  <PlusCircleIcon size={12} className="text-muted-foreground" />
                </CollapsibleTrigger>
                <CollapsibleContent className="col-span-full grid grid-cols-subgrid">
                  {sortedHeaders
                    .slice(MAX_HEADERS_TO_SHOW)
                    .map(([key, value]) => (
                      <div
                        key={key}
                        className="grid-cols-subgrid grid border-b col-span-full px-4 items-center"
                      >
                        <div className="">{key}</div>
                        <div className="break-all ">{value}</div>
                      </div>
                    ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex gap-2 justify-between items-center border-b h-10">
        {jsonContent && !isBinary && (
          <div className="px-2">
            <Select
              value={view}
              onValueChange={(value) => setView(value as "formatted" | "raw")}
            >
              <SelectTrigger className="min-w-32 border-none h-8">
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
      <div>
        {isBinary ? (
          <div className="p-4 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="text-lg font-semibold">Binary Content</div>
              <div className="text-sm text-muted-foreground">
                This response contains binary data that cannot be displayed as
                text.
              </div>
              <Button
                onClick={handleDownload}
                className="flex items-center gap-2"
                disabled={!blob}
              >
                <DownloadIcon className="h-4 w-4" />
                Download {fileName || "file"} ({humanFileSize(size)})
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-auto max-w-full p-4 text-xs max-h-[calc(83.333vh-180px)]">
            <Highlight
              language={
                view === "types"
                  ? "typescript"
                  : view === "raw"
                    ? jsonContent
                      ? "plain"
                      : detectedLanguage
                    : "json"
              }
              code={
                (view === "raw"
                  ? body
                  : view === "types"
                    ? types.data?.lines.join("\n")
                    : beautifiedBody) ?? ""
              }
            />
          </div>
        )}
      </div>
    </>
  );
};
