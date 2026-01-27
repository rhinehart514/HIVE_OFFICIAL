/**
 * Webhook Delivery Service
 *
 * Application service for delivering webhook payloads to registered endpoints.
 * Handles retry logic, signature generation, and failure tracking.
 *
 * @version 1.0.0
 */

import { Result } from "../../domain/shared/base/Result";
import { Webhook } from "../../domain/webhooks/webhook.entity";
import type { WebhookEventType } from "../../domain/webhooks/event-types";
import type { WebhookEventPayload } from "../../domain/webhooks/webhook-event";
import { createWebhookHeaders } from "../../utils/crypto/hmac";
import type { IWebhookRepository } from "./webhook.service";

/**
 * Retry intervals in milliseconds
 */
const RETRY_INTERVALS = [1000, 5000, 30000, 300000]; // 1s, 5s, 30s, 5min

/**
 * Maximum retry attempts
 */
const MAX_RETRIES = 4;

/**
 * Timeout for webhook delivery in milliseconds
 */
const DELIVERY_TIMEOUT = 30000; // 30 seconds

/**
 * Delivery result for a single webhook
 */
export interface DeliveryResult {
  webhookId: string;
  success: boolean;
  statusCode?: number;
  error?: string;
  attemptCount: number;
  durationMs: number;
}

/**
 * Delivery attempt for a single webhook
 */
interface DeliveryAttempt {
  webhook: Webhook;
  payload: WebhookEventPayload;
  attemptNumber: number;
  startTime: number;
}

/**
 * Delivery log entry for persistence
 */
export interface DeliveryLogEntry {
  id: string;
  webhookId: string;
  eventId: string;
  eventType: WebhookEventType;
  spaceId: string;
  timestamp: Date;
  success: boolean;
  statusCode?: number;
  error?: string;
  attemptCount: number;
  durationMs: number;
  requestPayload?: object;
  responseBody?: string;
}

/**
 * Delivery log repository interface
 */
export interface IDeliveryLogRepository {
  save(entry: DeliveryLogEntry): Promise<Result<void>>;
  findByWebhookId(webhookId: string, limit?: number): Promise<Result<DeliveryLogEntry[]>>;
}

/**
 * Webhook delivery service configuration
 */
export interface WebhookDeliveryConfig {
  retryIntervals: number[];
  maxRetries: number;
  deliveryTimeout: number;
  logDeliveries: boolean;
}

const DEFAULT_CONFIG: WebhookDeliveryConfig = {
  retryIntervals: RETRY_INTERVALS,
  maxRetries: MAX_RETRIES,
  deliveryTimeout: DELIVERY_TIMEOUT,
  logDeliveries: true,
};

/**
 * Webhook delivery service
 */
export class WebhookDeliveryService {
  constructor(
    private readonly webhookRepository: IWebhookRepository,
    private readonly deliveryLogRepository?: IDeliveryLogRepository,
    private readonly config: WebhookDeliveryConfig = DEFAULT_CONFIG
  ) {}

  /**
   * Emit an event to all subscribed webhooks for a space
   */
  async emit(
    spaceId: string,
    campusId: string,
    payload: WebhookEventPayload
  ): Promise<DeliveryResult[]> {
    // Get all active webhooks for this event
    const webhooksResult = await this.webhookRepository.findActiveBySpaceAndEvent(
      spaceId,
      campusId,
      payload.type
    );

    if (webhooksResult.isFailure) {
      console.error(`Failed to fetch webhooks for event ${payload.type}:`, webhooksResult.error);
      return [];
    }

    const webhooks = webhooksResult.getValue() || [];
    if (webhooks.length === 0) {
      return [];
    }

    // Deliver to all webhooks in parallel
    const results = await Promise.all(
      webhooks.map((webhook) => this.deliverWithRetry(webhook, payload))
    );

    return results;
  }

  /**
   * Deliver to a single webhook with retry logic
   */
  async deliverWithRetry(
    webhook: Webhook,
    payload: WebhookEventPayload
  ): Promise<DeliveryResult> {
    const startTime = Date.now();
    let lastError: string | undefined;
    let lastStatusCode: number | undefined;
    let attemptCount = 0;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      attemptCount = attempt + 1;

      // Wait before retry (skip for first attempt)
      if (attempt > 0) {
        const delay = this.config.retryIntervals[attempt - 1] || this.config.retryIntervals[this.config.retryIntervals.length - 1];
        await this.sleep(delay);
      }

      const attemptResult = await this.deliverOnce({
        webhook,
        payload,
        attemptNumber: attemptCount,
        startTime,
      });

      if (attemptResult.success) {
        // Record success
        webhook.recordSuccess();
        await this.webhookRepository.save(webhook);

        const result: DeliveryResult = {
          webhookId: webhook.id,
          success: true,
          statusCode: attemptResult.statusCode,
          attemptCount,
          durationMs: Date.now() - startTime,
        };

        // Log delivery
        if (this.config.logDeliveries && this.deliveryLogRepository) {
          await this.logDelivery(webhook, payload, result);
        }

        return result;
      }

      lastError = attemptResult.error;
      lastStatusCode = attemptResult.statusCode;

      // Check if we should retry (don't retry for 4xx errors except 429)
      if (attemptResult.statusCode && attemptResult.statusCode >= 400 && attemptResult.statusCode < 500 && attemptResult.statusCode !== 429) {
        break;
      }
    }

    // All retries failed
    webhook.recordFailure(lastError || "Delivery failed after all retries");
    await this.webhookRepository.save(webhook);

    const result: DeliveryResult = {
      webhookId: webhook.id,
      success: false,
      statusCode: lastStatusCode,
      error: lastError,
      attemptCount,
      durationMs: Date.now() - startTime,
    };

    // Log failed delivery
    if (this.config.logDeliveries && this.deliveryLogRepository) {
      await this.logDelivery(webhook, payload, result);
    }

    return result;
  }

  /**
   * Deliver once without retry
   */
  private async deliverOnce(
    attempt: DeliveryAttempt
  ): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    const { webhook, payload } = attempt;

    try {
      // Create signed headers
      const headers = await createWebhookHeaders(
        payload,
        webhook.signingSecret,
        payload.type
      );

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.deliveryTimeout
      );

      try {
        const response = await fetch(webhook.url, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          return { success: true, statusCode: response.status };
        }

        // Non-2xx response
        let errorBody: string | undefined;
        try {
          errorBody = await response.text();
        } catch {
          // Ignore body read errors
        }

        return {
          success: false,
          statusCode: response.status,
          error: `HTTP ${response.status}: ${errorBody?.slice(0, 200) || response.statusText}`,
        };
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          return { success: false, error: "Request timeout" };
        }
        return { success: false, error: error.message };
      }
      return { success: false, error: "Unknown error" };
    }
  }

  /**
   * Log a delivery attempt
   */
  private async logDelivery(
    webhook: Webhook,
    payload: WebhookEventPayload,
    result: DeliveryResult
  ): Promise<void> {
    if (!this.deliveryLogRepository) return;

    const entry: DeliveryLogEntry = {
      id: crypto.randomUUID(),
      webhookId: webhook.id,
      eventId: payload.id,
      eventType: payload.type,
      spaceId: payload.spaceId,
      timestamp: new Date(),
      success: result.success,
      statusCode: result.statusCode,
      error: result.error,
      attemptCount: result.attemptCount,
      durationMs: result.durationMs,
    };

    try {
      await this.deliveryLogRepository.save(entry);
    } catch (error) {
      console.error("Failed to log webhook delivery:", error);
    }
  }

  /**
   * Get recent deliveries for a webhook
   */
  async getRecentDeliveries(
    webhookId: string,
    limit: number = 50
  ): Promise<Result<DeliveryLogEntry[]>> {
    if (!this.deliveryLogRepository) {
      return Result.ok([]);
    }

    return this.deliveryLogRepository.findByWebhookId(webhookId, limit);
  }

  /**
   * Test a webhook by sending a test event
   */
  async testWebhook(webhook: Webhook): Promise<DeliveryResult> {
    const testPayload: WebhookEventPayload = {
      id: crypto.randomUUID(),
      type: "space.created" as WebhookEventType,
      timestamp: new Date().toISOString(),
      spaceId: webhook.spaceId,
      campusId: webhook.campusId,
      apiVersion: "1.0",
      data: {
        name: "Test Space",
        handle: "test-space",
        isPublic: true,
        createdBy: "system",
      },
    } as WebhookEventPayload;

    // Deliver without updating failure count
    const startTime = Date.now();

    try {
      const headers = await createWebhookHeaders(
        testPayload,
        webhook.signingSecret,
        testPayload.type
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.deliveryTimeout
      );

      try {
        const response = await fetch(webhook.url, {
          method: "POST",
          headers,
          body: JSON.stringify(testPayload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        return {
          webhookId: webhook.id,
          success: response.ok,
          statusCode: response.status,
          error: response.ok ? undefined : `HTTP ${response.status}`,
          attemptCount: 1,
          durationMs: Date.now() - startTime,
        };
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      return {
        webhookId: webhook.id,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        attemptCount: 1,
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Sleep helper for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
