/**
 * Webhook Service
 *
 * Application service for managing webhook subscriptions.
 * Handles registration, validation, and lifecycle management.
 *
 * @version 1.0.0
 */

import { Result } from "../../domain/shared/base/Result";
import {
  Webhook,
  CreateWebhookProps,
  WebhookProps,
  WebhookStatus,
} from "../../domain/webhooks/webhook.entity";
import type { WebhookEventType } from "../../domain/webhooks/event-types";

/**
 * Webhook repository interface
 */
export interface IWebhookRepository {
  save(webhook: Webhook): Promise<Result<void>>;
  findById(id: string): Promise<Result<Webhook | null>>;
  findBySpaceId(spaceId: string, campusId: string): Promise<Result<Webhook[]>>;
  findActiveBySpaceAndEvent(
    spaceId: string,
    campusId: string,
    eventType: WebhookEventType
  ): Promise<Result<Webhook[]>>;
  delete(id: string): Promise<Result<void>>;
}

/**
 * Webhook service configuration
 */
export interface WebhookServiceConfig {
  maxWebhooksPerSpace: number;
  allowedUrlPatterns?: RegExp[];
  blockedUrlPatterns?: RegExp[];
}

const DEFAULT_CONFIG: WebhookServiceConfig = {
  maxWebhooksPerSpace: 10,
  blockedUrlPatterns: [
    /^https?:\/\/localhost/i,
    /^https?:\/\/127\./,
    /^https?:\/\/10\./,
    /^https?:\/\/192\.168\./,
    /^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./,
  ],
};

/**
 * Webhook service for managing webhook subscriptions
 */
export class WebhookService {
  constructor(
    private readonly repository: IWebhookRepository,
    private readonly config: WebhookServiceConfig = DEFAULT_CONFIG
  ) {}

  /**
   * Register a new webhook for a space
   */
  async registerWebhook(props: CreateWebhookProps): Promise<Result<Webhook>> {
    // Validate URL is not blocked
    const urlValidation = this.validateUrl(props.url);
    if (!urlValidation.valid) {
      return Result.fail(urlValidation.error || "Invalid URL");
    }

    // Check webhook limit for space
    const existingResult = await this.repository.findBySpaceId(
      props.spaceId,
      props.campusId
    );

    if (existingResult.isFailure) {
      return Result.fail(existingResult.error || "Failed to check existing webhooks");
    }

    const existing = existingResult.getValue() || [];
    if (existing.length >= this.config.maxWebhooksPerSpace) {
      return Result.fail(
        `Maximum webhooks per space reached (${this.config.maxWebhooksPerSpace})`
      );
    }

    // Check for duplicate URL
    if (existing.some((w) => w.url === props.url && w.status !== "disabled")) {
      return Result.fail("A webhook with this URL already exists for this space");
    }

    // Create webhook
    const webhookResult = Webhook.create(props);
    if (webhookResult.isFailure) {
      return webhookResult;
    }

    const webhook = webhookResult.getValue();

    // Save to repository
    const saveResult = await this.repository.save(webhook);
    if (saveResult.isFailure) {
      return Result.fail(saveResult.error || "Failed to save webhook");
    }

    return Result.ok(webhook);
  }

  /**
   * Get a webhook by ID
   */
  async getWebhook(webhookId: string): Promise<Result<Webhook | null>> {
    return this.repository.findById(webhookId);
  }

  /**
   * List webhooks for a space
   */
  async listWebhooks(
    spaceId: string,
    campusId: string
  ): Promise<Result<Webhook[]>> {
    return this.repository.findBySpaceId(spaceId, campusId);
  }

  /**
   * Update webhook URL
   */
  async updateUrl(webhookId: string, newUrl: string): Promise<Result<Webhook>> {
    // Validate URL
    const urlValidation = this.validateUrl(newUrl);
    if (!urlValidation.valid) {
      return Result.fail(urlValidation.error || "Invalid URL");
    }

    const webhookResult = await this.repository.findById(webhookId);
    if (webhookResult.isFailure) {
      return Result.fail(webhookResult.error || "Failed to find webhook");
    }

    const webhook = webhookResult.getValue();
    if (!webhook) {
      return Result.fail("Webhook not found");
    }

    const updateResult = webhook.updateUrl(newUrl);
    if (updateResult.isFailure) {
      return Result.fail(updateResult.error || "Failed to update URL");
    }

    const saveResult = await this.repository.save(webhook);
    if (saveResult.isFailure) {
      return Result.fail(saveResult.error || "Failed to save webhook");
    }

    return Result.ok(webhook);
  }

  /**
   * Update subscribed events
   */
  async updateEvents(
    webhookId: string,
    events: WebhookEventType[]
  ): Promise<Result<Webhook>> {
    const webhookResult = await this.repository.findById(webhookId);
    if (webhookResult.isFailure) {
      return Result.fail(webhookResult.error || "Failed to find webhook");
    }

    const webhook = webhookResult.getValue();
    if (!webhook) {
      return Result.fail("Webhook not found");
    }

    const updateResult = webhook.updateEvents(events);
    if (updateResult.isFailure) {
      return Result.fail(updateResult.error || "Failed to update events");
    }

    const saveResult = await this.repository.save(webhook);
    if (saveResult.isFailure) {
      return Result.fail(saveResult.error || "Failed to save webhook");
    }

    return Result.ok(webhook);
  }

  /**
   * Pause a webhook
   */
  async pauseWebhook(webhookId: string): Promise<Result<Webhook>> {
    const webhookResult = await this.repository.findById(webhookId);
    if (webhookResult.isFailure) {
      return Result.fail(webhookResult.error || "Failed to find webhook");
    }

    const webhook = webhookResult.getValue();
    if (!webhook) {
      return Result.fail("Webhook not found");
    }

    webhook.pause();

    const saveResult = await this.repository.save(webhook);
    if (saveResult.isFailure) {
      return Result.fail(saveResult.error || "Failed to save webhook");
    }

    return Result.ok(webhook);
  }

  /**
   * Resume a paused webhook
   */
  async resumeWebhook(webhookId: string): Promise<Result<Webhook>> {
    const webhookResult = await this.repository.findById(webhookId);
    if (webhookResult.isFailure) {
      return Result.fail(webhookResult.error || "Failed to find webhook");
    }

    const webhook = webhookResult.getValue();
    if (!webhook) {
      return Result.fail("Webhook not found");
    }

    const resumeResult = webhook.resume();
    if (resumeResult.isFailure) {
      return Result.fail(resumeResult.error || "Cannot resume webhook");
    }

    const saveResult = await this.repository.save(webhook);
    if (saveResult.isFailure) {
      return Result.fail(saveResult.error || "Failed to save webhook");
    }

    return Result.ok(webhook);
  }

  /**
   * Regenerate signing secret
   */
  async regenerateSecret(webhookId: string): Promise<Result<{ webhook: Webhook; secret: string }>> {
    const webhookResult = await this.repository.findById(webhookId);
    if (webhookResult.isFailure) {
      return Result.fail(webhookResult.error || "Failed to find webhook");
    }

    const webhook = webhookResult.getValue();
    if (!webhook) {
      return Result.fail("Webhook not found");
    }

    const newSecret = webhook.regenerateSecret();

    const saveResult = await this.repository.save(webhook);
    if (saveResult.isFailure) {
      return Result.fail(saveResult.error || "Failed to save webhook");
    }

    return Result.ok({ webhook, secret: newSecret });
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string): Promise<Result<void>> {
    const webhookResult = await this.repository.findById(webhookId);
    if (webhookResult.isFailure) {
      return Result.fail(webhookResult.error || "Failed to find webhook");
    }

    const webhook = webhookResult.getValue();
    if (!webhook) {
      return Result.fail("Webhook not found");
    }

    return this.repository.delete(webhookId);
  }

  /**
   * Get active webhooks for an event
   */
  async getWebhooksForEvent(
    spaceId: string,
    campusId: string,
    eventType: WebhookEventType
  ): Promise<Result<Webhook[]>> {
    return this.repository.findActiveBySpaceAndEvent(spaceId, campusId, eventType);
  }

  /**
   * Validate a webhook URL
   */
  private validateUrl(url: string): { valid: boolean; error?: string } {
    // Check blocked patterns
    if (this.config.blockedUrlPatterns) {
      for (const pattern of this.config.blockedUrlPatterns) {
        if (pattern.test(url)) {
          return { valid: false, error: "URL not allowed (internal/private address)" };
        }
      }
    }

    // Check allowed patterns if specified
    if (this.config.allowedUrlPatterns && this.config.allowedUrlPatterns.length > 0) {
      const matches = this.config.allowedUrlPatterns.some((pattern) =>
        pattern.test(url)
      );
      if (!matches) {
        return { valid: false, error: "URL not in allowed list" };
      }
    }

    return { valid: true };
  }
}
