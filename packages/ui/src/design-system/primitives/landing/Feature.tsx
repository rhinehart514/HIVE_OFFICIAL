'use client';
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';

export const featureVariants = cva('group flex flex-col', {
  variants: {
    variant: { default: 'items-start text-left', center: 'items-center text-center' },
    size: { sm: 'gap-3', md: 'gap-4', lg: 'gap-5' },
  },
  defaultVariants: { variant: 'default', size: 'md' },
});

export const featureIconVariants = cva('flex items-center justify-center rounded-xl transition-all duration-300', {
  variants: { size: { sm: 'w-10 h-10', md: 'w-12 h-12', lg: 'w-14 h-14' } },
  defaultVariants: { size: 'md' },
});

export interface FeatureProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof featureVariants> {
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
}

export const Feature = React.forwardRef<HTMLDivElement, FeatureProps>(
  ({ icon, title, description, href, variant, size, className, ...props }, ref) => {
    const content = (
      <>
        <div className={cn(featureIconVariants({ size }))} style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <span className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" style={{ color: 'var(--text-secondary)' }}>{icon}</span>
        </div>
        <h3 className="text-lg font-semibold transition-colors duration-200" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{description}</p>
      </>
    );
    if (href) {
      return <a href={href} ref={ref as React.Ref<HTMLAnchorElement>} className={cn(featureVariants({ variant, size }), 'cursor-pointer', className)} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>{content}</a>;
    }
    return <div ref={ref} className={cn(featureVariants({ variant, size }), className)} {...props}>{content}</div>;
  }
);
Feature.displayName = 'Feature';
