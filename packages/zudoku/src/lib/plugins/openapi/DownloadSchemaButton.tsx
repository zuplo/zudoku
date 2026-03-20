import {
  ChevronDownIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
} from "lucide-react";
import type { MouseEventHandler } from "react";
import { Button } from "zudoku/components";
import { ButtonGroup } from "zudoku/ui/ButtonGroup.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "zudoku/ui/DropdownMenu.js";
import { useCopyToClipboard } from "../../util/useCopyToClipboard.js";
import { ChatGPTLogo } from "../markdown/assets/ChatGPTLogo.js";
import { ClaudeLogo } from "../markdown/assets/ClaudeLogo.js";

export const DownloadSchemaButton = ({
  downloadUrl,
  schemaDownload,
}: {
  downloadUrl: string;
  schemaDownload?: { useInClaude?: boolean; useInChatGPT?: boolean };
}) => {
  const [, copyToClipboard] = useCopyToClipboard();

  const handleDownload: MouseEventHandler<HTMLAnchorElement> = async (e) => {
    const isExternal = downloadUrl.includes("://");

    if (!isExternal) return;

    e.preventDefault();
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok)
        throw new Error(`Failed to fetch: ${response.statusText}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadUrl.split("/").pop() || "schema.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: Logging error
      console.error("Failed to download schema:", error);
    }
  };

  return (
    <ButtonGroup>
      <Button variant="outline" asChild>
        <a href={downloadUrl} download onClick={handleDownload}>
          <DownloadIcon />
          Download schema
        </a>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="px-1.5">
            <ChevronDownIcon size={14} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLinkIcon size={14} />
              Open in new tab
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => {
              const response = await fetch(downloadUrl);
              const schema = await response.text();
              copyToClipboard(schema);
            }}
          >
            <CopyIcon size={14} />
            Copy to clipboard
          </DropdownMenuItem>
          {schemaDownload?.useInClaude !== false && (
            <DropdownMenuItem
              onClick={() => {
                const prompt = encodeURIComponent(
                  `Help me understand this API: ${new URL(downloadUrl, window.location.href).href}`,
                );
                window.open(`https://claude.ai/new?q=${prompt}`, "_blank");
              }}
            >
              <ClaudeLogo className="size-4" />
              Use in Claude
            </DropdownMenuItem>
          )}
          {schemaDownload?.useInChatGPT !== false && (
            <DropdownMenuItem
              onClick={() => {
                const prompt = encodeURIComponent(
                  `Help me understand this API: ${new URL(downloadUrl, window.location.href).href}`,
                );
                window.open(`https://chatgpt.com/?q=${prompt}`, "_blank");
              }}
            >
              <ChatGPTLogo className="size-4" />
              Use in ChatGPT
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
};
