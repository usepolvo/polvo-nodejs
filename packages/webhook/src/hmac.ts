import { createHmac, timingSafeEqual } from "node:crypto";

export type HmacAlgorithm = "sha256" | "sha1";

export interface VerifyHmacOptions {
  /** The raw webhook payload (string or Buffer) */
  payload: string | Buffer;
  /** The signature from the webhook header */
  signature: string;
  /** The secret key for HMAC verification */
  secret: string;
  /** The HMAC algorithm to use (default: 'sha256') */
  algorithm?: HmacAlgorithm;
  /** Optional prefix in the signature (e.g., 'sha256=' for GitHub) */
  signaturePrefix?: string;
}

/**
 * Verify an HMAC signature for a webhook payload.
 * Uses timing-safe comparison to prevent timing attacks.
 *
 * @example
 * ```ts
 * // Linear webhook (no prefix)
 * const valid = verifyHmac({
 *   payload: rawBody,
 *   signature: req.headers['linear-signature'],
 *   secret: process.env.LINEAR_WEBHOOK_SECRET,
 * });
 *
 * // GitHub webhook (with prefix)
 * const valid = verifyHmac({
 *   payload: rawBody,
 *   signature: req.headers['x-hub-signature-256'],
 *   secret: process.env.GITHUB_WEBHOOK_SECRET,
 *   signaturePrefix: 'sha256=',
 * });
 * ```
 */
export function verifyHmac(options: VerifyHmacOptions): boolean {
  const {
    payload,
    signature,
    secret,
    algorithm = "sha256",
    signaturePrefix = "",
  } = options;

  if (!secret || !signature) {
    return false;
  }

  const payloadString =
    typeof payload === "string" ? payload : payload.toString("utf8");

  const expectedSignature =
    signaturePrefix +
    createHmac(algorithm, secret).update(payloadString).digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    // Length mismatch - signatures don't match
    return false;
  }
}
