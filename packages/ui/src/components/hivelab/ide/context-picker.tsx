'use client';

/**
 * ContextPicker - IDE Panel for selecting context fields
 *
 * Allows tool creators to specify which context fields an element requires:
 * - Space context (spaceId, spaceName, memberCount, etc.)
 * - Member context (userId, role, tenure, permissions)
 * - Temporal context (dayOfWeek, isWeekend, isEvening, etc.)
 *
 * @version 1.0.0 - HiveLab Sprint 2 (Jan 2026)
 */

import { useState, useCallback } from 'react';
import {
  BuildingOffice2Icon,
  UserGroupIcon,
  ClockIcon,
  ChevronRightIcon,
  CheckIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { springPresets } from '@hive/tokens';
import { cn } from '../../../lib/utils';
import type { ContextRequirements, ContextFieldPath } from '@hive/core';

// HiveLab Dark Panel Colors (consistent with properties-panel.tsx)
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
  success: '#22c55e',
  successLight: 'rgba(34, 197, 94, 0.1)',
  info: '#3b82f6',
  infoLight: 'rgba(59, 130, 246, 0.1)',
};

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-panel)]';

// ============================================================================
// Context Field Definitions
// ============================================================================

interface ContextFieldDef {
  path: ContextFieldPath;
  label: string;
  description: string;
  type: 'string' | 'number' | 'boolean';
  example: string;
}

interface ContextCategoryDef {
  id: 'space' | 'member' | 'temporal' | 'capabilities';
  label: string;
  description: string;
  icon: typeof BuildingOffice2Icon;
  fields: ContextFieldDef[];
  requiresSpace?: boolean;
}

const CONTEXT_CATEGORIES: ContextCategoryDef[] = [
  {
    id: 'space',
    label: 'Space',
    description: 'Information about the space where the tool is deployed',
    icon: BuildingOffice2Icon,
    requiresSpace: true,
    fields: [
      {
        path: 'space.spaceId',
        label: 'Space ID',
        description: 'Unique identifier for the space',
        type: 'string',
        example: 'space_abc123',
      },
      {
        path: 'space.spaceName',
        label: 'Space Name',
        description: 'Display name of the space',
        type: 'string',
        example: 'Computer Science Club',
      },
      {
        path: 'space.memberCount',
        label: 'Member Count',
        description: 'Total number of space members',
        type: 'number',
        example: '156',
      },
      {
        path: 'space.onlineCount',
        label: 'Online Count',
        description: 'Currently active members',
        type: 'number',
        example: '12',
      },
      {
        path: 'space.category',
        label: 'Category',
        description: 'Space category (club, academic, social, etc.)',
        type: 'string',
        example: 'academic',
      },
      {
        path: 'space.isVerified',
        label: 'Is Verified',
        description: 'Whether the space is officially verified',
        type: 'boolean',
        example: 'true',
      },
      {
        path: 'space.brand.primaryColor',
        label: 'Brand Color',
        description: 'Primary brand color (hex)',
        type: 'string',
        example: '#D4AF37',
      },
    ],
  },
  {
    id: 'member',
    label: 'Member',
    description: "Current user's membership information",
    icon: UserGroupIcon,
    requiresSpace: true,
    fields: [
      {
        path: 'member.userId',
        label: 'User ID',
        description: "Current user's unique identifier",
        type: 'string',
        example: 'user_xyz789',
      },
      {
        path: 'member.displayName',
        label: 'Display Name',
        description: "User's display name",
        type: 'string',
        example: 'Alex Chen',
      },
      {
        path: 'member.role',
        label: 'Role',
        description: "User's role in the space",
        type: 'string',
        example: 'member',
      },
      {
        path: 'member.tenure.daysInSpace',
        label: 'Days in Space',
        description: 'How long the user has been a member',
        type: 'number',
        example: '45',
      },
      {
        path: 'member.tenure.isNewMember',
        label: 'Is New Member',
        description: 'True if member joined < 7 days ago',
        type: 'boolean',
        example: 'false',
      },
      {
        path: 'member.permissions.canPost',
        label: 'Can Post',
        description: 'Whether user can create posts',
        type: 'boolean',
        example: 'true',
      },
      {
        path: 'member.permissions.canDeployTools',
        label: 'Can Deploy Tools',
        description: 'Whether user can deploy tools',
        type: 'boolean',
        example: 'false',
      },
      {
        path: 'member.permissions.canModerate',
        label: 'Can Moderate',
        description: 'Whether user can moderate content',
        type: 'boolean',
        example: 'false',
      },
      {
        path: 'member.permissions.canManageMembers',
        label: 'Can Manage Members',
        description: 'Whether user can manage members',
        type: 'boolean',
        example: 'false',
      },
      {
        path: 'member.permissions.canAccessAdmin',
        label: 'Can Access Admin',
        description: 'Whether user can access admin features',
        type: 'boolean',
        example: 'false',
      },
    ],
  },
  {
    id: 'temporal',
    label: 'Temporal',
    description: 'Time-based context for conditional rendering',
    icon: ClockIcon,
    fields: [
      {
        path: 'temporal.dayOfWeek',
        label: 'Day of Week',
        description: '0 = Sunday, 6 = Saturday',
        type: 'number',
        example: '3',
      },
      {
        path: 'temporal.hourOfDay',
        label: 'Hour of Day',
        description: "Hour in user's local timezone (0-23)",
        type: 'number',
        example: '14',
      },
      {
        path: 'temporal.isWeekend',
        label: 'Is Weekend',
        description: 'True on Saturday or Sunday',
        type: 'boolean',
        example: 'false',
      },
      {
        path: 'temporal.isEvening',
        label: 'Is Evening',
        description: 'True after 6pm',
        type: 'boolean',
        example: 'false',
      },
      {
        path: 'temporal.isMorning',
        label: 'Is Morning',
        description: 'True before noon',
        type: 'boolean',
        example: 'true',
      },
      {
        path: 'temporal.timestamp',
        label: 'Timestamp',
        description: 'Current ISO 8601 timestamp',
        type: 'string',
        example: '2026-01-22T14:30:00Z',
      },
    ],
  },
  {
    id: 'capabilities',
    label: 'Capabilities',
    description: 'Platform capabilities available to the tool',
    icon: ShieldCheckIcon,
    fields: [
      {
        path: 'capabilities.campusEvents',
        label: 'Campus Events',
        description: 'Can access campus-wide events',
        type: 'boolean',
        example: 'true',
      },
      {
        path: 'capabilities.spaceMembers',
        label: 'Space Members',
        description: 'Can access space member list',
        type: 'boolean',
        example: 'false',
      },
      {
        path: 'capabilities.notifications',
        label: 'Notifications',
        description: 'Can send notifications',
        type: 'boolean',
        example: 'true',
      },
      {
        path: 'capabilities.userConnections',
        label: 'User Connections',
        description: "Can access user's connections",
        type: 'boolean',
        example: 'true',
      },
      {
        path: 'capabilities.analytics',
        label: 'Analytics',
        description: 'Can access analytics data',
        type: 'boolean',
        example: 'false',
      },
      {
        path: 'capabilities.stateMutations',
        label: 'State Mutations',
        description: 'Can perform state mutations',
        type: 'boolean',
        example: 'true',
      },
    ],
  },
];

// ============================================================================
// Component Props
// ============================================================================

interface ContextPickerProps {
  /** Currently selected context requirements */
  requirements: ContextRequirements | undefined;
  /** Callback when requirements change */
  onChange: (requirements: ContextRequirements) => void;
  /** Whether to show preview values */
  showPreview?: boolean;
  /** Preview values for context fields */
  previewValues?: Record<string, unknown>;
  /** Compact mode for smaller panels */
  compact?: boolean;
}

// ============================================================================
// Collapsible Section
// ============================================================================

function ContextSection({
  category,
  selectedFields,
  onToggleField,
  onToggleCategory,
  expanded,
  onToggleExpand,
  showPreview,
  previewValues,
}: {
  category: ContextCategoryDef;
  selectedFields: Set<string>;
  onToggleField: (path: string) => void;
  onToggleCategory: (categoryId: string, enabled: boolean) => void;
  expanded: boolean;
  onToggleExpand: () => void;
  showPreview?: boolean;
  previewValues?: Record<string, unknown>;
}) {
  const prefersReducedMotion = useReducedMotion();
  const Icon = category.icon;

  // Check if any field in this category is selected
  const hasSelectedFields = category.fields.some((f) =>
    selectedFields.has(f.path)
  );
  const allFieldsSelected =
    category.fields.length > 0 &&
    category.fields.every((f) => selectedFields.has(f.path));

  return (
    <div style={{ borderBottom: `1px solid ${PANEL_COLORS.border}` }}>
      {/* Category Header */}
      <div className="flex items-center gap-2 px-4 py-3">
        {/* Expand Toggle */}
        <motion.button
          type="button"
          onClick={onToggleExpand}
          whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
          className={cn(
            'flex items-center gap-2 flex-1 text-left',
            focusRing
          )}
          aria-expanded={expanded}
        >
          <motion.div
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={
              prefersReducedMotion ? { duration: 0 } : springPresets.snappy
            }
          >
            <ChevronRightIcon
              className="h-3.5 w-3.5"
              style={{ color: PANEL_COLORS.textTertiary }}
            />
          </motion.div>
          <Icon
            className="h-4 w-4"
            style={{
              color: hasSelectedFields
                ? PANEL_COLORS.accent
                : PANEL_COLORS.textSecondary,
            }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: PANEL_COLORS.textPrimary }}
          >
            {category.label}
          </span>
          {category.requiresSpace && (
            <span
              className="text-label-xs uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: PANEL_COLORS.infoLight,
                color: PANEL_COLORS.info,
              }}
            >
              Space
            </span>
          )}
        </motion.button>

        {/* Category Toggle */}
        <motion.button
          type="button"
          onClick={() => onToggleCategory(category.id, !hasSelectedFields)}
          whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
          className={cn(
            'w-5 h-5 rounded border flex items-center justify-center transition-colors duration-200',
            focusRing
          )}
          style={{
            backgroundColor: allFieldsSelected
              ? PANEL_COLORS.success
              : hasSelectedFields
                ? PANEL_COLORS.successLight
                : 'transparent',
            borderColor: hasSelectedFields
              ? PANEL_COLORS.success
              : PANEL_COLORS.border,
          }}
          aria-label={`${hasSelectedFields ? 'Disable' : 'Enable'} all ${category.label} fields`}
        >
          {(hasSelectedFields || allFieldsSelected) && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={springPresets.snappy}
            >
              <CheckIcon
                className="h-3 w-3"
                style={{
                  color: allFieldsSelected ? 'white' : PANEL_COLORS.success,
                }}
              />
            </motion.div>
          )}
        </motion.button>
      </div>

      {/* Description */}
      {expanded && (
        <p
          className="text-xs px-4 pb-2 -mt-1"
          style={{ color: PANEL_COLORS.textTertiary }}
        >
          {category.description}
        </p>
      )}

      {/* Fields */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0.1 } : springPresets.gentle}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-1">
              {category.fields.map((field) => (
                <ContextFieldRow
                  key={field.path}
                  field={field}
                  selected={selectedFields.has(field.path)}
                  onToggle={() => onToggleField(field.path)}
                  showPreview={showPreview}
                  previewValue={previewValues?.[field.path]}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Field Row
// ============================================================================

function ContextFieldRow({
  field,
  selected,
  onToggle,
  showPreview,
  previewValue,
}: {
  field: ContextFieldDef;
  selected: boolean;
  onToggle: () => void;
  showPreview?: boolean;
  previewValue?: unknown;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileHover={prefersReducedMotion ? {} : { x: 2 }}
      whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
      className={cn(
        'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left transition-colors duration-150',
        focusRing
      )}
      style={{
        backgroundColor: selected ? PANEL_COLORS.accentLight : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.backgroundColor = PANEL_COLORS.bgHover;
        }
        setShowTooltip(true);
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
        setShowTooltip(false);
      }}
      aria-pressed={selected}
    >
      {/* Checkbox */}
      <div
        className={cn(
          'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors duration-150'
        )}
        style={{
          backgroundColor: selected ? PANEL_COLORS.accent : 'transparent',
          borderColor: selected ? PANEL_COLORS.accent : PANEL_COLORS.border,
        }}
      >
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={springPresets.snappy}
          >
            <CheckIcon className="h-2.5 w-2.5 text-black" />
          </motion.div>
        )}
      </div>

      {/* Label & Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-medium truncate"
            style={{
              color: selected
                ? PANEL_COLORS.textPrimary
                : PANEL_COLORS.textSecondary,
            }}
          >
            {field.label}
          </span>
          <span
            className="text-label-xs font-mono px-1 rounded"
            style={{
              backgroundColor: PANEL_COLORS.bgActive,
              color: PANEL_COLORS.textTertiary,
            }}
          >
            {field.type}
          </span>
        </div>

        {/* Preview Value */}
        {showPreview && previewValue !== undefined && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-label-xs font-mono mt-0.5 truncate"
            style={{ color: PANEL_COLORS.textTertiary }}
          >
            = {JSON.stringify(previewValue)}
          </motion.div>
        )}
      </div>

      {/* Info Icon with Tooltip */}
      <div className="relative flex-shrink-0">
        <InformationCircleIcon
          className="h-3.5 w-3.5"
          style={{ color: PANEL_COLORS.textTertiary }}
        />
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-1 z-50 w-48 p-2 rounded-lg shadow-lg"
              style={{
                backgroundColor: PANEL_COLORS.bg,
                border: `1px solid ${PANEL_COLORS.border}`,
              }}
            >
              <p
                className="text-label-xs mb-1"
                style={{ color: PANEL_COLORS.textSecondary }}
              >
                {field.description}
              </p>
              <p
                className="text-label-xs font-mono"
                style={{ color: PANEL_COLORS.textTertiary }}
              >
                Example: {field.example}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ContextPicker({
  requirements,
  onChange,
  showPreview = false,
  previewValues = {},
  compact = false,
}: ContextPickerProps) {
  const prefersReducedMotion = useReducedMotion();

  // Track expanded categories
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['temporal']) // Start with temporal expanded since it doesn't require space
  );

  // Convert requirements to a Set of selected field paths
  const selectedFields = new Set<string>();

  if (requirements?.space) {
    if (requirements.space === true) {
      // All space fields selected
      CONTEXT_CATEGORIES.find((c) => c.id === 'space')?.fields.forEach((f) =>
        selectedFields.add(f.path)
      );
    } else if (Array.isArray(requirements.space)) {
      requirements.space.forEach((path) => selectedFields.add(`space.${path}`));
    }
  }

  if (requirements?.member) {
    if (requirements.member === true) {
      CONTEXT_CATEGORIES.find((c) => c.id === 'member')?.fields.forEach((f) =>
        selectedFields.add(f.path)
      );
    } else if (Array.isArray(requirements.member)) {
      requirements.member.forEach((path) =>
        selectedFields.add(`member.${path}`)
      );
    }
  }

  if (requirements?.temporal) {
    if (requirements.temporal === true) {
      CONTEXT_CATEGORIES.find((c) => c.id === 'temporal')?.fields.forEach((f) =>
        selectedFields.add(f.path)
      );
    } else if (Array.isArray(requirements.temporal)) {
      requirements.temporal.forEach((path) =>
        selectedFields.add(`temporal.${path}`)
      );
    }
  }

  if (requirements?.capabilities) {
    requirements.capabilities.forEach((cap) =>
      selectedFields.add(`capabilities.${cap}`)
    );
  }

  // Toggle a single field
  const handleToggleField = useCallback(
    (path: string) => {
      const newSelected = new Set(selectedFields);
      if (newSelected.has(path)) {
        newSelected.delete(path);
      } else {
        newSelected.add(path);
      }
      onChange(buildRequirements(newSelected));
    },
    [selectedFields, onChange]
  );

  // Toggle all fields in a category
  const handleToggleCategory = useCallback(
    (categoryId: string, enabled: boolean) => {
      const category = CONTEXT_CATEGORIES.find((c) => c.id === categoryId);
      if (!category) return;

      const newSelected = new Set(selectedFields);
      category.fields.forEach((f) => {
        if (enabled) {
          newSelected.add(f.path);
        } else {
          newSelected.delete(f.path);
        }
      });
      onChange(buildRequirements(newSelected));
    },
    [selectedFields, onChange]
  );

  // Toggle category expansion
  const handleToggleExpand = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  // Count selected fields
  const selectedCount = selectedFields.size;

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springPresets.gentle}
      className="flex flex-col"
    >
      {/* Header */}
      {!compact && (
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ borderBottom: `1px solid ${PANEL_COLORS.border}` }}
        >
          <div>
            <h4
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: PANEL_COLORS.textTertiary }}
            >
              Context Requirements
            </h4>
            <p
              className="text-label-xs mt-0.5"
              style={{ color: PANEL_COLORS.textTertiary }}
            >
              Select data this element needs at runtime
            </p>
          </div>
          {selectedCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: PANEL_COLORS.accentLight,
                color: PANEL_COLORS.accent,
              }}
            >
              {selectedCount} selected
            </motion.span>
          )}
        </div>
      )}

      {/* Categories */}
      <div className="flex-1 overflow-y-auto">
        {CONTEXT_CATEGORIES.map((category) => (
          <ContextSection
            key={category.id}
            category={category}
            selectedFields={selectedFields}
            onToggleField={handleToggleField}
            onToggleCategory={handleToggleCategory}
            expanded={expandedCategories.has(category.id)}
            onToggleExpand={() => handleToggleExpand(category.id)}
            showPreview={showPreview}
            previewValues={previewValues}
          />
        ))}
      </div>

      {/* Empty State */}
      {selectedCount === 0 && !compact && (
        <div
          className="px-4 py-4 text-center"
          style={{ borderTop: `1px solid ${PANEL_COLORS.border}` }}
        >
          <p className="text-xs" style={{ color: PANEL_COLORS.textTertiary }}>
            No context fields selected.
          </p>
          <p className="text-xs mt-1" style={{ color: PANEL_COLORS.textTertiary }}>
            Element will render without personalization.
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function buildRequirements(selectedFields: Set<string>): ContextRequirements {
  const requirements: ContextRequirements = {};

  // Group fields by category
  const spaceFields: string[] = [];
  const memberFields: string[] = [];
  const temporalFields: string[] = [];
  const capabilityFields: string[] = [];

  selectedFields.forEach((path) => {
    if (path.startsWith('space.')) {
      spaceFields.push(path.replace('space.', ''));
    } else if (path.startsWith('member.')) {
      memberFields.push(path.replace('member.', ''));
    } else if (path.startsWith('temporal.')) {
      temporalFields.push(path.replace('temporal.', ''));
    } else if (path.startsWith('capabilities.')) {
      capabilityFields.push(path.replace('capabilities.', ''));
    }
  });

  // Set requirements based on selections
  const spaceCategory = CONTEXT_CATEGORIES.find((c) => c.id === 'space');
  const memberCategory = CONTEXT_CATEGORIES.find((c) => c.id === 'member');
  const temporalCategory = CONTEXT_CATEGORIES.find((c) => c.id === 'temporal');

  if (spaceFields.length > 0) {
    // If all space fields selected, use boolean true
    if (spaceFields.length === spaceCategory?.fields.length) {
      requirements.space = true;
    } else {
      requirements.space = spaceFields;
    }
  }

  if (memberFields.length > 0) {
    if (memberFields.length === memberCategory?.fields.length) {
      requirements.member = true;
    } else {
      requirements.member = memberFields;
    }
  }

  if (temporalFields.length > 0) {
    if (temporalFields.length === temporalCategory?.fields.length) {
      requirements.temporal = true;
    } else {
      requirements.temporal = temporalFields;
    }
  }

  if (capabilityFields.length > 0) {
    requirements.capabilities = capabilityFields as (keyof import('@hive/core').CapabilityContext)[];
  }

  return requirements;
}

export default ContextPicker;
