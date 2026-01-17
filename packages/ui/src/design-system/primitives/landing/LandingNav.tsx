'use client';
import * as React from 'react';
import { cn } from '../../../lib/utils';
import { Logo } from '../Logo';

export interface LandingNavProps extends React.HTMLAttributes<HTMLElement> {
  fixed?: boolean;
}
export interface LandingNavLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {}

function LandingNavRoot({ fixed = true, className, children, ...props }: LandingNavProps) {
  return (
    <nav
      className={cn('w-full z-50 transition-all duration-300', fixed ? 'fixed top-0 left-0 right-0' : 'relative', className)}
      style={{ background: 'rgba(10, 10, 9, 0.8)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
      {...props}
    >
      <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between">{children}</div>
    </nav>
  );
}

function LandingNavLogo({ href = '/', className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a href={href} className={cn('flex items-center', className)} {...props}>
      <Logo size="sm" variant="full" color="gold" />
    </a>
  );
}

function LandingNavLinks({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('hidden md:flex items-center gap-8', className)} {...props}>{children}</div>;
}

function LandingNavLink({ className, children, ...props }: LandingNavLinkProps) {
  return (
    <a className={cn('text-sm font-medium transition-colors duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)]', className)} {...props}>
      {children}
    </a>
  );
}

function LandingNavActions({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center gap-3', className)} {...props}>{children}</div>;
}

export const LandingNav = Object.assign(LandingNavRoot, {
  Logo: LandingNavLogo,
  Links: LandingNavLinks,
  Link: LandingNavLink,
  Actions: LandingNavActions,
});
