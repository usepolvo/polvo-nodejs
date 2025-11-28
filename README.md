# Polvo

**Integration connectors for Node.js**

Pre-built connectors for third-party APIs with typed clients, webhook validation, and OAuth support.

## Connectors

| Package                                 | Description                           |
| --------------------------------------- | ------------------------------------- |
| [`@usepolvo/linear`](./packages/linear) | Linear API client and webhook schemas |

### Shared Packages

| Package                                   | Description                                   |
| ----------------------------------------- | --------------------------------------------- |
| [`@usepolvo/core`](./packages/core)       | HTTP primitives used by connectors internally |
| [`@usepolvo/webhook`](./packages/webhook) | HMAC webhook signature verification           |

## Quick Start

Install the connector you need:

```bash
pnpm add @usepolvo/linear zod
```

### Linear

```typescript
import { LinearClient } from "@usepolvo/linear";
import {
  verifyLinearWebhook,
  parseLinearWebhook,
  isAgentSessionWebhook,
} from "@usepolvo/linear/webhook";

// API client
const client = new LinearClient({ accessToken: process.env.LINEAR_TOKEN });

const result = await client.query<{ issue: { title: string } }>(
  `query GetIssue($id: String!) { issue(id: $id) { title } }`,
  { id: "issue-123" }
);

// Webhook handling
function handleWebhook(rawBody: string, signature: string) {
  const isValid = verifyLinearWebhook(
    rawBody,
    signature,
    process.env.WEBHOOK_SECRET
  );
  if (!isValid) return { status: 401 };

  const result = parseLinearWebhook(JSON.parse(rawBody));
  if (!result.success) return { status: 400, error: result.error };

  if (isAgentSessionWebhook(result.data)) {
    console.log("Agent session:", result.data.agentSession.id);
  }

  return { status: 200 };
}
```

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Type check
pnpm typecheck

# Lint
pnpm lint
```

## License

MIT
