import { CheckIcon, CopyIcon, ExternalLinkIcon } from "lucide-react";
import { useState } from "react";
import { InlineCode } from "../../components/InlineCode.js";
import { Typography } from "../../components/Typography.js";
import { Button } from "../../ui/Button.js";
import { Callout } from "../../ui/Callout.js";
import { Card } from "../../ui/Card.js";
import { SyntaxHighlight } from "../../ui/SyntaxHighlight.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/Tabs.js";
import {
  type McpApp,
  type McpServerData,
  getAuthHeader,
  getAuthType,
  getClaudeCodeCommand,
  getCodexCliCommand,
  getCodexConfig,
  getCursorConfig,
  getGenericConfig,
  getMcpServerName,
  getMcpUrl,
  getVisibleApps,
  getVscodeConfig,
} from "./mcp-configs.js";

const SubAppSection = ({
  label,
  showLabel,
  children,
}: {
  label: string;
  showLabel: boolean;
  children: React.ReactNode;
}) =>
  showLabel ? (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">{label}</h4>
      {children}
    </div>
  ) : (
    <div className="space-y-3">{children}</div>
  );

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
  const authType = getAuthType(data);
  const visibleApps = getVisibleApps(authType);

  const claudeCodeCommand = getClaudeCodeCommand(name, mcpUrl, auth);
  const codexCliCommand = getCodexCliCommand(name, mcpUrl, auth);
  const cursorConfig = getCursorConfig(name, mcpUrl, auth);
  const codexConfig = getCodexConfig(name, mcpUrl, auth);
  const genericConfig = getGenericConfig(name, mcpUrl, auth);
  const vscodeConfig = getVscodeConfig(name, mcpUrl, auth);

  const defaultTab = visibleApps[0]?.id ?? "generic";

  const handleCopy = () => {
    void navigator.clipboard.writeText(mcpUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const hasSubApp = (app: McpApp, subAppId: string) =>
    app.subApps.some((s) => s.id === subAppId);

  const renderAppContent = (app: McpApp) => {
    const multiSub = app.subApps.length > 1;

    switch (app.id) {
      case "claude":
        return (
          <div className="space-y-4">
            {hasSubApp(app, "claude-desktop") && (
              <SubAppSection label="Claude Desktop" showLabel={multiSub}>
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
                <a
                  href="https://modelcontextprotocol.io/quickstart/user"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  View official docs
                  <ExternalLinkIcon className="h-3 w-3" />
                </a>
              </SubAppSection>
            )}
            {hasSubApp(app, "claude-code") && (
              <SubAppSection label="Claude Code CLI" showLabel={multiSub}>
                <p className="text-xs text-muted-foreground">
                  Add it to Claude Code CLI by running:
                </p>
                <SyntaxHighlight
                  showLanguageIndicator
                  title="Terminal"
                  language="bash"
                  code={claudeCodeCommand}
                  className="mt-2"
                />
              </SubAppSection>
            )}
          </div>
        );

      case "chatgpt":
        return (
          <>
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
                <InlineCode className="ml-2">{mcpUrl}</InlineCode>
              </li>
              <li>Save and the app will be available in your conversations</li>
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
          </>
        );

      case "codex":
        return (
          <div className="space-y-4">
            {hasSubApp(app, "codex-gui") && (
              <SubAppSection label="Codex" showLabel={multiSub}>
                <ol>
                  <li>
                    Open Codex and go to <strong>Settings</strong> →{" "}
                    <strong>MCP Servers</strong>
                  </li>
                  <li>Add a new server and paste the MCP URL</li>
                  <li>
                    Save and the server will be available in your sessions
                  </li>
                </ol>
                <a
                  href="https://openai.com/index/introducing-codex/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  View official docs
                  <ExternalLinkIcon className="h-3 w-3" />
                </a>
              </SubAppSection>
            )}
            {hasSubApp(app, "codex-cli") && (
              <SubAppSection label="Codex CLI" showLabel={multiSub}>
                <p className="text-xs text-muted-foreground">
                  Add it to Codex CLI by running:
                </p>
                <SyntaxHighlight
                  showLanguageIndicator
                  title="Terminal"
                  language="bash"
                  code={codexCliCommand}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground">
                  Or add to <InlineCode>~/.codex/config.json</InlineCode>:
                </p>
                <SyntaxHighlight
                  showLanguageIndicator
                  title="config.json"
                  language="json"
                  code={codexConfig}
                  className="mt-2"
                />
              </SubAppSection>
            )}
          </div>
        );

      case "cursor":
        return (
          <>
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
          </>
        );

      case "vscode":
        return (
          <>
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
          </>
        );

      case "generic":
        return (
          <>
            <p>
              Generic <InlineCode>.mcp.json</InlineCode> configuration format
              that works with most MCP-compatible apps.
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
              configuration directory for your app. The exact location depends
              on your specific tool.
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
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="p-6 mb-6 max-w-screen-md">
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">App Configuration</h3>
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              {isCopied ? (
                <CheckIcon className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <CopyIcon className="h-3.5 w-3.5" />
              )}
              {isCopied ? "Copied!" : "Copy URL"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Choose your app and copy the configuration to get started.
          </p>

          <hr className="my-4" />

          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList
              className="grid w-full"
              style={{
                gridTemplateColumns: `repeat(${visibleApps.length}, minmax(0, 1fr))`,
              }}
            >
              {visibleApps.map((app) => (
                <TabsTrigger key={app.id} value={app.id}>
                  {app.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <Typography className="text-sm max-w-full">
              {visibleApps.map((app) => (
                <TabsContent key={app.id} value={app.id} className="space-y-3">
                  {renderAppContent(app)}
                </TabsContent>
              ))}
            </Typography>
          </Tabs>
        </div>
      </div>
    </Card>
  );
};
