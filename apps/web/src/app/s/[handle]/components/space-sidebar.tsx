'use client';

/**
 * SpaceSidebar - Navigation Sidebar Shell
 *
 * Contains:
 * - Pinned tools section
 * - Members preview (online count + avatars)
 *
 * 200px width, 12px padding
 *
 * @version 3.0.0 - Simplified (Feb 2026) - Removed multi-board switching
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  SPACE_LAYOUT,
  spaceTypographyClasses,
} from '@hive/tokens';
import { ToolsList, type ToolsListProps } from './sidebar/tools-list';
import { MembersPreview, type MembersPreviewProps } from './sidebar/members-preview';
import { EventsList, type EventsListProps } from './sidebar/events-list';

interface SpaceSidebarProps {
  /** Tools section props (optional) */
  tools?: ToolsListProps;
  /** Events section props (optional) */
  events?: EventsListProps;
  /** Members preview props */
  members: MembersPreviewProps;
  /** Whether sidebar is collapsed */
  isCollapsed?: boolean;
  /** Additional class names */
  className?: string;
}

export function SpaceSidebar({
  tools,
  events,
  members,
  isCollapsed = false,
  className,
}: SpaceSidebarProps) {
  // Collapsed state is not supported (boards were the only collapsible content)
  if (isCollapsed) {
    return null;
  }

  return (
    <div
      className={cn('flex flex-col h-full', className)}
      style={{ gap: `${SPACE_LAYOUT.sectionGap}px` }}
    >

      {/* Tools Section (if provided) */}
      {tools && (tools.tools.length > 0 || tools.isLeader) && (
        <section>
          <h3 className={cn(spaceTypographyClasses.sectionLabel, 'mb-3 px-1')}>
            Tools
          </h3>
          <ToolsList {...tools} />
        </section>
      )}

      {/* Events Section (if provided and has events) */}
      {events && events.events.length > 0 && (
        <section>
          <h3 className={cn(spaceTypographyClasses.sectionLabel, 'mb-3 px-1')}>
            Events
          </h3>
          <EventsList {...events} />
        </section>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Members Preview - Bottom */}
      <section className="pt-4 border-t border-white/[0.06]">
        <MembersPreview {...members} />
      </section>
    </div>
  );
}

SpaceSidebar.displayName = 'SpaceSidebar';

export default SpaceSidebar;
