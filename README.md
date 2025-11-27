# Polvo

**Integration connector toolkit for Node.js**

Typed clients, webhook utilities, and simple HTTP primitives for building integrations.

## Packages

| Package                                   | Description                                            |
| ----------------------------------------- | ------------------------------------------------------ |
| [`@usepolvo/core`](./packages/core)       | Lightweight HTTP client with retries and auth handlers |
| [`@usepolvo/webhook`](./packages/webhook) | Generic webhook signature verification (HMAC)          |
| [`@usepolvo/linear`](./packages/linear)   | Linear API client and webhook schemas                  |

## Quick Start

```bash
# Core HTTP client
pnpm add @usepolvo/core

# Linear integration
pnpm add @usepolvo/linear zod
```

### HTTP Client

```typescript
import polvo, { auth } from "@usepolvo/core";

// Simple requests
const response = await polvo.get("https://api.example.com/data");
console.log(response.data);

// With authentication
const session = polvo.create({
  baseURL: "https://api.example.com",
  auth: auth.bearer("your_token"),
  retry: true,
});

const data = await session.get("/users").then((r) => r.data);
```

### Linear Integration

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
  // Verify signature
  const isValid = verifyLinearWebhook(
    rawBody,
    signature,
    process.env.WEBHOOK_SECRET
  );
  if (!isValid) return { status: 401 };

  // Parse with Zod validation
  const result = parseLinearWebhook(JSON.parse(rawBody));
  if (!result.success) return { status: 400, error: result.error };

  // Type-safe handling
  if (isAgentSessionWebhook(result.data)) {
    console.log("Agent session:", result.data.agentSession.id);
  }

  return { status: 200 };
}
```

## Auth Handlers

```typescript
import { auth } from "@usepolvo/core";

auth.bearer("token"); // Authorization: Bearer token
auth.apiKey("key", "X-API-Key"); // X-API-Key: key
auth.basic("user", "pass"); // Authorization: Basic base64(user:pass)
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
