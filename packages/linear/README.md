# @usepolvo/linear

Linear connector with OAuth, GraphQL client, and webhook utilities.

## Install

```bash
pnpm add @usepolvo/linear @usepolvo/core zod
```

## OAuth

```typescript
import { LinearClient } from "@usepolvo/linear";
import { oauth2 } from "@usepolvo/core";

const auth = oauth2({
  clientId: process.env.LINEAR_CLIENT_ID,
  clientSecret: process.env.LINEAR_CLIENT_SECRET,
  authorizationUrl: "https://linear.app/oauth/authorize",
  tokenUrl: "https://api.linear.app/oauth/token",
  redirectUri: "http://localhost:3000/callback",
  scopes: ["read", "write"],
});

// Redirect user to authorize
const { url } = auth.getAuthorizationUrl();

// Exchange code for tokens (in callback)
const tokens = await auth.exchangeCode(code);

// Use with client
const client = new LinearClient({ accessToken: tokens.accessToken });
```

## GraphQL Client

```typescript
import { LinearClient } from "@usepolvo/linear";

const client = new LinearClient({ accessToken: process.env.LINEAR_TOKEN });

const result = await client.query<{
  issue: { title: string; state: { name: string } };
}>(
  `query GetIssue($id: String!) {
    issue(id: $id) {
      title
      state { name }
    }
  }`,
  { id: "issue-123" }
);

console.log(result.issue.title);
```

## Webhooks

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

## License

MIT
