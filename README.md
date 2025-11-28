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
import { oauth2 } from "@usepolvo/core";

// OAuth setup
const auth = oauth2({
  clientId: process.env.LINEAR_CLIENT_ID,
  clientSecret: process.env.LINEAR_CLIENT_SECRET,
  authorizationUrl: "https://linear.app/oauth/authorize",
  tokenUrl: "https://api.linear.app/oauth/token",
  redirectUri: "http://localhost:3000/callback",
  scopes: ["read", "write"],
});

// 1. Redirect user to authorize
const { url } = auth.getAuthorizationUrl();

// 2. Exchange code for tokens (in your callback handler)
const tokens = await auth.exchangeCode(code);

// 3. Use with Linear client
const client = new LinearClient({ accessToken: tokens.accessToken });

const result = await client.query<{ issue: { title: string } }>(
  `query GetIssue($id: String!) { issue(id: $id) { title } }`,
  { id: "issue-123" }
);
```

#### Webhooks

```typescript
import {
  verifyLinearWebhook,
  parseLinearWebhook,
} from "@usepolvo/linear/webhook";

function handleWebhook(rawBody: string, signature: string) {
  const isValid = verifyLinearWebhook(
    rawBody,
    signature,
    process.env.WEBHOOK_SECRET
  );
  if (!isValid) return { status: 401 };

  const result = parseLinearWebhook(JSON.parse(rawBody));
  if (!result.success) return { status: 400, error: result.error };

  console.log("Webhook:", result.data);
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
