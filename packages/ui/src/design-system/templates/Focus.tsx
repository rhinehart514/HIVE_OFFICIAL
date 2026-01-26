'use client';

/**
 * Focus Template
 * Source: docs/design-system/TEMPLATES.md (Template 1)
 *
 * The controlled reveal. Single-task immersion with zero escape velocity.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * TEMPLATE PHILOSOPHY
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Focus is the antithesis of distraction. When you enter Focus, everything
 * else disappears. There's only the task at hand.
 *
 * Used for: Auth, Onboarding, Settings modals, Single-form completion
 *
 * The psychological contract: "Complete this. Nothing else matters right now."
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * FOCUS MODES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Mode A: Portal (Full-bleed immersion)
 * ┌─────────────────────────────────────┐
 * │                                     │
 * │            ⬡ HIVE                   │
 * │                                     │
 * │        ┌─────────────┐              │
 * │        │   CONTENT   │              │
 * │        └─────────────┘              │
 * │                                     │
 * │             ● ● ○                   │
 * └─────────────────────────────────────┘
 * Used for: Auth flow, landing transitions
 *
 * Mode B: Reveal (Centered with max-width)
 * ┌─────────────────────────────────────┐
 * │   ⬡ HIVE                            │
 * │                                     │
 * │     ┌───────────────────────┐       │
 * │     │                       │       │
 * │     │      CONTENT          │       │
 * │     │                       │       │
 * │     └───────────────────────┘       │
 * │                                     │
 * │              ● ● ○                  │
 * └─────────────────────────────────────┘
 * Used for: Onboarding, settings flows
 *
 * Mode C: Form (Tight, single-column)
 * ┌─────────────────────────────────────┐
 * │                                     │
 * │            ⬡                        │
 * │                                     │
 * │          ┌───────┐                  │
 * │          │ FORM  │                  │
 * │          └───────┘                  │
 * │                                     │
 * └─────────────────────────────────────┘
 * Used for: OTP entry, single input flows
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
import { EASE_PREMIUM } from '../layout-tokens';

// ============================================
// HIVE LOGO
// ============================================

const HIVE_LOGO_PATH =
  'M432.83,133.2l373.8,216.95v173.77s-111.81,64.31-111.81,64.31v-173.76l-262.47-150.64-262.27,150.84.28,303.16,259.55,150.31,5.53-.33,633.4-365.81,374.52,215.84v433.92l-372.35,215.04h-2.88l-372.84-215.99-.27-174.53,112.08-63.56v173.76c87.89,49.22,174.62,101.14,262.48,150.69l261.99-151.64v-302.41s-261.51-151.27-261.51-151.27l-2.58.31-635.13,366.97c-121.32-69.01-241.36-140.28-362.59-209.44-4.21-2.4-8.42-5.15-13.12-6.55v-433.92l375.23-216h.96Z';

// ============================================
// TYPES
// ============================================

export type FocusMode = 'portal' | 'reveal' | 'form';

export type LogoPosition = 'center' | 'top-left' | 'hidden';

export type LogoVariant = 'full' | 'icon';

export type BackgroundStyle = 'ambient' | 'gradient' | 'none';

export type MaxWidth = 'xs' | 'sm' | 'md' | 'lg';

export interface FocusProgressProps {
  /** Total number of steps */
  steps: number;
  /** Current step (0-indexed) */
  current: number;
  /** Variant style */
  variant?: 'dots' | 'line';
}

export interface FocusLogoProps {
  /** Logo position */
  position?: LogoPosition;
  /** Logo variant (full text or icon only) */
  variant?: LogoVariant;
  /** Custom logo click handler */
  onClick?: () => void;
}

export interface FocusProps {
  children: React.ReactNode;
  /** Focus mode - controls layout structure */
  mode?: FocusMode;
  /** Atmosphere level - controls density and effects */
  atmosphere?: AtmosphereLevel;
  /** Logo configuration */
  logo?: FocusLogoProps;
  /** Progress indicator configuration */
  progress?: FocusProgressProps;
  /** Background style */
  background?: BackgroundStyle;
  /** Maximum content width */
  maxWidth?: MaxWidth;
  /** Additional CSS class for the container */
  className?: string;
  /** Additional CSS class for the content wrapper */
  contentClassName?: string;
  /** Enable footer area (for legal links, etc.) */
  footer?: React.ReactNode;
  /** Animate content on mount */
  animate?: boolean;
  /** Transition key for AnimatePresence */
  transitionKey?: string;
}

// ============================================
// CONSTANTS
// ============================================

const MAX_WIDTH_VALUES: Record<MaxWidth, string> = {
  xs: '320px',
  sm: '400px',
  md: '480px',
  lg: '560px',
};

// Animation variants
const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const contentVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_PREMIUM },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

// ============================================
// FOCUS CONTEXT
// ============================================

interface FocusContextValue {
  mode: FocusMode;
  maxWidth: MaxWidth;
}

const FocusContext = React.createContext<FocusContextValue | null>(null);

export function useFocus() {
  const context = React.useContext(FocusContext);
  if (!context) {
    throw new Error('useFocus must be used within a Focus template');
  }
  return context;
}

export function useFocusOptional() {
  return React.useContext(FocusContext);
}

// ============================================
// INTERNAL COMPONENTS
// ============================================

interface FocusHiveLogoProps {
  position: LogoPosition;
  variant: LogoVariant;
  onClick?: () => void;
}

function FocusHiveLogo({ position, variant, onClick }: FocusHiveLogoProps) {
  if (position === 'hidden') return null;

  const logoSize = variant === 'icon' ? 32 : 28;

  const positionStyles: React.CSSProperties = position === 'center'
    ? { position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)' }
    : { position: 'absolute', top: '24px', left: '24px' };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: EASE_PREMIUM }}
      style={positionStyles}
      className="z-10"
    >
      <button
        onClick={onClick}
        className="flex items-center gap-2 transition-colors duration-150 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        aria-label="HIVE"
        type="button"
      >
        <svg width={logoSize} height={logoSize} viewBox="0 0 1500 1500" fill="currentColor">
          <path d={HIVE_LOGO_PATH} />
        </svg>
        {variant === 'full' && (
          <span className="text-lg font-semibold tracking-tight">HIVE</span>
        )}
      </button>
    </motion.div>
  );
}

interface FocusProgressIndicatorProps extends FocusProgressProps {
  className?: string;
}

function FocusProgressIndicator({
  steps,
  current,
  variant = 'dots',
  className
}: FocusProgressIndicatorProps) {
  if (steps <= 1) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className={`flex items-center justify-center gap-2 ${className ?? ''}`}
    >
      {variant === 'dots' ? (
        // Dot indicator
        Array.from({ length: steps }).map((_, index) => (
          <motion.div
            key={index}
            animate={{
              backgroundColor: index <= current
                ? 'var(--color-gold)'
                : 'rgba(255, 255, 255, 0.15)',
              scale: index === current ? 1 : 0.85,
            }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 25
            }}
            className="w-2 h-2 rounded-full"
          />
        ))
      ) : (
        // Line indicator
        <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((current + 1) / steps) * 100}%` }}
            transition={{ duration: 0.4, ease: EASE_PREMIUM }}
            className="h-full bg-[var(--color-gold)] rounded-full"
          />
        </div>
      )}
    </motion.div>
  );
}

interface FocusBackgroundProps {
  style: BackgroundStyle;
  effectsEnabled: boolean;
}

function FocusBackground({ style, effectsEnabled }: FocusBackgroundProps) {
  if (style === 'none') return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Base layer */}
      <div className="absolute inset-0 bg-[var(--color-bg-page)]" />

      {/* Ambient particles - only in landing atmosphere */}
      {style === 'ambient' && effectsEnabled && (
        <>
          {/* Subtle warm glow in center */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255, 215, 0, 0.03) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />

          {/* Subtle edge vignette */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
            }}
          />
        </>
      )}

      {/* Gradient style */}
      {style === 'gradient' && effectsEnabled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(255, 215, 0, 0.02) 0%, transparent 50%)',
          }}
        />
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface FocusInnerProps extends Omit<FocusProps, 'atmosphere'> {}

function FocusInner({
  children,
  mode = 'portal',
  logo = { position: 'center', variant: 'icon' },
  progress,
  background = 'ambient',
  maxWidth = 'sm',
  className,
  contentClassName,
  footer,
  animate = true,
  transitionKey,
}: FocusInnerProps) {
  const { effectsEnabled } = useAtmosphere();

  const focusContext: FocusContextValue = React.useMemo(() => ({
    mode,
    maxWidth,
  }), [mode, maxWidth]);

  // Determine layout based on mode
  const getContentAlignment = () => {
    switch (mode) {
      case 'portal':
        return 'items-center justify-center';
      case 'reveal':
        return 'items-center justify-center pt-24';
      case 'form':
        return 'items-center justify-center';
      default:
        return 'items-center justify-center';
    }
  };

  const content = (
    <div
      className="w-full"
      style={{ maxWidth: MAX_WIDTH_VALUES[maxWidth] }}
    >
      {children}
    </div>
  );

  return (
    <FocusContext.Provider value={focusContext}>
      <div className={`relative min-h-screen flex flex-col ${className ?? ''}`}>
        {/* Background */}
        <FocusBackground style={background} effectsEnabled={effectsEnabled} />

        {/* Logo */}
        <FocusHiveLogo
          position={logo.position ?? 'center'}
          variant={logo.variant ?? 'icon'}
          onClick={logo.onClick}
        />

        {/* Main content area */}
        <main className={`relative flex-1 flex ${getContentAlignment()} px-4 sm:px-6`}>
          {animate ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={transitionKey ?? 'focus-content'}
                variants={containerVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className={`w-full flex flex-col items-center ${contentClassName ?? ''}`}
                style={{ maxWidth: MAX_WIDTH_VALUES[maxWidth] }}
              >
                <motion.div variants={contentVariants} className="w-full">
                  {children}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div
              className={`w-full flex flex-col items-center ${contentClassName ?? ''}`}
              style={{ maxWidth: MAX_WIDTH_VALUES[maxWidth] }}
            >
              {children}
            </div>
          )}
        </main>

        {/* Progress indicator */}
        {progress && (
          <div className="absolute bottom-8 left-0 right-0">
            <FocusProgressIndicator {...progress} />
          </div>
        )}

        {/* Footer */}
        {footer && (
          <footer className="relative z-10 px-4 pb-6 text-center">
            {footer}
          </footer>
        )}
      </div>
    </FocusContext.Provider>
  );
}

/**
 * Focus Template - Single-task immersion
 *
 * Wraps content in a full-screen focus environment with controlled atmosphere.
 * Everything else disappears. There's only the task at hand.
 *
 * @example
 * ```tsx
 * // Auth flow (portal mode)
 * <Focus
 *   mode="portal"
 *   atmosphere="landing"
 *   logo={{ position: 'center', variant: 'icon' }}
 * >
 *   <LoginForm />
 * </Focus>
 *
 * // Onboarding flow (reveal mode with progress)
 * <Focus
 *   mode="reveal"
 *   atmosphere="landing"
 *   logo={{ position: 'top-left', variant: 'full' }}
 *   progress={{ steps: 3, current: 0 }}
 * >
 *   <OnboardingStep />
 * </Focus>
 * ```
 */
export function Focus({ atmosphere = 'landing', ...props }: FocusProps) {
  return (
    <AtmosphereProvider defaultAtmosphere={atmosphere}>
      <FocusInner {...props} />
    </AtmosphereProvider>
  );
}

/**
 * FocusStatic - Non-animated version for loading states
 *
 * Same structure as Focus but without animations.
 * Use for Suspense fallbacks.
 */
export function FocusStatic({
  children,
  mode = 'portal',
  maxWidth = 'sm',
  className,
}: Pick<FocusProps, 'children' | 'mode' | 'maxWidth' | 'className'>) {
  return (
    <div className={`relative min-h-screen flex flex-col bg-[var(--color-bg-page)] ${className ?? ''}`}>
      <main className="relative flex-1 flex items-center justify-center px-4 sm:px-6">
        <div
          className="w-full"
          style={{ maxWidth: MAX_WIDTH_VALUES[maxWidth] }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

// Named exports for flexibility
export { FocusHiveLogo, FocusProgressIndicator, FocusBackground };
export type { FocusContextValue };
