---
title: AI Chat
sidebar_icon: sparkles
description:
  Add an "Ask AI" assistant to your Zudoku site. The Zudoku AI plugin renders a chat panel powered
  by the AI SDK that streams answers from your own backend endpoint.
---

The **Zudoku AI** plugin adds an _Ask AI_ button to the header. When clicked it opens a chat panel
that streams answers from an AI backend you control. The UI is built on
[`@ai-sdk/react`](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat), so it works with any model
provider supported by the [AI SDK](https://ai-sdk.dev).

:::tip

Looking for the _"Open in ChatGPT / Claude"_ buttons on documentation and API pages instead? Those
are configured separately — see [AI Assistants](./ai-assistants.md). The Zudoku AI plugin is an
in-page chat experience.

:::

## Installation

The AI SDK packages are optional peer dependencies, so install them alongside Zudoku:

```bash npm2yarn
npm install @ai-sdk/react ai
```

## Usage

Add the plugin to the `plugins` array in your Zudoku configuration:

```tsx title="zudoku.config.tsx"
import type { ZudokuConfig } from "zudoku";
import { zudokuAiPlugin } from "zudoku/plugins/ai";

const config: ZudokuConfig = {
  // ...your other configuration
  plugins: [
    zudokuAiPlugin({
      // The endpoint that implements the AI SDK UI Message Stream protocol.
      api: "/api/chat",
    }),
  ],
};

export default config;
```

An _Ask AI_ button now appears in the header (and as a floating button on small screens). Opening it
reveals the chat panel.

## Options

| Option        | Type                     | Default                                          | Description                                                                     |
| ------------- | ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `api`         | `string`                 | `"/api/chat"`                                    | Endpoint that returns an AI SDK UI Message Stream response.                     |
| `label`       | `string`                 | `"Ask AI"`                                       | Text shown on the header button.                                                |
| `title`       | `string`                 | `label`                                          | Heading shown at the top of the chat panel.                                     |
| `greeting`    | `string`                 | `"Hi! Ask me anything about the documentation."` | Message shown above the conversation while it is empty.                         |
| `suggestions` | `string[]`               | –                                                | Suggested questions rendered as clickable prompts in the empty state.           |
| `placeholder` | `string`                 | `"Ask a question…"`                              | Placeholder for the message input.                                              |
| `headers`     | `Record<string, string>` | –                                                | Additional headers sent with every request (e.g. for authorization).            |
| `credentials` | `RequestCredentials`     | `"same-origin"`                                  | Whether cookies are sent with the request.                                      |
| `position`    | `SlotName`               | `"head-navigation-end"`                          | The [slot](./slots.mdx) the header button is rendered into.                     |
| `shortcut`    | `string \| false`        | `false`                                          | A single key that, combined with ⌘/Ctrl, toggles the chat. `false` disables it. |

A fuller example:

```tsx title="zudoku.config.tsx"
zudokuAiPlugin({
  api: "/api/chat",
  label: "Ask AI",
  greeting: "Hi! I'm the Cosmo Cargo assistant. How can I help?",
  placeholder: "Ask about shipments, warp drives…",
  shortcut: "i",
  suggestions: [
    "How do I create a shipment?",
    "What authentication does the API use?",
    "Show me an example request.",
  ],
});
```

## The backend endpoint

The plugin is frontend-only — you provide the endpoint named by `api`. It must accept a `POST`
request whose body contains the chat `messages` and respond with an AI SDK UI Message Stream.

The example below uses the [AI SDK](https://ai-sdk.dev) `streamText` helper. It runs in any
environment that can return a `Response` (a Zudoku [server deployment](../deployment.md), a
serverless function, a Hono/Express route, etc.):

```ts title="api/chat.ts"
import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: "You are a helpful assistant for the ACME documentation.",
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
```

You can swap `@ai-sdk/openai` for any
[AI SDK provider](https://ai-sdk.dev/providers/ai-sdk-providers) such as `@ai-sdk/anthropic` or
`@ai-sdk/google`. To ground answers in your documentation, retrieve relevant context (for example
from your [`llms.txt`](./llms.md) file or a vector store) and include it in the `system` prompt or
messages.

:::note

If your endpoint lives on a different origin, pass its absolute URL as `api` and make sure the
server sends the appropriate CORS headers. Use `headers` and `credentials` for authenticated
requests.

:::

## Opening the chat programmatically

Use the `useAskAi` hook to control the panel from your own components — for example a call-to-action
in an MDX page:

```tsx
import { useAskAi } from "zudoku/plugins/ai";

export const AskButton = () => {
  const { open } = useAskAi();
  return <button onClick={open}>Ask the assistant</button>;
};
```

The hook returns `{ isOpen, open, close, toggle }`.
