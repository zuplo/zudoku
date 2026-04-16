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
import {
  type McpServerData,
  getAuthHeader,
  getClaudeCodeCommand,
  getCursorConfig,
  getGenericConfig,
  getMcpServerName,
  getMcpUrl,
  getVscodeConfig,
} from "./mcp-configs.js";

export const MCPEndpoint = ({
  serverUrl,
  operationPath,
  summary,
  data,
}: {
  serverUrl?: string;
  operationPath?: string;
  data?: McpServerData;
  summary?: string;
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const mcpUrl = getMcpUrl(serverUrl, operationPath);
  const name = getMcpServerName(data, summary);
  const auth = getAuthHeader(data);

  const claudeCodeCommand = getClaudeCodeCommand(name, mcpUrl, auth);
  const cursorConfig = getCursorConfig(name, mcpUrl, auth);
  const chatgptConfig = mcpUrl;
  const genericConfig = getGenericConfig(name, mcpUrl, auth);
  const vscodeConfig = getVscodeConfig(name, mcpUrl, auth);

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
          <h3 className="text-lg font-semibold mb-2">App Configuration</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Choose your app and copy the configuration to get started.
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
                  Alternatively, add it to Claude Code CLI by running:
                </p>
                <SyntaxHighlight
                  showLanguageIndicator
                  title="Terminal"
                  language="bash"
                  code={claudeCodeCommand}
                  className="mt-2"
                />
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
                    Go to <strong>Settings</strong> → <strong>Apps</strong> →{" "}
                    <strong>Advanced Settings</strong>
                  </li>
                  <li>
                    Click <strong>Create app</strong> and fill out the form
                  </li>
                  <li>
                    Enter the MCP server URL:
                    <InlineCode className="ml-2">{chatgptConfig}</InlineCode>
                  </li>
                  <li>
                    Save and the app will be available in your conversations
                  </li>
                </ol>

                <a
                  href="https://developers.openai.com/apps-sdk/deploy/connect-chatgpt#create-a-connector"
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
                    <span>
                      Go to <strong>Settings</strong> →{" "}
                      <strong>Tools & MCPs</strong> →{" "}
                      <strong>New MCP Server</strong>, or edit:{" "}
                    </span>
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
                  format that works with most MCP-compatible apps.
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
                  configuration directory for your app. The exact location
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
            -compatible app
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
      </div>
    </Card>
  );
};
