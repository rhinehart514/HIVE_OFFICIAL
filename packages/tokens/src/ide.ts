/**
 * HiveLab IDE Design Tokens
 *
 * Semantic tokens for the Figma/VS Code-inspired IDE interface.
 * Uses CSS custom properties for runtime theming support.
 */

// Surface tokens - background colors for different elevation levels
export const ideSurface = {
  canvas: 'var(--ide-surface-canvas)',
  panel: 'var(--ide-surface-panel)',
  toolbar: 'var(--ide-surface-toolbar)',
  elevated: 'var(--ide-surface-elevated)',
  overlay: 'var(--ide-surface-overlay)',
} as const;

// Border tokens
export const ideBorder = {
  default: 'var(--ide-border-default)',
  subtle: 'var(--ide-border-subtle)',
  focus: 'var(--ide-border-focus)',
  accent: 'var(--ide-border-accent)',
} as const;

// Text tokens
export const ideText = {
  primary: 'var(--ide-text-primary)',
  secondary: 'var(--ide-text-secondary)',
  muted: 'var(--ide-text-muted)',
  accent: 'var(--ide-text-accent)',
  inverse: 'var(--ide-text-inverse)',
} as const;

// Interactive element tokens
export const ideInteractive = {
  default: 'var(--ide-interactive-default)',
  hover: 'var(--ide-interactive-hover)',
  active: 'var(--ide-interactive-active)',
  selected: 'var(--ide-interactive-selected)',
  disabled: 'var(--ide-interactive-disabled)',
} as const;

// Status tokens
export const ideStatus = {
  success: 'var(--ide-status-success)',
  successBg: 'var(--ide-status-success-bg)',
  warning: 'var(--ide-status-warning)',
  warningBg: 'var(--ide-status-warning-bg)',
  error: 'var(--ide-status-error)',
  errorBg: 'var(--ide-status-error-bg)',
  info: 'var(--ide-status-info)',
  infoBg: 'var(--ide-status-info-bg)',
} as const;

// Accent tokens (HIVE gold)
export const ideAccent = {
  primary: 'var(--ide-accent-primary)',
  primaryHover: 'var(--ide-accent-primary-hover)',
  primaryBg: 'var(--ide-accent-primary-bg)',
  secondary: 'var(--ide-accent-secondary)',
} as const;

// Combined IDE tokens object for convenience
export const IDE_TOKENS = {
  surface: ideSurface,
  border: ideBorder,
  text: ideText,
  interactive: ideInteractive,
  status: ideStatus,
  accent: ideAccent,
} as const;

// Tailwind-compatible class mappings
export const ideClasses = {
  // Backgrounds
  bgCanvas: 'bg-[var(--ide-surface-canvas)]',
  bgPanel: 'bg-[var(--ide-surface-panel)]',
  bgToolbar: 'bg-[var(--ide-surface-toolbar)]',
  bgElevated: 'bg-[var(--ide-surface-elevated)]',
  bgOverlay: 'bg-[var(--ide-surface-overlay)]',

  // Borders
  borderDefault: 'border-[var(--ide-border-default)]',
  borderSubtle: 'border-[var(--ide-border-subtle)]',
  borderFocus: 'border-[var(--ide-border-focus)]',
  borderAccent: 'border-[var(--ide-border-accent)]',

  // Text
  textPrimary: 'text-[var(--ide-text-primary)]',
  textSecondary: 'text-[var(--ide-text-secondary)]',
  textMuted: 'text-[var(--ide-text-muted)]',
  textAccent: 'text-[var(--ide-text-accent)]',

  // Interactive backgrounds
  bgInteractive: 'bg-[var(--ide-interactive-default)]',
  bgInteractiveHover: 'hover:bg-[var(--ide-interactive-hover)]',
  bgInteractiveActive: 'active:bg-[var(--ide-interactive-active)]',
} as const;

// Type exports
export type IDESurface = typeof ideSurface;
export type IDEBorder = typeof ideBorder;
export type IDEText = typeof ideText;
export type IDEInteractive = typeof ideInteractive;
export type IDEStatus = typeof ideStatus;
export type IDEAccent = typeof ideAccent;
export type IDETokens = typeof IDE_TOKENS;
