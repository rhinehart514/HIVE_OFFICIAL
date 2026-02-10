'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarPlus,
  CheckSquare,
  ClipboardList,
  PenSquare,
  Plus,
  Sparkles,
  Timer,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlobalFABProps {
  activeSpaceHandle: string | null;
  isInSpace: boolean;
  isOnHome: boolean;
  isRssEvent?: boolean;
  spaceToolCount?: number | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface FabActionItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
}

type FabMenuEntry =
  | { type: 'action'; action: FabActionItem }
  | { type: 'separator'; id: string };

function buildCreateUrl({
  kind,
  activeSpaceHandle,
}: {
  kind: string;
  activeSpaceHandle: string | null;
}): string {
  const params = new URLSearchParams({
    prompt: `Create a ${kind}.`,
  });

  if (activeSpaceHandle) {
    params.set('space', activeSpaceHandle);
  }

  return `/lab/new?${params.toString()}`;
}

function createMenuEntries({
  close,
  push,
  activeSpaceHandle,
  isInSpace,
  isOnHome,
  isRssEvent,
  spaceToolCount,
}: {
  close: () => void;
  push: (href: string) => void;
  activeSpaceHandle: string | null;
  isInSpace: boolean;
  isOnHome: boolean;
  isRssEvent: boolean;
  spaceToolCount?: number | null;
}): FabMenuEntry[] {
  const go = (href: string) => {
    push(href);
    close();
  };

  const baseActions: FabActionItem[] = [
    {
      id: 'poll',
      label: 'Poll',
      icon: CheckSquare,
      onSelect: () => go(buildCreateUrl({ kind: 'poll', activeSpaceHandle })),
    },
    {
      id: 'rsvp',
      label: 'RSVP',
      icon: CalendarPlus,
      onSelect: () => go(buildCreateUrl({ kind: 'RSVP form', activeSpaceHandle })),
    },
    {
      id: 'signup',
      label: 'Signup',
      icon: ClipboardList,
      onSelect: () => go(buildCreateUrl({ kind: 'signup form', activeSpaceHandle })),
    },
    {
      id: 'countdown',
      label: 'Countdown',
      icon: Timer,
      onSelect: () => go(buildCreateUrl({ kind: 'countdown', activeSpaceHandle })),
    },
    {
      id: 'event',
      label: 'Event',
      icon: PenSquare,
      onSelect: () => go(buildCreateUrl({ kind: 'event', activeSpaceHandle })),
    },
  ];

  if (isInSpace && spaceToolCount === 0) {
    baseActions.unshift({
      id: 'add-tool',
      label: 'Add a tool',
      icon: Wrench,
      onSelect: () => go(`/s/${encodeURIComponent(activeSpaceHandle ?? '')}`),
    });
  } else if (isRssEvent) {
    baseActions.unshift({
      id: 'add-rsvp',
      label: 'Add RSVP',
      icon: CalendarPlus,
      onSelect: () => go(buildCreateUrl({ kind: 'RSVP form', activeSpaceHandle })),
    });
  }

  const entries: FabMenuEntry[] = baseActions.map((action) => ({
    type: 'action',
    action,
  }));

  entries.push({ type: 'separator', id: 'divider-primary' });

  entries.push({
    type: 'action',
    action: {
      id: 'describe-ai',
      label: 'Describe with AI',
      icon: Sparkles,
      onSelect: () => go(buildCreateUrl({ kind: 'tool', activeSpaceHandle })),
    },
  });

  entries.push({
    type: 'action',
    action: {
      id: 'open-builder',
      label: 'Open Builder',
      icon: Wrench,
      onSelect: () => go('/lab'),
    },
  });

  if (isOnHome) {
    entries.push({
      type: 'action',
      action: {
        id: 'create-space',
        label: 'Create a space',
        icon: Plus,
        onSelect: () => go('/spaces/new'),
      },
    });
  }

  return entries;
}

export function GlobalFAB({
  activeSpaceHandle,
  isInSpace,
  isOnHome,
  isRssEvent = false,
  spaceToolCount,
  open,
  onOpenChange,
}: GlobalFABProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = open ?? internalOpen;

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (typeof onOpenChange === 'function') {
        onOpenChange(value);
      } else {
        setInternalOpen(value);
      }
    },
    [onOpenChange]
  );

  const close = React.useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  React.useEffect(() => {
    if (!isOpen) return undefined;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', onEscape);
    return () => {
      window.removeEventListener('keydown', onEscape);
    };
  }, [isOpen, setOpen]);

  const menuEntries = React.useMemo(
    () =>
      createMenuEntries({
        close,
        push: router.push,
        activeSpaceHandle,
        isInSpace,
        isOnHome,
        isRssEvent,
        spaceToolCount,
      }),
    [
      activeSpaceHandle,
      close,
      isInSpace,
      isOnHome,
      isRssEvent,
      router.push,
      spaceToolCount,
    ]
  );

  return (
    <>
      <button
        type="button"
        onClick={close}
        aria-label="Close create menu"
        className={cn(
          'fixed inset-0 z-40 bg-black/40 transition-opacity duration-150',
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

      <div className="fixed bottom-20 right-5 z-50 md:bottom-6 md:right-6">
        <div
          className={cn(
            'absolute bottom-16 right-0 flex w-56 flex-col gap-2 transition-all duration-150',
            isOpen
              ? 'pointer-events-auto translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-2 opacity-0'
          )}
        >
          {menuEntries.map((entry) => {
            if (entry.type === 'separator') {
              return (
                <div
                  key={entry.id}
                  className="mx-2 h-px bg-white/[0.06]"
                  role="separator"
                />
              );
            }

            const Icon = entry.action.icon;
            return (
              <button
                key={entry.action.id}
                type="button"
                onClick={entry.action.onSelect}
                className="flex h-10 items-center gap-2 rounded-lg border border-white/[0.06] bg-black px-3 text-sm text-white transition-colors hover:bg-white/[0.06]"
              >
                <Icon className="h-4 w-4 text-white/55" />
                <span>{entry.action.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setOpen(!isOpen)}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-[#FFD700] bg-[#FFD700] text-black"
          aria-label={isOpen ? 'Close create menu' : 'Open create menu'}
          aria-expanded={isOpen}
        >
          <Plus
            className={cn(
              'h-6 w-6 transition-transform duration-150',
              isOpen && 'rotate-45'
            )}
          />
        </button>
      </div>
    </>
  );
}

export default GlobalFAB;
