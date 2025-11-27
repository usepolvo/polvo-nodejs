import {
  verifyLinearWebhook,
  parseLinearWebhook,
  isIssueWebhook,
  isAgentSessionWebhook,
  isAgentActivityWebhook,
  isCommentWebhook,
  isPromptActivity,
} from "@usepolvo/linear/webhook";

// Example webhook payloads (for demonstration)
const issuePayload = {
  action: "create",
  type: "Issue",
  data: {
    id: "issue-123",
    title: "Fix authentication bug",
    description: "Users are getting logged out randomly",
    state: { name: "In Progress" },
    team: { name: "Engineering" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  url: "https://linear.app/team/issue/ENG-123",
  createdAt: new Date().toISOString(),
};

const agentSessionPayload = {
  action: "create",
  type: "AgentSessionEvent",
  agentSession: {
    id: "session-456",
    mentionedAgentId: "agent-789",
    issue: {
      id: "issue-123",
      title: "Review PR #456",
    },
    comment: {
      id: "comment-001",
      body: "@agent please review this PR",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  url: "https://linear.app/team/issue/ENG-123",
  createdAt: new Date().toISOString(),
};

function handleWebhook(rawBody, signature, secret) {
  console.log("Linear Webhook Handler Example\n");

  // 1. Verify signature (in real usage)
  if (signature && secret) {
    const isValid = verifyLinearWebhook(rawBody, signature, secret);
    if (!isValid) {
      console.log("Invalid signature - rejecting webhook");
      return { status: 401, error: "Invalid signature" };
    }
    console.log("Signature verified");
  }

  // 2. Parse with Zod validation
  const payload = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;
  const result = parseLinearWebhook(payload);

  if (!result.success) {
    console.log("Failed to parse webhook:", result.error);
    return { status: 400, error: result.error };
  }

  console.log("Webhook parsed successfully");
  console.log("Type:", result.data.type);
  console.log("Action:", result.data.action);
  console.log("");

  // 3. Handle typed webhook with type guards
  const webhook = result.data;

  if (isIssueWebhook(webhook)) {
    console.log("Issue webhook:");
    console.log("  Title:", webhook.data.title);
    console.log("  State:", webhook.data.state?.name);
    console.log("  Team:", webhook.data.team?.name);
  }

  if (isAgentSessionWebhook(webhook)) {
    console.log("Agent session webhook:");
    console.log("  Session ID:", webhook.agentSession.id);
    console.log("  Issue:", webhook.agentSession.issue.title);
    console.log("  Comment:", webhook.agentSession.comment.body);
  }

  if (isAgentActivityWebhook(webhook)) {
    console.log("Agent activity webhook:");
    console.log("  Activity type:", webhook.agentActivity.content.type);

    if (isPromptActivity(webhook.agentActivity)) {
      console.log("  Prompt:", webhook.agentActivity.content.prompt);
    }
  }

  if (isCommentWebhook(webhook)) {
    console.log("Comment webhook:");
    console.log("  Body:", webhook.data.body);
  }

  return { status: 200 };
}

// Demonstrate with example payloads
console.log("=== Issue Webhook ===");
handleWebhook(issuePayload, null, null);

console.log("\n=== Agent Session Webhook ===");
handleWebhook(agentSessionPayload, null, null);
