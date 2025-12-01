import { describe, it, expect, beforeEach } from 'vitest';
import { EnhancedSpace } from '../../../../domain/spaces/aggregates/enhanced-space';
import { SpaceId } from '../../../../domain/spaces/value-objects/space-id.value';
import { SpaceName } from '../../../../domain/spaces/value-objects/space-name.value';
import { SpaceDescription } from '../../../../domain/spaces/value-objects/space-description.value';
import { SpaceCategory } from '../../../../domain/spaces/value-objects/space-category.value';
import { CampusId } from '../../../../domain/profile/value-objects/campus-id.value';
import { ProfileId } from '../../../../domain/profile/value-objects/profile-id.value';
import {
  SpaceUpdatedEvent,
  TabCreatedEvent,
  TabUpdatedEvent,
  TabRemovedEvent,
  TabsReorderedEvent,
  WidgetCreatedEvent,
  WidgetUpdatedEvent,
  WidgetRemovedEvent,
  WidgetAttachedToTabEvent,
  WidgetDetachedFromTabEvent,
} from '../../../../domain/spaces/events';

/**
 * Test Utilities
 */
function createTestSpace(): EnhancedSpace {
  const spaceIdResult = SpaceId.generate(); // Use generate() for auto-generated ID
  const nameResult = SpaceName.create('Test Space');
  const descResult = SpaceDescription.create('A test space for unit testing');
  const categoryResult = SpaceCategory.create('club');
  const campusIdResult = CampusId.createUBBuffalo(); // Use factory for valid campus
  const creatorIdResult = ProfileId.create('test-user-123');

  if (
    spaceIdResult.isFailure ||
    nameResult.isFailure ||
    descResult.isFailure ||
    categoryResult.isFailure ||
    campusIdResult.isFailure ||
    creatorIdResult.isFailure
  ) {
    // Debug: Find which one failed
    const failures = [
      { name: 'spaceId', result: spaceIdResult },
      { name: 'name', result: nameResult },
      { name: 'desc', result: descResult },
      { name: 'category', result: categoryResult },
      { name: 'campusId', result: campusIdResult },
      { name: 'creatorId', result: creatorIdResult },
    ].filter(x => x.result.isFailure);

    throw new Error(
      `Failed to create test value objects: ${failures.map(f => `${f.name}: ${f.result.error}`).join(', ')}`
    );
  }

  const spaceResult = EnhancedSpace.create({
    spaceId: spaceIdResult.getValue(),
    name: nameResult.getValue(),
    description: descResult.getValue(),
    category: categoryResult.getValue(),
    campusId: campusIdResult.getValue(),
    createdBy: creatorIdResult.getValue(),
    visibility: 'public',
  });

  if (spaceResult.isFailure) {
    throw new Error(`Failed to create test space: ${spaceResult.error}`);
  }

  return spaceResult.getValue();
}

describe('EnhancedSpace Aggregate', () => {
  let space: EnhancedSpace;

  beforeEach(() => {
    space = createTestSpace();
  });

  describe('Space Creation', () => {
    it('should create a space with default feed tab', () => {
      expect(space).toBeDefined();
      expect(space.tabs).toHaveLength(1);
      expect(space.tabs[0]?.name).toBe('Feed');
      expect(space.tabs[0]?.isDefault).toBe(true);
    });

    it('should have creator as owner', () => {
      expect(space.owner.value).toBe('test-user-123');
    });

    it('should start with empty widgets', () => {
      expect(space.widgets).toHaveLength(0);
    });
  });

  // ============================================================
  // Tab Operations
  // ============================================================
  describe('Tab Operations', () => {
    describe('getTabById', () => {
      it('should return the default tab', () => {
        const defaultTab = space.tabs[0];
        expect(defaultTab).toBeDefined();

        const foundTab = space.getTabById(defaultTab!.id);
        expect(foundTab).toBe(defaultTab);
      });

      it('should return undefined for non-existent tab', () => {
        const tab = space.getTabById('non-existent-id');
        expect(tab).toBeUndefined();
      });
    });

    describe('createTab', () => {
      it('should create a new tab successfully', () => {
        const result = space.createTab({
          name: 'Resources',
          type: 'resource',
        });

        expect(result.isSuccess).toBe(true);
        expect(space.tabs).toHaveLength(2);

        const newTab = result.getValue();
        expect(newTab.name).toBe('Resources');
        expect(newTab.type).toBe('resource');
        expect(newTab.isDefault).toBe(false);
      });

      it('should emit TabCreatedEvent', () => {
        space.createTab({
          name: 'Resources',
          type: 'resource',
        });

        const events = space.domainEvents;
        const tabCreatedEvent = events.find(e => e instanceof TabCreatedEvent);
        expect(tabCreatedEvent).toBeDefined();
      });

      it('should fail when creating duplicate tab name', () => {
        space.createTab({ name: 'Resources', type: 'resource' });
        const result = space.createTab({ name: 'resources', type: 'resource' }); // case insensitive

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('already exists');
      });

      it('should auto-increment order when not provided', () => {
        const tab1 = space.createTab({ name: 'Tab 1', type: 'custom' }).getValue();
        const tab2 = space.createTab({ name: 'Tab 2', type: 'custom' }).getValue();

        expect(tab1.order).toBe(1); // After default Feed tab at 0
        expect(tab2.order).toBe(2);
      });

      it('should respect provided order', () => {
        const tab = space.createTab({ name: 'Custom Tab', type: 'custom', order: 10 }).getValue();
        expect(tab.order).toBe(10);
      });
    });

    describe('updateTab', () => {
      it('should update tab name', () => {
        const tab = space.createTab({ name: 'Old Name', type: 'custom' }).getValue();

        const result = space.updateTab(tab.id, { name: 'New Name' });

        expect(result.isSuccess).toBe(true);
        expect(tab.name).toBe('New Name');
      });

      it('should update tab order', () => {
        const tab = space.createTab({ name: 'Tab', type: 'custom' }).getValue();

        space.updateTab(tab.id, { order: 5 });

        expect(tab.order).toBe(5);
      });

      it('should update tab visibility', () => {
        const tab = space.createTab({ name: 'Tab', type: 'custom' }).getValue();

        space.updateTab(tab.id, { isVisible: false });

        expect(tab.isVisible).toBe(false);
      });

      it('should emit TabUpdatedEvent when changes made', () => {
        const tab = space.createTab({ name: 'Tab', type: 'custom' }).getValue();
        space.clearEvents(); // Clear the create event

        space.updateTab(tab.id, { name: 'Updated' });

        const events = space.domainEvents;
        const updateEvent = events.find(e => e instanceof TabUpdatedEvent);
        expect(updateEvent).toBeDefined();
      });

      it('should NOT hide the default tab', () => {
        const defaultTab = space.tabs.find(t => t.isDefault);
        expect(defaultTab).toBeDefined();

        const result = space.updateTab(defaultTab!.id, { isVisible: false });

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('Cannot hide the default tab');
      });

      it('should fail for non-existent tab', () => {
        const result = space.updateTab('non-existent', { name: 'New' });

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('not found');
      });
    });

    describe('removeTab', () => {
      it('should remove a non-default tab', () => {
        const tab = space.createTab({ name: 'Removable', type: 'custom' }).getValue();
        expect(space.tabs).toHaveLength(2);

        const result = space.removeTab(tab.id);

        expect(result.isSuccess).toBe(true);
        expect(space.tabs).toHaveLength(1);
      });

      it('should emit TabRemovedEvent', () => {
        const tab = space.createTab({ name: 'Removable', type: 'custom' }).getValue();
        space.clearEvents();

        space.removeTab(tab.id);

        const events = space.domainEvents;
        const removeEvent = events.find(e => e instanceof TabRemovedEvent);
        expect(removeEvent).toBeDefined();
      });

      it('should NOT remove the default tab', () => {
        const defaultTab = space.tabs.find(t => t.isDefault);
        expect(defaultTab).toBeDefined();

        const result = space.removeTab(defaultTab!.id);

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('Cannot remove the default tab');
      });

      it('should emit WidgetDetachedFromTabEvent for attached widgets', () => {
        // Create tab and widget
        const tab = space.createTab({ name: 'Tab With Widget', type: 'custom' }).getValue();
        const widget = space.createWidget({ type: 'links', title: 'Links' }).getValue();
        space.attachWidgetToTab(widget.id, tab.id);
        space.clearEvents();

        // Remove tab
        space.removeTab(tab.id);

        const events = space.domainEvents;
        const detachEvent = events.find(e => e instanceof WidgetDetachedFromTabEvent);
        expect(detachEvent).toBeDefined();
      });

      it('should fail for non-existent tab', () => {
        const result = space.removeTab('non-existent');

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('not found');
      });
    });

    describe('reorderTabs', () => {
      it('should reorder tabs correctly', () => {
        const tab1 = space.createTab({ name: 'Tab 1', type: 'custom' }).getValue();
        const tab2 = space.createTab({ name: 'Tab 2', type: 'custom' }).getValue();
        const defaultTab = space.tabs.find(t => t.isDefault)!;

        // New order: Tab 2, Default, Tab 1
        const result = space.reorderTabs([tab2.id, defaultTab.id, tab1.id]);

        expect(result.isSuccess).toBe(true);
        expect(space.tabs[0]?.id).toBe(tab2.id);
        expect(space.tabs[1]?.id).toBe(defaultTab.id);
        expect(space.tabs[2]?.id).toBe(tab1.id);
      });

      it('should emit TabsReorderedEvent', () => {
        const tab1 = space.createTab({ name: 'Tab 1', type: 'custom' }).getValue();
        const defaultTab = space.tabs.find(t => t.isDefault)!;
        space.clearEvents();

        space.reorderTabs([tab1.id, defaultTab.id]);

        const events = space.domainEvents;
        const reorderEvent = events.find(e => e instanceof TabsReorderedEvent);
        expect(reorderEvent).toBeDefined();
      });

      it('should fail with invalid tab ID', () => {
        const defaultTab = space.tabs.find(t => t.isDefault)!;

        const result = space.reorderTabs(['invalid-id', defaultTab.id]);

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('not found');
      });

      it('should fail if not all tabs included', () => {
        space.createTab({ name: 'Tab 1', type: 'custom' });
        const defaultTab = space.tabs.find(t => t.isDefault)!;

        const result = space.reorderTabs([defaultTab.id]); // Missing Tab 1

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('All tab IDs must be included');
      });
    });
  });

  // ============================================================
  // Widget Operations
  // ============================================================
  describe('Widget Operations', () => {
    describe('getWidgetById', () => {
      it('should return a widget by ID', () => {
        const widget = space.createWidget({ type: 'poll', title: 'Poll' }).getValue();

        const found = space.getWidgetById(widget.id);

        expect(found).toBe(widget);
      });

      it('should return undefined for non-existent widget', () => {
        const widget = space.getWidgetById('non-existent');
        expect(widget).toBeUndefined();
      });
    });

    describe('createWidget', () => {
      it('should create a widget successfully', () => {
        const result = space.createWidget({
          type: 'calendar',
          title: 'Events Calendar',
        });

        expect(result.isSuccess).toBe(true);
        expect(space.widgets).toHaveLength(1);

        const widget = result.getValue();
        expect(widget.type).toBe('calendar');
        expect(widget.title).toBe('Events Calendar');
      });

      it('should emit WidgetCreatedEvent', () => {
        space.createWidget({ type: 'links', title: 'Quick Links' });

        const events = space.domainEvents;
        const createEvent = events.find(e => e instanceof WidgetCreatedEvent);
        expect(createEvent).toBeDefined();
      });

      it('should support all widget types', () => {
        const types = ['calendar', 'poll', 'links', 'files', 'rss', 'custom'] as const;

        for (const type of types) {
          const result = space.createWidget({ type, title: `${type} widget` });
          expect(result.isSuccess).toBe(true);
        }

        expect(space.widgets).toHaveLength(types.length);
      });

      it('should auto-increment order', () => {
        const w1 = space.createWidget({ type: 'poll', title: 'Poll 1' }).getValue();
        const w2 = space.createWidget({ type: 'poll', title: 'Poll 2' }).getValue();

        expect(w1.order).toBe(0);
        expect(w2.order).toBe(1);
      });

      it('should support custom config', () => {
        const widget = space.createWidget({
          type: 'poll',
          title: 'Custom Poll',
          config: { maxVotes: 3, allowMultiple: true },
        }).getValue();

        expect(widget.config.maxVotes).toBe(3);
        expect(widget.config.allowMultiple).toBe(true);
      });
    });

    describe('updateWidget', () => {
      it('should update widget title', () => {
        const widget = space.createWidget({ type: 'poll', title: 'Old Title' }).getValue();

        const result = space.updateWidget(widget.id, { title: 'New Title' });

        expect(result.isSuccess).toBe(true);
        expect(widget.title).toBe('New Title');
      });

      it('should update widget config', () => {
        const widget = space.createWidget({ type: 'poll', title: 'Poll' }).getValue();

        space.updateWidget(widget.id, { config: { newKey: 'value' } });

        expect(widget.config.newKey).toBe('value');
      });

      it('should update widget visibility', () => {
        const widget = space.createWidget({ type: 'poll', title: 'Poll' }).getValue();

        space.updateWidget(widget.id, { isVisible: false });

        expect(widget.isVisible).toBe(false);
      });

      it('should update widget enabled state', () => {
        const widget = space.createWidget({ type: 'poll', title: 'Poll' }).getValue();

        space.updateWidget(widget.id, { isEnabled: false });

        expect(widget.isEnabled).toBe(false);
      });

      it('should emit WidgetUpdatedEvent', () => {
        const widget = space.createWidget({ type: 'poll', title: 'Poll' }).getValue();
        space.clearEvents();

        space.updateWidget(widget.id, { title: 'Updated' });

        const events = space.domainEvents;
        const updateEvent = events.find(e => e instanceof WidgetUpdatedEvent);
        expect(updateEvent).toBeDefined();
      });

      it('should fail for non-existent widget', () => {
        const result = space.updateWidget('non-existent', { title: 'New' });

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('not found');
      });
    });

    describe('removeWidget', () => {
      it('should remove a widget', () => {
        const widget = space.createWidget({ type: 'poll', title: 'Removable' }).getValue();
        expect(space.widgets).toHaveLength(1);

        const result = space.removeWidget(widget.id);

        expect(result.isSuccess).toBe(true);
        expect(space.widgets).toHaveLength(0);
      });

      it('should emit WidgetRemovedEvent', () => {
        const widget = space.createWidget({ type: 'poll', title: 'Removable' }).getValue();
        space.clearEvents();

        space.removeWidget(widget.id);

        const events = space.domainEvents;
        const removeEvent = events.find(e => e instanceof WidgetRemovedEvent);
        expect(removeEvent).toBeDefined();
      });

      it('should detach from tabs when removed', () => {
        const tab = space.createTab({ name: 'Tab', type: 'custom' }).getValue();
        const widget = space.createWidget({ type: 'poll', title: 'Poll' }).getValue();
        space.attachWidgetToTab(widget.id, tab.id);
        space.clearEvents();

        space.removeWidget(widget.id);

        // Widget should be removed from tab
        expect(tab.widgets).not.toContain(widget.id);

        // Should emit detach event
        const events = space.domainEvents;
        const detachEvent = events.find(e => e instanceof WidgetDetachedFromTabEvent);
        expect(detachEvent).toBeDefined();
      });

      it('should fail for non-existent widget', () => {
        const result = space.removeWidget('non-existent');

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('not found');
      });
    });

    describe('attachWidgetToTab', () => {
      it('should attach widget to tab', () => {
        const tab = space.createTab({ name: 'Tab', type: 'custom' }).getValue();
        const widget = space.createWidget({ type: 'poll', title: 'Poll' }).getValue();

        const result = space.attachWidgetToTab(widget.id, tab.id);

        expect(result.isSuccess).toBe(true);
        expect(tab.widgets).toContain(widget.id);
      });

      it('should emit WidgetAttachedToTabEvent', () => {
        const tab = space.createTab({ name: 'Tab', type: 'custom' }).getValue();
        const widget = space.createWidget({ type: 'poll', title: 'Poll' }).getValue();
        space.clearEvents();

        space.attachWidgetToTab(widget.id, tab.id);

        const events = space.domainEvents;
        const attachEvent = events.find(e => e instanceof WidgetAttachedToTabEvent);
        expect(attachEvent).toBeDefined();
      });

      it('should be idempotent (attaching twice is no-op)', () => {
        const tab = space.createTab({ name: 'Tab', type: 'custom' }).getValue();
        const widget = space.createWidget({ type: 'poll', title: 'Poll' }).getValue();

        space.attachWidgetToTab(widget.id, tab.id);
        space.clearEvents();

        const result = space.attachWidgetToTab(widget.id, tab.id);

        expect(result.isSuccess).toBe(true);
        expect(space.domainEvents).toHaveLength(0); // No event for no-op
      });

      it('should fail for non-existent widget', () => {
        const tab = space.createTab({ name: 'Tab', type: 'custom' }).getValue();

        const result = space.attachWidgetToTab('non-existent', tab.id);

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('Widget');
      });

      it('should fail for non-existent tab', () => {
        const widget = space.createWidget({ type: 'poll', title: 'Poll' }).getValue();

        const result = space.attachWidgetToTab(widget.id, 'non-existent');

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('Tab');
      });
    });

    describe('detachWidgetFromTab', () => {
      it('should detach widget from tab', () => {
        const tab = space.createTab({ name: 'Tab', type: 'custom' }).getValue();
        const widget = space.createWidget({ type: 'poll', title: 'Poll' }).getValue();
        space.attachWidgetToTab(widget.id, tab.id);

        const result = space.detachWidgetFromTab(widget.id, tab.id);

        expect(result.isSuccess).toBe(true);
        expect(tab.widgets).not.toContain(widget.id);
      });

      it('should emit WidgetDetachedFromTabEvent', () => {
        const tab = space.createTab({ name: 'Tab', type: 'custom' }).getValue();
        const widget = space.createWidget({ type: 'poll', title: 'Poll' }).getValue();
        space.attachWidgetToTab(widget.id, tab.id);
        space.clearEvents();

        space.detachWidgetFromTab(widget.id, tab.id);

        const events = space.domainEvents;
        const detachEvent = events.find(e => e instanceof WidgetDetachedFromTabEvent);
        expect(detachEvent).toBeDefined();
      });

      it('should be idempotent (detaching non-attached is no-op)', () => {
        const tab = space.createTab({ name: 'Tab', type: 'custom' }).getValue();
        const widget = space.createWidget({ type: 'poll', title: 'Poll' }).getValue();
        // Don't attach

        const result = space.detachWidgetFromTab(widget.id, tab.id);

        expect(result.isSuccess).toBe(true);
        expect(space.domainEvents.filter(e => e instanceof WidgetDetachedFromTabEvent)).toHaveLength(0);
      });

      it('should fail for non-existent tab', () => {
        const widget = space.createWidget({ type: 'poll', title: 'Poll' }).getValue();

        const result = space.detachWidgetFromTab(widget.id, 'non-existent');

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('Tab');
      });
    });
  });

  // ============================================================
  // Basic Info Update
  // ============================================================
  describe('updateBasicInfo', () => {
    it('should update space name', () => {
      const newName = SpaceName.create('Updated Name').getValue();

      const result = space.updateBasicInfo({ name: newName }, 'test-user-123');

      expect(result.isSuccess).toBe(true);
      expect(space.name.value).toBe('Updated Name');
    });

    it('should update space description', () => {
      const newDesc = SpaceDescription.create('New description').getValue();

      space.updateBasicInfo({ description: newDesc }, 'test-user-123');

      expect(space.description.value).toBe('New description');
    });

    it('should update visibility', () => {
      expect(space.isPublic).toBe(true);

      space.updateBasicInfo({ visibility: 'private' }, 'test-user-123');

      expect(space.isPublic).toBe(false);
    });

    it('should update settings', () => {
      space.updateBasicInfo({
        settings: { allowRSS: true, requireApproval: true },
      }, 'test-user-123');

      expect(space.settings.allowRSS).toBe(true);
      expect(space.settings.requireApproval).toBe(true);
    });

    it('should emit SpaceUpdatedEvent', () => {
      const newName = SpaceName.create('Updated').getValue();
      space.clearEvents();

      space.updateBasicInfo({ name: newName }, 'test-user-123');

      const events = space.domainEvents;
      const updateEvent = events.find(e => e instanceof SpaceUpdatedEvent);
      expect(updateEvent).toBeDefined();
    });

    it('should NOT emit event when no changes made', () => {
      space.clearEvents();

      space.updateBasicInfo({}, 'test-user-123');

      expect(space.domainEvents).toHaveLength(0);
    });

    it('should sync settings.isPublic with visibility', () => {
      space.updateBasicInfo({ visibility: 'private' }, 'test-user-123');
      expect(space.settings.isPublic).toBe(false);

      space.updateBasicInfo({ visibility: 'public' }, 'test-user-123');
      expect(space.settings.isPublic).toBe(true);
    });
  });

  // ============================================================
  // Domain Events
  // ============================================================
  describe('Domain Events', () => {
    it('should accumulate multiple events', () => {
      space.createTab({ name: 'Tab 1', type: 'custom' });
      space.createTab({ name: 'Tab 2', type: 'custom' });
      space.createWidget({ type: 'poll', title: 'Poll' });

      // Should have 3+ events (createTab x2, createWidget)
      expect(space.domainEvents.length).toBeGreaterThanOrEqual(3);
    });

    it('should clear events', () => {
      space.createTab({ name: 'Tab', type: 'custom' });
      expect(space.domainEvents.length).toBeGreaterThan(0);

      space.clearEvents();

      expect(space.domainEvents).toHaveLength(0);
    });

    it('should include correct event data', () => {
      const tab = space.createTab({ name: 'Test Tab', type: 'resource' }).getValue();

      const createEvent = space.domainEvents.find(e => e instanceof TabCreatedEvent) as TabCreatedEvent;

      expect(createEvent).toBeDefined();
      expect(createEvent.tabId).toBe(tab.id);
      expect(createEvent.tabName).toBe('Test Tab');
      expect(createEvent.tabType).toBe('resource');
    });
  });
});
