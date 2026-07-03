import { CheckIcon, CopyIcon, ExternalLinkIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import { InlineCode } from "../../components/InlineCode.js";
import { Typography } from "../../components/Typography.js";
import { Button } from "../../ui/Button.js";
import { Callout } from "../../ui/Callout.js";
import { Card } from "../../ui/Card.js";
import { SyntaxHighlight } from "../../ui/SyntaxHighlight.js";
import { ToggleGroup, ToggleGroupItem } from "../../ui/ToggleGroup.js";
import { cn } from "../../util/cn.js";
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
import { McpClientLogo } from "./McpClientLogos.js";

const DocsLink = ({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
  >
    {children}
    <ExternalLinkIcon className="h-3 w-3" />
  </a>
);

// Wraps a list of <li> steps in the shared `.stepper` visual (numbered bullets
// with a connecting line, see main.css).
const Steps = ({ children }: { children: ReactNode }) => (
  <div className="stepper">
    <ol>{children}</ol>
  </div>
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

  const [selectedAppId, setSelectedAppId] = useState(
    visibleApps[0]?.id ?? "generic",
  );
  const selectedApp =
    visibleApps.find((app) => app.id === selectedAppId) ?? visibleApps[0];

  const [selectedSubAppId, setSelectedSubAppId] = useState<string | undefined>(
    selectedApp?.subApps[0]?.id,
  );

  const selectApp = (id: string) => {
    setSelectedAppId(id);
    const next = visibleApps.find((app) => app.id === id);
    setSelectedSubAppId(next?.subApps[0]?.id);
  };

  // Keep the active sub-app consistent with the selected app.
  const activeSubApp =
    selectedApp?.subApps.find((sub) => sub.id === selectedSubAppId) ??
    selectedApp?.subApps[0];

  const handleCopy = () => {
    void navigator.clipboard.writeText(mcpUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const renderSetup = (app: McpApp) => {
    const subAppId = activeSubApp?.id ?? app.subApps[0]?.id;

    switch (app.id) {
      case "claude":
        if (subAppId === "claude-code") {
          return (
            <>
              <Steps>
                <li>
                  <p>Add {name} to Claude Code by running:</p>
                  <SyntaxHighlight
                    showLanguageIndicator
                    title="Terminal"
                    language="bash"
                    code={claudeCodeCommand}
                  />
                </li>
                {auth && (
                  <li>
                    <p>
                      Replace <InlineCode>{auth.placeholder}</InlineCode> with
                      your API key.
                    </p>
                  </li>
                )}
                <li>
                  <p>
                    Restart Claude Code — the {name} tools are now available.
                  </p>
                </li>
              </Steps>
              <DocsLink href="https://docs.anthropic.com/en/docs/claude-code/mcp">
                View official docs
              </DocsLink>
            </>
          );
        }
        return (
          <>
            <Steps>
              <li>
                <p>
                  Open Claude Desktop and go to{" "}
                  <strong>Settings → Connectors</strong>.
                </p>
              </li>
              <li>
                <p>
                  Click <strong>Add custom connector</strong>, paste the MCP
                  server URL above, and save.
                </p>
              </li>
              <li>
                <p>
                  Click <strong>Connect</strong> and sign in to authorize {name}{" "}
                  — the tools appear in your conversations.
                </p>
              </li>
            </Steps>
            <DocsLink href="https://modelcontextprotocol.io/quickstart/user">
              View official docs
            </DocsLink>
          </>
        );

      case "chatgpt":
        return (
          <>
            <Callout type="note" title="Requirements">
              ChatGPT Plus, Team, Enterprise, or Edu subscription.
            </Callout>
            <Steps>
              <li>
                <p>
                  Go to <strong>Settings → Apps → Advanced Settings</strong>.
                </p>
              </li>
              <li>
                <p>
                  Click <strong>Create app</strong> and fill out the form.
                </p>
              </li>
              <li>
                <p>
                  Enter the MCP server URL above and save — the app is now
                  available in your conversations.
                </p>
              </li>
            </Steps>
            <DocsLink href="https://developers.openai.com/apps-sdk/deploy/connect-chatgpt#create-a-connector">
              View official docs
            </DocsLink>
          </>
        );

      case "codex":
        if (subAppId === "codex-cli") {
          return (
            <>
              <Steps>
                <li>
                  <p>Add {name} to Codex CLI by running:</p>
                  <SyntaxHighlight
                    showLanguageIndicator
                    title="Terminal"
                    language="bash"
                    code={codexCliCommand}
                  />
                </li>
                <li>
                  <p>
                    Or add it to <InlineCode>~/.codex/config.json</InlineCode>:
                  </p>
                  <SyntaxHighlight
                    showLanguageIndicator
                    title="config.json"
                    language="json"
                    code={codexConfig}
                  />
                </li>
              </Steps>
              <DocsLink href="https://openai.com/index/introducing-codex/">
                View official docs
              </DocsLink>
            </>
          );
        }
        return (
          <>
            <Steps>
              <li>
                <p>
                  Open Codex and go to <strong>Settings → MCP Servers</strong>.
                </p>
              </li>
              <li>
                <p>Add a new server and paste the MCP server URL above.</p>
              </li>
              <li>
                <p>Save — the server is available in your sessions.</p>
              </li>
            </Steps>
            <DocsLink href="https://openai.com/index/introducing-codex/">
              View official docs
            </DocsLink>
          </>
        );

      case "cursor":
        return (
          <>
            <Steps>
              <li>
                <p>
                  Go to{" "}
                  <strong>Settings → Tools & MCPs → New MCP Server</strong>, or
                  edit <InlineCode>~/.cursor/mcp.json</InlineCode> (global) /{" "}
                  <InlineCode>.cursor/mcp.json</InlineCode> (project):
                </p>
                <SyntaxHighlight
                  showLanguageIndicator
                  title="mcp.json"
                  language="json"
                  code={cursorConfig}
                />
              </li>
              <li>
                <p>Restart Cursor to apply the configuration.</p>
              </li>
            </Steps>
            <DocsLink href="https://cursor.com/docs/context/mcp">
              View official docs
            </DocsLink>
          </>
        );

      case "vscode":
        return (
          <>
            <Callout type="note" title="Requirements">
              VS Code with the GitHub Copilot extension.
            </Callout>
            <Steps>
              <li>
                <p>
                  Create <InlineCode>.vscode/mcp.json</InlineCode> in your
                  workspace (or a user-level mcp.json):
                </p>
                <SyntaxHighlight
                  showLanguageIndicator
                  title="mcp.json"
                  language="json"
                  code={vscodeConfig}
                />
              </li>
              <li>
                <p>Restart VS Code to apply the configuration.</p>
              </li>
              <li>
                <p>
                  Use the MCP tools in GitHub Copilot Chat by selecting Agent
                  mode.
                </p>
              </li>
            </Steps>
            <DocsLink href="https://code.visualstudio.com/docs/copilot/chat/mcp-servers">
              View official docs
            </DocsLink>
          </>
        );

      case "generic":
        return (
          <>
            <p>
              A generic <InlineCode>.mcp.json</InlineCode> configuration that
              works with most MCP-compatible apps.
            </p>
            <SyntaxHighlight
              showLanguageIndicator
              title=".mcp.json"
              language="json"
              code={genericConfig}
            />
            <p className="text-sm text-muted-foreground">
              Place this file in your project root or the appropriate
              configuration directory for your app. The exact location depends
              on your specific tool.
            </p>
            <DocsLink href="https://modelcontextprotocol.io/">
              Learn more about MCP
            </DocsLink>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="p-6 mb-6 max-w-screen-md">
      <div className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold">Connect {name}</h3>
          <p className="text-sm text-muted-foreground">
            Add this MCP server to your favorite AI tools in a few steps.
          </p>
        </div>

        {/* Step 1 — the one thing every client needs: the server URL. */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-medium text-muted-foreground mb-1">
                MCP Server URL
              </div>
              <code className="block truncate font-mono text-sm">{mcpUrl}</code>
            </div>
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className="gap-1.5 shrink-0"
            >
              {isCopied ? (
                <CheckIcon className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <CopyIcon className="h-3.5 w-3.5" />
              )}
              {isCopied ? "Copied!" : "Copy"}
            </Button>
          </div>
          {auth && (
            <p className="mt-2 text-xs text-muted-foreground">
              Requires an <InlineCode>{auth.headerName}</InlineCode> header —
              replace <InlineCode>{auth.placeholder}</InlineCode> with your key.
            </p>
          )}
        </div>

        {/* Step 2 — pick your client. */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Choose your client</div>
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(3, minmax(0, 1fr))`,
            }}
          >
            {visibleApps.map((app) => {
              const isActive = app.id === selectedApp?.id;
              return (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => selectApp(app.id)}
                  aria-pressed={isActive}
                  data-active={isActive}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-lg border p-3 transition sm:col-span-1",
                    "hover:bg-muted/60",
                    isActive
                      ? "border-primary bg-primary/5 ring-1 ring-primary text-foreground"
                      : "border-border text-muted-foreground",
                  )}
                >
                  <McpClientLogo appId={app.id} className="size-6" />
                  <span className="text-xs font-medium">{app.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3 — client-specific setup walkthrough. */}
        {selectedApp && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-medium">
                Set up {selectedApp.label}
              </div>
              {selectedApp.subApps.length > 1 && (
                <ToggleGroup
                  size="sm"
                  variant="outline"
                  spacing={2}
                  aria-label={`Set up method for ${selectedApp.label}`}
                  value={activeSubApp ? [activeSubApp.id] : []}
                  onValueChange={(value: string[]) => {
                    const next = value.at(0);
                    if (next) setSelectedSubAppId(next);
                  }}
                >
                  {selectedApp.subApps.map((sub) => (
                    <ToggleGroupItem key={sub.id} value={sub.id}>
                      {sub.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              )}
            </div>
            <Typography className="text-sm max-w-full">
              {renderSetup(selectedApp)}
            </Typography>
          </div>
        )}
      </div>
    </Card>
  );
};
