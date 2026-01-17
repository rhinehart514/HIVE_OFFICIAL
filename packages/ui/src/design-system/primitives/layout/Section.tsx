'use client';
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';

export const sectionVariants = cva('relative w-full', {
  variants: {
    variant: { default: '', hero: '', feature: '', cta: '', footer: '' },
    padding: {
      none: 'py-0',
      sm: 'py-8 md:py-12',
      md: 'py-12 md:py-16',
      lg: 'py-16 md:py-24',
      xl: 'py-24 md:py-32',
      '2xl': 'py-32 md:py-40',
    },
    background: {
      transparent: 'bg-transparent',
      base: 'bg-[var(--bg-base)]',
      subtle: 'bg-[var(--bg-subtle)]',
      elevated: 'bg-[var(--bg-elevated)]',
      void: 'bg-[var(--bg-void)]',
    },
  },
  defaultVariants: { variant: 'default', padding: 'lg', background: 'transparent' },
});

export interface SectionProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof sectionVariants> {}

export const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ variant, padding, background, className, children, ...props }, ref) => (
    <section ref={ref} className={cn(sectionVariants({ variant, padding, background }), className)} {...props}>
      {children}
    </section>
  )
);
Section.displayName = 'Section';
