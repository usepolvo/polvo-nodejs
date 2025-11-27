# @usepolvo/linear

Linear API client and webhook utilities with Zod schemas.

## Install

```bash
pnpm add @usepolvo/linear zod
```

## API Client

```typescript
import { LinearClient } from "@usepolvo/linear";

const client = new LinearClient({ accessToken: process.env.LINEAR_TOKEN });

// Execute any GraphQL query
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

## Webhook Handling

```typescript
import {
  verifyLinearWebhook,
  parseLinearWebhook,
  isIssueWebhook,
  isAgentSessionWebhook,
  isAgentActivityWebhook,
} from "@usepolvo/linear/webhook";

function handleWebhook(rawBody: string, signature: string) {
  // 1. Verify signature
  const isValid = verifyLinearWebhook(
    rawBody,
    signature,
    process.env.WEBHOOK_SECRET
  );
  if (!isValid) {
    return { status: 401, error: "Invalid signature" };
  }

  // 2. Parse with Zod validation
  const result = parseLinearWebhook(JSON.parse(rawBody));
  if (!result.success) {
    return { status: 400, error: result.error };
  }

  // 3. Handle typed webhook
  const webhook = result.data;

  if (isIssueWebhook(webhook)) {
    console.log("Issue:", webhook.data.title, webhook.action);
  }

  if (isAgentSessionWebhook(webhook)) {
    console.log("Agent session:", webhook.agentSession.id);
    console.log("Comment:", webhook.agentSession.comment.body);
  }

  if (isAgentActivityWebhook(webhook)) {
    console.log("Activity:", webhook.agentActivity.content.type);
  }

  return { status: 200 };
}
```

## Webhook Types

The following webhook types are supported with full Zod schemas:

- `Issue` - Issue create/update/remove events
- `AgentSessionEvent` - Agent mention events (@agent)
- `AgentActivity` - Agent session activity (prompts, responses)
- `Comment` - Comment events

## Type Guards

```typescript
import {
  isIssueWebhook,
  isAgentSessionWebhook,
  isAgentActivityWebhook,
  isCommentWebhook,
  isPromptActivity,
} from "@usepolvo/linear/webhook";
```

## License

MIT
