/**
 * Template Repository - Firestore persistence for community templates
 *
 * Provides CRUD operations for templates stored in Firestore.
 * Also provides access to code-defined templates from TOOL_TEMPLATES.
 */

import * as admin from 'firebase-admin';
import { dbAdmin } from '../../../firebase-admin';
import { Result } from '../../shared/base/Result';
import {
  Template,
  TemplateProps,
  TemplateCategory,
  TemplateVisibility,
  TemplateComposition,
} from './template.entity';

// ============================================================================
// Types
// ============================================================================

/**
 * Firestore document structure for templates
 */
interface TemplateDocument {
  name: string;
  description: string;
  category: TemplateCategory;
  composition: TemplateComposition;
  source: 'code' | 'community' | 'featured';
  visibility: TemplateVisibility;
  creatorId: string;
  creatorName?: string;
  campusId?: string;
  tags: string[];
  isFeatured: boolean;
  usageCount: number;
  remixedFromId?: string;
  thumbnailUrl?: string;
  spaceId?: string;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

/**
 * Query options for template listing
 */
export interface TemplateQueryOptions {
  /** Filter by category */
  category?: TemplateCategory;
  /** Filter by visibility */
  visibility?: TemplateVisibility;
  /** Filter by campus (for campus-visible templates) */
  campusId?: string;
  /** Filter by creator */
  creatorId?: string;
  /** Filter by space */
  spaceId?: string;
  /** Search query (searches name and description) */
  searchQuery?: string;
  /** Filter by tags */
  tags?: string[];
  /** Only featured templates */
  featuredOnly?: boolean;
  /** Include code-defined templates */
  includeCodeTemplates?: boolean;
  /** Order by field */
  orderBy?: 'createdAt' | 'usageCount' | 'name';
  /** Order direction */
  orderDirection?: 'asc' | 'desc';
  /** Limit results */
  limit?: number;
  /** Cursor for pagination */
  cursor?: string;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  items: T[];
  hasMore: boolean;
  nextCursor?: string;
}

// ============================================================================
// Repository Interface
// ============================================================================

export interface ITemplateRepository {
  findById(id: string): Promise<Result<Template>>;
  findMany(options: TemplateQueryOptions): Promise<Result<PaginatedResult<Template>>>;
  save(template: Template): Promise<Result<void>>;
  delete(id: string): Promise<Result<void>>;
  incrementUsageCount(id: string): Promise<Result<void>>;
}

// ============================================================================
// Firebase Admin Repository Implementation
// ============================================================================

const COLLECTION_NAME = 'templates';

export class FirebaseAdminTemplateRepository implements ITemplateRepository {
  /**
   * Find a template by ID
   */
  async findById(id: string): Promise<Result<Template>> {
    try {
      // Check if it's a code-defined template first
      const codeTemplate = this.getCodeTemplateById(id);
      if (codeTemplate) {
        return Result.ok(codeTemplate);
      }

      // Otherwise, fetch from Firestore
      const docRef = dbAdmin.collection(COLLECTION_NAME).doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return Result.fail<Template>('Template not found');
      }

      const data = docSnap.data() as TemplateDocument;
      const template = this.toDomain(id, data);

      return Result.ok(template);
    } catch (error) {
      return Result.fail<Template>(`Failed to find template: ${error}`);
    }
  }

  /**
   * Find templates with filtering and pagination
   */
  async findMany(options: TemplateQueryOptions = {}): Promise<Result<PaginatedResult<Template>>> {
    try {
      const {
        category,
        visibility,
        campusId,
        creatorId,
        spaceId,
        tags,
        featuredOnly,
        includeCodeTemplates = true,
        orderBy = 'createdAt',
        orderDirection = 'desc',
        limit = 50,
        cursor,
      } = options;

      let templates: Template[] = [];

      // Get code-defined templates if requested
      if (includeCodeTemplates && !creatorId && !spaceId) {
        const codeTemplates = this.getCodeTemplates();
        templates = codeTemplates.filter(t => {
          if (category && t.category !== category) return false;
          if (featuredOnly && !t.isFeatured) return false;
          if (tags && tags.length > 0 && !tags.some(tag => t.tags.includes(tag))) return false;
          return true;
        });
      }

      // Build Firestore query
      let query: admin.firestore.Query = dbAdmin.collection(COLLECTION_NAME);

      // Apply filters
      if (category) {
        query = query.where('category', '==', category);
      }

      if (visibility) {
        query = query.where('visibility', '==', visibility);
      }

      if (creatorId) {
        query = query.where('creatorId', '==', creatorId);
      }

      if (spaceId) {
        query = query.where('spaceId', '==', spaceId);
      }

      if (featuredOnly) {
        query = query.where('isFeatured', '==', true);
      }

      if (tags && tags.length > 0) {
        // Firestore only supports array-contains for single value
        query = query.where('tags', 'array-contains', tags[0]);
      }

      // Apply ordering
      query = query.orderBy(orderBy, orderDirection);

      // Apply cursor for pagination
      if (cursor) {
        const cursorDoc = await dbAdmin.collection(COLLECTION_NAME).doc(cursor).get();
        if (cursorDoc.exists) {
          query = query.startAfter(cursorDoc);
        }
      }

      // Fetch extra for hasMore check
      query = query.limit(limit + 1);

      const snapshot = await query.get();
      const hasMore = snapshot.docs.length > limit;
      const docs = hasMore ? snapshot.docs.slice(0, limit) : snapshot.docs;

      // Convert to domain models
      for (const doc of docs) {
        const data = doc.data() as TemplateDocument;

        // Filter by visibility rules for community templates
        if (data.visibility === 'campus' && campusId && data.campusId !== campusId) {
          continue;
        }

        const template = this.toDomain(doc.id, data);
        templates.push(template);
      }

      // Filter templates by visibility for the requesting user's context
      // (additional filtering should be done at the API layer for user-specific access)

      // Get next cursor
      const nextCursor = hasMore && docs.length > 0 ? docs[docs.length - 1]?.id : undefined;

      return Result.ok({
        items: templates,
        hasMore,
        nextCursor,
      });
    } catch (error) {
      return Result.fail(`Failed to query templates: ${error}`);
    }
  }

  /**
   * Save a template (create or update)
   */
  async save(template: Template): Promise<Result<void>> {
    try {
      const data = this.toPersistence(template);
      const docRef = dbAdmin.collection(COLLECTION_NAME).doc(template.id);

      // Check if document exists
      const existing = await docRef.get();

      if (existing.exists) {
        // Update
        await docRef.update({
          ...data,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // Create
        await docRef.set({
          ...data,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to save template: ${error}`);
    }
  }

  /**
   * Delete a template
   */
  async delete(id: string): Promise<Result<void>> {
    try {
      // Don't allow deleting code templates
      if (id.startsWith('code-')) {
        return Result.fail('Cannot delete code-defined templates');
      }

      await dbAdmin.collection(COLLECTION_NAME).doc(id).delete();
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to delete template: ${error}`);
    }
  }

  /**
   * Increment usage count (atomic)
   */
  async incrementUsageCount(id: string): Promise<Result<void>> {
    try {
      // Code templates don't have persistent usage counts
      if (id.startsWith('code-')) {
        return Result.ok();
      }

      const docRef = dbAdmin.collection(COLLECTION_NAME).doc(id);
      await docRef.update({
        usageCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to increment usage count: ${error}`);
    }
  }

  // ============================================================================
  // Code-defined Templates
  // ============================================================================

  /**
   * Get all code-defined templates
   * These are hardcoded templates that are always available
   */
  private getCodeTemplates(): Template[] {
    return CODE_DEFINED_TEMPLATES.map(tpl =>
      Template.reconstitute({
        id: `code-${tpl.id}`,
        name: tpl.name,
        description: tpl.description,
        category: tpl.category,
        composition: tpl.composition,
        source: 'code',
        visibility: 'public',
        creatorId: 'system',
        creatorName: 'HIVE',
        tags: tpl.tags,
        isFeatured: true,
        usageCount: tpl.usageCount || 0,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      })
    );
  }

  /**
   * Get a code-defined template by ID
   */
  private getCodeTemplateById(id: string): Template | null {
    if (!id.startsWith('code-')) {
      return null;
    }

    const templateId = id.replace('code-', '');
    const tpl = CODE_DEFINED_TEMPLATES.find(t => t.id === templateId);

    if (!tpl) {
      return null;
    }

    return Template.reconstitute({
      id: `code-${tpl.id}`,
      name: tpl.name,
      description: tpl.description,
      category: tpl.category,
      composition: tpl.composition,
      source: 'code',
      visibility: 'public',
      creatorId: 'system',
      creatorName: 'HIVE',
      tags: tpl.tags,
      isFeatured: true,
      usageCount: tpl.usageCount || 0,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    });
  }

  // ============================================================================
  // Mappers
  // ============================================================================

  /**
   * Convert Firestore document to domain entity
   */
  private toDomain(id: string, data: TemplateDocument): Template {
    return Template.reconstitute({
      id,
      name: data.name,
      description: data.description,
      category: data.category,
      composition: data.composition,
      source: data.source,
      visibility: data.visibility,
      creatorId: data.creatorId,
      creatorName: data.creatorName,
      campusId: data.campusId,
      tags: data.tags || [],
      isFeatured: data.isFeatured || false,
      usageCount: data.usageCount || 0,
      remixedFromId: data.remixedFromId,
      thumbnailUrl: data.thumbnailUrl,
      spaceId: data.spaceId,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    });
  }

  /**
   * Convert domain entity to persistence format
   */
  private toPersistence(template: Template): Omit<TemplateDocument, 'createdAt' | 'updatedAt'> {
    const props = template.toProps();

    return {
      name: props.name,
      description: props.description,
      category: props.category,
      composition: props.composition,
      source: props.source,
      visibility: props.visibility,
      creatorId: props.creatorId,
      creatorName: props.creatorName,
      campusId: props.campusId,
      tags: props.tags,
      isFeatured: props.isFeatured,
      usageCount: props.usageCount,
      remixedFromId: props.remixedFromId,
      thumbnailUrl: props.thumbnailUrl,
      spaceId: props.spaceId,
    };
  }
}

// ============================================================================
// Code-Defined Templates
// These are the default templates that ship with HIVE
// ============================================================================

interface CodeTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  composition: TemplateComposition;
  tags: string[];
  usageCount?: number;
}

const CODE_DEFINED_TEMPLATES: CodeTemplate[] = [
  {
    id: 'quick-poll',
    name: 'Quick Poll',
    description: 'Simple poll for gathering opinions from your community',
    category: 'engagement',
    tags: ['poll', 'voting', 'engagement'],
    composition: {
      elements: [
        {
          elementId: 'poll-element',
          instanceId: 'poll-1',
          config: {
            question: 'What do you think?',
            options: ['Option A', 'Option B', 'Option C'],
            allowMultipleVotes: false,
            showResults: true,
          },
          position: { x: 0, y: 0 },
          size: { width: 12, height: 4 },
        },
      ],
      connections: [],
      layout: 'grid',
    },
    usageCount: 150,
  },
  {
    id: 'event-countdown',
    name: 'Event Countdown',
    description: 'Countdown timer with RSVP for upcoming events',
    category: 'events',
    tags: ['countdown', 'event', 'rsvp'],
    composition: {
      elements: [
        {
          elementId: 'countdown-timer',
          instanceId: 'countdown-1',
          config: {
            title: 'Event Starting In',
            showDays: true,
            showHours: true,
            showMinutes: true,
            showSeconds: true,
          },
          position: { x: 0, y: 0 },
          size: { width: 12, height: 3 },
        },
        {
          elementId: 'rsvp-button',
          instanceId: 'rsvp-1',
          config: {
            options: ['Going', 'Maybe', "Can't Go"],
            showCounts: true,
          },
          position: { x: 0, y: 3 },
          size: { width: 12, height: 2 },
        },
      ],
      connections: [],
      layout: 'grid',
    },
    usageCount: 89,
  },
  {
    id: 'sign-up-sheet',
    name: 'Sign-Up Sheet',
    description: 'Let members sign up for slots, shifts, or roles',
    category: 'organization',
    tags: ['signup', 'slots', 'scheduling'],
    composition: {
      elements: [
        {
          elementId: 'form-builder',
          instanceId: 'signup-form-1',
          config: {
            title: 'Sign Up',
            fields: [
              { type: 'text', label: 'Name', required: true },
              { type: 'select', label: 'Slot', required: true, options: ['Slot A', 'Slot B', 'Slot C'] },
            ],
          },
          position: { x: 0, y: 0 },
          size: { width: 6, height: 4 },
        },
        {
          elementId: 'result-list',
          instanceId: 'signups-list-1',
          config: {
            title: 'Signed Up',
            itemsPerPage: 10,
          },
          position: { x: 6, y: 0 },
          size: { width: 6, height: 4 },
        },
      ],
      connections: [
        {
          from: { instanceId: 'signup-form-1', output: 'submission' },
          to: { instanceId: 'signups-list-1', input: 'data' },
        },
      ],
      layout: 'grid',
    },
    usageCount: 67,
  },
  {
    id: 'engagement-dashboard',
    name: 'Engagement Dashboard',
    description: 'Track member activity and space engagement metrics',
    category: 'analytics',
    tags: ['analytics', 'dashboard', 'stats', 'leaderboard'],
    composition: {
      elements: [
        {
          elementId: 'space-stats',
          instanceId: 'stats-1',
          config: {
            showMembers: true,
            showOnline: true,
            showActivity: true,
          },
          position: { x: 0, y: 0 },
          size: { width: 4, height: 2 },
        },
        {
          elementId: 'chart-display',
          instanceId: 'chart-1',
          config: {
            type: 'line',
            title: 'Weekly Activity',
          },
          position: { x: 4, y: 0 },
          size: { width: 8, height: 3 },
        },
        {
          elementId: 'leaderboard',
          instanceId: 'leaderboard-1',
          config: {
            title: 'Top Contributors',
            maxEntries: 5,
          },
          position: { x: 0, y: 3 },
          size: { width: 6, height: 3 },
        },
      ],
      connections: [],
      layout: 'grid',
    },
    usageCount: 45,
  },
  {
    id: 'announcement-board',
    name: 'Announcement Board',
    description: 'Pin important updates and announcements for your community',
    category: 'communication',
    tags: ['announcements', 'updates', 'news'],
    composition: {
      elements: [
        {
          elementId: 'announcement',
          instanceId: 'announce-1',
          config: {
            maxItems: 5,
            showTimestamp: true,
            allowPin: true,
          },
          position: { x: 0, y: 0 },
          size: { width: 12, height: 5 },
        },
      ],
      connections: [],
      layout: 'grid',
    },
    usageCount: 112,
  },
  {
    id: 'study-session-organizer',
    name: 'Study Session Organizer',
    description: 'Organize study sessions with countdown and attendance',
    category: 'academic',
    tags: ['study', 'academic', 'timer', 'attendance'],
    composition: {
      elements: [
        {
          elementId: 'countdown-timer',
          instanceId: 'session-timer-1',
          config: {
            title: 'Study Session',
            duration: 3600,
            showControls: true,
          },
          position: { x: 0, y: 0 },
          size: { width: 6, height: 2 },
        },
        {
          elementId: 'member-list',
          instanceId: 'attendees-1',
          config: {
            title: 'Attendees',
            maxVisible: 8,
            showOnlineStatus: true,
          },
          position: { x: 6, y: 0 },
          size: { width: 6, height: 4 },
        },
        {
          elementId: 'poll-element',
          instanceId: 'topic-poll-1',
          config: {
            question: "What should we focus on?",
            options: ['Topic 1', 'Topic 2', 'Review'],
            allowMultipleVotes: true,
          },
          position: { x: 0, y: 2 },
          size: { width: 6, height: 3 },
        },
      ],
      connections: [],
      layout: 'grid',
    },
    usageCount: 34,
  },
  {
    id: 'icebreaker-game',
    name: 'Icebreaker Game',
    description: 'Fun icebreaker with random questions and voting',
    category: 'social',
    tags: ['icebreaker', 'game', 'social', 'fun'],
    composition: {
      elements: [
        {
          elementId: 'counter',
          instanceId: 'round-counter-1',
          config: {
            title: 'Round',
            min: 1,
            max: 10,
          },
          position: { x: 0, y: 0 },
          size: { width: 4, height: 2 },
        },
        {
          elementId: 'poll-element',
          instanceId: 'question-1',
          config: {
            question: 'Two truths and a lie - which is the lie?',
            options: ['Statement A', 'Statement B', 'Statement C'],
            showResults: false,
          },
          position: { x: 4, y: 0 },
          size: { width: 8, height: 3 },
        },
        {
          elementId: 'leaderboard',
          instanceId: 'scores-1',
          config: {
            title: 'Scores',
            maxEntries: 10,
          },
          position: { x: 0, y: 3 },
          size: { width: 12, height: 3 },
        },
      ],
      connections: [],
      layout: 'grid',
    },
    usageCount: 56,
  },
  {
    id: 'task-tracker',
    name: 'Task Tracker',
    description: 'Track tasks and assignments with progress indicators',
    category: 'productivity',
    tags: ['tasks', 'productivity', 'checklist'],
    composition: {
      elements: [
        {
          elementId: 'form-builder',
          instanceId: 'task-form-1',
          config: {
            title: 'Add Task',
            fields: [
              { type: 'text', label: 'Task', required: true },
              { type: 'select', label: 'Priority', options: ['High', 'Medium', 'Low'] },
              { type: 'date', label: 'Due Date' },
            ],
          },
          position: { x: 0, y: 0 },
          size: { width: 5, height: 4 },
        },
        {
          elementId: 'result-list',
          instanceId: 'task-list-1',
          config: {
            title: 'Tasks',
            itemsPerPage: 10,
            showCheckbox: true,
          },
          position: { x: 5, y: 0 },
          size: { width: 7, height: 6 },
        },
      ],
      connections: [
        {
          from: { instanceId: 'task-form-1', output: 'submission' },
          to: { instanceId: 'task-list-1', input: 'data' },
        },
      ],
      layout: 'grid',
    },
    usageCount: 78,
  },
  // === NEW TEMPLATES ===
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Capture and share meeting notes with action items',
    category: 'productivity',
    tags: ['meetings', 'notes', 'organization'],
    composition: {
      elements: [
        {
          elementId: 'form-builder',
          instanceId: 'notes-form-1',
          config: {
            title: 'Add Note',
            fields: [
              { type: 'text', label: 'Topic', required: true },
              { type: 'textarea', label: 'Notes', required: true },
              { type: 'select', label: 'Type', options: ['Discussion', 'Action Item', 'Decision', 'Question'] },
              { type: 'text', label: 'Assigned To' },
            ],
          },
          position: { x: 0, y: 0 },
          size: { width: 5, height: 5 },
        },
        {
          elementId: 'result-list',
          instanceId: 'notes-list-1',
          config: {
            title: 'Meeting Notes',
            itemsPerPage: 15,
            groupBy: 'type',
          },
          position: { x: 5, y: 0 },
          size: { width: 7, height: 6 },
        },
      ],
      connections: [
        {
          from: { instanceId: 'notes-form-1', output: 'submission' },
          to: { instanceId: 'notes-list-1', input: 'data' },
        },
      ],
      layout: 'grid',
    },
    usageCount: 42,
  },
  {
    id: 'weekly-standup',
    name: 'Weekly Standup',
    description: 'Run team standups with timer and participation tracking',
    category: 'organization',
    tags: ['standup', 'meetings', 'team', 'timer'],
    composition: {
      elements: [
        {
          elementId: 'countdown-timer',
          instanceId: 'standup-timer-1',
          config: {
            title: 'Time Remaining',
            duration: 120,
            showControls: true,
            onComplete: 'next',
          },
          position: { x: 0, y: 0 },
          size: { width: 4, height: 2 },
        },
        {
          elementId: 'counter',
          instanceId: 'speaker-counter-1',
          config: {
            title: 'Current Speaker',
            min: 1,
            showControls: true,
          },
          position: { x: 4, y: 0 },
          size: { width: 4, height: 2 },
        },
        {
          elementId: 'form-builder',
          instanceId: 'update-form-1',
          config: {
            title: 'Quick Update',
            fields: [
              { type: 'textarea', label: 'What I did', required: true },
              { type: 'textarea', label: 'What I\'m working on' },
              { type: 'textarea', label: 'Blockers' },
            ],
          },
          position: { x: 8, y: 0 },
          size: { width: 4, height: 4 },
        },
        {
          elementId: 'leaderboard',
          instanceId: 'participation-1',
          config: {
            title: 'Participation',
            maxEntries: 10,
            scoreLabel: 'Updates',
          },
          position: { x: 0, y: 2 },
          size: { width: 8, height: 4 },
        },
      ],
      connections: [],
      layout: 'grid',
    },
    usageCount: 28,
  },
  {
    id: 'resource-library',
    name: 'Resource Library',
    description: 'Curated collection of links and resources for your community',
    category: 'productivity',
    tags: ['resources', 'links', 'library', 'knowledge'],
    composition: {
      elements: [
        {
          elementId: 'search-input',
          instanceId: 'resource-search-1',
          config: {
            placeholder: 'Search resources...',
            showSuggestions: true,
          },
          position: { x: 0, y: 0 },
          size: { width: 8, height: 1 },
        },
        {
          elementId: 'filter-selector',
          instanceId: 'resource-filter-1',
          config: {
            options: [
              { value: 'all', label: 'All' },
              { value: 'docs', label: 'Documents' },
              { value: 'videos', label: 'Videos' },
              { value: 'tools', label: 'Tools' },
              { value: 'guides', label: 'Guides' },
            ],
            allowMultiple: true,
          },
          position: { x: 8, y: 0 },
          size: { width: 4, height: 1 },
        },
        {
          elementId: 'result-list',
          instanceId: 'resource-list-1',
          config: {
            title: 'Resources',
            itemsPerPage: 20,
            showCategory: true,
          },
          position: { x: 0, y: 1 },
          size: { width: 12, height: 5 },
        },
      ],
      connections: [
        {
          from: { instanceId: 'resource-search-1', output: 'query' },
          to: { instanceId: 'resource-list-1', input: 'searchQuery' },
        },
        {
          from: { instanceId: 'resource-filter-1', output: 'selectedFilters' },
          to: { instanceId: 'resource-list-1', input: 'filters' },
        },
      ],
      layout: 'grid',
    },
    usageCount: 63,
  },
  {
    id: 'qa-board',
    name: 'Q&A Board',
    description: 'Community Q&A with upvoting and answers',
    category: 'engagement',
    tags: ['qa', 'questions', 'answers', 'community'],
    composition: {
      elements: [
        {
          elementId: 'form-builder',
          instanceId: 'question-form-1',
          config: {
            title: 'Ask a Question',
            fields: [
              { type: 'text', label: 'Question', required: true },
              { type: 'textarea', label: 'Details' },
              { type: 'select', label: 'Category', options: ['General', 'Technical', 'Events', 'Other'] },
            ],
          },
          position: { x: 0, y: 0 },
          size: { width: 5, height: 4 },
        },
        {
          elementId: 'result-list',
          instanceId: 'questions-list-1',
          config: {
            title: 'Questions',
            itemsPerPage: 10,
            sortBy: 'votes',
            showVoting: true,
          },
          position: { x: 5, y: 0 },
          size: { width: 7, height: 6 },
        },
      ],
      connections: [
        {
          from: { instanceId: 'question-form-1', output: 'submission' },
          to: { instanceId: 'questions-list-1', input: 'data' },
        },
      ],
      layout: 'grid',
    },
    usageCount: 47,
  },
  {
    id: 'birthday-tracker',
    name: 'Birthday Tracker',
    description: 'Never miss a birthday in your community',
    category: 'social',
    tags: ['birthday', 'celebration', 'community'],
    composition: {
      elements: [
        {
          elementId: 'countdown-timer',
          instanceId: 'next-birthday-1',
          config: {
            title: 'Next Birthday',
            showDays: true,
            showHours: false,
            showMinutes: false,
            showSeconds: false,
          },
          position: { x: 0, y: 0 },
          size: { width: 6, height: 2 },
        },
        {
          elementId: 'form-builder',
          instanceId: 'birthday-form-1',
          config: {
            title: 'Add Birthday',
            fields: [
              { type: 'text', label: 'Name', required: true },
              { type: 'date', label: 'Birthday', required: true },
            ],
          },
          position: { x: 6, y: 0 },
          size: { width: 6, height: 2 },
        },
        {
          elementId: 'result-list',
          instanceId: 'birthday-list-1',
          config: {
            title: 'Upcoming Birthdays',
            itemsPerPage: 10,
            sortBy: 'date',
          },
          position: { x: 0, y: 2 },
          size: { width: 12, height: 4 },
        },
      ],
      connections: [
        {
          from: { instanceId: 'birthday-form-1', output: 'submission' },
          to: { instanceId: 'birthday-list-1', input: 'data' },
        },
      ],
      layout: 'grid',
    },
    usageCount: 31,
  },
  {
    id: 'goal-tracker',
    name: 'Goal Tracker',
    description: 'Track community or personal goals with progress',
    category: 'productivity',
    tags: ['goals', 'progress', 'tracking', 'achievement'],
    composition: {
      elements: [
        {
          elementId: 'counter',
          instanceId: 'goal-progress-1',
          config: {
            title: 'Progress',
            min: 0,
            max: 100,
            showProgress: true,
            suffix: '%',
          },
          position: { x: 0, y: 0 },
          size: { width: 6, height: 3 },
        },
        {
          elementId: 'chart-display',
          instanceId: 'progress-chart-1',
          config: {
            type: 'line',
            title: 'Progress Over Time',
          },
          position: { x: 6, y: 0 },
          size: { width: 6, height: 3 },
        },
        {
          elementId: 'leaderboard',
          instanceId: 'contributors-1',
          config: {
            title: 'Top Contributors',
            maxEntries: 5,
            scoreLabel: 'Contributions',
          },
          position: { x: 0, y: 3 },
          size: { width: 6, height: 3 },
        },
        {
          elementId: 'result-list',
          instanceId: 'milestones-1',
          config: {
            title: 'Milestones',
            itemsPerPage: 5,
            showCheckbox: true,
          },
          position: { x: 6, y: 3 },
          size: { width: 6, height: 3 },
        },
      ],
      connections: [],
      layout: 'grid',
    },
    usageCount: 39,
  },
  {
    id: 'feedback-collector',
    name: 'Feedback Collector',
    description: 'Gather and visualize feedback from your community',
    category: 'engagement',
    tags: ['feedback', 'survey', 'ratings', 'insights'],
    composition: {
      elements: [
        {
          elementId: 'form-builder',
          instanceId: 'feedback-form-1',
          config: {
            title: 'Share Feedback',
            fields: [
              { type: 'select', label: 'Rating', options: ['5 - Excellent', '4 - Good', '3 - Average', '2 - Poor', '1 - Bad'], required: true },
              { type: 'textarea', label: 'Comments', required: true },
              { type: 'select', label: 'Category', options: ['Events', 'Communication', 'Activities', 'General'] },
            ],
          },
          position: { x: 0, y: 0 },
          size: { width: 5, height: 4 },
        },
        {
          elementId: 'chart-display',
          instanceId: 'rating-chart-1',
          config: {
            type: 'bar',
            title: 'Rating Distribution',
          },
          position: { x: 5, y: 0 },
          size: { width: 7, height: 3 },
        },
        {
          elementId: 'result-list',
          instanceId: 'feedback-list-1',
          config: {
            title: 'Recent Feedback',
            itemsPerPage: 5,
          },
          position: { x: 5, y: 3 },
          size: { width: 7, height: 3 },
        },
      ],
      connections: [
        {
          from: { instanceId: 'feedback-form-1', output: 'submission' },
          to: { instanceId: 'feedback-list-1', input: 'data' },
        },
      ],
      layout: 'grid',
    },
    usageCount: 52,
  },
];

// ============================================================================
// Singleton Instance
// ============================================================================

let templateRepositoryInstance: FirebaseAdminTemplateRepository | null = null;

/**
 * Get the server-side Template Repository instance
 */
export function getServerTemplateRepository(): ITemplateRepository {
  if (!templateRepositoryInstance) {
    templateRepositoryInstance = new FirebaseAdminTemplateRepository();
  }
  return templateRepositoryInstance;
}

/**
 * Reset the repository instance (for testing)
 */
export function resetServerTemplateRepository(): void {
  templateRepositoryInstance = null;
}
