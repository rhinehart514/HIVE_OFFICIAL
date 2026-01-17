'use client';

/**
 * TemplateScroller Primitive - LOCKED 2026-01-14
 *
 * LOCKED: Horizontal template carousel for HiveLab
 * Apple Glass Dark cards, hover brightness, scroll with fades.
 *
 * Recipe:
 *   container: Horizontal scroll with edge fades
 *   cards: Glass surface, rounded-2xl, aspect-video preview
 *   hover: brightness-110 (no scale)
 *   selected: White border ring
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// LOCKED: Glass card surface
const glassCardSurface = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
};

// Container variants
const templateScrollerContainerVariants = cva(
  [
    'relative',
    'w-full',
  ].join(' ')
);

// Scroll area variants
const templateScrollerScrollAreaVariants = cva(
  [
    'flex',
    'overflow-x-auto',
    'scroll-smooth',
    'gap-4',
    'pb-4',
    // Hide scrollbar
    'scrollbar-none',
    '[&::-webkit-scrollbar]:hidden',
    '[-ms-overflow-style:none]',
    '[scrollbar-width:none]',
  ].join(' ')
);

// Card variants
const templateCardVariants = cva(
  [
    'shrink-0',
    'rounded-2xl',
    'border border-white/[0.06]',
    'overflow-hidden',
    'transition-all duration-200',
    'cursor-pointer',
    // Hover (brightness, not scale)
    'hover:brightness-110',
    // Focus (WHITE)
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A09]',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'w-48',
        default: 'w-64',
        lg: 'w-80',
      },
      selected: {
        true: 'ring-2 ring-white/50',
        false: '',
      },
    },
    defaultVariants: {
      size: 'default',
      selected: false,
    },
  }
);

// Preview variants
const templatePreviewVariants = cva(
  [
    'aspect-[16/10]',
    'bg-[#0A0A09]',
    'flex items-center justify-center',
  ].join(' ')
);

// Fade overlay variants
const fadeOverlayVariants = cva(
  [
    'absolute top-0 bottom-4',
    'w-12 pointer-events-none',
    'z-10',
    'transition-opacity duration-200',
  ].join(' '),
  {
    variants: {
      side: {
        left: 'left-0 bg-gradient-to-r from-[#0A0A09] to-transparent',
        right: 'right-0 bg-gradient-to-l from-[#0A0A09] to-transparent',
      },
      visible: {
        true: 'opacity-100',
        false: 'opacity-0',
      },
    },
    defaultVariants: {
      visible: false,
    },
  }
);

// Types
export interface TemplateItem {
  /** Unique identifier */
  id: string;
  /** Template name */
  name: string;
  /** Description */
  description?: string;
  /** Preview image URL */
  previewUrl?: string;
  /** Category/tag */
  category?: string;
  /** Usage count (for popularity) */
  usageCount?: number;
  /** Is featured */
  featured?: boolean;
  /** Icon (if no preview image) */
  icon?: React.ReactNode;
}

export interface TemplateScrollerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Template items */
  templates: TemplateItem[];
  /** Selected template ID */
  value?: string;
  /** Selection handler */
  onValueChange?: (templateId: string) => void;
  /** Card size */
  size?: 'sm' | 'default' | 'lg';
  /** Show edge fades */
  showFades?: boolean;
  /** Section title */
  title?: string;
  /** Show usage counts */
  showUsageCounts?: boolean;
  /** Show "Create blank" option first */
  showBlankOption?: boolean;
  /** Blank option handler */
  onCreateBlank?: () => void;
}

// Template card component
const TemplateCard: React.FC<{
  template: TemplateItem;
  isSelected: boolean;
  size: 'sm' | 'default' | 'lg';
  showUsageCount?: boolean;
  onClick: () => void;
}> = ({ template, isSelected, size, showUsageCount, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(templateCardVariants({ size, selected: isSelected }))}
      style={glassCardSurface}
    >
      {/* Preview area */}
      <div className={cn(templatePreviewVariants())}>
        {template.previewUrl ? (
          <img
            src={template.previewUrl}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        ) : template.icon ? (
          <div className="text-white/30 text-4xl">{template.icon}</div>
        ) : (
          <div className="text-white/20 text-4xl font-light">
            {template.name[0]}
          </div>
        )}
      </div>

      {/* Info area */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-white truncate">
              {template.name}
            </h3>
            {template.description && (
              <p className="text-xs text-white/50 truncate mt-0.5">
                {template.description}
              </p>
            )}
          </div>
          {template.featured && (
            <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#D4AF37]/20 text-[#D4AF37]">
              Featured
            </span>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 mt-2">
          {template.category && (
            <span className="text-[10px] text-white/40">{template.category}</span>
          )}
          {showUsageCount && template.usageCount !== undefined && (
            <>
              {template.category && <span className="text-white/20">·</span>}
              <span className="text-[10px] text-white/40 tabular-nums">
                {template.usageCount.toLocaleString()} uses
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  );
};

// Blank card component
const BlankCard: React.FC<{
  size: 'sm' | 'default' | 'lg';
  onClick: () => void;
}> = ({ size, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        templateCardVariants({ size, selected: false }),
        'border-dashed border-white/10'
      )}
      style={{ background: 'transparent' }}
    >
      {/* Preview area */}
      <div className={cn(templatePreviewVariants(), 'border-b border-white/[0.06]')}>
        <div className="flex flex-col items-center gap-2">
          <svg
            className="w-8 h-8 text-white/20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </div>
      </div>

      {/* Info area */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-white/60">Start blank</h3>
        <p className="text-xs text-white/40 mt-0.5">Build from scratch</p>
      </div>
    </button>
  );
};

// Main component
const TemplateScroller = React.forwardRef<HTMLDivElement, TemplateScrollerProps>(
  (
    {
      className,
      templates,
      value,
      onValueChange,
      size = 'default',
      showFades = true,
      title,
      showUsageCounts = false,
      showBlankOption = false,
      onCreateBlank,
      ...props
    },
    ref
  ) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = React.useState(false);
    const [canScrollRight, setCanScrollRight] = React.useState(false);

    // Check scroll position for fades
    const updateScrollState = React.useCallback(() => {
      const el = scrollRef.current;
      if (!el) return;

      const { scrollLeft, scrollWidth, clientWidth } = el;
      setCanScrollLeft(scrollLeft > 8);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 8);
    }, []);

    // Initialize and listen for scroll
    React.useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;

      updateScrollState();
      el.addEventListener('scroll', updateScrollState, { passive: true });

      const resizeObserver = new ResizeObserver(updateScrollState);
      resizeObserver.observe(el);

      return () => {
        el.removeEventListener('scroll', updateScrollState);
        resizeObserver.disconnect();
      };
    }, [updateScrollState, templates]);

    return (
      <div
        ref={ref}
        className={cn(templateScrollerContainerVariants(), className)}
        {...props}
      >
        {/* Title */}
        {title && (
          <h2 className="text-sm font-medium text-white/60 mb-3">{title}</h2>
        )}

        {/* Left fade */}
        {showFades && (
          <div
            className={cn(fadeOverlayVariants({ side: 'left', visible: canScrollLeft }))}
            aria-hidden="true"
          />
        )}

        {/* Scroll area */}
        <div
          ref={scrollRef}
          className={cn(templateScrollerScrollAreaVariants())}
        >
          {/* Blank option */}
          {showBlankOption && onCreateBlank && (
            <BlankCard size={size} onClick={onCreateBlank} />
          )}

          {/* Templates */}
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={value === template.id}
              size={size}
              showUsageCount={showUsageCounts}
              onClick={() => onValueChange?.(template.id)}
            />
          ))}
        </div>

        {/* Right fade */}
        {showFades && (
          <div
            className={cn(fadeOverlayVariants({ side: 'right', visible: canScrollRight }))}
            aria-hidden="true"
          />
        )}
      </div>
    );
  }
);

TemplateScroller.displayName = 'TemplateScroller';

export {
  TemplateScroller,
  TemplateCard,
  BlankCard,
  // Export variants
  templateScrollerContainerVariants,
  templateScrollerScrollAreaVariants,
  templateCardVariants,
  templatePreviewVariants,
  fadeOverlayVariants as templateScrollerFadeOverlayVariants,
  // Export style helpers
  glassCardSurface as templateCardGlassSurface,
};
