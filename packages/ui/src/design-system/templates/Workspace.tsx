'use client';

/**
 * Workspace Template
 * Source: docs/design-system/TEMPLATES.md (Template 5)
 *
 * The creation studio. IDE-like layouts for building, editing, and composing.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * TEMPLATE PHILOSOPHY
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Workspace is where creation happens. It's the builder's domain.
 * Everything is in service of the central canvas/work area.
 *
 * Used for: HiveLab IDE, editors, builders, composition tools
 *
 * The psychological contract: "You're in control. Build what you imagine."
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * WORKSPACE MODES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Mode A: Magic (AI-first, minimal chrome)
 * ┌─────────────────────────────────────────┐
 * │  Command Bar                     [⋮]   │
 * ├─────────────────────────────────────────┤
 * │                                         │
 * │                                         │
 * │           ┌─────────────┐              │
 * │           │  Canvas     │              │
 * │           │   Area      │              │
 * │           └─────────────┘              │
 * │                                         │
 * │        ┌──────────────────┐            │
 * │        │   AI Prompt Bar  │            │
 * │        └──────────────────┘            │
 * └─────────────────────────────────────────┘
 * Used for: AI-powered creation, quick builds
 *
 * Mode B: Build (Full IDE layout)
 * ┌─────────────────────────────────────────┐
 * │  Header Bar         [Save] [Preview]   │
 * ├────┬──────────────────────────────┬────┤
 * │ E  │                              │ P  │
 * │ L  │                              │ R  │
 * │ E  │        Canvas / Editor       │ O  │
 * │ M  │                              │ P  │
 * │ E  │                              │ S  │
 * │ N  │                              │    │
 * │ T  │                              │    │
 * │ S  │                              │    │
 * ├────┴──────────────────────────────┴────┤
 * │  Status Bar                            │
 * └─────────────────────────────────────────┘
 * Used for: Full IDE experience, complex tools
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AtmosphereProvider,
  useAtmosphere,
  type AtmosphereLevel
} from '../AtmosphereProvider';
import { cn } from '../../lib/utils';

// ============================================
// TYPES
// ============================================

export type WorkspaceMode = 'magic' | 'build';

export type RailState = 'expanded' | 'collapsed' | 'hidden';

export type CanvasBackground = 'grid' | 'dots' | 'none';

export interface WorkspaceProps {
  children: React.ReactNode;
  /** Workspace mode */
  mode?: WorkspaceMode;
  /** Atmosphere level - always workshop for creation */
  atmosphere?: AtmosphereLevel;
  /** Header content (logo, title, actions) */
  header?: React.ReactNode;
  /** Command bar for quick actions */
  commandBar?: React.ReactNode;
  /** Floating action bar (for magic mode) */
  actionBar?: React.ReactNode;
  /** Left rail content (element palette, layers) */
  leftRail?: React.ReactNode;
  /** Right rail content (properties, inspector) */
  rightRail?: React.ReactNode;
  /** Left rail visibility state */
  leftRailState?: RailState;
  /** Right rail visibility state */
  rightRailState?: RailState;
  /** Left rail width when expanded */
  leftRailWidth?: number;
  /** Right rail width when expanded */
  rightRailWidth?: number;
  /** Canvas background style */
  canvasBackground?: CanvasBackground;
  /** Track unsaved changes */
  hasUnsavedChanges?: boolean;
  /** Status bar content */
  statusBar?: React.ReactNode;
  /** On unsaved changes warning */
  onUnsavedWarning?: () => void;
  /** Additional class names */
  className?: string;
}

// ============================================
// CONSTANTS
// ============================================

const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

const DEFAULT_LEFT_RAIL_WIDTH = 280;
const DEFAULT_RIGHT_RAIL_WIDTH = 320;
const COLLAPSED_RAIL_WIDTH = 48;

// ============================================
// WORKSPACE CONTEXT
// ============================================

interface WorkspaceContextValue {
  mode: WorkspaceMode;
  leftRailState: RailState;
  rightRailState: RailState;
  hasUnsavedChanges: boolean;
  setLeftRailState: (state: RailState) => void;
  setRightRailState: (state: RailState) => void;
}

const WorkspaceContext = React.createContext<WorkspaceContextValue | null>(null);

export function useWorkspace() {
  const context = React.useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a Workspace template');
  }
  return context;
}

export function useWorkspaceOptional() {
  return React.useContext(WorkspaceContext);
}

// ============================================
// INTERNAL COMPONENTS
// ============================================

interface WorkspaceBackgroundProps {
  canvasBackground: CanvasBackground;
}

function WorkspaceBackground({ canvasBackground }: WorkspaceBackgroundProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Base layer - workshop atmosphere is denser */}
      <div className="absolute inset-0 bg-void" />

      {/* Grid background */}
      {canvasBackground === 'grid' && (
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />
      )}

      {/* Dots background */}
      {canvasBackground === 'dots' && (
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.8) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      )}
    </div>
  );
}

interface RailProps {
  children: React.ReactNode;
  state: RailState;
  width: number;
  side: 'left' | 'right';
  onToggle?: () => void;
}

function Rail({ children, state, width, side, onToggle }: RailProps) {
  if (state === 'hidden') return null;

  const isCollapsed = state === 'collapsed';
  const currentWidth = isCollapsed ? COLLAPSED_RAIL_WIDTH : width;

  return (
    <motion.aside
      initial={false}
      animate={{ width: currentWidth }}
      transition={{ duration: 0.2, ease: EASE_PREMIUM }}
      className={cn(
        'relative flex-shrink-0 bg-ground border-border-subtle overflow-hidden',
        side === 'left' ? 'border-r' : 'border-l'
      )}
    >
      {/* Collapsed toggle button */}
      {isCollapsed && onToggle && (
        <button
          onClick={onToggle}
          className="absolute inset-0 flex items-center justify-center text-text-tertiary hover:text-text-secondary transition-colors"
          aria-label={`Expand ${side} panel`}
        >
          <svg
            className={cn('w-4 h-4', side === 'left' ? '' : 'rotate-180')}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}

      {/* Rail content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="h-full overflow-auto"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}

function UnsavedIndicator({ hasChanges }: { hasChanges: boolean }) {
  if (!hasChanges) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-life-gold/10 border border-life-gold/20"
    >
      <div className="w-1.5 h-1.5 rounded-full bg-life-gold animate-pulse" />
      <span className="text-xs font-medium text-life-gold">Unsaved changes</span>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface WorkspaceInnerProps extends Omit<WorkspaceProps, 'atmosphere'> {}

function WorkspaceInner({
  children,
  mode = 'build',
  header,
  commandBar,
  actionBar,
  leftRail,
  rightRail,
  leftRailState: initialLeftState = 'expanded',
  rightRailState: initialRightState = 'expanded',
  leftRailWidth = DEFAULT_LEFT_RAIL_WIDTH,
  rightRailWidth = DEFAULT_RIGHT_RAIL_WIDTH,
  canvasBackground = 'grid',
  hasUnsavedChanges = false,
  statusBar,
  className,
}: WorkspaceInnerProps) {
  const { effectsEnabled } = useAtmosphere();

  const [leftRailState, setLeftRailState] = React.useState<RailState>(initialLeftState);
  const [rightRailState, setRightRailState] = React.useState<RailState>(initialRightState);

  const workspaceContext: WorkspaceContextValue = React.useMemo(
    () => ({
      mode,
      leftRailState,
      rightRailState,
      hasUnsavedChanges,
      setLeftRailState,
      setRightRailState,
    }),
    [mode, leftRailState, rightRailState, hasUnsavedChanges]
  );

  const toggleLeftRail = React.useCallback(() => {
    setLeftRailState(s => s === 'collapsed' ? 'expanded' : 'collapsed');
  }, []);

  const toggleRightRail = React.useCallback(() => {
    setRightRailState(s => s === 'collapsed' ? 'expanded' : 'collapsed');
  }, []);

  // Magic mode - minimal chrome, AI-first
  if (mode === 'magic') {
    return (
      <WorkspaceContext.Provider value={workspaceContext}>
        <div className={cn('relative min-h-screen flex flex-col bg-void', className)}>
          {/* Command bar at top */}
          {commandBar && (
            <div className="relative z-20 border-b border-border-subtle">
              {commandBar}
            </div>
          )}

          {/* Canvas area */}
          <main className="relative flex-1 flex items-center justify-center">
            <WorkspaceBackground canvasBackground={canvasBackground} />
            <div className="relative z-10 w-full h-full">
              {children}
            </div>
          </main>

          {/* Floating action bar at bottom */}
          {actionBar && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
              {actionBar}
            </div>
          )}

          {/* Unsaved indicator */}
          <UnsavedIndicator hasChanges={hasUnsavedChanges} />
        </div>
      </WorkspaceContext.Provider>
    );
  }

  // Build mode - full IDE layout
  return (
    <WorkspaceContext.Provider value={workspaceContext}>
      <div className={cn('relative h-screen flex flex-col overflow-hidden bg-void', className)}>
        {/* Header */}
        {header && (
          <header className="relative z-20 flex-shrink-0 border-b border-border-subtle bg-ground">
            {header}
          </header>
        )}

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left rail */}
          {leftRail && (
            <Rail
              state={leftRailState}
              width={leftRailWidth}
              side="left"
              onToggle={toggleLeftRail}
            >
              {leftRail}
            </Rail>
          )}

          {/* Canvas / main area */}
          <main className="relative flex-1 overflow-hidden">
            <WorkspaceBackground canvasBackground={canvasBackground} />
            <div className="relative z-10 w-full h-full overflow-auto">
              {children}
            </div>

            {/* Unsaved indicator */}
            <UnsavedIndicator hasChanges={hasUnsavedChanges} />
          </main>

          {/* Right rail */}
          {rightRail && (
            <Rail
              state={rightRailState}
              width={rightRailWidth}
              side="right"
              onToggle={toggleRightRail}
            >
              {rightRail}
            </Rail>
          )}
        </div>

        {/* Status bar */}
        {statusBar && (
          <footer className="relative z-20 flex-shrink-0 border-t border-border-subtle bg-ground">
            {statusBar}
          </footer>
        )}
      </div>
    </WorkspaceContext.Provider>
  );
}

/**
 * Workspace Template - Creation Studio
 *
 * IDE-like layouts for building and editing.
 * Two modes: magic (AI-first) and build (full IDE).
 *
 * @example
 * ```tsx
 * // Magic mode - AI-powered creation
 * <Workspace mode="magic" commandBar={<CommandBar />} actionBar={<AIPrompt />}>
 *   <Canvas />
 * </Workspace>
 *
 * // Build mode - full IDE
 * <Workspace
 *   mode="build"
 *   header={<HeaderBar title="My Tool" />}
 *   leftRail={<ElementPalette />}
 *   rightRail={<PropertiesPanel />}
 *   hasUnsavedChanges={dirty}
 * >
 *   <IDECanvas />
 * </Workspace>
 * ```
 */
export function Workspace({ atmosphere = 'workshop', ...props }: WorkspaceProps) {
  return (
    <AtmosphereProvider defaultAtmosphere={atmosphere}>
      <WorkspaceInner {...props} />
    </AtmosphereProvider>
  );
}

/**
 * WorkspaceStatic - Non-animated version for loading states
 */
export function WorkspaceStatic(props: Omit<WorkspaceProps, 'atmosphere'>) {
  return <WorkspaceInner {...props} />;
}

// ============================================
// HELPER COMPONENTS
// ============================================

export interface WorkspaceHeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  backButton?: React.ReactNode;
  className?: string;
}

export function WorkspaceHeader({
  title,
  subtitle,
  actions,
  backButton,
  className,
}: WorkspaceHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between px-4 py-3', className)}>
      <div className="flex items-center gap-3">
        {backButton}
        <div>
          {title && (
            <h1 className="text-sm font-medium text-text-primary">{title}</h1>
          )}
          {subtitle && (
            <p className="text-xs text-text-tertiary">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

export interface WorkspaceStatusBarProps {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

export function WorkspaceStatusBar({
  left,
  center,
  right,
  className,
}: WorkspaceStatusBarProps) {
  return (
    <div className={cn('flex items-center justify-between px-4 py-2 text-xs', className)}>
      <div className="flex items-center gap-4 text-text-tertiary">
        {left}
      </div>
      <div className="flex items-center gap-4 text-text-tertiary">
        {center}
      </div>
      <div className="flex items-center gap-4 text-text-tertiary">
        {right}
      </div>
    </div>
  );
}

export default Workspace;
