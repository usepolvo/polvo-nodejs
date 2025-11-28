import type { WebhookParseResult } from "@usepolvo/webhook";
import { LinearWebhookSchema, type LinearWebhook } from "./schemas.js";

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
