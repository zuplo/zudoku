import { CheckIcon, CopyIcon, ExternalLinkIcon } from "lucide-react";
import { useState } from "react";
import { InlineCode } from "../../components/InlineCode.js";
import { Typography } from "../../components/Typography.js";
import { Button } from "../../ui/Button.js";
import { Callout } from "../../ui/Callout.js";
import { Card } from "../../ui/Card.js";
import { SyntaxHighlight } from "../../ui/SyntaxHighlight.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/Tabs.js";
import { cn } from "../../util/cn.js";

export const MCPEndpoint = ({
  serverUrl,
  operationPath,
  summary,
  data,
}: {
  serverUrl?: string;
  operationPath?: string;
  data?: boolean | Record<string, unknown>;
  summary?: string;
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const mcpUrl = `${(serverUrl ?? "").replace(/\/+$/, "")}${operationPath ?? "/mcp"}`;

  const name =
    typeof data === "boolean"
      ? (summary ?? "mcp-server")
      : (data?.name ?? summary ?? "mcp-server");

  const claudeConfig = `{
  "mcpServers": {
    "${name}": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "${mcpUrl}"]
    }
  }
}`;

  const cursorConfig = `{
  "mcpServers": {
    "${name}": {
      "url": "${mcpUrl}"
    }
  }
}`;

  const chatgptConfig = mcpUrl;

  const genericConfig = `{
  "mcpServers": {
    "${name}": {
      "url": "${mcpUrl}"
    }
  }
}`;

  const vscodeConfig = `{
  "servers": {
    "${name}": {
      "type": "http",
      "url": "${mcpUrl}"
    }
  }
}`;

  const handleCopy = () => {
    void navigator.clipboard.writeText(mcpUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <Card className="p-6 mb-6 max-w-screen-md">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">MCP Endpoint</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Copy the url to connect any{" "}
            <a
              href="https://modelcontextprotocol.io/"
              target="_blank"
              rel="noopener"
              className="text-primary hover:underline"
            >
              MCP
            </a>
            -compatible AI tool
          </p>

          <div
            className={cn(
              "relative flex items-center gap-2 p-3 rounded-md border border-primary/50",
            )}
          >
            <InlineCode className="bg-primary/20 px-4 py-2 flex-1 border-none">
              {mcpUrl}
            </InlineCode>
            <Button
              onClick={handleCopy}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              {isCopied ? (
                <CheckIcon className="h-4 w-4 text-green-600" />
              ) : (
                <CopyIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">AI Tool Configuration</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Choose your AI tool and copy the configuration to get started.
          </p>

          <hr className="my-4" />

          <Tabs defaultValue="claude" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="claude">Claude</TabsTrigger>
              <TabsTrigger value="chatgpt">ChatGPT</TabsTrigger>
              <TabsTrigger value="cursor">Cursor</TabsTrigger>
              <TabsTrigger value="vscode">VS Code</TabsTrigger>
              <TabsTrigger value="generic">Generic</TabsTrigger>
            </TabsList>

            <Typography className="text-sm max-w-full">
              <TabsContent value="claude" className="space-y-3">
                <ol>
                  <li>
                    Open Claude Desktop and navigate to{" "}
                    <strong>Settings</strong>
                  </li>
                  <li>
                    Go to <strong>Connectors</strong> →{" "}
                    <strong>Add custom connector</strong> and paste the MCP URL
                  </li>
                  <li>Save and the server will appear in your conversations</li>
                </ol>
                <p className="text-xs text-muted-foreground mt-2">
                  Alternatively, add to{" "}
                  <InlineCode>claude_desktop_config.json</InlineCode> using{" "}
                  <InlineCode>mcp-remote</InlineCode> (requires Node.js):
                </p>
                <SyntaxHighlight
                  showLanguageIndicator
                  title="claude_desktop_config.json"
                  language="json"
                  code={claudeConfig}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  macOS: ~/Library/Application
                  Support/Claude/claude_desktop_config.json
                  <br />
                  Windows: %APPDATA%\Claude\claude_desktop_config.json
                </p>
                <a
                  href="https://modelcontextprotocol.io/quickstart/user"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  View official docs
                  <ExternalLinkIcon className="h-3 w-3" />
                </a>
              </TabsContent>

              <TabsContent value="chatgpt" className="space-y-3">
                <Callout type="note" title="Requirements">
                  ChatGPT Plus, Team, Enterprise, or Edu subscription.
                </Callout>
                <ol>
                  <li>
                    Go to <strong>Settings</strong> →{" "}
                    <strong>Apps & Connectors</strong>
                  </li>
                  <li>
                    Click <strong>Add connector</strong> and enter your MCP URL:
                    <InlineCode className="ml-2">{chatgptConfig}</InlineCode>
                  </li>
                  <li>Provide a name and description for your connector</li>
                  <li>
                    Save and enable the connector. Users must authenticate with
                    the connector before first use.
                  </li>
                </ol>

                <a
                  href="https://help.openai.com/en/articles/11487775-connectors-in-chatgpt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  View official docs
                  <ExternalLinkIcon className="h-3 w-3" />
                </a>
              </TabsContent>

              <TabsContent value="cursor" className="space-y-3">
                <ol>
                  <li>
                    <span>Create or edit: </span>
                    <InlineCode>~/.cursor/mcp.json</InlineCode>
                    <span> (global) or </span>
                    <InlineCode>.cursor/mcp.json</InlineCode>
                    <span> (project)</span>
                    <SyntaxHighlight
                      showLanguageIndicator
                      title="mcp.json"
                      language="json"
                      code={cursorConfig}
                      className="mt-2"
                    />
                  </li>
                  <li>Restart Cursor to apply the configuration</li>
                </ol>
                <a
                  href="https://cursor.com/docs/context/mcp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  View official docs
                  <ExternalLinkIcon className="h-3 w-3" />
                </a>
              </TabsContent>

              <TabsContent value="vscode" className="space-y-3">
                <Callout type="note" title="Requirements">
                  VS Code with GitHub Copilot extension
                </Callout>

                <ol>
                  <li>
                    <span>Create </span>
                    <InlineCode>.vscode/mcp.json</InlineCode>
                    <span> in your workspace (or user-level mcp.json):</span>
                    <SyntaxHighlight
                      showLanguageIndicator
                      title="mcp.json"
                      language="json"
                      code={vscodeConfig}
                      className="mt-2"
                    />
                  </li>
                  <li>Restart VS Code to apply the configuration</li>
                  <li>
                    Use MCP tools in GitHub Copilot Chat by selecting Agent mode
                  </li>
                </ol>
                <a
                  href="https://code.visualstudio.com/docs/copilot/chat/mcp-servers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  View official docs
                  <ExternalLinkIcon className="h-3 w-3" />
                </a>
              </TabsContent>

              <TabsContent value="generic" className="space-y-3">
                <p>
                  Generic <InlineCode>.mcp.json</InlineCode> configuration
                  format that works with most MCP-compatible AI tools.
                </p>
                <SyntaxHighlight
                  showLanguageIndicator
                  title=".mcp.json"
                  language="json"
                  code={genericConfig}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground">
                  Place this file in your project root or the appropriate
                  configuration directory for your AI tool. The exact location
                  depends on your specific tool.
                </p>
                <a
                  href="https://modelcontextprotocol.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Learn more about MCP
                  <ExternalLinkIcon className="h-3 w-3" />
                </a>
              </TabsContent>
            </Typography>
          </Tabs>
        </div>
      </div>
    </Card>
  );
};
