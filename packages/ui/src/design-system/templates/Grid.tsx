'use client';

/**
 * Grid Template
 * Source: docs/design-system/TEMPLATES.md (Template 4)
 *
 * Curated discovery. Grid-based layouts for browsing, galleries, and categories.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * TEMPLATE PHILOSOPHY
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Grid is about discovery. It presents options without overwhelming.
 * Each mode has a distinct personality for how content is organized.
 *
 * Used for: Browse pages, galleries, category views, tool libraries
 *
 * The psychological contract: "Explore at your own pace. Everything is here."
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * GRID MODES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Mode A: Netflix (Horizontal scroll rows)
 * ┌─────────────────────────────────────────┐
 * │  Header / Hero                          │
 * ├─────────────────────────────────────────┤
 * │  Category A                        →    │
 * │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐    │
 * │  │    │ │    │ │    │ │    │ │    │    │
 * │  └────┘ └────┘ └────┘ └────┘ └────┘    │
 * │                                         │
 * │  Category B                        →    │
 * │  ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
 * │  │    │ │    │ │    │ │    │           │
 * │  └────┘ └────┘ └────┘ └────┘           │
 * └─────────────────────────────────────────┘
 * Used for: Category browsing, recommendations
 *
 * Mode B: Uniform (Responsive grid)
 * ┌─────────────────────────────────────────┐
 * │  Header / Filter Bar                    │
 * ├─────────────────────────────────────────┤
 * │  ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
 * │  │    │ │    │ │    │ │    │          │
 * │  └────┘ └────┘ └────┘ └────┘          │
 * │  ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
 * │  │    │ │    │ │    │ │    │          │
 * │  └────┘ └────┘ └────┘ └────┘          │
 * └─────────────────────────────────────────┘
 * Used for: Gallery view, search results
 *
 * Mode C: Territorial (Category-styled sections)
 * ┌─────────────────────────────────────────┐
 * │  Header / Search                        │
 * ├─────────────────────────────────────────┤
 * │  ═══ Territory A ═══                    │
 * │  ┌────┐ ┌────┐ ┌────┐                  │
 * │  │    │ │    │ │    │                  │
 * │  └────┘ └────┘ └────┘                  │
 * │                                         │
 * │  ═══ Territory B ═══                    │
 * │  ┌────┐ ┌────┐                         │
 * │  │    │ │    │                         │
 * │  └────┘ └────┘                         │
 * └─────────────────────────────────────────┘
 * Used for: Browse with territory config, categorized discovery
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

export type GridMode = 'netflix' | 'uniform' | 'territorial';

/** Responsive column configuration - can be a single number (all breakpoints) or object per breakpoint */
export type ResponsiveColumns = number | {
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
};

/** Normalize ResponsiveColumns to always be an object */
function normalizeColumns(columns: ResponsiveColumns): { sm: number; md: number; lg: number; xl: number } {
  if (typeof columns === 'number') {
    return { sm: columns, md: columns, lg: columns, xl: columns };
  }
  return {
    sm: columns.sm ?? 1,
    md: columns.md ?? 2,
    lg: columns.lg ?? 3,
    xl: columns.xl ?? 4,
  };
}

export interface TerritoryConfig {
  name: string;
  tagline?: string;
  staggerMs?: number;
  baseDelayMs?: number;
  springStiffness?: number;
  springDamping?: number;
  gradientAccent?: string;
}

export interface CategoryRowProps {
  /** Category display name */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Category items */
  children: React.ReactNode;
  /** Show "See all" link */
  showSeeAll?: boolean;
  /** See all click handler */
  onSeeAllClick?: () => void;
  /** Territory config for animation tuning */
  territory?: TerritoryConfig;
}

export interface GridProps {
  children: React.ReactNode;
  /** Grid mode - controls layout structure */
  mode?: GridMode;
  /** Atmosphere level */
  atmosphere?: AtmosphereLevel;
  /** Header content (logo, navigation) */
  header?: React.ReactNode;
  /** Hero section for featured content */
  heroSection?: React.ReactNode;
  /** Filter bar content */
  filterBar?: React.ReactNode;
  /** Active territory config (for territorial mode) */
  territory?: TerritoryConfig;
  /** Columns configuration */
  columns?: ResponsiveColumns;
  /** Gap between items */
  gap?: 'sm' | 'md' | 'lg';
  /** Featured item to highlight */
  featuredItem?: React.ReactNode;
  /** Infinite scroll handler */
  onLoadMore?: () => void;
  /** Has more items to load */
  hasMore?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Empty state content */
  emptyState?: React.ReactNode;
  /** Maximum content width */
  maxWidth?: 'lg' | 'xl' | '2xl' | 'full';
  /** Content padding */
  contentPadding?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
}

// ============================================
// CONSTANTS
// ============================================

const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

const MAX_WIDTH_VALUES: Record<string, string> = {
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  full: '100%',
};

const GAP_VALUES: Record<string, string> = {
  sm: '12px',
  md: '16px',
  lg: '24px',
};

const PADDING_VALUES: Record<string, string> = {
  sm: '12px',
  md: '16px',
  lg: '24px',
};

const DEFAULT_COLUMNS: ResponsiveColumns = {
  sm: 1,
  md: 2,
  lg: 3,
  xl: 4,
};

// ============================================
// ANIMATION VARIANTS
// ============================================

const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const itemVariants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE_PREMIUM },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

function getAnimationVariants(territory?: TerritoryConfig) {
  if (!territory) return { container: containerVariants, item: itemVariants };

  return {
    container: {
      initial: { opacity: 0 },
      animate: {
        opacity: 1,
        transition: {
          staggerChildren: (territory.staggerMs || 80) / 1000,
          delayChildren: (territory.baseDelayMs || 200) / 1000,
        },
      },
      exit: { opacity: 0, transition: { duration: 0.2 } },
    },
    item: {
      initial: { opacity: 0, y: 16 },
      animate: {
        opacity: 1,
        y: 0,
        transition: {
          type: 'spring',
          stiffness: territory.springStiffness || 500,
          damping: territory.springDamping || 30,
        },
      },
      exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
    },
  };
}

// ============================================
// GRID CONTEXT
// ============================================

interface GridContextValue {
  mode: GridMode;
  columns: ResponsiveColumns;
  gap: string;
  territory?: TerritoryConfig;
}

const GridContext = React.createContext<GridContextValue | null>(null);

export function useGrid() {
  const context = React.useContext(GridContext);
  if (!context) {
    throw new Error('useGrid must be used within a Grid template');
  }
  return context;
}

export function useGridOptional() {
  return React.useContext(GridContext);
}

// ============================================
// INTERNAL COMPONENTS
// ============================================

interface GridBackgroundProps {
  territory?: TerritoryConfig;
  effectsEnabled: boolean;
}

function GridBackground({ territory, effectsEnabled }: GridBackgroundProps) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Base layer */}
      <div className="absolute inset-0 bg-[var(--color-bg-page)]" />

      {/* Territory gradient */}
      {effectsEnabled && territory?.gradientAccent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center bottom, ${territory.gradientAccent} 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Subtle edge vignette */}
      {effectsEnabled && (
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.3) 100%)',
          }}
        />
      )}
    </div>
  );
}

interface GridLoadingProps {
  columns: ResponsiveColumns;
}

function GridLoading({ columns }: GridLoadingProps) {
  const cols = normalizeColumns(columns);
  const skeletonCount = cols.lg || 6;

  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${cols.sm || 1}, 1fr)`,
      }}
    >
      {Array.from({ length: skeletonCount }).map((_, i) => (
        <div
          key={i}
          className="aspect-[4/3] rounded-xl bg-surface animate-pulse"
        />
      ))}
    </div>
  );
}

function GridEmpty({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {children || (
        <>
          <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-text-tertiary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-1">
            Nothing here yet
          </h3>
          <p className="text-sm text-text-secondary">
            Check back later or try a different filter.
          </p>
        </>
      )}
    </div>
  );
}

interface InfiniteScrollTriggerProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

function InfiniteScrollTrigger({ onLoadMore, hasMore, isLoading }: InfiniteScrollTriggerProps) {
  const triggerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: '200px' }
    );

    if (triggerRef.current) {
      observer.observe(triggerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  if (!hasMore) return null;

  return (
    <div ref={triggerRef} className="w-full py-8 flex items-center justify-center">
      {isLoading && (
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      )}
    </div>
  );
}

// ============================================
// CATEGORY ROW (for netflix mode)
// ============================================

export function CategoryRow({
  title,
  subtitle,
  children,
  showSeeAll = true,
  onSeeAllClick,
  territory,
}: CategoryRowProps) {
  const variants = getAnimationVariants(territory);

  return (
    <motion.section
      variants={variants.container}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mb-8"
    >
      {/* Header */}
      <div className="flex items-baseline justify-between mb-4 px-4 lg:px-0">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          {subtitle && (
            <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>
          )}
        </div>
        {showSeeAll && onSeeAllClick && (
          <button
            onClick={onSeeAllClick}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            See all →
          </button>
        )}
      </div>

      {/* Horizontal scroll container */}
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4 lg:px-0 pb-2 -mx-4 lg:mx-0">
          {React.Children.map(children, (child, index) => (
            <motion.div
              key={index}
              variants={variants.item}
              className="flex-shrink-0 first:ml-4 last:mr-4 lg:first:ml-0 lg:last:mr-0"
            >
              {child}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// ============================================
// GRID ITEM WRAPPER
// ============================================

export interface GridItemProps {
  children: React.ReactNode;
  className?: string;
}

export function GridItem({ children, className }: GridItemProps) {
  const { territory } = useGridOptional() || {};
  const variants = getAnimationVariants(territory);

  return (
    <motion.div variants={variants.item} className={className}>
      {children}
    </motion.div>
  );
}

// ============================================
// GRID SECTION (for territorial mode)
// ============================================

export interface GridSectionProps {
  title: string;
  tagline?: string;
  territory?: TerritoryConfig;
  children: React.ReactNode;
  className?: string;
}

export function GridSection({
  title,
  tagline,
  territory,
  children,
  className,
}: GridSectionProps) {
  const gridContext = useGridOptional();
  const effectiveTerritory = territory || gridContext?.territory;
  const variants = getAnimationVariants(effectiveTerritory);

  return (
    <motion.section
      variants={variants.container}
      initial="initial"
      animate="animate"
      className={cn('mb-12', className)}
    >
      {/* Section header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
        {(tagline || effectiveTerritory?.tagline) && (
          <p className="text-sm text-text-secondary mt-1">
            {tagline || effectiveTerritory?.tagline}
          </p>
        )}
      </div>

      {/* Section content */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {React.Children.map(children, (child, index) => (
          <motion.div key={index} variants={variants.item}>
            {child}
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface GridInnerProps extends Omit<GridProps, 'atmosphere'> {}

function GridInner({
  children,
  mode = 'uniform',
  header,
  heroSection,
  filterBar,
  territory,
  columns = DEFAULT_COLUMNS,
  gap = 'md',
  featuredItem,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  emptyState,
  maxWidth = 'xl',
  contentPadding = 'md',
  className,
}: GridInnerProps) {
  const { effectsEnabled } = useAtmosphere();
  const variants = getAnimationVariants(territory);
  const cols = normalizeColumns(columns);

  const gridContext: GridContextValue = React.useMemo(
    () => ({
      mode,
      columns,
      gap: GAP_VALUES[gap],
      territory,
    }),
    [mode, columns, gap, territory]
  );

  const hasChildren = React.Children.count(children) > 0;

  // Generate grid template columns based on mode
  const getGridStyles = (): React.CSSProperties => {
    if (mode === 'netflix') {
      return {}; // Netflix mode doesn't use CSS grid
    }

    return {
      display: 'grid',
      gap: GAP_VALUES[gap],
      gridTemplateColumns: `repeat(${cols.sm}, 1fr)`,
    };
  };

  // Get responsive grid classes for uniform/territorial modes
  const getGridClasses = () => {
    if (mode === 'netflix') return '';

    const classes = [
      `sm:grid-cols-${cols.sm}`,
      `md:grid-cols-${cols.md}`,
      `lg:grid-cols-${cols.lg}`,
      `xl:grid-cols-${cols.xl}`,
    ];

    return classes.join(' ');
  };

  return (
    <GridContext.Provider value={gridContext}>
      <div className={cn('relative min-h-screen flex flex-col', className)}>
        {/* Background */}
        <GridBackground territory={territory} effectsEnabled={effectsEnabled} />

        {/* Header */}
        {header && (
          <header className="relative z-10 sticky top-0 bg-ground/80 backdrop-blur-md border-b border-border-subtle">
            {header}
          </header>
        )}

        {/* Hero section */}
        {heroSection && (
          <div className="relative z-10">
            {heroSection}
          </div>
        )}

        {/* Main content */}
        <main
          className="relative z-10 flex-1"
          style={{
            padding: PADDING_VALUES[contentPadding],
          }}
        >
          <div
            className="mx-auto"
            style={{ maxWidth: MAX_WIDTH_VALUES[maxWidth] }}
          >
            {/* Filter bar */}
            {filterBar && (
              <div className="mb-6">
                {filterBar}
              </div>
            )}

            {/* Featured item */}
            {featuredItem && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE_PREMIUM }}
                className="mb-8"
              >
                {featuredItem}
              </motion.div>
            )}

            {/* Loading state */}
            {isLoading && !hasChildren && (
              <GridLoading columns={columns} />
            )}

            {/* Empty state */}
            {!isLoading && !hasChildren && (
              <GridEmpty>{emptyState}</GridEmpty>
            )}

            {/* Content */}
            {hasChildren && (
              <AnimatePresence mode="wait">
                {mode === 'netflix' ? (
                  // Netflix mode: children are CategoryRow components
                  <motion.div
                    key="netflix-content"
                    variants={containerVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    {children}
                  </motion.div>
                ) : mode === 'territorial' ? (
                  // Territorial mode: children are GridSection components
                  <motion.div
                    key="territorial-content"
                    variants={containerVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    {children}
                  </motion.div>
                ) : (
                  // Uniform mode: standard grid
                  <motion.div
                    key="uniform-content"
                    variants={variants.container}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className={cn('grid', getGridClasses())}
                    style={getGridStyles()}
                  >
                    {React.Children.map(children, (child, index) => (
                      <motion.div key={index} variants={variants.item}>
                        {child}
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Infinite scroll trigger */}
            {onLoadMore && hasMore && (
              <InfiniteScrollTrigger
                onLoadMore={onLoadMore}
                hasMore={hasMore}
                isLoading={isLoading}
              />
            )}
          </div>
        </main>
      </div>
    </GridContext.Provider>
  );
}

/**
 * Grid Template - Curated Discovery
 *
 * Presents content in organized, browsable layouts.
 * Three modes for different discovery experiences.
 *
 * @example
 * ```tsx
 * // Netflix-style horizontal rows
 * <Grid mode="netflix" atmosphere="spaces">
 *   <CategoryRow title="Popular">
 *     <SpaceCard />
 *     <SpaceCard />
 *   </CategoryRow>
 * </Grid>
 *
 * // Uniform grid for search results
 * <Grid mode="uniform" columns={{ sm: 1, md: 2, lg: 3 }}>
 *   <GridItem><SpaceCard /></GridItem>
 *   <GridItem><SpaceCard /></GridItem>
 * </Grid>
 *
 * // Territorial with category-specific styling
 * <Grid mode="territorial" territory={studentOrgTerritory}>
 *   <GridSection title="Student Orgs">
 *     <SpaceCard />
 *   </GridSection>
 * </Grid>
 * ```
 */
export function Grid({ atmosphere = 'spaces', ...props }: GridProps) {
  return (
    <AtmosphereProvider defaultAtmosphere={atmosphere}>
      <GridInner {...props} />
    </AtmosphereProvider>
  );
}

/**
 * GridStatic - Non-animated version for loading states
 */
export function GridStatic(props: Omit<GridProps, 'atmosphere'>) {
  return <GridInner {...props} />;
}

export default Grid;
