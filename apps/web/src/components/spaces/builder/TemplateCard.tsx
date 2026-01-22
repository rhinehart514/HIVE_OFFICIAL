'use client';

/**
 * TemplateCard - Selectable space template card
 *
 * Features:
 * - Icon + title + description
 * - Selected state with gold border
 * - Hover tilt effect
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Tilt, GlassSurface, MOTION } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';

export interface SpaceTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** Default settings for this template */
  defaults?: {
    category?: string;
    privacy?: 'open' | 'approval' | 'invite';
  };
}

export interface TemplateCardProps {
  template: SpaceTemplate;
  selected: boolean;
  onSelect: (template: SpaceTemplate) => void;
}

export function TemplateCard({ template, selected, onSelect }: TemplateCardProps) {
  return (
    <Tilt intensity={6}>
      <motion.button
        type="button"
        onClick={() => onSelect(template)}
        className="w-full text-left"
        whileTap={{ scale: 0.99 }}
      >
        <GlassSurface
          intensity="subtle"
          className={cn(
            'p-5 rounded-xl transition-all duration-200',
            selected
              ? 'border-2 border-[var(--life-gold)]/40 bg-[var(--life-gold)]/5'
              : 'border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.02]'
          )}
        >
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={cn(
                'w-12 h-12 rounded-lg flex items-center justify-center text-2xl',
                selected ? 'bg-[var(--life-gold)]/10' : 'bg-white/[0.04]'
              )}
            >
              {template.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3
                className={cn(
                  'text-[15px] font-medium',
                  selected ? 'text-[var(--life-gold)]' : 'text-white'
                )}
              >
                {template.name}
              </h3>
              <p className="text-[13px] text-white/40 mt-0.5 line-clamp-2">
                {template.description}
              </p>
            </div>

            {/* Selected Indicator */}
            {selected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-5 h-5 rounded-full bg-[var(--life-gold)] flex items-center justify-center"
              >
                <svg
                  className="w-3 h-3 text-[var(--bg-ground)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}
          </div>
        </GlassSurface>
      </motion.button>
    </Tilt>
  );
}

// ============================================
// TEMPLATE OPTIONS
// ============================================

export const SPACE_TEMPLATES: SpaceTemplate[] = [
  {
    id: 'org',
    name: 'Student Org',
    description: 'For clubs, organizations, and official groups',
    icon: '🏛️',
    defaults: { category: 'academic', privacy: 'open' },
  },
  {
    id: 'study',
    name: 'Study Group',
    description: 'For courses, study sessions, and academic collaboration',
    icon: '📚',
    defaults: { category: 'academic', privacy: 'approval' },
  },
  {
    id: 'project',
    name: 'Project Team',
    description: 'For hackathons, startups, and collaborative projects',
    icon: '🚀',
    defaults: { category: 'professional', privacy: 'invite' },
  },
  {
    id: 'club',
    name: 'Club / Interest',
    description: 'For hobbies, interests, and casual communities',
    icon: '🎯',
    defaults: { category: 'social', privacy: 'open' },
  },
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start from scratch with full control',
    icon: '✨',
    defaults: { privacy: 'approval' },
  },
];
