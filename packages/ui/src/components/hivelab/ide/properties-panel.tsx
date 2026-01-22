'use client';

import { useState, useRef, useCallback } from 'react';
import { Cog6ToothIcon, HashtagIcon, ListBulletIcon, ArrowsPointingOutIcon, TrashIcon, ClipboardDocumentIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, ChevronDownIcon, ChevronRightIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { springPresets, durationSeconds } from '@hive/tokens';
import { cn } from '../../../lib/utils';
import { ArrayEditor } from './field-primitives';
import { ContextPicker } from './context-picker';
import { ConditionBuilder } from './condition-builder';
import type { CanvasElement } from './types';
import type { ContextRequirements, VisibilityCondition, ConditionGroup } from '@hive/core';

// HiveLab Dark Panel Colors (consistent with context-rail.tsx)
const PANEL_COLORS = {
  bg: 'var(--hivelab-panel, #1A1A1A)',
  bgHover: 'var(--hivelab-surface-hover, #1A1A1A)',
  bgActive: 'var(--hivelab-surface, #141414)',
  border: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
  borderEmphasis: 'var(--hivelab-border-emphasis, rgba(255, 255, 255, 0.12))',
  textPrimary: 'var(--hivelab-text-primary, #FAF9F7)',
  textSecondary: 'var(--hivelab-text-secondary, #8A8A8A)',
  textTertiary: 'var(--hivelab-text-tertiary, #5A5A5A)',
  accent: 'var(--life-gold, #D4AF37)',
  accentLight: 'rgba(212, 175, 55, 0.1)',
  error: '#f44336',
  errorLight: 'rgba(244, 67, 54, 0.1)',
  success: '#22c55e',
  successLight: 'rgba(34, 197, 94, 0.1)',
  warning: '#f59e0b',
  warningLight: 'rgba(245, 158, 11, 0.1)',
};

// Workshop tokens
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-panel)]';

// Validation shake animation
const shakeAnimation = {
  x: [0, -10, 10, -10, 10, -5, 5, -2, 2, 0],
  transition: { duration: 0.5 },
};

// Hook for arrow key nudge feedback
function useNudgeFeedback() {
  const [nudgeDirection, setNudgeDirection] = useState<'up' | 'down' | null>(null);

  const triggerNudge = useCallback((direction: 'up' | 'down') => {
    setNudgeDirection(direction);
    setTimeout(() => setNudgeDirection(null), 150);
  }, []);

  return { nudgeDirection, triggerNudge };
}

interface PropertiesPanelProps {
  selectedElement: CanvasElement | null;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
}

// Element config schemas - defines what properties each element type has
// Complete coverage for all 27 elements
const ELEMENT_SCHEMAS: Record<string, PropertySchema[]> = {
  // =============================================================================
  // UNIVERSAL ELEMENTS (15)
  // =============================================================================

  'search-input': [
    { key: 'placeholder', type: 'string', label: 'Placeholder', default: 'Search...' },
    { key: 'showSuggestions', type: 'boolean', label: 'Show Suggestions', default: true },
    { key: 'debounceMs', type: 'number', label: 'Debounce (ms)', default: 300, min: 0, max: 2000 },
  ],

  'filter-selector': [
    {
      key: 'filters',
      type: 'string-array',
      label: 'Filter Options',
      default: ['All', 'Category A', 'Category B'],
      placeholder: 'Add filter...',
      addButtonText: 'Add Filter',
      emptyMessage: 'Add filter options',
      minItems: 1,
      maxItems: 15,
    },
    { key: 'allowMultiple', type: 'boolean', label: 'Allow Multiple', default: true },
    { key: 'showCounts', type: 'boolean', label: 'Show Counts', default: false },
  ],

  'result-list': [
    { key: 'itemsPerPage', type: 'number', label: 'Items Per Page', default: 10, min: 1, max: 100 },
    { key: 'showPagination', type: 'boolean', label: 'Show Pagination', default: true },
    { key: 'cardStyle', type: 'select', label: 'Card Style', options: ['standard', 'compact', 'detailed'], default: 'standard' },
  ],

  'date-picker': [
    { key: 'includeTime', type: 'boolean', label: 'Include Time', default: false },
    { key: 'allowRange', type: 'boolean', label: 'Allow Range', default: false },
    { key: 'minDate', type: 'string', label: 'Min Date', default: '' },
    { key: 'maxDate', type: 'string', label: 'Max Date', default: '' },
  ],

  'tag-cloud': [
    {
      key: 'tags',
      type: 'string-array',
      label: 'Tags',
      default: ['Popular', 'Trending', 'New', 'Featured'],
      placeholder: 'Add tag...',
      addButtonText: 'Add Tag',
      emptyMessage: 'Add tags',
      maxItems: 50,
    },
    { key: 'maxTags', type: 'number', label: 'Max Visible', default: 50, min: 5, max: 200 },
    { key: 'sortBy', type: 'select', label: 'Sort By', options: ['frequency', 'alphabetical', 'recent'], default: 'frequency' },
    { key: 'showCounts', type: 'boolean', label: 'Show Counts', default: true },
  ],

  'map-view': [
    { key: 'defaultZoom', type: 'number', label: 'Default Zoom', default: 10, min: 1, max: 20 },
    { key: 'allowMarkers', type: 'boolean', label: 'Allow Markers', default: true },
    { key: 'showControls', type: 'boolean', label: 'Show Controls', default: true },
  ],

  'chart-display': [
    { key: 'chartType', type: 'select', label: 'Chart Type', options: ['bar', 'line', 'pie', 'area', 'doughnut'], default: 'bar' },
    { key: 'showLegend', type: 'boolean', label: 'Show Legend', default: true },
    { key: 'animate', type: 'boolean', label: 'Animate', default: true },
  ],

  'form-builder': [
    { key: 'title', type: 'string', label: 'Form Title', default: 'Form' },
    {
      key: 'fieldLabels',
      type: 'string-array',
      label: 'Form Fields',
      default: ['Name', 'Email', 'Message'],
      placeholder: 'Add field...',
      addButtonText: 'Add Field',
      emptyMessage: 'Add form fields',
      minItems: 1,
      maxItems: 20,
    },
    { key: 'submitLabel', type: 'string', label: 'Submit Button', default: 'Submit' },
    { key: 'validateOnChange', type: 'boolean', label: 'Validate On Change', default: true },
    { key: 'showProgress', type: 'boolean', label: 'Show Progress', default: false },
  ],

  'countdown-timer': [
    { key: 'label', type: 'string', label: 'Label', default: 'Time Remaining' },
    { key: 'targetDate', type: 'string', label: 'Target Date (ISO)', default: '' },
    { key: 'showDays', type: 'boolean', label: 'Show Days', default: true },
    { key: 'onComplete', type: 'string', label: 'On Complete Action', default: '' },
  ],

  'poll-element': [
    { key: 'question', type: 'string', label: 'Question', default: 'What do you think?' },
    {
      key: 'options',
      type: 'string-array',
      label: 'Poll Options',
      default: ['Option 1', 'Option 2', 'Option 3'],
      placeholder: 'Add option...',
      addButtonText: 'Add Option',
      emptyMessage: 'Add poll options',
      minItems: 2,
      maxItems: 10,
    },
    { key: 'allowMultipleVotes', type: 'boolean', label: 'Allow Multiple Votes', default: false },
    { key: 'showResults', type: 'boolean', label: 'Show Results', default: true },
    { key: 'anonymousVoting', type: 'boolean', label: 'Anonymous Voting', default: false },
  ],

  'leaderboard': [
    { key: 'title', type: 'string', label: 'Title', default: 'Leaderboard' },
    { key: 'maxEntries', type: 'number', label: 'Max Entries', default: 10, min: 3, max: 100 },
    { key: 'showRank', type: 'boolean', label: 'Show Rank', default: true },
    { key: 'showScore', type: 'boolean', label: 'Show Score', default: true },
    { key: 'scoreLabel', type: 'string', label: 'Score Label', default: 'Points' },
    { key: 'highlightTop', type: 'number', label: 'Highlight Top N', default: 3, min: 0, max: 10 },
  ],

  'notification-display': [
    { key: 'maxNotifications', type: 'number', label: 'Max Notifications', default: 10, min: 1, max: 50 },
    { key: 'groupByType', type: 'boolean', label: 'Group By Type', default: true },
    { key: 'autoMarkRead', type: 'boolean', label: 'Auto Mark Read', default: false },
  ],

  'timer': [
    { key: 'label', type: 'string', label: 'Label', default: 'Timer' },
    { key: 'showControls', type: 'boolean', label: 'Show Controls', default: true },
    { key: 'countUp', type: 'boolean', label: 'Count Up (vs Down)', default: true },
    { key: 'initialSeconds', type: 'number', label: 'Initial Seconds', default: 0, min: 0 },
  ],

  'counter': [
    { key: 'label', type: 'string', label: 'Label', default: 'Count' },
    { key: 'initialValue', type: 'number', label: 'Initial Value', default: 0 },
    { key: 'step', type: 'number', label: 'Step', default: 1, min: 1 },
    { key: 'min', type: 'number', label: 'Min Value', default: 0 },
    { key: 'max', type: 'number', label: 'Max Value', default: 999 },
    { key: 'showControls', type: 'boolean', label: 'Show +/- Buttons', default: true },
  ],

  'availability-heatmap': [
    { key: 'startHour', type: 'number', label: 'Start Hour', default: 8, min: 0, max: 23 },
    { key: 'endHour', type: 'number', label: 'End Hour', default: 22, min: 1, max: 24 },
    { key: 'timeFormat', type: 'select', label: 'Time Format', options: ['12h', '24h'], default: '12h' },
    { key: 'highlightThreshold', type: 'number', label: 'Highlight Threshold', default: 0.7, min: 0, max: 1 },
  ],

  // =============================================================================
  // CONNECTED ELEMENTS (5)
  // =============================================================================

  'event-picker': [
    { key: 'showPastEvents', type: 'boolean', label: 'Show Past Events', default: false },
    { key: 'filterByCategory', type: 'string', label: 'Filter Category', default: '' },
    { key: 'maxEvents', type: 'number', label: 'Max Events', default: 20, min: 1, max: 100 },
  ],

  'space-picker': [
    { key: 'filterByCategory', type: 'string', label: 'Filter Category', default: '' },
    { key: 'showMemberCount', type: 'boolean', label: 'Show Member Count', default: true },
  ],

  'user-selector': [
    { key: 'allowMultiple', type: 'boolean', label: 'Allow Multiple', default: false },
    { key: 'showAvatars', type: 'boolean', label: 'Show Avatars', default: true },
  ],

  'rsvp-button': [
    { key: 'eventName', type: 'string', label: 'Event Name', default: 'Event' },
    {
      key: 'responseOptions',
      type: 'string-array',
      label: 'Response Options',
      default: ['Going', 'Maybe', 'Not Going'],
      placeholder: 'Add response...',
      addButtonText: 'Add Response',
      emptyMessage: 'Add response options',
      minItems: 2,
      maxItems: 5,
    },
    { key: 'maxAttendees', type: 'number', label: 'Max Attendees', default: 100, min: 1 },
    { key: 'showCount', type: 'boolean', label: 'Show Count', default: true },
    { key: 'requireConfirmation', type: 'boolean', label: 'Require Confirmation', default: false },
    { key: 'allowWaitlist', type: 'boolean', label: 'Allow Waitlist', default: true },
  ],

  'connection-list': [
    { key: 'maxConnections', type: 'number', label: 'Max Connections', default: 10, min: 1, max: 50 },
    { key: 'showMutual', type: 'boolean', label: 'Show Mutual', default: true },
  ],

  // =============================================================================
  // SPACE ELEMENTS (7) - Leaders only
  // =============================================================================

  'member-list': [
    { key: 'maxMembers', type: 'number', label: 'Max Members', default: 20, min: 1, max: 100 },
    { key: 'showRole', type: 'boolean', label: 'Show Role', default: true },
    { key: 'showJoinDate', type: 'boolean', label: 'Show Join Date', default: false },
  ],

  'member-selector': [
    { key: 'allowMultiple', type: 'boolean', label: 'Allow Multiple', default: true },
    { key: 'filterByRole', type: 'string', label: 'Filter By Role', default: '' },
    { key: 'showAvatars', type: 'boolean', label: 'Show Avatars', default: true },
  ],

  'space-events': [
    { key: 'showPast', type: 'boolean', label: 'Show Past Events', default: false },
    { key: 'maxEvents', type: 'number', label: 'Max Events', default: 5, min: 1, max: 20 },
    { key: 'showRsvpCount', type: 'boolean', label: 'Show RSVP Count', default: true },
  ],

  'space-feed': [
    { key: 'maxPosts', type: 'number', label: 'Max Posts', default: 5, min: 1, max: 20 },
    { key: 'showEngagement', type: 'boolean', label: 'Show Engagement', default: true },
  ],

  'space-stats': [
    { key: 'showTrends', type: 'boolean', label: 'Show Trends', default: true },
  ],

  'announcement': [
    { key: 'title', type: 'string', label: 'Title', default: 'Announcement' },
    { key: 'pinned', type: 'boolean', label: 'Pinned', default: false },
    { key: 'sendNotification', type: 'boolean', label: 'Send Notification', default: true },
    { key: 'expiresAt', type: 'string', label: 'Expires At (ISO)', default: '' },
  ],

  'role-gate': [
    { key: 'fallbackMessage', type: 'string', label: 'Fallback Message', default: 'This content is restricted.' },
  ],
};

interface PropertySchema {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'array' | 'color' | 'string-array';
  label: string;
  default: unknown;
  options?: string[];
  min?: number;
  max?: number;
  // For string-array type
  placeholder?: string;
  addButtonText?: string;
  emptyMessage?: string;
  maxItems?: number;
  minItems?: number;
}

interface PropertyFieldProps {
  schema: PropertySchema;
  value: unknown;
  onChange: (value: unknown) => void;
  hasError?: boolean;
}

function PropertyField({ schema, value, onChange, hasError = false }: PropertyFieldProps) {
  const currentValue = value ?? schema.default;
  const prefersReducedMotion = useReducedMotion();
  const { nudgeDirection, triggerNudge } = useNudgeFeedback();
  const [isFocused, setIsFocused] = useState(false);

  // Handle arrow key nudge for number inputs
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (schema.type !== 'number') return;
      if (e.key === 'ArrowUp') {
        triggerNudge('up');
      } else if (e.key === 'ArrowDown') {
        triggerNudge('down');
      }
    },
    [schema.type, triggerNudge]
  );

  switch (schema.type) {
    case 'string':
      return (
        <motion.div
          animate={hasError && !prefersReducedMotion ? shakeAnimation : {}}
          className="relative"
        >
          <input
            type="text"
            value={currentValue as string}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-label={schema.label}
            aria-invalid={hasError}
            className={cn(
              'w-full rounded-lg px-3 py-2 text-sm outline-none transition-all duration-200',
              focusRing
            )}
            style={{
              backgroundColor: PANEL_COLORS.bgHover,
              border: `1px solid ${hasError ? PANEL_COLORS.error : isFocused ? PANEL_COLORS.borderEmphasis : PANEL_COLORS.border}`,
              color: PANEL_COLORS.textPrimary,
            }}
          />
          {hasError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <ExclamationCircleIcon className="h-4 w-4" style={{ color: PANEL_COLORS.error }} />
            </motion.div>
          )}
        </motion.div>
      );

    case 'number':
      return (
        <motion.div
          animate={
            hasError && !prefersReducedMotion
              ? shakeAnimation
              : nudgeDirection && !prefersReducedMotion
                ? { y: nudgeDirection === 'up' ? -2 : 2 }
                : { y: 0 }
          }
          transition={nudgeDirection ? springPresets.snappy : undefined}
          className="relative"
        >
          <input
            type="number"
            value={currentValue as number}
            min={schema.min}
            max={schema.max}
            onChange={(e) => onChange(Number(e.target.value))}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-label={schema.label}
            aria-invalid={hasError}
            aria-valuemin={schema.min}
            aria-valuemax={schema.max}
            className={cn(
              'w-full rounded-lg px-3 py-2 text-sm font-mono outline-none transition-all duration-200',
              focusRing
            )}
            style={{
              backgroundColor: PANEL_COLORS.bgHover,
              border: `1px solid ${hasError ? PANEL_COLORS.error : isFocused ? PANEL_COLORS.borderEmphasis : PANEL_COLORS.border}`,
              color: PANEL_COLORS.textPrimary,
            }}
          />
          {/* Arrow key feedback indicator */}
          <AnimatePresence>
            {nudgeDirection && !prefersReducedMotion && (
              <motion.div
                initial={{ opacity: 0, y: nudgeDirection === 'up' ? 4 : -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  'absolute right-2 top-1/2 -translate-y-1/2',
                  nudgeDirection === 'up' ? 'rotate-180' : ''
                )}
                style={{ color: PANEL_COLORS.accent }}
              >
                <ChevronDownIcon className="h-3 w-3" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      );

    case 'boolean':
      return (
        <motion.button
          type="button"
          onClick={() => onChange(!currentValue)}
          whileTap={prefersReducedMotion ? {} : { opacity: 0.8 }}
          role="switch"
          aria-checked={Boolean(currentValue)}
          aria-label={`${schema.label}: ${currentValue ? 'enabled' : 'disabled'}`}
          className="w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-200"
          style={{
            backgroundColor: Boolean(currentValue) ? PANEL_COLORS.success : PANEL_COLORS.bgActive,
          }}
        >
          {/* Track glow when on */}
          {Boolean(currentValue) && !prefersReducedMotion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              className="absolute inset-0 rounded-full blur-sm"
              style={{ backgroundColor: PANEL_COLORS.success }}
            />
          )}
          {/* Thumb with spring physics */}
          <motion.div
            animate={{
              x: Boolean(currentValue) ? 24 : 2,
              scale: Boolean(currentValue) ? 1 : 0.95,
            }}
            transition={springPresets.snappy}
            className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md z-10"
          />
          {/* Check mark inside thumb when on */}
          <AnimatePresence>
            {Boolean(currentValue) && !prefersReducedMotion && (
              <motion.svg
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ delay: 0.1 }}
                className="absolute left-[26px] top-1.5 w-3 h-3 z-20"
                style={{ color: PANEL_COLORS.success }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <polyline points="20 6 9 17 4 12" />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.button>
      );

    case 'select':
      return (
        <motion.div
          animate={hasError && !prefersReducedMotion ? shakeAnimation : {}}
        >
          <select
            value={currentValue as string}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-label={schema.label}
            aria-invalid={hasError}
            className={cn(
              'w-full rounded-lg px-3 py-2 text-sm cursor-pointer outline-none transition-all duration-200',
              focusRing
            )}
            style={{
              backgroundColor: PANEL_COLORS.bgHover,
              border: `1px solid ${hasError ? PANEL_COLORS.error : isFocused ? PANEL_COLORS.borderEmphasis : PANEL_COLORS.border}`,
              color: PANEL_COLORS.textPrimary,
            }}
          >
            {schema.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </motion.div>
      );

    case 'string-array':
      return (
        <ArrayEditor
          value={(currentValue as string[]) || []}
          onChange={(newValue) => onChange(newValue)}
          placeholder={schema.placeholder}
          addButtonText={schema.addButtonText}
          emptyMessage={schema.emptyMessage}
          maxItems={schema.maxItems}
          minItems={schema.minItems}
        />
      );

    default:
      return <span className="text-xs" style={{ color: PANEL_COLORS.textTertiary }}>Unsupported type</span>;
  }
}

function Section({
  title,
  children,
  defaultExpanded = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const prefersReducedMotion = useReducedMotion();
  const sectionId = `section-${title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div style={{ borderBottom: `1px solid ${PANEL_COLORS.border}` }}>
      <motion.button
        type="button"
        onClick={() => setExpanded(!expanded)}
        whileTap={prefersReducedMotion ? {} : { opacity: 0.8 }}
        aria-expanded={expanded}
        aria-controls={sectionId}
        className={cn(
          'flex items-center justify-between w-full px-4 py-2.5 text-left transition-colors duration-200',
          focusRing
        )}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = PANEL_COLORS.bgHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span
          className="text-[10px] font-medium uppercase tracking-wider"
          style={{ color: PANEL_COLORS.textTertiary }}
        >
          {title}
        </span>
        {/* Spring-animated chevron rotation */}
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : springPresets.snappy}
        >
          <ChevronRightIcon className="h-3.5 w-3.5" style={{ color: PANEL_COLORS.textTertiary }} />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            id={sectionId}
            initial={prefersReducedMotion ? { opacity: 1 } : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0.1 } : springPresets.gentle}
            className="overflow-hidden"
          >
            <motion.div
              initial={prefersReducedMotion ? {} : { y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { delay: 0.05, ...springPresets.snappy }
              }
              className="px-4 pb-4 space-y-3"
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PropertiesPanel({
  selectedElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
}: PropertiesPanelProps) {
  const prefersReducedMotion = useReducedMotion();

  if (!selectedElement) {
    return (
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-full text-center p-6"
      >
        <motion.div
          animate={
            prefersReducedMotion
              ? {}
              : {
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.02, 1],
                }
          }
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Cog6ToothIcon className="h-12 w-12 mb-4" style={{ color: `${PANEL_COLORS.textTertiary}50` }} />
        </motion.div>
        <h3 className="text-sm font-medium mb-1" style={{ color: PANEL_COLORS.textPrimary }}>No Selection</h3>
        <p className="text-xs" style={{ color: PANEL_COLORS.textTertiary }}>Select an element to view its properties</p>
      </motion.div>
    );
  }

  const displayName = selectedElement.elementId
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const schema = ELEMENT_SCHEMAS[selectedElement.elementId] || [];

  const updateConfig = (key: string, value: unknown) => {
    onUpdateElement(selectedElement.id, {
      config: { ...selectedElement.config, [key]: value },
    });
  };

  return (
    <motion.div
      key={selectedElement.id}
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={springPresets.snappy}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="px-4 py-4" style={{ borderBottom: `1px solid ${PANEL_COLORS.border}` }}>
        <div className="flex items-center justify-between">
          <motion.h3
            initial={prefersReducedMotion ? {} : { opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-sm font-semibold"
            style={{ color: PANEL_COLORS.textPrimary }}
          >
            {displayName}
          </motion.h3>
          <div className="flex items-center gap-1">
            <motion.button
              type="button"
              onClick={() =>
                onUpdateElement(selectedElement.id, { visible: !selectedElement.visible })
              }
              whileHover={prefersReducedMotion ? {} : { opacity: 0.9 }}
              whileTap={prefersReducedMotion ? {} : { opacity: 0.8 }}
              className={cn('p-1.5 rounded-lg transition-colors duration-200', focusRing)}
              style={{ color: PANEL_COLORS.textTertiary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = PANEL_COLORS.textPrimary;
                e.currentTarget.style.backgroundColor = PANEL_COLORS.bgHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = PANEL_COLORS.textTertiary;
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label={selectedElement.visible ? 'Hide element' : 'Show element'}
              aria-pressed={selectedElement.visible}
            >
              <AnimatePresence mode="wait">
                {selectedElement.visible ? (
                  <motion.div
                    key="visible"
                    initial={prefersReducedMotion ? {} : { scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    transition={springPresets.snappy}
                  >
                    <EyeIcon className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="hidden"
                    initial={prefersReducedMotion ? {} : { scale: 0, rotate: 90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: -90 }}
                    transition={springPresets.snappy}
                  >
                    <EyeSlashIcon className="h-4 w-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
            <motion.button
              type="button"
              onClick={() =>
                onUpdateElement(selectedElement.id, { locked: !selectedElement.locked })
              }
              whileHover={prefersReducedMotion ? {} : { opacity: 0.9 }}
              whileTap={prefersReducedMotion ? {} : { opacity: 0.8 }}
              animate={
                selectedElement.locked && !prefersReducedMotion
                  ? { rotate: [0, -5, 5, 0] }
                  : {}
              }
              transition={{ duration: 0.3 }}
              className={cn('p-1.5 rounded-lg transition-colors duration-200', focusRing)}
              style={{
                color: selectedElement.locked ? PANEL_COLORS.warning : PANEL_COLORS.textTertiary,
                backgroundColor: selectedElement.locked ? PANEL_COLORS.warningLight : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!selectedElement.locked) {
                  e.currentTarget.style.color = PANEL_COLORS.textPrimary;
                  e.currentTarget.style.backgroundColor = PANEL_COLORS.bgHover;
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedElement.locked) {
                  e.currentTarget.style.color = PANEL_COLORS.textTertiary;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              aria-label={selectedElement.locked ? 'Unlock element' : 'Lock element'}
              aria-pressed={selectedElement.locked}
            >
              <LockClosedIcon className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
        <motion.p
          initial={prefersReducedMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-xs mt-1 font-mono"
          style={{ color: PANEL_COLORS.textTertiary }}
        >
          ID: {selectedElement.id.slice(0, 20)}...
        </motion.p>
      </div>

      {/* Properties */}
      <div className="flex-1 overflow-y-auto">
        {/* Transform */}
        <Section title="Transform">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: PANEL_COLORS.textTertiary }}>X</label>
              <input
                type="number"
                value={Math.round(selectedElement.position.x)}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, {
                    position: { ...selectedElement.position, x: Number(e.target.value) },
                  })
                }
                className={cn('w-full rounded-lg px-3 py-2 text-sm font-mono outline-none transition-all duration-200', focusRing)}
                style={{
                  backgroundColor: PANEL_COLORS.bgHover,
                  border: `1px solid ${PANEL_COLORS.border}`,
                  color: PANEL_COLORS.textPrimary,
                }}
              />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: PANEL_COLORS.textTertiary }}>Y</label>
              <input
                type="number"
                value={Math.round(selectedElement.position.y)}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, {
                    position: { ...selectedElement.position, y: Number(e.target.value) },
                  })
                }
                className={cn('w-full rounded-lg px-3 py-2 text-sm font-mono outline-none transition-all duration-200', focusRing)}
                style={{
                  backgroundColor: PANEL_COLORS.bgHover,
                  border: `1px solid ${PANEL_COLORS.border}`,
                  color: PANEL_COLORS.textPrimary,
                }}
              />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: PANEL_COLORS.textTertiary }}>Width</label>
              <input
                type="number"
                min={50}
                max={2000}
                value={selectedElement.size.width}
                onChange={(e) => {
                  const value = Math.max(50, Math.min(2000, Number(e.target.value) || 50));
                  onUpdateElement(selectedElement.id, {
                    size: { ...selectedElement.size, width: value },
                  });
                }}
                className={cn('w-full rounded-lg px-3 py-2 text-sm font-mono outline-none transition-all duration-200', focusRing)}
                style={{
                  backgroundColor: PANEL_COLORS.bgHover,
                  border: `1px solid ${PANEL_COLORS.border}`,
                  color: PANEL_COLORS.textPrimary,
                }}
              />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: PANEL_COLORS.textTertiary }}>Height</label>
              <input
                type="number"
                min={30}
                max={2000}
                value={selectedElement.size.height}
                onChange={(e) => {
                  const value = Math.max(30, Math.min(2000, Number(e.target.value) || 30));
                  onUpdateElement(selectedElement.id, {
                    size: { ...selectedElement.size, height: value },
                  });
                }}
                className={cn('w-full rounded-lg px-3 py-2 text-sm font-mono outline-none transition-all duration-200', focusRing)}
                style={{
                  backgroundColor: PANEL_COLORS.bgHover,
                  border: `1px solid ${PANEL_COLORS.border}`,
                  color: PANEL_COLORS.textPrimary,
                }}
              />
            </div>
          </div>
        </Section>

        {/* Element Config */}
        {schema.length > 0 && (
          <Section title="Configuration">
            {schema.map((prop) => (
              <div key={prop.key}>
                <label className="text-xs mb-1.5 block" style={{ color: PANEL_COLORS.textTertiary }}>{prop.label}</label>
                <PropertyField
                  schema={prop}
                  value={selectedElement.config[prop.key]}
                  onChange={(value) => updateConfig(prop.key, value)}
                />
              </div>
            ))}
          </Section>
        )}

        {/* Layout */}
        <Section title="Layout" defaultExpanded={false}>
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: PANEL_COLORS.textTertiary }}>Z-Index</label>
            <input
              type="number"
              min={1}
              max={999}
              value={selectedElement.zIndex || 1}
              onChange={(e) => {
                const value = Math.max(1, Math.min(999, Number(e.target.value) || 1));
                onUpdateElement(selectedElement.id, { zIndex: value });
              }}
              className={cn('w-full rounded-lg px-3 py-2 text-sm font-mono outline-none transition-all duration-200', focusRing)}
              style={{
                backgroundColor: PANEL_COLORS.bgHover,
                border: `1px solid ${PANEL_COLORS.border}`,
                color: PANEL_COLORS.textPrimary,
              }}
            />
          </div>
        </Section>

        {/* Sprint 2: Context Requirements */}
        <Section title="Context" defaultExpanded={false}>
          <ContextPicker
            requirements={selectedElement.contextRequirements as ContextRequirements | undefined}
            onChange={(requirements) =>
              onUpdateElement(selectedElement.id, {
                contextRequirements: requirements,
              })
            }
            compact
          />
        </Section>

        {/* Sprint 2: Visibility Conditions */}
        <Section title="Visibility" defaultExpanded={false}>
          <ConditionBuilder
            conditions={selectedElement.visibilityConditions as VisibilityCondition[] | ConditionGroup | undefined}
            onChange={(conditions) =>
              onUpdateElement(selectedElement.id, {
                visibilityConditions: conditions,
              })
            }
            compact
          />
        </Section>
      </div>

      {/* Actions */}
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="px-4 py-4 space-y-2"
        style={{ borderTop: `1px solid ${PANEL_COLORS.border}` }}
      >
        <motion.button
          type="button"
          onClick={() => onDuplicateElement(selectedElement.id)}
          whileHover={prefersReducedMotion ? {} : { opacity: 0.9 }}
          whileTap={prefersReducedMotion ? {} : { opacity: 0.8 }}
          aria-label={`Duplicate ${displayName}`}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200',
            focusRing
          )}
          style={{
            backgroundColor: PANEL_COLORS.bgHover,
            color: PANEL_COLORS.textPrimary,
            border: `1px solid ${PANEL_COLORS.border}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = PANEL_COLORS.bgActive;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = PANEL_COLORS.bgHover;
          }}
        >
          <motion.div
            whileHover={prefersReducedMotion ? {} : { rotate: 15 }}
            transition={springPresets.snappy}
          >
            <ClipboardDocumentIcon className="h-4 w-4" style={{ color: PANEL_COLORS.textSecondary }} />
          </motion.div>
          Duplicate
        </motion.button>
        <motion.button
          type="button"
          onClick={() => onDeleteElement(selectedElement.id)}
          whileHover={prefersReducedMotion ? {} : { opacity: 0.9 }}
          whileTap={prefersReducedMotion ? {} : { opacity: 0.8 }}
          aria-label={`Delete ${displayName}`}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200',
            focusRing
          )}
          style={{
            backgroundColor: PANEL_COLORS.errorLight,
            color: PANEL_COLORS.error,
            border: `1px solid rgba(244, 67, 54, 0.2)`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(244, 67, 54, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = PANEL_COLORS.errorLight;
          }}
        >
          <motion.div
            whileHover={prefersReducedMotion ? {} : { rotate: -10, opacity: 0.9 }}
            transition={springPresets.snappy}
          >
            <TrashIcon className="h-4 w-4" />
          </motion.div>
          Delete
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
