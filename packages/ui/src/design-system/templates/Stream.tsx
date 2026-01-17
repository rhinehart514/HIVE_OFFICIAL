'use client';

/**
 * Stream Template
 * Source: docs/design-system/TEMPLATES.md (Template 3)
 *
 * The temporal flow. Content that moves through time—always arriving, never static.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * TEMPLATE PHILOSOPHY
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Stream is about presence in time. Messages arrive. Posts appear. The world
 * moves forward. You're part of that flow.
 *
 * Used for: Chat, Feed, Notifications, Activity logs
 *
 * The psychological contract: "Stay present. Things are happening now."
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * STREAM MODES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Mode A: Conversational (Real-time chat)
 * ┌─────────────────────────────────────┐
 * │ [Sticky Header]                     │
 * ├─────────────────────────────────────┤
 * │                                     │
 * │   ↑ Messages flow up               │
 * │   (reverse scroll)                  │
 * │   New messages at bottom            │
 * │                                     │
 * ├─────────────────────────────────────┤
 * │ [Typing indicator]                  │
 * │ [Composer at bottom]                │
 * └─────────────────────────────────────┘
 * Used for: Space chat, DMs
 *
 * Mode B: Stories (Feed/timeline)
 * ┌─────────────────────────────────────┐
 * │ [Sticky Header with filters]        │
 * ├─────────────────────────────────────┤
 * │   Card 1                            │
 * │   Card 2                            │
 * │   Card 3                            │
 * │   [Load more trigger]               │
 * ├─────────────────────────────────────┤
 * │ [Scroll to top FAB]                 │
 * └─────────────────────────────────────┘
 * Used for: Feed, notifications list
 *
 * Mode C: Sectioned (Grouped content)
 * ┌─────────────────────────────────────┐
 * │ [Header]                            │
 * ├─────────────────────────────────────┤
 * │ Today                               │
 * │   - Item 1                          │
 * │   - Item 2                          │
 * │ Yesterday                           │
 * │   - Item 3                          │
 * │ Earlier                             │
 * │   - Item 4                          │
 * └─────────────────────────────────────┘
 * Used for: Activity log, grouped notifications
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

// ============================================
// TYPES
// ============================================

export type StreamMode = 'conversational' | 'stories' | 'sectioned';

export type ScrollDirection = 'normal' | 'reverse';

export interface StreamProps {
  children: React.ReactNode;
  /** Stream mode - controls layout and scroll behavior */
  mode?: StreamMode;
  /** Atmosphere level */
  atmosphere?: AtmosphereLevel;
  /** Header content (sticky) */
  header?: React.ReactNode;
  /** Whether header is sticky */
  stickyHeader?: boolean;
  /** Composer/input component (for conversational mode) */
  composer?: React.ReactNode;
  /** Composer position */
  composerPosition?: 'bottom' | 'top';
  /** Scroll direction (reverse for chat) */
  scrollDirection?: ScrollDirection;
  /** Enable infinite scroll */
  infiniteScroll?: boolean;
  /** Load more callback */
  onLoadMore?: () => void;
  /** Whether there's more content to load */
  hasMore?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Loading component */
  loadingComponent?: React.ReactNode;
  /** Empty state component */
  emptyState?: React.ReactNode;
  /** Enable virtualization hint (component handles actual virtualization) */
  virtualized?: boolean;
  /** Maximum content width */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Content padding */
  contentPadding?: 'none' | 'sm' | 'md' | 'lg';
  /** Additional className for container */
  className?: string;
  /** Additional className for content area */
  contentClassName?: string;
  /** Scroll to top button */
  showScrollToTop?: boolean;
  /** Callback when scroll position changes */
  onScroll?: (scrollInfo: { isAtTop: boolean; isAtBottom: boolean; scrollY: number }) => void;
}

// ============================================
// CONSTANTS
// ============================================

const MAX_WIDTH_VALUES: Record<NonNullable<StreamProps['maxWidth']>, string> = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  full: '100%',
};

const CONTENT_PADDING: Record<NonNullable<StreamProps['contentPadding']>, string> = {
  none: '0',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
};

// Premium easing from design system
const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

// Animation variants
const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE_PREMIUM },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
};

const headerVariants = {
  initial: { opacity: 0, y: -10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE_PREMIUM },
  },
};

const fabVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
};

// ============================================
// STREAM CONTEXT
// ============================================

interface StreamContextValue {
  mode: StreamMode;
  scrollDirection: ScrollDirection;
  maxWidth: NonNullable<StreamProps['maxWidth']>;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  isAtTop: boolean;
  isAtBottom: boolean;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

const StreamContext = React.createContext<StreamContextValue | null>(null);

export function useStream() {
  const context = React.useContext(StreamContext);
  if (!context) {
    throw new Error('useStream must be used within a Stream template');
  }
  return context;
}

export function useStreamOptional() {
  return React.useContext(StreamContext);
}

// ============================================
// INTERNAL COMPONENTS
// ============================================

interface StreamHeaderProps {
  children: React.ReactNode;
  sticky?: boolean;
}

function StreamHeader({ children, sticky = true }: StreamHeaderProps) {
  return (
    <motion.header
      variants={headerVariants}
      initial="initial"
      animate="animate"
      className={`
        flex-shrink-0 z-10
        border-b border-[var(--color-border-subtle)]
        bg-[var(--color-bg-page)]
        ${sticky ? 'sticky top-0' : ''}
      `}
    >
      {children}
    </motion.header>
  );
}

interface StreamScrollToTopProps {
  onClick: () => void;
  visible: boolean;
}

function StreamScrollToTop({ onClick, visible }: StreamScrollToTopProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          variants={fabVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClick}
          className={`
            fixed bottom-24 right-6 z-20
            w-10 h-10 rounded-full
            bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]
            text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
            shadow-lg hover:shadow-xl
            flex items-center justify-center
            transition-colors duration-150
          `}
          aria-label="Scroll to top"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

interface StreamLoadingProps {
  children?: React.ReactNode;
}

function StreamLoading({ children }: StreamLoadingProps) {
  if (children) return <>{children}</>;

  return (
    <div className="flex items-center justify-center py-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-6 h-6 border-2 border-[var(--color-border-subtle)] border-t-[var(--color-gold)] rounded-full"
      />
    </div>
  );
}

interface StreamEmptyProps {
  children?: React.ReactNode;
}

function StreamEmpty({ children }: StreamEmptyProps) {
  if (children) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--color-bg-surface)] flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-[var(--color-text-tertiary)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
          />
        </svg>
      </div>
      <p className="text-[var(--color-text-secondary)]">Nothing here yet</p>
      <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
        Content will appear as it arrives
      </p>
    </div>
  );
}

// ============================================
// INFINITE SCROLL TRIGGER
// ============================================

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
      { threshold: 0.1 }
    );

    const trigger = triggerRef.current;
    if (trigger) {
      observer.observe(trigger);
    }

    return () => {
      if (trigger) {
        observer.unobserve(trigger);
      }
    };
  }, [hasMore, isLoading, onLoadMore]);

  if (!hasMore) return null;

  return (
    <div ref={triggerRef} className="py-4">
      {isLoading && <StreamLoading />}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface StreamInnerProps extends Omit<StreamProps, 'atmosphere'> {}

function StreamInner({
  children,
  mode = 'stories',
  header,
  stickyHeader = true,
  composer,
  composerPosition = 'bottom',
  scrollDirection: scrollDirectionProp,
  infiniteScroll = false,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  loadingComponent,
  emptyState,
  maxWidth = 'lg',
  contentPadding = 'md',
  className,
  contentClassName,
  showScrollToTop = true,
  onScroll,
}: StreamInnerProps) {
  const { effectsEnabled } = useAtmosphere();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [isAtTop, setIsAtTop] = React.useState(true);
  const [isAtBottom, setIsAtBottom] = React.useState(false);
  const [showScrollTop, setShowScrollTop] = React.useState(false);

  // Derive scroll direction from mode if not explicitly set
  const scrollDirection = scrollDirectionProp ?? (mode === 'conversational' ? 'reverse' : 'normal');

  // Scroll handlers
  const scrollToTop = React.useCallback(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToBottom = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  // Handle scroll events
  const handleScroll = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const atTop = scrollTop < 50;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 50;

    setIsAtTop(atTop);
    setIsAtBottom(atBottom);
    setShowScrollTop(scrollTop > 300);

    onScroll?.({
      isAtTop: atTop,
      isAtBottom: atBottom,
      scrollY: scrollTop,
    });
  }, [onScroll]);

  // Attach scroll listener
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Context value
  const streamContext: StreamContextValue = React.useMemo(
    () => ({
      mode,
      scrollDirection,
      maxWidth,
      scrollToTop,
      scrollToBottom,
      isAtTop,
      isAtBottom,
      scrollContainerRef: scrollContainerRef as React.RefObject<HTMLDivElement>,
    }),
    [mode, scrollDirection, maxWidth, scrollToTop, scrollToBottom, isAtTop, isAtBottom]
  );

  // Check if content is empty (React.Children.count)
  const isEmpty = React.Children.count(children) === 0;

  // Content styles based on mode
  const getContentStyles = (): React.CSSProperties => {
    const styles: React.CSSProperties = {
      maxWidth: MAX_WIDTH_VALUES[maxWidth],
      margin: '0 auto',
      padding: CONTENT_PADDING[contentPadding],
    };

    if (scrollDirection === 'reverse') {
      styles.display = 'flex';
      styles.flexDirection = 'column-reverse';
    }

    return styles;
  };

  return (
    <StreamContext.Provider value={streamContext}>
      <div
        className={`
          flex flex-col h-full
          bg-[var(--color-bg-page)]
          ${className ?? ''}
        `}
      >
        {/* Header */}
        {header && (
          <StreamHeader sticky={stickyHeader}>
            {header}
          </StreamHeader>
        )}

        {/* Composer at top (for some modes) */}
        {composer && composerPosition === 'top' && (
          <div className="flex-shrink-0 border-b border-[var(--color-border-subtle)]">
            <div style={{ maxWidth: MAX_WIDTH_VALUES[maxWidth], margin: '0 auto' }}>
              {composer}
            </div>
          </div>
        )}

        {/* Scrollable content area */}
        <main
          ref={scrollContainerRef}
          className={`
            flex-1 overflow-y-auto overflow-x-hidden
            ${contentClassName ?? ''}
          `}
          style={scrollDirection === 'reverse' ? { display: 'flex', flexDirection: 'column-reverse' } : undefined}
        >
          <div style={getContentStyles()}>
            {/* Loading state at top for stories/sectioned */}
            {isLoading && mode !== 'conversational' && !children && (
              <StreamLoading>{loadingComponent}</StreamLoading>
            )}

            {/* Empty state */}
            {isEmpty && !isLoading ? (
              <StreamEmpty>{emptyState}</StreamEmpty>
            ) : (
              children
            )}

            {/* Infinite scroll trigger */}
            {infiniteScroll && onLoadMore && mode !== 'conversational' && (
              <InfiniteScrollTrigger
                onLoadMore={onLoadMore}
                hasMore={hasMore}
                isLoading={isLoading}
              />
            )}

            {/* Loading indicator for conversational (at top of reverse scroll) */}
            {isLoading && mode === 'conversational' && hasMore && (
              <div className="py-4">
                <StreamLoading>{loadingComponent}</StreamLoading>
              </div>
            )}
          </div>
        </main>

        {/* Composer at bottom (default for conversational) */}
        {composer && composerPosition === 'bottom' && (
          <div className="flex-shrink-0 border-t border-[var(--color-border-subtle)]">
            <div style={{ maxWidth: MAX_WIDTH_VALUES[maxWidth], margin: '0 auto' }}>
              {composer}
            </div>
          </div>
        )}

        {/* Scroll to top button */}
        {showScrollToTop && mode !== 'conversational' && (
          <StreamScrollToTop
            onClick={scrollToTop}
            visible={showScrollTop}
          />
        )}
      </div>
    </StreamContext.Provider>
  );
}

/**
 * Stream Template - Temporal content flow
 *
 * For content that moves through time—messages, posts, notifications.
 * Everything is about now. Things arrive. The world moves forward.
 *
 * @example
 * ```tsx
 * // Chat (conversational mode)
 * <Stream
 *   mode="conversational"
 *   atmosphere="spaces"
 *   header={<ChatHeader />}
 *   composer={<ChatInput />}
 * >
 *   {messages.map(msg => <Message key={msg.id} {...msg} />)}
 * </Stream>
 *
 * // Feed (stories mode)
 * <Stream
 *   mode="stories"
 *   atmosphere="spaces"
 *   header={<FeedFilters />}
 *   infiniteScroll
 *   onLoadMore={loadMore}
 *   hasMore={hasNextPage}
 * >
 *   {posts.map(post => <PostCard key={post.id} {...post} />)}
 * </Stream>
 *
 * // Notifications (sectioned mode)
 * <Stream
 *   mode="sectioned"
 *   atmosphere="spaces"
 *   header={<NotificationHeader />}
 * >
 *   <StreamSection title="Today">
 *     {todayNotifications}
 *   </StreamSection>
 *   <StreamSection title="Yesterday">
 *     {yesterdayNotifications}
 *   </StreamSection>
 * </Stream>
 * ```
 */
export function Stream({ atmosphere = 'spaces', ...props }: StreamProps) {
  return (
    <AtmosphereProvider defaultAtmosphere={atmosphere}>
      <StreamInner {...props} />
    </AtmosphereProvider>
  );
}

/**
 * StreamStatic - Non-animated version for SSR/loading states
 */
export function StreamStatic({
  children,
  maxWidth = 'lg',
  className,
}: Pick<StreamProps, 'children' | 'maxWidth' | 'className'>) {
  return (
    <div className={`flex flex-col h-full bg-[var(--color-bg-page)] ${className ?? ''}`}>
      <main className="flex-1 overflow-y-auto">
        <div
          style={{
            maxWidth: MAX_WIDTH_VALUES[maxWidth],
            margin: '0 auto',
            padding: CONTENT_PADDING.md,
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

/**
 * StreamSection - For sectioned mode grouping
 */
export interface StreamSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function StreamSection({ title, children, className }: StreamSectionProps) {
  return (
    <section className={`mb-6 ${className ?? ''}`}>
      <motion.h3
        variants={itemVariants}
        initial="initial"
        animate="animate"
        className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3 px-1"
      >
        {title}
      </motion.h3>
      <div className="space-y-2">
        {children}
      </div>
    </section>
  );
}

/**
 * StreamItem - Animated wrapper for stream items
 */
export interface StreamItemProps {
  children: React.ReactNode;
  className?: string;
}

export function StreamItem({ children, className }: StreamItemProps) {
  return (
    <motion.div
      variants={itemVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Named exports for flexibility
export { StreamHeader, StreamScrollToTop, StreamLoading, StreamEmpty };
export type { StreamContextValue };
