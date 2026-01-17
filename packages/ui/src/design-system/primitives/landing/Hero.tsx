'use client';
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';

export const heroVariants = cva('w-full', {
  variants: {
    variant: {
      center: 'text-center flex flex-col items-center',
      left: 'text-left flex flex-col items-start',
      split: 'grid md:grid-cols-2 gap-12 items-center',
    },
  },
  defaultVariants: { variant: 'center' },
});

export interface HeroProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof heroVariants> {
  media?: React.ReactNode;
}

function HeroRoot({ variant, media, className, children, ...props }: HeroProps) {
  if (variant === 'split' && media) {
    return (
      <div className={cn(heroVariants({ variant }), className)} {...props}>
        <div className="flex flex-col gap-6">{children}</div>
        <div className="flex items-center justify-center">{media}</div>
      </div>
    );
  }
  return <div className={cn(heroVariants({ variant }), className)} {...props}>{children}</div>;
}

function HeroEyebrow({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4', className)} {...props}>{children}</div>;
}

function HeroTitle({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-6', className)} {...props}>{children}</div>;
}

function HeroDescription({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-8 max-w-2xl', className)} {...props}>{children}</div>;
}

function HeroActions({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col sm:flex-row items-center gap-4', className)} {...props}>{children}</div>;
}

export const Hero = Object.assign(HeroRoot, {
  Eyebrow: HeroEyebrow,
  Title: HeroTitle,
  Description: HeroDescription,
  Actions: HeroActions,
});
