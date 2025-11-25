/**
 * HIVE Tailwind Variants Configuration
 * Type-safe component styling with variants, slots, and compound variants
 */

import { tv, type VariantProps } from 'tailwind-variants';

// Re-export tv and VariantProps for convenience
export { tv, type VariantProps };

// ============================================================================
// BUTTON VARIANTS
// ============================================================================

export const buttonVariants = tv({
  base: [
    'inline-flex items-center justify-center gap-2',
    'font-medium rounded-lg',
    'transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  variants: {
    variant: {
      default: 'bg-foreground text-background hover:bg-foreground/90',
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      outline: 'border border-border bg-transparent hover:bg-accent',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      link: 'text-primary underline-offset-4 hover:underline',
    },
    size: {
      xs: 'h-7 px-2 text-xs rounded-md',
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-11 px-6 text-base',
      xl: 'h-12 px-8 text-lg',
      icon: 'h-10 w-10',
    },
  },
  compoundVariants: [
    {
      variant: 'primary',
      size: 'lg',
      class: 'font-semibold',
    },
  ],
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

export type ButtonVariants = VariantProps<typeof buttonVariants>;

// ============================================================================
// CARD VARIANTS
// ============================================================================

export const cardVariants = tv({
  slots: {
    root: [
      'rounded-xl border border-border bg-card text-card-foreground',
      'shadow-sm',
    ],
    header: 'flex flex-col space-y-1.5 p-6',
    title: 'text-lg font-semibold leading-none tracking-tight',
    description: 'text-sm text-muted-foreground',
    content: 'p-6 pt-0',
    footer: 'flex items-center p-6 pt-0',
  },
  variants: {
    variant: {
      default: {},
      interactive: {
        root: 'cursor-pointer transition-colors hover:bg-accent/50',
      },
      elevated: {
        root: 'shadow-md',
      },
      outline: {
        root: 'bg-transparent',
      },
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export type CardVariants = VariantProps<typeof cardVariants>;

// ============================================================================
// INPUT VARIANTS
// ============================================================================

export const inputVariants = tv({
  base: [
    'flex w-full rounded-lg border border-input bg-background px-3 py-2',
    'text-sm ring-offset-background',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
    'placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  variants: {
    size: {
      sm: 'h-8 text-xs',
      md: 'h-10 text-sm',
      lg: 'h-12 text-base px-4',
    },
    state: {
      default: '',
      error: 'border-destructive focus-visible:ring-destructive',
      success: 'border-green-500 focus-visible:ring-green-500',
    },
  },
  defaultVariants: {
    size: 'md',
    state: 'default',
  },
});

export type InputVariants = VariantProps<typeof inputVariants>;

// ============================================================================
// BADGE VARIANTS
// ============================================================================

export const badgeVariants = tv({
  base: [
    'inline-flex items-center rounded-md px-2.5 py-0.5',
    'text-xs font-medium',
    'transition-colors',
  ],
  variants: {
    variant: {
      default: 'bg-secondary text-secondary-foreground',
      primary: 'bg-primary text-primary-foreground',
      outline: 'border border-border text-foreground',
      success: 'bg-green-500/20 text-green-500',
      warning: 'bg-yellow-500/20 text-yellow-500',
      destructive: 'bg-destructive/20 text-destructive',
      muted: 'bg-muted text-muted-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export type BadgeVariants = VariantProps<typeof badgeVariants>;

// ============================================================================
// SKELETON VARIANTS
// ============================================================================

export const skeletonVariants = tv({
  base: 'animate-pulse rounded-md bg-muted',
  variants: {
    variant: {
      default: '',
      circular: 'rounded-full',
      text: 'h-4',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export type SkeletonVariants = VariantProps<typeof skeletonVariants>;

// ============================================================================
// AVATAR VARIANTS
// ============================================================================

export const avatarVariants = tv({
  slots: {
    root: 'relative flex shrink-0 overflow-hidden rounded-full',
    image: 'aspect-square h-full w-full',
    fallback: 'flex h-full w-full items-center justify-center rounded-full bg-muted',
  },
  variants: {
    size: {
      xs: { root: 'h-6 w-6', fallback: 'text-[10px]' },
      sm: { root: 'h-8 w-8', fallback: 'text-xs' },
      md: { root: 'h-10 w-10', fallback: 'text-sm' },
      lg: { root: 'h-12 w-12', fallback: 'text-base' },
      xl: { root: 'h-16 w-16', fallback: 'text-lg' },
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export type AvatarVariants = VariantProps<typeof avatarVariants>;

// ============================================================================
// ALERT VARIANTS
// ============================================================================

export const alertVariants = tv({
  slots: {
    root: 'relative w-full rounded-lg border p-4',
    icon: 'h-4 w-4',
    title: 'mb-1 font-medium leading-none tracking-tight',
    description: 'text-sm [&_p]:leading-relaxed',
  },
  variants: {
    variant: {
      default: {
        root: 'bg-background text-foreground',
      },
      destructive: {
        root: 'border-destructive/50 text-destructive [&>svg]:text-destructive',
      },
      success: {
        root: 'border-green-500/50 text-green-500 [&>svg]:text-green-500',
      },
      warning: {
        root: 'border-yellow-500/50 text-yellow-500 [&>svg]:text-yellow-500',
      },
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export type AlertVariants = VariantProps<typeof alertVariants>;

// ============================================================================
// DIALOG/MODAL VARIANTS
// ============================================================================

export const dialogVariants = tv({
  slots: {
    overlay: [
      'fixed inset-0 z-50 bg-black/60',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    ],
    content: [
      'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg',
      'translate-x-[-50%] translate-y-[-50%] gap-4',
      'border border-border bg-background p-6 shadow-lg',
      'duration-200',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
      'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
      'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
      'sm:rounded-lg',
    ],
    header: 'flex flex-col space-y-1.5 text-center sm:text-left',
    footer: 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
    title: 'text-lg font-semibold leading-none tracking-tight',
    description: 'text-sm text-muted-foreground',
  },
});

export type DialogVariants = VariantProps<typeof dialogVariants>;

// ============================================================================
// TOAST VARIANTS
// ============================================================================

export const toastVariants = tv({
  base: [
    'group pointer-events-auto relative flex w-full items-center justify-between',
    'space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg',
    'transition-all',
    'data-[swipe=cancel]:translate-x-0',
    'data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
    'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
    'data-[swipe=move]:transition-none',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[swipe=end]:animate-out data-[state=closed]:fade-out-80',
    'data-[state=closed]:slide-out-to-right-full',
    'data-[state=open]:slide-in-from-top-full',
    'data-[state=open]:sm:slide-in-from-bottom-full',
  ],
  variants: {
    variant: {
      default: 'border bg-background text-foreground',
      success: 'border-green-500 bg-green-500/10 text-green-500',
      warning: 'border-yellow-500 bg-yellow-500/10 text-yellow-500',
      destructive: 'border-destructive bg-destructive text-destructive-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export type ToastVariants = VariantProps<typeof toastVariants>;

// ============================================================================
// FEED CARD VARIANTS
// ============================================================================

export const feedCardVariants = tv({
  slots: {
    root: [
      'relative overflow-hidden rounded-xl border border-border',
      'bg-card text-card-foreground',
      'transition-all duration-200',
    ],
    header: 'flex items-start gap-3 p-4',
    avatar: 'shrink-0',
    meta: 'flex-1 min-w-0',
    author: 'font-medium text-sm truncate',
    timestamp: 'text-xs text-muted-foreground',
    content: 'px-4 pb-4',
    media: 'relative aspect-video w-full bg-muted',
    actions: 'flex items-center gap-4 border-t border-border p-4',
    actionButton: [
      'flex items-center gap-1.5 text-sm text-muted-foreground',
      'hover:text-foreground transition-colors',
    ],
  },
  variants: {
    type: {
      post: {},
      event: {
        root: 'border-l-4 border-l-primary',
      },
      tool: {
        root: 'bg-gradient-to-br from-card to-accent/10',
      },
      system: {
        root: 'bg-muted/50 border-dashed',
      },
    },
    interactive: {
      true: {
        root: 'cursor-pointer hover:bg-accent/50 hover:shadow-md',
      },
    },
  },
  defaultVariants: {
    type: 'post',
    interactive: false,
  },
});

export type FeedCardVariants = VariantProps<typeof feedCardVariants>;

// ============================================================================
// SPACE HEADER VARIANTS
// ============================================================================

export const spaceHeaderVariants = tv({
  slots: {
    root: 'relative',
    banner: 'h-32 w-full bg-gradient-to-r from-primary/20 to-accent/20',
    content: 'relative px-4 pb-4',
    avatar: '-mt-12 rounded-xl border-4 border-background',
    info: 'mt-3',
    name: 'text-xl font-bold',
    description: 'mt-1 text-sm text-muted-foreground',
    stats: 'mt-2 flex items-center gap-4 text-sm text-muted-foreground',
    actions: 'mt-4 flex items-center gap-2',
  },
  variants: {
    size: {
      compact: {
        banner: 'h-20',
        avatar: '-mt-8',
        name: 'text-lg',
      },
      default: {},
      large: {
        banner: 'h-48',
        avatar: '-mt-16',
        name: 'text-2xl',
      },
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

export type SpaceHeaderVariants = VariantProps<typeof spaceHeaderVariants>;

// ============================================================================
// RITUAL CARD VARIANTS
// ============================================================================

export const ritualCardVariants = tv({
  slots: {
    root: [
      'relative overflow-hidden rounded-xl border border-border',
      'bg-gradient-to-br from-card to-card',
    ],
    header: 'p-4',
    badge: 'text-xs font-medium uppercase tracking-wider text-primary',
    title: 'mt-1 text-lg font-bold',
    description: 'mt-1 text-sm text-muted-foreground',
    content: 'px-4 pb-4',
    progress: 'mt-4',
    progressBar: 'h-2 w-full rounded-full bg-muted overflow-hidden',
    progressFill: 'h-full bg-primary transition-all duration-500',
    footer: 'border-t border-border p-4',
    cta: 'w-full',
  },
  variants: {
    status: {
      active: {
        root: 'border-primary/50',
        badge: 'text-primary',
      },
      completed: {
        root: 'border-green-500/50',
        badge: 'text-green-500',
        progressFill: 'bg-green-500',
      },
      locked: {
        root: 'opacity-60',
        badge: 'text-muted-foreground',
      },
    },
    featured: {
      true: {
        root: 'ring-2 ring-primary/50',
      },
    },
  },
  defaultVariants: {
    status: 'active',
    featured: false,
  },
});

export type RitualCardVariants = VariantProps<typeof ritualCardVariants>;

// ============================================================================
// UTILITY VARIANTS
// ============================================================================

export const focusRingVariants = tv({
  base: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
});

export const interactiveVariants = tv({
  base: 'transition-colors hover:bg-accent hover:text-accent-foreground',
});

export const truncateVariants = tv({
  variants: {
    lines: {
      1: 'truncate',
      2: 'line-clamp-2',
      3: 'line-clamp-3',
    },
  },
  defaultVariants: {
    lines: 1,
  },
});
