'use client';

/**
 * EmptyState - Reusable empty state component
 *
 * Use when a page/section has no data to display.
 * Provides visual feedback and actionable next steps.
 */

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button, Text } from '@hive/ui/design-system/primitives';
import { EASE_PREMIUM } from '@hive/ui';

interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'cta' | 'secondary';
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actions?: EmptyStateAction[];
  className?: string;
  compact?: boolean;
}

// Locked animation tokens
const EASE = EASE_PREMIUM;

export function EmptyState({
  icon,
  title,
  description,
  actions,
  className = '',
  compact = false,
}: EmptyStateProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? undefined : { duration: 0.35, ease: EASE }}
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'py-8 px-4' : 'py-16 px-6'
      } ${className}`}
    >
      {/* Icon */}
      {icon && (
        <div className={`${compact ? 'mb-3' : 'mb-4'} text-white/50`}>
          {icon}
        </div>
      )}

      {/* Title */}
      <Text
        size={compact ? 'default' : 'lg'}
        weight="medium"
        className="text-white/50 mb-1"
      >
        {title}
      </Text>

      {/* Description */}
      {description && (
        <Text
          size="sm"
          className="text-white/50 max-w-sm mb-6"
        >
          {description}
        </Text>
      )}

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-3 mt-2">
          {actions.map((action, index) => (
            action.href ? (
              <a key={index} href={action.href}>
                <Button variant={action.variant || 'default'} size="sm">
                  {action.label}
                </Button>
              </a>
            ) : (
              <Button
                key={index}
                variant={action.variant || 'default'}
                size="sm"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            )
          ))}
        </div>
      )}
    </motion.div>
  );
}

// Pre-built empty states for common scenarios
export function NoConnectionsEmptyState({ onFindPeople }: { onFindPeople?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      }
      title="No connections yet"
      description="Join spaces to meet people and build your network"
      actions={[
        { label: 'Browse Spaces', href: '/spaces', variant: 'cta' },
        ...(onFindPeople ? [{ label: 'Find People', onClick: onFindPeople }] : []),
      ]}
    />
  );
}

export function NoToolsEmptyState({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      }
      title="No tools yet"
      description="Create your first AI-powered tool in HiveLab"
      actions={onCreate ? [
        { label: 'Create Tool', onClick: onCreate, variant: 'cta' },
      ] : []}
    />
  );
}

export function NoSpacesEmptyState() {
  return (
    <EmptyState
      icon={
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      }
      title="No spaces found"
      description="Try a different search or browse categories"
      actions={[
        { label: 'Browse All', href: '/spaces' },
      ]}
    />
  );
}

export function NoEventsEmptyState({ onCreateEvent }: { onCreateEvent?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      }
      title="No upcoming events"
      description="Events from your spaces will appear here"
      actions={onCreateEvent ? [
        { label: 'Create Event', onClick: onCreateEvent, variant: 'cta' },
      ] : [
        { label: 'Browse Spaces', href: '/spaces' },
      ]}
    />
  );
}

export function NoMembersEmptyState() {
  return (
    <EmptyState
      icon={
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m12 5.197v-1a6 6 0 00-6-6" />
        </svg>
      }
      title="No members yet"
      description="Share this space to invite others"
      compact
    />
  );
}

export function NoNotificationsEmptyState() {
  return (
    <EmptyState
      icon={
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      }
      title="No notifications yet"
      description="Join spaces and participate to start receiving updates"
      actions={[
        { label: 'Browse Spaces', href: '/spaces' },
      ]}
    />
  );
}

export function NoMessagesEmptyState() {
  return (
    <EmptyState
      icon={
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      }
      title="No messages yet"
      description="Be the first to say something"
      compact
    />
  );
}

// Re-export contextual empty states
export { NotificationsEmptyState } from './NotificationsEmptyState';
export type { NotificationsEmptyVariant } from './NotificationsEmptyState';

export { CalendarEmptyState } from './CalendarEmptyState';
export type { CalendarEmptyVariant } from './CalendarEmptyState';

export { SearchEmptyState } from './SearchEmptyState';
export type { SearchEmptyVariant } from './SearchEmptyState';

export { SpacesEmptyState } from './SpacesEmptyState';
export type { SpacesEmptyVariant } from './SpacesEmptyState';
