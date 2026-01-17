/**
 * Element Showcase Data
 *
 * Problem-first bundles and enhanced metadata for the ChatGPT-style element showcase.
 * Organizes 14 elements into 4 bundles based on user problems they solve.
 */

import { CalendarIcon, UsersIcon, MagnifyingGlassIcon, ChartBarIcon } from '@heroicons/react/24/outline';

// Type alias for lucide compatibility
type LucideIcon = React.ComponentType<{ className?: string }>;

// ============================================================================
// Types
// ============================================================================

export interface ElementBundleDefinition {
  id: string;
  name: string;
  tagline: string;
  icon: LucideIcon;
  elements: string[];
  promptSuggestion: string;
  color: string; // Tailwind color for theming
}

export interface ElementShowcaseMetadata {
  elementId: string;
  bundle: string;
  prompts: string[]; // Sample prompts that use this element
  demoConfig: Record<string, unknown>; // Config for live preview
  shortDescription: string; // One-liner for card display
}

// ============================================================================
// Bundle Definitions (4 problem-first chunks)
// ============================================================================

export const ELEMENT_BUNDLES: Record<string, ElementBundleDefinition> = {
  'run-event': {
    id: 'run-event',
    name: 'Run an Event',
    tagline: 'From invites to reminders',
    icon: CalendarIcon,
    elements: ['date-picker', 'rsvp-button', 'countdown-timer', 'notification-center'],
    promptSuggestion: 'Build an event registration with countdown and reminders',
    color: 'amber',
  },
  'engage-members': {
    id: 'engage-members',
    name: 'Engage Members',
    tagline: 'Get your club involved',
    icon: UsersIcon,
    elements: ['poll-element', 'leaderboard', 'user-selector', 'result-list'],
    promptSuggestion: 'Create a weekly poll with live results and leaderboard',
    color: 'violet',
  },
  'organize-find': {
    id: 'organize-find',
    name: 'Organize & Find',
    tagline: 'Help members find things',
    icon: MagnifyingGlassIcon,
    elements: ['search-input', 'filter-selector', 'tag-cloud'],
    promptSuggestion: 'Build a searchable resource library with filters',
    color: 'sky',
  },
  'track-display': {
    id: 'track-display',
    name: 'Track & Display',
    tagline: 'Collect and visualize',
    icon: ChartBarIcon,
    elements: ['chart-display', 'form-builder', 'map-view'],
    promptSuggestion: 'Create a feedback form with response analytics',
    color: 'emerald',
  },
};

// Bundle order for display
export const BUNDLE_ORDER = ['run-event', 'engage-members', 'organize-find', 'track-display'];

// ============================================================================
// Element Showcase Metadata (enhanced info for each element)
// ============================================================================

export const ELEMENT_SHOWCASE_DATA: Record<string, ElementShowcaseMetadata> = {
  // === Run an Event Bundle ===
  'date-picker': {
    elementId: 'date-picker',
    bundle: 'run-event',
    shortDescription: 'Select dates and times',
    prompts: [
      'Create an event scheduler for weekly meetings',
      'Build a deadline tracker for project submissions',
    ],
    demoConfig: {
      includeTime: true,
      allowRange: false,
      placeholder: 'Pick a date',
    },
  },
  'rsvp-button': {
    elementId: 'rsvp-button',
    bundle: 'run-event',
    shortDescription: 'Event signups with capacity',
    prompts: [
      'Add RSVP tracking for our workshop',
      'Create event registration with waitlist',
    ],
    demoConfig: {
      eventName: 'Club Meeting',
      maxAttendees: 25,
      showCount: true,
      currentCount: 12,
      allowWaitlist: true,
    },
  },
  'countdown-timer': {
    elementId: 'countdown-timer',
    bundle: 'run-event',
    shortDescription: 'Live countdown to events',
    prompts: [
      'Add a countdown to our hackathon',
      'Show time remaining for applications',
    ],
    demoConfig: {
      label: 'Event starts in',
      seconds: 86400 * 3, // 3 days
      showDays: true,
    },
  },
  'notification-center': {
    elementId: 'notification-center',
    bundle: 'run-event',
    shortDescription: 'In-tool notifications',
    prompts: [
      'Add reminders for upcoming deadlines',
      'Show activity updates for my tool',
    ],
    demoConfig: {
      maxNotifications: 5,
      groupByType: true,
      notifications: [
        { type: 'reminder', message: 'Event tomorrow at 6pm', time: '2h ago' },
        { type: 'update', message: '3 new RSVPs', time: '5h ago' },
      ],
    },
  },

  // === Engage Members Bundle ===
  'poll-element': {
    elementId: 'poll-element',
    bundle: 'engage-members',
    shortDescription: 'Voting polls for decisions',
    prompts: [
      'Create a voting poll for club decisions',
      'Build a weekly suggestion poll',
    ],
    demoConfig: {
      question: 'Which event should we plan next?',
      options: ['Game night', 'Study session', 'Networking mixer', 'Workshop'],
      showResults: true,
      votes: [12, 8, 15, 6],
      totalVotes: 41,
    },
  },
  'leaderboard': {
    elementId: 'leaderboard',
    bundle: 'engage-members',
    shortDescription: 'Ranked standings with scores',
    prompts: [
      'Show top contributors this month',
      'Create a competition leaderboard',
    ],
    demoConfig: {
      maxEntries: 5,
      showRank: true,
      showScore: true,
      scoreLabel: 'points',
      entries: [
        { name: 'Alex M.', score: 2450, avatar: null },
        { name: 'Jordan K.', score: 2180, avatar: null },
        { name: 'Sam T.', score: 1920, avatar: null },
      ],
    },
  },
  'user-selector': {
    elementId: 'user-selector',
    bundle: 'engage-members',
    shortDescription: 'Pick users from the space',
    prompts: [
      'Add a member assignment selector',
      'Let users pick team members',
    ],
    demoConfig: {
      allowMultiple: true,
      showAvatars: true,
      placeholder: 'Select members...',
      selectedCount: 0,
    },
  },
  'result-list': {
    elementId: 'result-list',
    bundle: 'engage-members',
    shortDescription: 'Paginated list of items',
    prompts: [
      'Display search results in a list',
      'Show poll responses as a list',
    ],
    demoConfig: {
      itemsPerPage: 5,
      showPagination: true,
      items: [
        { title: 'Study Group - Calculus', subtitle: '5 members', status: 'active' },
        { title: 'Project Team Alpha', subtitle: '3 members', status: 'active' },
        { title: 'Research Partners', subtitle: '2 members', status: 'pending' },
      ],
    },
  },

  // === Organize & Find Bundle ===
  'search-input': {
    elementId: 'search-input',
    bundle: 'organize-find',
    shortDescription: 'Text search with autocomplete',
    prompts: [
      'Add search to find resources',
      'Create a member search tool',
    ],
    demoConfig: {
      placeholder: 'MagnifyingGlassIcon resources...',
      showSuggestions: true,
      suggestions: ['Study guides', 'Past exams', 'Lecture notes'],
    },
  },
  'filter-selector': {
    elementId: 'filter-selector',
    bundle: 'organize-find',
    shortDescription: 'Multi-select category filters',
    prompts: [
      'Add filters for resource types',
      'Let users filter by category',
    ],
    demoConfig: {
      options: [
        { value: 'document', label: 'Documents', count: 24 },
        { value: 'video', label: 'Videos', count: 12 },
        { value: 'link', label: 'Links', count: 8 },
      ],
      allowMultiple: true,
      showCounts: true,
    },
  },
  'tag-cloud': {
    elementId: 'tag-cloud',
    bundle: 'organize-find',
    shortDescription: 'Visual tag display',
    prompts: [
      'Show popular topics as tags',
      'Display skill categories',
    ],
    demoConfig: {
      maxTags: 10,
      sortBy: 'frequency',
      showCounts: true,
      tags: [
        { name: 'Programming', count: 45 },
        { name: 'Design', count: 32 },
        { name: 'Business', count: 28 },
        { name: 'Research', count: 20 },
        { name: 'Leadership', count: 15 },
      ],
    },
  },

  // === Track & Display Bundle ===
  'chart-display': {
    elementId: 'chart-display',
    bundle: 'track-display',
    shortDescription: 'Data visualization charts',
    prompts: [
      'Show attendance trends over time',
      'Visualize poll results as a chart',
    ],
    demoConfig: {
      chartType: 'bar',
      showLegend: true,
      animate: true,
      data: [
        { label: 'Jan', value: 45 },
        { label: 'Feb', value: 52 },
        { label: 'Mar', value: 48 },
        { label: 'Apr', value: 61 },
      ],
    },
  },
  'form-builder': {
    elementId: 'form-builder',
    bundle: 'track-display',
    shortDescription: 'Dynamic form creation',
    prompts: [
      'Create a feedback collection form',
      'Build a registration form',
    ],
    demoConfig: {
      fields: [
        { name: 'name', type: 'text', label: 'Your Name', required: true },
        { name: 'feedback', type: 'textarea', label: 'Feedback', required: true },
        { name: 'rating', type: 'select', label: 'Rating', options: ['1', '2', '3', '4', '5'] },
      ],
      showProgress: true,
    },
  },
  'map-view': {
    elementId: 'map-view',
    bundle: 'track-display',
    shortDescription: 'Location display on map',
    prompts: [
      'Show event location on campus',
      'Display meeting points on a map',
    ],
    demoConfig: {
      center: { lat: 37.7749, lng: -122.4194 },
      zoom: 15,
      markers: [
        { lat: 37.7749, lng: -122.4194, label: 'Meeting Point' },
      ],
    },
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all elements in a bundle
 */
export function getBundleElements(bundleId: string): ElementShowcaseMetadata[] {
  const bundle = ELEMENT_BUNDLES[bundleId];
  if (!bundle) return [];

  return bundle.elements
    .map(elementId => ELEMENT_SHOWCASE_DATA[elementId])
    .filter(Boolean);
}

/**
 * Get bundle for an element
 */
export function getElementBundle(elementId: string): ElementBundleDefinition | null {
  const metadata = ELEMENT_SHOWCASE_DATA[elementId];
  if (!metadata) return null;

  return ELEMENT_BUNDLES[metadata.bundle] || null;
}

/**
 * Get all elements across all bundles
 */
export function getAllShowcaseElements(): ElementShowcaseMetadata[] {
  return Object.values(ELEMENT_SHOWCASE_DATA);
}

/**
 * Get a random prompt suggestion for an element
 */
export function getRandomPrompt(elementId: string): string | null {
  const metadata = ELEMENT_SHOWCASE_DATA[elementId];
  if (!metadata || metadata.prompts.length === 0) return null;

  const index = Math.floor(Math.random() * metadata.prompts.length);
  return metadata.prompts[index];
}
