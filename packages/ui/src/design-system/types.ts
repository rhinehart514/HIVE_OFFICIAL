/**
 * HIVE Design System Types
 * Generated from: docs/design-system/PRIMITIVES.md
 *
 * Standardized prop interfaces for all HIVE primitives and components.
 * These interfaces ensure consistent APIs across the design system.
 *
 * Key Principles from PRIMITIVES.md:
 * - Every primitive accepts `atmosphere` prop
 * - Warmth is edge-based (box-shadow), never background
 * - Gold budget enforced (1-2% max)
 * - Focus rings are WHITE, never gold
 */

import type { AtmosphereLevel, Density, WarmthLevel } from './AtmosphereProvider';

// ============================================
// CORE PROP INTERFACES
// ============================================

/**
 * AtmosphereAware - Base interface for atmosphere-aware components
 * From PRIMITIVES.md: "Every primitive should accept atmosphere prop"
 *
 * Components inherit atmosphere from AtmosphereProvider context,
 * but can be overridden via prop for special cases.
 */
export interface AtmosphereAware {
  /** Override inherited atmosphere level */
  atmosphere?: AtmosphereLevel;
}

/**
 * DensityAware - For components that respond to density context
 */
export interface DensityAware {
  /** Override inherited density */
  density?: Density;
}

/**
 * WarmthProps - For components that display warmth (activity indication)
 * From PRIMITIVES.md: "Warmth is edge-based, never background tint"
 *
 * CRITICAL: Warmth uses box-shadow inset, NOT background color.
 * This creates a subtle gold edge that indicates activity level.
 */
export interface WarmthProps {
  /** Activity indication via edge warmth (box-shadow inset) */
  warmth?: WarmthLevel;
}

/**
 * ElevationProps - For components with z-depth layers
 * From PRIMITIVES.md elevation scale
 */
export interface ElevationProps {
  /** Visual elevation level */
  elevation?: 'resting' | 'raised' | 'floating';
}

/**
 * LifeProps - For components displaying "life" (gold indicators)
 * From PRINCIPLES.md: Gold budget is 1-2%, only for life/activity
 *
 * Only these elements can show gold:
 * - PresenceDot (online status)
 * - Primary CTAs (Button variant)
 * - LiveCounter (real-time counts)
 * - Achievements/badges
 */
export interface LifeProps {
  /** Show life indicator (gold, breathing) */
  alive?: boolean;
  /** Pulse animation for active states */
  pulse?: boolean;
}

// ============================================
// SURFACE & CONTAINER TYPES
// ============================================

/**
 * SurfaceProps - For surface/container components (Card, Panel, etc.)
 * Combines atmosphere, warmth, and elevation awareness
 */
export interface SurfaceProps extends AtmosphereAware, WarmthProps, ElevationProps {
  /** Glass effect (landing atmosphere only) */
  glass?: boolean;
  /** Background variant */
  variant?: 'default' | 'subtle' | 'ghost';
}

/**
 * CardProps - Standard card container props
 * From PRIMITIVES.md Card specification
 */
export interface CardProps extends SurfaceProps {
  /** Card size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Interactive hover state */
  interactive?: boolean;
  /** Pressed/active state */
  pressed?: boolean;
}

// ============================================
// INTERACTIVE ELEMENT TYPES
// ============================================

/**
 * InteractiveProps - Base for interactive elements
 * From PRINCIPLES.md: Focus rings are WHITE, never gold
 */
export interface InteractiveProps {
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
}

/**
 * ButtonVariant - Button style variants
 * From PRIMITIVES.md Button specification
 *
 * IMPORTANT: Only 'primary' (gold CTA) uses gold color.
 * All other variants use grayscale.
 */
export type ButtonVariant =
  | 'default'    // Standard ghost style
  | 'primary'    // Gold CTA - the ONLY gold button
  | 'secondary'  // Outlined
  | 'ghost'      // Transparent with hover
  | 'destructive'; // Red for danger actions

/**
 * ButtonSize - Button size variants
 */
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

/**
 * ButtonProps - Complete button props
 */
export interface ButtonProps extends AtmosphereAware, InteractiveProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

// ============================================
// INPUT TYPES
// ============================================

/**
 * InputState - Input validation states
 */
export type InputState = 'default' | 'error' | 'success' | 'warning';

/**
 * InputProps - Base input props
 * From PRIMITIVES.md Input specification
 */
export interface InputProps extends AtmosphereAware, InteractiveProps {
  /** Validation state */
  state?: InputState;
  /** Full width */
  fullWidth?: boolean;
}

/**
 * TextareaProps - Multi-line input
 */
export interface TextareaProps extends InputProps {
  /** Number of visible rows */
  rows?: number;
  /** Auto-resize based on content */
  autoResize?: boolean;
}

/**
 * SelectProps - Dropdown selector
 */
export interface SelectProps extends InputProps {
  /** Placeholder text */
  placeholder?: string;
}

/**
 * CheckboxProps - Toggle with warmth
 */
export interface CheckboxProps extends InteractiveProps {
  /** Checked state */
  checked?: boolean;
  /** Indeterminate state */
  indeterminate?: boolean;
}

/**
 * SwitchProps - Binary toggle
 */
export interface SwitchProps extends InteractiveProps {
  /** On state */
  checked?: boolean;
}

// ============================================
// FEEDBACK TYPES
// ============================================

/**
 * ToastVariant - Toast notification types
 */
export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

/**
 * ToastProps - Notification message props
 */
export interface ToastProps {
  variant?: ToastVariant;
  /** Auto-dismiss duration in ms (0 = no auto-dismiss) */
  duration?: number;
  /** Show close button */
  dismissible?: boolean;
}

/**
 * ProgressProps - Loading progress indicator
 */
export interface ProgressProps {
  /** Progress value 0-100 */
  value?: number;
  /** Indeterminate (unknown progress) */
  indeterminate?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * SkeletonProps - Loading placeholder
 */
export interface SkeletonProps {
  /** Skeleton shape */
  variant?: 'text' | 'circular' | 'rectangular';
  /** Width (CSS value) */
  width?: string | number;
  /** Height (CSS value) */
  height?: string | number;
  /** Animation enabled */
  animate?: boolean;
}

// ============================================
// NAVIGATION TYPES
// ============================================

/**
 * TabsProps - Tab navigation
 */
export interface TabsProps extends AtmosphereAware {
  /** Default selected tab */
  defaultValue?: string;
  /** Controlled selected tab */
  value?: string;
  /** Tab change handler */
  onValueChange?: (value: string) => void;
}

/**
 * BadgeVariant - Badge style variants
 */
export type BadgeVariant =
  | 'default'   // Gray, neutral
  | 'primary'   // Gold (rare - achievements only)
  | 'secondary' // Outlined
  | 'success'   // Green
  | 'warning'   // Yellow
  | 'error';    // Red

/**
 * BadgeProps - Count/status badge
 */
export interface BadgeProps {
  variant?: BadgeVariant;
  /** Badge size */
  size?: 'sm' | 'md';
}

// ============================================
// LIFE ELEMENT TYPES (Gold Budget: 1-2%)
// ============================================

/**
 * PresenceDotProps - Online status indicator
 * From PRIMITIVES.md: "The ONLY element that shows gold without action"
 *
 * This is the primary use of gold in HIVE - showing life/presence.
 */
export interface PresenceDotProps extends LifeProps {
  /** Online status */
  status: 'online' | 'away' | 'busy' | 'offline';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * ActivityEdgeProps - Edge warmth treatment
 * From PRIMITIVES.md: "Box-shadow inset warmth, never background"
 */
export interface ActivityEdgeProps extends WarmthProps {
  /** Activity count for auto-warmth calculation */
  activityCount?: number;
}

/**
 * LiveCounterProps - Real-time counter
 * From PRIMITIVES.md: One of few gold-allowed elements
 */
export interface LiveCounterProps extends LifeProps {
  /** Count value */
  count: number;
  /** Label text */
  label?: string;
  /** Animate count changes */
  animate?: boolean;
}

/**
 * TypingIndicatorProps - Breathing animation for typing
 */
export interface TypingIndicatorProps {
  /** Users currently typing */
  users?: string[];
  /** Max users to display before "and X others" */
  maxDisplay?: number;
}

// ============================================
// AVATAR TYPES
// ============================================

/**
 * AvatarShape - Avatar shape options
 * From PRIMITIVES.md: "Rounded square, NEVER circles"
 *
 * CRITICAL: HIVE uses rounded squares (radius-lg), not circles.
 * This is a core visual identity choice.
 */
export type AvatarShape = 'rounded-square'; // Only option - enforced

/**
 * AvatarSize - Avatar size variants
 */
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * AvatarProps - User avatar props
 */
export interface AvatarProps {
  /** Image source URL */
  src?: string;
  /** Alt text for accessibility */
  alt: string;
  /** Fallback initials */
  fallback?: string;
  /** Size variant */
  size?: AvatarSize;
  /** Show presence indicator */
  showPresence?: boolean;
  /** Presence status (if showing) */
  presenceStatus?: PresenceDotProps['status'];
}

/**
 * AvatarGroupProps - Stacked avatars
 */
export interface AvatarGroupProps {
  /** Maximum avatars to show before "+N" */
  max?: number;
  /** Size for all avatars */
  size?: AvatarSize;
  /** Overlap amount */
  spacing?: 'tight' | 'normal' | 'loose';
}

// ============================================
// ICON TYPES
// ============================================

/**
 * IconProps - Icon component props
 * From PRIMITIVES.md: "Lucide icons only"
 */
export interface IconProps {
  /** Icon size (matches text size by default) */
  size?: 'sm' | 'md' | 'lg' | number;
  /** Icon color (inherits text color by default) */
  color?: string;
  /** Stroke width */
  strokeWidth?: number;
}

// ============================================
// MODAL/OVERLAY TYPES
// ============================================

/**
 * ModalProps - Dialog overlay props
 */
export interface ModalProps extends AtmosphereAware {
  /** Open state */
  open?: boolean;
  /** Close handler */
  onOpenChange?: (open: boolean) => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'full';
  /** Allow closing via backdrop click */
  dismissible?: boolean;
}

/**
 * TooltipProps - Hover hint props
 */
export interface TooltipProps {
  /** Tooltip content */
  content: React.ReactNode;
  /** Placement relative to trigger */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Delay before showing (ms) */
  delayDuration?: number;
}

// ============================================
// LAYOUT TYPES
// ============================================

/**
 * SeparatorProps - Divider line props
 */
export interface SeparatorProps {
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Visual style */
  variant?: 'subtle' | 'default' | 'emphasis';
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * AsChildProps - Radix-style as child pattern
 * Allows component to merge props with child
 */
export interface AsChildProps {
  asChild?: boolean;
}

/**
 * PolymorphicProps - For components that can render as different elements
 */
export interface PolymorphicProps<T extends React.ElementType> {
  as?: T;
}

/**
 * DataAttributes - Common data attributes for styling
 */
export interface DataAttributes {
  'data-atmosphere'?: AtmosphereLevel;
  'data-density'?: Density;
  'data-warmth'?: WarmthLevel;
  'data-state'?: string;
}

// ============================================
// COMPOSITE INTERFACES
// ============================================

/**
 * FullPrimitiveProps - All possible primitive props combined
 * Use for generic primitive components
 */
export type FullPrimitiveProps = AtmosphereAware &
  DensityAware &
  WarmthProps &
  ElevationProps &
  LifeProps &
  InteractiveProps;

/**
 * ComponentWithRef - Helper for forwardRef components
 */
export type ComponentWithRef<T, P> = React.ForwardRefExoticComponent<
  P & React.RefAttributes<T>
>;

// ============================================
// RE-EXPORTS
// ============================================

export type { AtmosphereLevel, Density, WarmthLevel };
