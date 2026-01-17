'use client';

/**
 * Space Mobile Navigation
 *
 * Bottom bar and drawer panels for mobile space experience.
 * Extracted from the main space page for better maintainability.
 */

import Link from 'next/link';
import {
  MobileActionBar,
  MobileDrawer,
  type MobileDrawerType,
} from '@hive/ui';
import { Text, SimpleAvatar, Badge, Button } from '@hive/ui/design-system/primitives';
import { CalendarIcon, PlusIcon } from '@heroicons/react/24/outline';

interface ToolData {
  id: string;
  name: string;
  type: string;
}

interface LeaderData {
  id: string;
  name: string;
  avatarUrl?: string;
  role: string;
}

interface AutomationData {
  id: string;
  name: string;
  trigger: string;
  enabled: boolean;
  runCount?: number;
}

interface SpaceData {
  name: string;
  description?: string;
  memberCount: number;
  onlineCount: number;
  category?: string;
}

interface EventData {
  id: string;
  title: string;
  startDate: string;
  currentAttendees: number;
}

export interface SpaceMobileNavigationProps {
  activeDrawer: MobileDrawerType | null;
  setActiveDrawer: (drawer: MobileDrawerType | null) => void;
  space: SpaceData;
  spaceId: string;
  events: EventData[];
  tools: ToolData[];
  leaders: LeaderData[];
  automations?: AutomationData[];
  isLeader?: boolean;
  onOpenTemplates?: () => void;
}

export function SpaceMobileNavigation({
  activeDrawer,
  setActiveDrawer,
  space,
  spaceId,
  events,
  tools,
  leaders,
  automations,
  isLeader,
  onOpenTemplates,
}: SpaceMobileNavigationProps) {
  return (
    <>
      <div className="lg:hidden">
        <MobileActionBar
          activeDrawer={activeDrawer}
          onAction={(type) => setActiveDrawer(type)}
          isLeader={isLeader}
        />
      </div>

      {/* Info drawer */}
      <MobileDrawer
        type="info"
        open={activeDrawer === 'info'}
        onClose={() => setActiveDrawer(null)}
        title={space.name}
      >
        <div className="p-4 space-y-4">
          {space.description && (
            <Text tone="muted" size="sm">{space.description}</Text>
          )}
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <Text size="sm">{space.onlineCount} online</Text>
            </div>
            <Text tone="muted" size="sm">{space.memberCount} members</Text>
          </div>
          {space.category && (
            <Badge variant="secondary">{space.category}</Badge>
          )}
        </div>
      </MobileDrawer>

      {/* Events drawer */}
      <MobileDrawer
        type="events"
        open={activeDrawer === 'events'}
        onClose={() => setActiveDrawer(null)}
      >
        <div className="p-4 space-y-3">
          {events.length === 0 ? (
            <div className="text-center py-6">
              <CalendarIcon className="w-8 h-8 text-white/30 mx-auto mb-2" />
              <Text tone="muted" size="sm" className="mb-3">No upcoming events</Text>
              {isLeader ? (
                <Link href={`/spaces/${spaceId}/events`}>
                  <Button variant="outline" size="sm">
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Create Event
                  </Button>
                </Link>
              ) : (
                <Text tone="muted" size="xs">Check back later for events</Text>
              )}
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="p-3 rounded-lg bg-white/[0.03]">
                <Text weight="medium" size="sm">{event.title}</Text>
                <Text tone="muted" size="xs">
                  {new Date(event.startDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
                <Text tone="muted" size="xs">{event.currentAttendees} attending</Text>
              </div>
            ))
          )}
        </div>
      </MobileDrawer>

      {/* Tools drawer */}
      <MobileDrawer
        type="tools"
        open={activeDrawer === 'tools'}
        onClose={() => setActiveDrawer(null)}
      >
        <div className="p-4 space-y-3">
          {tools.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] mx-auto mb-2 flex items-center justify-center">
                <PlusIcon className="w-4 h-4 text-white/40" />
              </div>
              <Text tone="muted" size="sm" className="mb-3">No tools available</Text>
              {isLeader ? (
                <Link href="/tools/create">
                  <Button variant="outline" size="sm">
                    Create Tool
                  </Button>
                </Link>
              ) : (
                <Text tone="muted" size="xs">Leaders can add tools to this space</Text>
              )}
            </div>
          ) : (
            tools.map((tool) => (
              <div key={tool.id} className="p-3 rounded-lg bg-white/[0.03]">
                <Text weight="medium" size="sm">{tool.name}</Text>
                <Text tone="muted" size="xs">{tool.type}</Text>
              </div>
            ))
          )}
        </div>
      </MobileDrawer>

      {/* Members drawer */}
      <MobileDrawer
        type="members"
        open={activeDrawer === 'members'}
        onClose={() => setActiveDrawer(null)}
      >
        <div className="p-4 space-y-3">
          {leaders.map((leader) => (
            <div key={leader.id} className="flex items-center gap-3 p-2">
              <SimpleAvatar
                src={leader.avatarUrl}
                fallback={leader.name}
                size="sm"
              />
              <div>
                <Text weight="medium" size="sm">{leader.name}</Text>
                <Text tone="muted" size="xs">{leader.role}</Text>
              </div>
            </div>
          ))}
        </div>
      </MobileDrawer>

      {/* Automations drawer - only for leaders */}
      {isLeader && (
        <MobileDrawer
          type="settings"
          open={activeDrawer === 'automations'}
          onClose={() => setActiveDrawer(null)}
          title="Automations"
        >
          <div className="p-4 space-y-3">
            {automations?.length === 0 ? (
              <div className="text-center py-4">
                <Text tone="muted" size="sm">No automations set up</Text>
                {onOpenTemplates && (
                  <button
                    onClick={onOpenTemplates}
                    className="mt-2 text-sm text-[var(--color-accent-gold)] hover:underline"
                  >
                    Browse templates
                  </button>
                )}
              </div>
            ) : (
              automations?.map((automation) => (
                <div key={automation.id} className="p-3 rounded-lg bg-white/[0.03]">
                  <div className="flex items-center justify-between">
                    <Text weight="medium" size="sm">{automation.name}</Text>
                    <Badge variant={automation.enabled ? 'success' : 'secondary'}>
                      {automation.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                  <Text tone="muted" size="xs">{automation.trigger}</Text>
                  {automation.runCount !== undefined && (
                    <Text tone="muted" size="xs">{automation.runCount} runs</Text>
                  )}
                </div>
              ))
            )}
          </div>
        </MobileDrawer>
      )}
    </>
  );
}
