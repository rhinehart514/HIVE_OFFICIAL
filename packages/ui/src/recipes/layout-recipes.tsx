import * as React from 'react'
import { cn } from '../lib/utils'

/**
 * Stack layout - vertical spacing between children.
 */
interface StackProps {
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch'
  children: React.ReactNode
  className?: string
}

export function Stack({
  gap = 'md',
  align = 'stretch',
  children,
  className,
}: StackProps) {
  const gapClasses = {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  }

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  }

  return (
    <div
      className={cn(
        'flex flex-col',
        gapClasses[gap],
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Row layout - horizontal spacing between children.
 */
interface RowProps {
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  wrap?: boolean
  children: React.ReactNode
  className?: string
}

export function Row({
  gap = 'md',
  align = 'center',
  justify = 'start',
  wrap = false,
  children,
  className,
}: RowProps) {
  const gapClasses = {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  }

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    baseline: 'items-baseline',
    stretch: 'items-stretch',
  }

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  }

  return (
    <div
      className={cn(
        'flex',
        gapClasses[gap],
        alignClasses[align],
        justifyClasses[justify],
        wrap && 'flex-wrap',
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Split layout - two columns with content on each side.
 */
interface SplitProps {
  left: React.ReactNode
  right: React.ReactNode
  ratio?: '1:1' | '1:2' | '2:1' | '1:3' | '3:1'
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Split({
  left,
  right,
  ratio = '1:1',
  gap = 'md',
  className,
}: SplitProps) {
  const ratioClasses = {
    '1:1': 'grid-cols-2',
    '1:2': 'grid-cols-3',
    '2:1': 'grid-cols-3',
    '1:3': 'grid-cols-4',
    '3:1': 'grid-cols-4',
  }

  const leftSpan = {
    '1:1': 'col-span-1',
    '1:2': 'col-span-1',
    '2:1': 'col-span-2',
    '1:3': 'col-span-1',
    '3:1': 'col-span-3',
  }

  const rightSpan = {
    '1:1': 'col-span-1',
    '1:2': 'col-span-2',
    '2:1': 'col-span-1',
    '1:3': 'col-span-3',
    '3:1': 'col-span-1',
  }

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  }

  return (
    <div
      className={cn(
        'grid',
        ratioClasses[ratio],
        gapClasses[gap],
        className
      )}
    >
      <div className={leftSpan[ratio]}>{left}</div>
      <div className={rightSpan[ratio]}>{right}</div>
    </div>
  )
}

/**
 * Center layout - centers content both horizontally and vertically.
 */
interface CenterProps {
  children: React.ReactNode
  className?: string
}

export function Center({ children, className }: CenterProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      {children}
    </div>
  )
}

/**
 * Container with max-width and padding.
 */
interface ContainerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  children: React.ReactNode
  className?: string
}

export function Container({ size = 'lg', children, className }: ContainerProps) {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  }

  return (
    <div className={cn('mx-auto px-4 sm:px-6', sizeClasses[size], className)}>
      {children}
    </div>
  )
}

/**
 * Section with optional title and description.
 */
interface SectionProps {
  title?: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function Section({
  title,
  description,
  action,
  children,
  className,
}: SectionProps) {
  return (
    <section className={cn('space-y-4', className)}>
      {(title || action) && (
        <div className="flex items-start justify-between">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-text-primary">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-text-secondary mt-1">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

/**
 * Divider with optional label.
 */
interface DividerProps {
  label?: string
  className?: string
}

export function Divider({ label, className }: DividerProps) {
  if (label) {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <div className="flex-1 h-px bg-border-subtle" />
        <span className="text-xs text-text-tertiary">{label}</span>
        <div className="flex-1 h-px bg-border-subtle" />
      </div>
    )
  }

  return <div className={cn('h-px bg-border-subtle', className)} />
}

/**
 * Grid layout with responsive columns.
 */
interface GridProps {
  cols?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  className?: string
}

export function Grid({ cols = 3, gap = 'md', children, className }: GridProps) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  }

  return (
    <div className={cn('grid', colClasses[cols], gapClasses[gap], className)}>
      {children}
    </div>
  )
}

/**
 * Sticky header layout.
 */
interface StickyHeaderProps {
  children: React.ReactNode
  className?: string
}

export function StickyHeader({ children, className }: StickyHeaderProps) {
  return (
    <div
      className={cn(
        'sticky top-0 z-40 bg-background-primary/80 backdrop-blur-lg border-b border-border-subtle',
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Page layout with header, content, and optional sidebar.
 */
interface PageLayoutProps {
  header?: React.ReactNode
  sidebar?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function PageLayout({
  header,
  sidebar,
  children,
  className,
}: PageLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-background-primary', className)}>
      {header && <StickyHeader>{header}</StickyHeader>}
      <div className="flex">
        {sidebar && (
          <aside className="hidden lg:block w-64 shrink-0 border-r border-border-subtle">
            {sidebar}
          </aside>
        )}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}

/**
 * Card grid for dashboard layouts.
 */
interface CardGridProps {
  children: React.ReactNode
  className?: string
}

export function CardGrid({ children, className }: CardGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4',
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Masonry-style layout for variable height cards.
 */
interface MasonryProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4
  className?: string
}

export function Masonry({ children, columns = 3, className }: MasonryProps) {
  const columnClasses = {
    2: 'columns-1 sm:columns-2',
    3: 'columns-1 sm:columns-2 lg:columns-3',
    4: 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4',
  }

  return (
    <div className={cn(columnClasses[columns], 'gap-4', className)}>
      {React.Children.map(children, (child) => (
        <div className="break-inside-avoid mb-4">{child}</div>
      ))}
    </div>
  )
}
