/**
 * Result of webhook signature verification
 */
export interface WebhookVerifyResult {
  valid: boolean;
  error?: string;
}

/**
 * Result of parsing a webhook payload
 */
export interface WebhookParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
