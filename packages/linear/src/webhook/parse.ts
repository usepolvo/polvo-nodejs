import type { WebhookParseResult } from "@usepolvo/webhook";
import {
  LinearWebhookSchema,
  IssueWebhookSchema,
  AgentSessionWebhookSchema,
  AgentActivityWebhookSchema,
  CommentWebhookSchema,
  type LinearWebhook,
  type IssueWebhook,
  type AgentSessionWebhook,
  type AgentActivityWebhook,
  type CommentWebhook,
} from "./schemas.js";

/**
 * Parse and validate a Linear webhook payload.
 *
 * @param payload - The parsed JSON payload from the webhook
 * @returns A parse result with typed data or an error
 *
 * @example
 * ```ts
 * const result = parseLinearWebhook(JSON.parse(req.body));
 * if (result.success) {
 *   console.log('Webhook type:', result.data.type);
 * } else {
 *   console.error('Parse error:', result.error);
 * }
 * ```
 */
export function parseLinearWebhook(
  payload: unknown
): WebhookParseResult<LinearWebhook> {
  const result = LinearWebhookSchema.safeParse(payload);

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

// ─────────────────────────────────────────────────────────────
// Type guards
// ─────────────────────────────────────────────────────────────

/**
 * Check if the webhook is an Issue event
 */
export function isIssueWebhook(
  webhook: LinearWebhook
): webhook is IssueWebhook {
  return webhook.type === "Issue";
}

/**
 * Check if the webhook is an AgentSessionEvent
 */
export function isAgentSessionWebhook(
  webhook: LinearWebhook
): webhook is AgentSessionWebhook {
  return webhook.type === "AgentSessionEvent";
}

/**
 * Check if the webhook is an AgentActivity event
 */
export function isAgentActivityWebhook(
  webhook: LinearWebhook
): webhook is AgentActivityWebhook {
  return webhook.type === "AgentActivity";
}

/**
 * Check if the webhook is a Comment event
 */
export function isCommentWebhook(
  webhook: LinearWebhook
): webhook is CommentWebhook {
  return webhook.type === "Comment";
}

/**
 * Check if an AgentActivity is a user prompt (message)
 */
export function isPromptActivity(webhook: AgentActivityWebhook): boolean {
  return webhook.agentActivity.content.type === "prompt";
}
