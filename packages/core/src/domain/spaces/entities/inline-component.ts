/**
 * InlineComponent Entity
 * Represents a HiveLab component embedded in a chat message
 *
 * Components have:
 * - Config: Element-specific settings (poll question, countdown target, etc.)
 * - SharedState: Aggregated data visible to all users (vote counts, RSVP counts)
 * - Participants: Per-user participation records (who voted for what)
 *
 * State Model (Hybrid):
 * - Individual votes stored in participants subcollection
 * - Aggregated counts updated atomically on each vote
 * - Real-time sync via version increment + SSE
 */

import { Entity } from '../../shared/base/Entity.base';
import { Result } from '../../shared/base/Result';

export type InlineComponentType = 'poll' | 'countdown' | 'rsvp' | 'custom';

export interface PollConfig {
  question: string;
  options: string[];
  allowMultiple: boolean;
  showResults: 'always' | 'after_vote' | 'after_close';
  closesAt?: Date;
}

export interface CountdownConfig {
  title: string;
  targetDate: Date;
  showDays: boolean;
  showHours: boolean;
  showMinutes: boolean;
  showSeconds: boolean;
}

export interface RsvpConfig {
  eventId?: string;
  eventTitle: string;
  eventDate: Date;
  maxCapacity?: number;
  allowMaybe: boolean;
}

export interface CustomConfig {
  elementType: string;
  toolId: string;
  settings: Record<string, unknown>;
}

export type ComponentConfig = PollConfig | CountdownConfig | RsvpConfig | CustomConfig;

export interface SharedState {
  /** For polls: count per option */
  optionCounts?: Record<string, number>;
  /** For RSVP: counts per response */
  rsvpCounts?: {
    yes: number;
    no: number;
    maybe: number;
  };
  /** Total unique participants */
  totalResponses: number;
  /** For countdowns: time remaining (computed on read) */
  timeRemaining?: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isComplete: boolean;
  };
}

export interface ParticipantRecord {
  userId: string;
  /** For polls */
  selectedOptions?: string[];
  /** For RSVP */
  response?: 'yes' | 'no' | 'maybe';
  /** Custom data */
  data?: Record<string, unknown>;
  participatedAt: Date;
}

export interface AggregationDelta {
  /** Option being incremented (for polls) */
  incrementOption?: string;
  /** Option being decremented (if changing vote) */
  decrementOption?: string;
  /** RSVP response change */
  rsvpChange?: {
    from?: 'yes' | 'no' | 'maybe';
    to: 'yes' | 'no' | 'maybe';
  };
  /** Whether this is a new participant */
  isNewParticipant: boolean;
}

export interface ComponentDisplayState {
  componentId: string;
  elementType: string;
  config: ComponentConfig;
  aggregations: SharedState;
  userParticipation?: ParticipantRecord;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  version: number;
}

interface InlineComponentProps {
  spaceId: string;
  boardId: string;
  messageId: string;

  componentType: InlineComponentType;
  elementType: string;
  toolId: string;

  config: ComponentConfig;
  sharedState: SharedState;

  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export class InlineComponent extends Entity<InlineComponentProps> {
  get spaceId(): string {
    return this.props.spaceId;
  }

  get boardId(): string {
    return this.props.boardId;
  }

  get messageId(): string {
    return this.props.messageId;
  }

  get componentType(): InlineComponentType {
    return this.props.componentType;
  }

  get elementType(): string {
    return this.props.elementType;
  }

  get toolId(): string {
    return this.props.toolId;
  }

  get config(): ComponentConfig {
    return this.props.config;
  }

  get sharedState(): SharedState {
    return this.props.sharedState;
  }

  get isActive(): boolean {
    return this.props.isActive;
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

  get version(): number {
    return this.props.version;
  }

  private constructor(props: InlineComponentProps, id?: string) {
    super(
      props,
      id || `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Factory Methods
  // ─────────────────────────────────────────────────────────────

  /**
   * Create a poll component
   */
  public static createPoll(props: {
    spaceId: string;
    boardId: string;
    messageId: string;
    createdBy: string;
    question: string;
    options: string[];
    allowMultiple?: boolean;
    showResults?: PollConfig['showResults'];
    closesAt?: Date;
  }): Result<InlineComponent> {
    // Validate
    if (!props.question || props.question.trim().length === 0) {
      return Result.fail<InlineComponent>('Poll question is required');
    }

    if (!props.options || props.options.length < 2) {
      return Result.fail<InlineComponent>('Poll requires at least 2 options');
    }

    if (props.options.length > 10) {
      return Result.fail<InlineComponent>('Poll cannot have more than 10 options');
    }

    // Deduplicate and clean options
    const cleanedOptions = [...new Set(props.options.map(o => o.trim()).filter(o => o.length > 0))];
    if (cleanedOptions.length < 2) {
      return Result.fail<InlineComponent>('Poll requires at least 2 unique options');
    }

    const config: PollConfig = {
      question: props.question.trim(),
      options: cleanedOptions,
      allowMultiple: props.allowMultiple ?? false,
      showResults: props.showResults ?? 'always',
      closesAt: props.closesAt,
    };

    // Initialize counts to 0 for each option
    const optionCounts: Record<string, number> = {};
    cleanedOptions.forEach(opt => {
      optionCounts[opt] = 0;
    });

    return Result.ok<InlineComponent>(
      new InlineComponent({
        spaceId: props.spaceId,
        boardId: props.boardId,
        messageId: props.messageId,
        componentType: 'poll',
        elementType: 'poll-element',
        toolId: 'quick-poll',
        config,
        sharedState: {
          optionCounts,
          totalResponses: 0,
        },
        isActive: true,
        createdBy: props.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      })
    );
  }

  /**
   * Create a countdown component
   */
  public static createCountdown(props: {
    spaceId: string;
    boardId: string;
    messageId: string;
    createdBy: string;
    title: string;
    targetDate: Date;
    showDays?: boolean;
    showHours?: boolean;
    showMinutes?: boolean;
    showSeconds?: boolean;
  }): Result<InlineComponent> {
    if (!props.title || props.title.trim().length === 0) {
      return Result.fail<InlineComponent>('Countdown title is required');
    }

    if (!props.targetDate || props.targetDate <= new Date()) {
      return Result.fail<InlineComponent>('Countdown target date must be in the future');
    }

    const config: CountdownConfig = {
      title: props.title.trim(),
      targetDate: props.targetDate,
      showDays: props.showDays ?? true,
      showHours: props.showHours ?? true,
      showMinutes: props.showMinutes ?? true,
      showSeconds: props.showSeconds ?? true,
    };

    return Result.ok<InlineComponent>(
      new InlineComponent({
        spaceId: props.spaceId,
        boardId: props.boardId,
        messageId: props.messageId,
        componentType: 'countdown',
        elementType: 'countdown-timer',
        toolId: 'quick-countdown',
        config,
        sharedState: {
          totalResponses: 0,
        },
        isActive: true,
        createdBy: props.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      })
    );
  }

  /**
   * Create an RSVP component
   */
  public static createRsvp(props: {
    spaceId: string;
    boardId: string;
    messageId: string;
    createdBy: string;
    eventTitle: string;
    eventDate: Date;
    eventId?: string;
    maxCapacity?: number;
    allowMaybe?: boolean;
  }): Result<InlineComponent> {
    if (!props.eventTitle || props.eventTitle.trim().length === 0) {
      return Result.fail<InlineComponent>('Event title is required');
    }

    if (!props.eventDate) {
      return Result.fail<InlineComponent>('Event date is required');
    }

    const config: RsvpConfig = {
      eventId: props.eventId,
      eventTitle: props.eventTitle.trim(),
      eventDate: props.eventDate,
      maxCapacity: props.maxCapacity,
      allowMaybe: props.allowMaybe ?? true,
    };

    return Result.ok<InlineComponent>(
      new InlineComponent({
        spaceId: props.spaceId,
        boardId: props.boardId,
        messageId: props.messageId,
        componentType: 'rsvp',
        elementType: 'rsvp-button',
        toolId: 'quick-rsvp',
        config,
        sharedState: {
          rsvpCounts: { yes: 0, no: 0, maybe: 0 },
          totalResponses: 0,
        },
        isActive: true,
        createdBy: props.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      })
    );
  }

  /**
   * Create a custom component from deployed HiveLab tool
   */
  public static createCustom(props: {
    spaceId: string;
    boardId: string;
    messageId: string;
    createdBy: string;
    elementType: string;
    toolId: string;
    settings?: Record<string, unknown>;
  }): Result<InlineComponent> {
    if (!props.elementType) {
      return Result.fail<InlineComponent>('Element type is required');
    }

    if (!props.toolId) {
      return Result.fail<InlineComponent>('Tool ID is required');
    }

    const config: CustomConfig = {
      elementType: props.elementType,
      toolId: props.toolId,
      settings: props.settings ?? {},
    };

    return Result.ok<InlineComponent>(
      new InlineComponent({
        spaceId: props.spaceId,
        boardId: props.boardId,
        messageId: props.messageId,
        componentType: 'custom',
        elementType: props.elementType,
        toolId: props.toolId,
        config,
        sharedState: {
          totalResponses: 0,
        },
        isActive: true,
        createdBy: props.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      })
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Participation Methods
  // ─────────────────────────────────────────────────────────────

  /**
   * Record a poll vote
   * Returns the participant record and aggregation delta for atomic update
   */
  public recordPollVote(
    userId: string,
    selectedOptions: string[],
    previousVote?: ParticipantRecord
  ): Result<{
    participantRecord: ParticipantRecord;
    aggregationDelta: AggregationDelta;
  }> {
    if (this.props.componentType !== 'poll') {
      return Result.fail('This is not a poll component');
    }

    if (!this.props.isActive) {
      return Result.fail('This poll is no longer active');
    }

    const pollConfig = this.props.config as PollConfig;

    // Validate options
    const validOptions = selectedOptions.filter(opt =>
      pollConfig.options.includes(opt)
    );

    if (validOptions.length === 0) {
      return Result.fail('No valid options selected');
    }

    if (!pollConfig.allowMultiple && validOptions.length > 1) {
      return Result.fail('This poll only allows one selection');
    }

    // Check if closed
    if (pollConfig.closesAt && pollConfig.closesAt <= new Date()) {
      return Result.fail('This poll has closed');
    }

    const participantRecord: ParticipantRecord = {
      userId,
      selectedOptions: validOptions,
      participatedAt: new Date(),
    };

    const aggregationDelta: AggregationDelta = {
      isNewParticipant: !previousVote,
    };

    // If changing vote, we need to decrement old option
    if (previousVote?.selectedOptions?.length) {
      aggregationDelta.decrementOption = previousVote.selectedOptions[0];
    }

    // Increment new option
    aggregationDelta.incrementOption = validOptions[0];

    return Result.ok({ participantRecord, aggregationDelta });
  }

  /**
   * Record an RSVP response
   */
  public recordRsvp(
    userId: string,
    response: 'yes' | 'no' | 'maybe',
    previousResponse?: ParticipantRecord
  ): Result<{
    participantRecord: ParticipantRecord;
    aggregationDelta: AggregationDelta;
  }> {
    if (this.props.componentType !== 'rsvp') {
      return Result.fail('This is not an RSVP component');
    }

    if (!this.props.isActive) {
      return Result.fail('This RSVP is no longer active');
    }

    const rsvpConfig = this.props.config as RsvpConfig;

    if (response === 'maybe' && !rsvpConfig.allowMaybe) {
      return Result.fail('Maybe responses are not allowed');
    }

    // Check capacity for 'yes' responses
    if (response === 'yes' && rsvpConfig.maxCapacity) {
      const currentYes = this.props.sharedState.rsvpCounts?.yes ?? 0;
      const wasYes = previousResponse?.response === 'yes';
      if (!wasYes && currentYes >= rsvpConfig.maxCapacity) {
        return Result.fail('This event is at capacity');
      }
    }

    const participantRecord: ParticipantRecord = {
      userId,
      response,
      participatedAt: new Date(),
    };

    const aggregationDelta: AggregationDelta = {
      isNewParticipant: !previousResponse,
      rsvpChange: {
        from: previousResponse?.response,
        to: response,
      },
    };

    return Result.ok({ participantRecord, aggregationDelta });
  }

  /**
   * Record custom participation data
   */
  public recordCustomParticipation(
    userId: string,
    data: Record<string, unknown>,
    previousData?: ParticipantRecord
  ): Result<{
    participantRecord: ParticipantRecord;
    aggregationDelta: AggregationDelta;
  }> {
    if (!this.props.isActive) {
      return Result.fail('This component is no longer active');
    }

    const participantRecord: ParticipantRecord = {
      userId,
      data,
      participatedAt: new Date(),
    };

    const aggregationDelta: AggregationDelta = {
      isNewParticipant: !previousData,
    };

    return Result.ok({ participantRecord, aggregationDelta });
  }

  // ─────────────────────────────────────────────────────────────
  // State Methods
  // ─────────────────────────────────────────────────────────────

  /**
   * Get display state for rendering
   */
  public getDisplayState(userParticipation?: ParticipantRecord): ComponentDisplayState {
    return {
      componentId: this.id,
      elementType: this.props.elementType,
      config: this.props.config,
      aggregations: this.computeSharedState(),
      userParticipation,
      isActive: this.props.isActive,
      createdBy: this.props.createdBy,
      createdAt: this.props.createdAt,
      version: this.props.version,
    };
  }

  /**
   * Compute shared state (adds time remaining for countdowns)
   */
  private computeSharedState(): SharedState {
    const state = { ...this.props.sharedState };

    if (this.props.componentType === 'countdown') {
      const config = this.props.config as CountdownConfig;
      const now = new Date();
      const diff = config.targetDate.getTime() - now.getTime();

      if (diff <= 0) {
        state.timeRemaining = {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isComplete: true,
        };
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        state.timeRemaining = {
          days,
          hours,
          minutes,
          seconds,
          isComplete: false,
        };
      }
    }

    return state;
  }

  /**
   * Close the component (stop accepting responses)
   */
  public close(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  /**
   * Reactivate the component
   */
  public reactivate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  /**
   * Apply aggregation delta (used after atomic write)
   */
  public applyDelta(delta: AggregationDelta): void {
    if (delta.incrementOption && this.props.sharedState.optionCounts) {
      this.props.sharedState.optionCounts[delta.incrementOption] =
        (this.props.sharedState.optionCounts[delta.incrementOption] ?? 0) + 1;
    }

    if (delta.decrementOption && this.props.sharedState.optionCounts) {
      this.props.sharedState.optionCounts[delta.decrementOption] = Math.max(
        0,
        (this.props.sharedState.optionCounts[delta.decrementOption] ?? 0) - 1
      );
    }

    if (delta.rsvpChange && this.props.sharedState.rsvpCounts) {
      if (delta.rsvpChange.from) {
        this.props.sharedState.rsvpCounts[delta.rsvpChange.from] = Math.max(
          0,
          this.props.sharedState.rsvpCounts[delta.rsvpChange.from] - 1
        );
      }
      this.props.sharedState.rsvpCounts[delta.rsvpChange.to] += 1;
    }

    if (delta.isNewParticipant) {
      this.props.sharedState.totalResponses += 1;
    }

    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  // ─────────────────────────────────────────────────────────────
  // Serialization
  // ─────────────────────────────────────────────────────────────

  /**
   * Convert to plain object for persistence
   */
  public toDTO(): Record<string, unknown> {
    return {
      id: this.id,
      spaceId: this.props.spaceId,
      boardId: this.props.boardId,
      messageId: this.props.messageId,
      componentType: this.props.componentType,
      elementType: this.props.elementType,
      toolId: this.props.toolId,
      config: this.serializeConfig(this.props.config),
      sharedState: this.props.sharedState,
      isActive: this.props.isActive,
      createdBy: this.props.createdBy,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
      version: this.props.version,
    };
  }

  private serializeConfig(config: ComponentConfig): Record<string, unknown> {
    const serialized = { ...config } as Record<string, unknown>;

    // Convert dates to ISO strings
    if ('targetDate' in config && config.targetDate instanceof Date) {
      serialized.targetDate = config.targetDate.toISOString();
    }
    if ('eventDate' in config && config.eventDate instanceof Date) {
      serialized.eventDate = config.eventDate.toISOString();
    }
    if ('closesAt' in config && config.closesAt instanceof Date) {
      serialized.closesAt = config.closesAt.toISOString();
    }

    return serialized;
  }

  /**
   * Reconstruct from persistence
   */
  public static fromDTO(data: Record<string, unknown>): Result<InlineComponent> {
    try {
      const config = InlineComponent.deserializeConfig(
        data.componentType as InlineComponentType,
        data.config as Record<string, unknown>
      );

      return Result.ok<InlineComponent>(
        new InlineComponent(
          {
            spaceId: data.spaceId as string,
            boardId: data.boardId as string,
            messageId: data.messageId as string,
            componentType: data.componentType as InlineComponentType,
            elementType: data.elementType as string,
            toolId: data.toolId as string,
            config,
            sharedState: data.sharedState as SharedState,
            isActive: Boolean(data.isActive),
            createdBy: data.createdBy as string,
            createdAt: new Date(data.createdAt as string),
            updatedAt: new Date(data.updatedAt as string),
            version: (data.version as number) || 1,
          },
          data.id as string
        )
      );
    } catch (error) {
      return Result.fail<InlineComponent>('Failed to reconstruct InlineComponent from DTO');
    }
  }

  private static deserializeConfig(
    componentType: InlineComponentType,
    data: Record<string, unknown>
  ): ComponentConfig {
    switch (componentType) {
      case 'poll':
        return {
          question: data.question as string,
          options: data.options as string[],
          allowMultiple: Boolean(data.allowMultiple),
          showResults: (data.showResults as PollConfig['showResults']) || 'always',
          closesAt: data.closesAt ? new Date(data.closesAt as string) : undefined,
        };

      case 'countdown':
        return {
          title: data.title as string,
          targetDate: new Date(data.targetDate as string),
          showDays: Boolean(data.showDays ?? true),
          showHours: Boolean(data.showHours ?? true),
          showMinutes: Boolean(data.showMinutes ?? true),
          showSeconds: Boolean(data.showSeconds ?? true),
        };

      case 'rsvp':
        return {
          eventId: data.eventId as string | undefined,
          eventTitle: data.eventTitle as string,
          eventDate: new Date(data.eventDate as string),
          maxCapacity: data.maxCapacity as number | undefined,
          allowMaybe: Boolean(data.allowMaybe ?? true),
        };

      case 'custom':
      default:
        return {
          elementType: data.elementType as string,
          toolId: data.toolId as string,
          settings: (data.settings as Record<string, unknown>) ?? {},
        };
    }
  }
}
