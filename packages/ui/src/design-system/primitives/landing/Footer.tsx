'use client';
import * as React from 'react';
import { cn } from '../../../lib/utils';
import { Logo } from '../Logo';

export interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'minimal' | 'full';
}
export interface FooterLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {}
export interface FooterLinkGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

function FooterRoot({ variant = 'minimal', className, children, ...props }: FooterProps) {
  const isMinimal = variant === 'minimal';
  return (
    <footer className={cn('w-full', isMinimal ? 'py-8' : 'py-12 md:py-16', className)} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', background: 'var(--bg-void)' }} {...props}>
      <div className={cn('max-w-screen-xl mx-auto px-6', isMinimal ? 'flex flex-col sm:flex-row items-center justify-between gap-4' : 'flex flex-col gap-12')}>
        {children}
      </div>
    </footer>
  );
}

function FooterBrand({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center gap-4', className)} {...props}>
      <Logo size="sm" variant="mark" color="muted" />
      {children}
    </div>
  );
}

function FooterLinks({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center gap-6', className)} {...props}>{children}</div>;
}

function FooterLinkGroup({ title, className, children, ...props }: FooterLinkGroupProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)} {...props}>
      {title && <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{title}</span>}
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function FooterLink({ className, children, ...props }: FooterLinkProps) {
  return (
    <a className={cn('text-sm transition-colors duration-200 text-[var(--text-muted)] hover:text-[var(--text-secondary)]', className)} {...props}>{children}</a>
  );
}

function FooterCopyright({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs', className)} style={{ color: 'var(--text-dim)' }} {...props}>
      {children || `© ${new Date().getFullYear()} HIVE. All rights reserved.`}
    </p>
  );
}

function FooterSocial({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center gap-4', className)} {...props}>{children}</div>;
}

function FooterBottom({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4 pt-8', className)} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }} {...props}>
      {children}
    </div>
  );
}

export const Footer = Object.assign(FooterRoot, {
  Brand: FooterBrand,
  Links: FooterLinks,
  LinkGroup: FooterLinkGroup,
  Link: FooterLink,
  Copyright: FooterCopyright,
  Social: FooterSocial,
  Bottom: FooterBottom,
});
