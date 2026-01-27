/**
 * HMAC Signature Utilities
 *
 * Provides HMAC-SHA256 signing and verification for webhook payloads.
 * Used to ensure webhook authenticity and prevent tampering.
 *
 * @version 1.0.0
 */

/**
 * Signature header name used in webhook requests
 */
export const SIGNATURE_HEADER = "X-Hive-Signature";

/**
 * Timestamp header name used in webhook requests
 */
export const TIMESTAMP_HEADER = "X-Hive-Timestamp";

/**
 * Event type header name used in webhook requests
 */
export const EVENT_HEADER = "X-Hive-Event";

/**
 * Maximum age in seconds for a valid webhook timestamp (5 minutes)
 */
export const MAX_TIMESTAMP_AGE_SECONDS = 300;

/**
 * Generate HMAC-SHA256 signature for a payload
 *
 * @param payload - The payload to sign (will be JSON stringified if object)
 * @param secret - The signing secret
 * @param timestamp - Unix timestamp in seconds
 * @returns The signature in format "t={timestamp},v1={signature}"
 */
export async function signPayload(
  payload: string | object,
  secret: string,
  timestamp?: number
): Promise<string> {
  const ts = timestamp || Math.floor(Date.now() / 1000);
  const payloadString = typeof payload === "string" ? payload : JSON.stringify(payload);

  // Create the signed payload: timestamp.payload
  const signedPayload = `${ts}.${payloadString}`;

  // Generate HMAC-SHA256 signature
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signedPayload)
  );

  // Convert to hex
  const signatureHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `t=${ts},v1=${signatureHex}`;
}

/**
 * Verify an HMAC-SHA256 signature
 *
 * @param payload - The payload that was signed
 * @param signature - The signature header value
 * @param secret - The signing secret
 * @returns true if signature is valid and not expired
 */
export async function verifySignature(
  payload: string | object,
  signature: string,
  secret: string
): Promise<{ valid: boolean; error?: string }> {
  // Parse signature header
  const parts = signature.split(",");
  const timestampPart = parts.find((p) => p.startsWith("t="));
  const signaturePart = parts.find((p) => p.startsWith("v1="));

  if (!timestampPart || !signaturePart) {
    return { valid: false, error: "Invalid signature format" };
  }

  const timestamp = parseInt(timestampPart.slice(2), 10);
  const providedSignature = signaturePart.slice(3);

  if (isNaN(timestamp)) {
    return { valid: false, error: "Invalid timestamp" };
  }

  // Check timestamp age
  const now = Math.floor(Date.now() / 1000);
  if (now - timestamp > MAX_TIMESTAMP_AGE_SECONDS) {
    return { valid: false, error: "Timestamp too old" };
  }

  // Regenerate signature
  const expectedSignature = await signPayload(payload, secret, timestamp);
  const expectedSignaturePart = expectedSignature.split(",").find((p) => p.startsWith("v1="));

  if (!expectedSignaturePart) {
    return { valid: false, error: "Failed to generate expected signature" };
  }

  const expectedHex = expectedSignaturePart.slice(3);

  // Constant-time comparison
  if (providedSignature.length !== expectedHex.length) {
    return { valid: false, error: "Signature mismatch" };
  }

  let result = 0;
  for (let i = 0; i < providedSignature.length; i++) {
    result |= providedSignature.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  }

  if (result !== 0) {
    return { valid: false, error: "Signature mismatch" };
  }

  return { valid: true };
}

/**
 * Create webhook headers for a delivery
 */
export async function createWebhookHeaders(
  payload: object,
  secret: string,
  eventType: string
): Promise<Record<string, string>> {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await signPayload(payload, secret, timestamp);

  return {
    "Content-Type": "application/json",
    [SIGNATURE_HEADER]: signature,
    [TIMESTAMP_HEADER]: timestamp.toString(),
    [EVENT_HEADER]: eventType,
    "User-Agent": "HIVE-Webhooks/1.0",
  };
}
