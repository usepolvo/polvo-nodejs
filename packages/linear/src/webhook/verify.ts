import { verifyHmac } from "@usepolvo/webhook";

/**
 * Verify a Linear webhook signature.
 *
 * @param payload - The raw webhook payload (string or Buffer)
 * @param signature - The signature from the 'linear-signature' header
 * @param secret - Your webhook signing secret
 * @returns true if the signature is valid
 *
 * @example
 * ```ts
 * const isValid = verifyLinearWebhook(
 *   req.rawBody,
 *   req.headers['linear-signature'],
 *   process.env.LINEAR_WEBHOOK_SECRET
 * );
 * ```
 */
export function verifyLinearWebhook(
  payload: string | Buffer,
  signature: string,
  secret: string
): boolean {
  return verifyHmac({
    payload,
    signature,
    secret,
    algorithm: "sha256",
  });
}
