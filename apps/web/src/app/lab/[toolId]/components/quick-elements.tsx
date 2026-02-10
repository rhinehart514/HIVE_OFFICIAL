'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChartBarIcon,
  ClockIcon,
  DocumentTextIcon,
  PlusIcon,
  XMarkIcon,
  CheckCircleIcon,
  ListBulletIcon,
  PhotoIcon,
  CalendarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

interface QuickElement {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const QUICK_ELEMENTS: QuickElement[] = [
  { id: 'poll-element', name: 'Poll', icon: ChartBarIcon, description: 'Create a voting poll' },
  { id: 'countdown-timer', name: 'Timer', icon: ClockIcon, description: 'Countdown to an event' },
  { id: 'form-builder', name: 'Form', icon: DocumentTextIcon, description: 'Collect responses' },
  { id: 'chart-display', name: 'Chart', icon: ChartBarIcon, description: 'Visualize data' },
];

const MORE_ELEMENTS: QuickElement[] = [
  { id: 'leaderboard', name: 'Leaderboard', icon: ListBulletIcon, description: 'Rank standings' },
  { id: 'image-element', name: 'Image', icon: PhotoIcon, description: 'Display an image' },
  { id: 'button-element', name: 'Button', icon: CheckCircleIcon, description: 'Action button' },
  { id: 'calendar-view', name: 'Calendar', icon: CalendarIcon, description: 'Show events' },
  { id: 'member-list', name: 'Members', icon: UsersIcon, description: 'Space members' },
];

interface QuickElementsProps {
  onAddElement: (elementId: string) => void;
  disabled?: boolean;
}

export function QuickElements({ onAddElement, disabled = false }: QuickElementsProps) {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-[var(--bg-ground)] border-t border-[var(--border-subtle)]">
      {/* Quick element buttons */}
      {QUICK_ELEMENTS.map((element) => (
        <button
          key={element.id}
          onClick={() => onAddElement(element.id)}
          disabled={disabled}
          aria-label={`Add ${element.name} element: ${element.description}`}
          className="flex items-center gap-2 px-3 py-2 rounded-lg
            bg-[var(--surface-subtle)] border border-[var(--border-subtle)]
            text-[var(--text-secondary)] text-sm font-medium
            transition-all duration-200
            hover:bg-[var(--surface-elevated)] hover:border-[var(--border-default)] hover:text-[var(--text-primary)]
            active:opacity-80
            disabled:opacity-40 disabled:cursor-not-allowed"
          title={element.description}
        >
          <element.icon className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">{element.name}</span>
        </button>
      ))}

      {/* More button */}
      <div className="relative">
        <button
          onClick={() => setShowMore(!showMore)}
          disabled={disabled}
          aria-label={showMore ? "Close element menu" : "Show more elements"}
          aria-expanded={showMore}
          aria-haspopup="menu"
          className="flex items-center justify-center w-9 h-9 rounded-lg
            bg-[var(--surface-subtle)] border border-[var(--border-subtle)]
            text-[var(--text-tertiary)]
            transition-all duration-200
            hover:bg-[var(--surface-elevated)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]
            active:opacity-80
            disabled:opacity-40 disabled:cursor-not-allowed"
          title="More elements"
        >
          {showMore ? (
            <XMarkIcon className="w-4 h-4" aria-hidden="true" />
          ) : (
            <PlusIcon className="w-4 h-4" aria-hidden="true" />
          )}
        </button>

        {/* More elements popover */}
        <AnimatePresence>
          {showMore && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-full left-0 mb-2 w-56 rounded-lg
                bg-[var(--surface-elevated)] border border-[var(--border-subtle)]
                py-1 z-50"
            >
              <div className="px-3 py-2 text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-wider">
                More Elements
              </div>
              {MORE_ELEMENTS.map((element) => (
                <button
                  key={element.id}
                  onClick={() => {
                    onAddElement(element.id);
                    setShowMore(false);
                  }}
                  aria-label={`Add ${element.name} element: ${element.description}`}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left
                    hover:bg-[var(--surface-hover)] transition-colors duration-150"
                >
                  <element.icon className="w-4 h-4 text-[var(--text-tertiary)]" aria-hidden="true" />
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">{element.name}</div>
                    <div className="text-xs text-[var(--text-tertiary)]">{element.description}</div>
                  </div>
                </button>
              ))}

              <div className="h-px bg-[var(--border-subtle)] mx-2 my-1" />

              <button
                onClick={() => setShowMore(false)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left
                  text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)]
                  transition-colors duration-150"
              >
                <span className="text-xs">Press ⌘K for all elements</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Keyboard hint */}
      <div className="hidden md:flex items-center gap-1 text-xs text-[var(--text-muted)]">
        <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--border-subtle)] font-mono">⌘K</kbd>
        <span>for all elements</span>
      </div>
    </div>
  );
}
