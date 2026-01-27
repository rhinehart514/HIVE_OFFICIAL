/**
 * Webhook Entity (Aggregate Root)
 *
 * Represents a webhook subscription for a space.
 * Webhooks allow external systems to receive real-time notifications
 * about events happening within a space.
 *
 * @version 1.0.0
 */

import { Entity } from "../shared/base/Entity.base";
import { Result } from "../shared/base/Result";
import type { WebhookEventType } from "./event-types";
import { isValidEventType } from "./event-types";

/**
 * Webhook status
 */
export type WebhookStatus = "active" | "paused" | "disabled";

/**
 * Webhook configuration properties
 */
export interface WebhookProps {
  /** Target URL to receive webhook payloads */
  url: string;
  /** Space this webhook belongs to */
  spaceId: string;
  /** Campus for multi-tenant isolation */
  campusId: string;
  /** Event types this webhook is subscribed to */
  events: WebhookEventType[];
  /** Current status */
  status: WebhookStatus;
  /** HMAC signing secret (encrypted at rest) */
  signingSecret: string;
  /** User who created this webhook */
  createdBy: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Optional description */
  description?: string;
  /** Consecutive failure count (for auto-disable) */
  failureCount: number;
  /** Last successful delivery timestamp */
  lastSuccessAt?: Date;
  /** Last failure timestamp */
  lastFailureAt?: Date;
  /** Last failure message */
  lastFailureMessage?: string;
}

/**
 * Properties required to create a new webhook
 */
export interface CreateWebhookProps {
  url: string;
  spaceId: string;
  campusId: string;
  events: WebhookEventType[];
  createdBy: string;
  description?: string;
}

/**
 * Webhook aggregate root
 */
export class Webhook extends Entity<WebhookProps> {
  private static readonly MAX_FAILURE_COUNT = 5;
  private static readonly MAX_EVENTS = 20;
  private static readonly URL_PATTERN = /^https:\/\/.+/;

  private constructor(props: WebhookProps, id: string) {
    super(props, id);
  }

  // ============================================
  // GETTERS
  // ============================================

  get url(): string {
    return this.props.url;
  }

  get spaceId(): string {
    return this.props.spaceId;
  }

  get campusId(): string {
    return this.props.campusId;
  }

  get events(): WebhookEventType[] {
    return [...this.props.events];
  }

  get status(): WebhookStatus {
    return this.props.status;
  }

  get signingSecret(): string {
    return this.props.signingSecret;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get failureCount(): number {
    return this.props.failureCount;
  }

  get lastSuccessAt(): Date | undefined {
    return this.props.lastSuccessAt;
  }

  get lastFailureAt(): Date | undefined {
    return this.props.lastFailureAt;
  }

  get lastFailureMessage(): string | undefined {
    return this.props.lastFailureMessage;
  }

  get isActive(): boolean {
    return this.props.status === "active";
  }

  get isHealthy(): boolean {
    return this.props.failureCount < Webhook.MAX_FAILURE_COUNT;
  }

  // ============================================
  // FACTORY
  // ============================================

  /**
   * Create a new webhook
   */
  static create(props: CreateWebhookProps, id?: string): Result<Webhook> {
    // Validate URL (must be HTTPS)
    if (!Webhook.URL_PATTERN.test(props.url)) {
      return Result.fail("Webhook URL must use HTTPS");
    }

    // Validate events
    if (!props.events || props.events.length === 0) {
      return Result.fail("At least one event type is required");
    }

    if (props.events.length > Webhook.MAX_EVENTS) {
      return Result.fail(`Maximum ${Webhook.MAX_EVENTS} event types allowed`);
    }

    // Validate each event type
    for (const event of props.events) {
      if (!isValidEventType(event)) {
        return Result.fail(`Invalid event type: ${event}`);
      }
    }

    // Generate signing secret
    const signingSecret = Webhook.generateSigningSecret();

    const webhook = new Webhook(
      {
        url: props.url,
        spaceId: props.spaceId,
        campusId: props.campusId,
        events: [...new Set(props.events)], // Dedupe
        status: "active",
        signingSecret,
        createdBy: props.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        description: props.description,
        failureCount: 0,
      },
      id || crypto.randomUUID()
    );

    return Result.ok(webhook);
  }

  /**
   * Reconstitute a webhook from persistence
   */
  static reconstitute(props: WebhookProps, id: string): Webhook {
    return new Webhook(props, id);
  }

  // ============================================
  // BEHAVIORS
  // ============================================

  /**
   * Update webhook URL
   */
  updateUrl(url: string): Result<void> {
    if (!Webhook.URL_PATTERN.test(url)) {
      return Result.fail("Webhook URL must use HTTPS");
    }

    this.props.url = url;
    this.props.updatedAt = new Date();
    // Reset failure count on URL change
    this.props.failureCount = 0;
    this.props.lastFailureAt = undefined;
    this.props.lastFailureMessage = undefined;

    return Result.ok();
  }

  /**
   * Update subscribed events
   */
  updateEvents(events: WebhookEventType[]): Result<void> {
    if (!events || events.length === 0) {
      return Result.fail("At least one event type is required");
    }

    if (events.length > Webhook.MAX_EVENTS) {
      return Result.fail(`Maximum ${Webhook.MAX_EVENTS} event types allowed`);
    }

    for (const event of events) {
      if (!isValidEventType(event)) {
        return Result.fail(`Invalid event type: ${event}`);
      }
    }

    this.props.events = [...new Set(events)];
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Update description
   */
  updateDescription(description: string | undefined): void {
    this.props.description = description;
    this.props.updatedAt = new Date();
  }

  /**
   * Pause the webhook (temporary disable)
   */
  pause(): void {
    this.props.status = "paused";
    this.props.updatedAt = new Date();
  }

  /**
   * Resume a paused webhook
   */
  resume(): Result<void> {
    if (this.props.status === "disabled") {
      return Result.fail("Cannot resume a disabled webhook. Regenerate the secret first.");
    }

    this.props.status = "active";
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Record a successful delivery
   */
  recordSuccess(): void {
    this.props.failureCount = 0;
    this.props.lastSuccessAt = new Date();
    this.props.lastFailureMessage = undefined;
    this.props.updatedAt = new Date();

    // Auto-resume if was paused due to failures
    if (this.props.status === "paused" && !this.props.lastFailureAt) {
      this.props.status = "active";
    }
  }

  /**
   * Record a failed delivery
   */
  recordFailure(message: string): void {
    this.props.failureCount += 1;
    this.props.lastFailureAt = new Date();
    this.props.lastFailureMessage = message;
    this.props.updatedAt = new Date();

    // Auto-disable after too many failures
    if (this.props.failureCount >= Webhook.MAX_FAILURE_COUNT) {
      this.props.status = "disabled";
    }
  }

  /**
   * Regenerate signing secret (also reactivates disabled webhooks)
   */
  regenerateSecret(): string {
    const newSecret = Webhook.generateSigningSecret();
    this.props.signingSecret = newSecret;
    this.props.failureCount = 0;
    this.props.status = "active";
    this.props.lastFailureAt = undefined;
    this.props.lastFailureMessage = undefined;
    this.props.updatedAt = new Date();

    return newSecret;
  }

  /**
   * Check if this webhook should receive a specific event type
   */
  shouldReceiveEvent(eventType: WebhookEventType): boolean {
    return this.isActive && this.props.events.includes(eventType);
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  /**
   * Generate a secure signing secret
   */
  private static generateSigningSecret(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // ============================================
  // SERIALIZATION
  // ============================================

  /**
   * Convert to plain object for persistence
   */
  toObject(): WebhookProps & { id: string } {
    return {
      id: this.id,
      ...this.props,
    };
  }

  /**
   * Convert to safe object for API responses (excludes secret)
   */
  toSafeObject(): Omit<WebhookProps & { id: string }, "signingSecret"> {
    const { signingSecret: _, ...rest } = this.toObject();
    return rest;
  }
}
