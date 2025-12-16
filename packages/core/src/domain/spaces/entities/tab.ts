/**
 * Tab Entity
 * Represents a tab in a space's layout
 */

import { Entity } from '../../shared/base/Entity.base';
import { Result } from '../../shared/base/Result';

interface TabProps {
  name: string;
  type: 'feed' | 'widget' | 'resource' | 'custom';
  isDefault: boolean;
  order: number;
  widgets: string[]; // Widget IDs
  isVisible: boolean;
  title: string;
  originPostId?: string;
  messageCount: number;
  createdAt: Date;
  lastActivityAt?: Date;
  expiresAt?: Date;
  isArchived: boolean;
}

export class Tab extends Entity<TabProps> {
  get name(): string {
    return this.props.name;
  }

  get type(): string {
    return this.props.type;
  }

  get isDefault(): boolean {
    return this.props.isDefault;
  }

  get order(): number {
    return this.props.order;
  }

  get widgets(): string[] {
    return this.props.widgets;
  }

  get title(): string {
    return this.props.title;
  }

  get originPostId(): string | undefined {
    return this.props.originPostId;
  }

  get messageCount(): number {
    return this.props.messageCount;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get lastActivityAt(): Date | undefined {
    return this.props.lastActivityAt;
  }

  get expiresAt(): Date | undefined {
    return this.props.expiresAt;
  }

  get isArchived(): boolean {
    return this.props.isArchived;
  }

  get isVisible(): boolean {
    return this.props.isVisible;
  }

  private constructor(props: TabProps, id?: string) {
    // SECURITY FIX: Use crypto.randomUUID() for cryptographically secure IDs
    super(props, id || `tab_${crypto.randomUUID()}`);
  }

  public static create(props: Partial<TabProps> & { name: string; type: TabProps['type'] }, id?: string): Result<Tab> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail<Tab>('Tab name is required');
    }

    const tabProps: TabProps = {
      name: props.name,
      type: props.type,
      isDefault: props.isDefault || false,
      order: props.order || 0,
      widgets: props.widgets || [],
      isVisible: props.isVisible !== undefined ? props.isVisible : true,
      title: props.title || props.name,
      originPostId: props.originPostId,
      messageCount: props.messageCount || 0,
      createdAt: props.createdAt || new Date(),
      lastActivityAt: props.lastActivityAt,
      expiresAt: props.expiresAt,
      isArchived: props.isArchived || false
    };

    return Result.ok<Tab>(new Tab(tabProps, id));
  }

  public addWidget(widgetId: string): void {
    if (!this.props.widgets.includes(widgetId)) {
      this.props.widgets.push(widgetId);
    }
  }

  public removeWidget(widgetId: string): void {
    this.props.widgets = this.props.widgets.filter(id => id !== widgetId);
  }

  public setOrder(order: number): void {
    this.props.order = order;
  }

  public setVisibility(isVisible: boolean): void {
    this.props.isVisible = isVisible;
  }

  /**
   * Update the tab name
   */
  public setName(name: string): Result<void> {
    if (!name || name.trim().length === 0) {
      return Result.fail<void>('Tab name cannot be empty');
    }
    if (name.length > 50) {
      return Result.fail<void>('Tab name cannot exceed 50 characters');
    }
    this.props.name = name.trim();
    this.props.title = name.trim(); // Keep title in sync
    return Result.ok<void>();
  }

  /**
   * Update multiple properties at once
   * Returns list of fields that were actually changed
   */
  public update(updates: {
    name?: string;
    order?: number;
    isVisible?: boolean;
  }): Result<{ changedFields: string[] }> {
    const changedFields: string[] = [];

    if (updates.name !== undefined && updates.name !== this.props.name) {
      const nameResult = this.setName(updates.name);
      if (nameResult.isFailure) {
        return Result.fail<{ changedFields: string[] }>(nameResult.error ?? 'Name update failed');
      }
      changedFields.push('name');
    }

    if (updates.order !== undefined && updates.order !== this.props.order) {
      this.setOrder(updates.order);
      changedFields.push('order');
    }

    if (updates.isVisible !== undefined && updates.isVisible !== this.props.isVisible) {
      this.setVisibility(updates.isVisible);
      changedFields.push('isVisible');
    }

    return Result.ok<{ changedFields: string[] }>({ changedFields });
  }

  /**
   * Archive the tab (soft delete)
   */
  public archive(): void {
    this.props.isArchived = true;
    this.props.isVisible = false;
  }

  /**
   * Unarchive the tab
   */
  public unarchive(): void {
    this.props.isArchived = false;
  }
}