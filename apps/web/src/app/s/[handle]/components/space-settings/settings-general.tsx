'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Save, Globe, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Text, Button } from '@hive/ui';
import type { SpaceData } from './types';

const inputClassName = cn(
  'w-full px-4 py-2.5',
  'rounded-lg text-sm',
  'bg-white/[0.06] border border-white/[0.06]',
  'text-white placeholder:text-white/50',
  'focus:outline-none focus:outline-2 focus:outline-[#FFD700]',
  'transition-colors duration-150'
);

interface SettingsGeneralProps {
  space: SpaceData;
  onUpdate?: (updates: Record<string, unknown>) => Promise<void>;
}

export function SettingsGeneral({ space, onUpdate }: SettingsGeneralProps) {
  const [name, setName] = React.useState(space.name);
  const [description, setDescription] = React.useState(space.description || '');
  const [isPublic, setIsPublic] = React.useState(space.isPublic ?? true);
  const [isSaving, setIsSaving] = React.useState(false);

  const hasChanges =
    name !== space.name ||
    description !== (space.description || '') ||
    isPublic !== space.isPublic;

  const handleSave = async () => {
    if (!hasChanges || !onUpdate) return;
    setIsSaving(true);
    try {
      const updates: Record<string, unknown> = {};
      if (name !== space.name) updates.name = name;
      if (description !== (space.description || '')) updates.description = description;
      if (isPublic !== space.isPublic) updates.visibility = isPublic ? 'public' : 'private';
      await onUpdate(updates);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(space.name);
    setDescription(space.description || '');
    setIsPublic(space.isPublic ?? true);
  };

  return (
    <>
      <h2
        className="text-title-lg font-semibold text-white mb-2"
        style={{ fontFamily: 'var(--font-clash)' }}
      >
        General Settings
      </h2>
      <Text size="sm" tone="muted" className="mb-8">
        Update your space&apos;s basic information and visibility
      </Text>

      <div className="space-y-6">
        {/* Space Name */}
        <div>
          <label className="block mb-2">
            <Text size="sm" weight="medium">Space Name</Text>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Space name"
            className={inputClassName}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block mb-2">
            <Text size="sm" weight="medium">Description</Text>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's your space about?"
            rows={4}
            className={cn(inputClassName, 'resize-none')}
          />
        </div>

        {/* Visibility */}
        <div>
          <label className="block mb-3">
            <Text size="sm" weight="medium">Visibility</Text>
          </label>
          <div className="space-y-2">
            <button
              onClick={() => setIsPublic(true)}
              className={cn(
                'w-full p-4 rounded-lg text-left transition-colors',
                'border',
                isPublic
                  ? 'bg-white/[0.06] border-white/[0.06]'
                  : 'bg-white/[0.06] border-white/[0.06] hover:bg-white/[0.06]'
              )}
            >
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-white/50 flex-shrink-0 mt-0.5" />
                <div>
                  <Text weight="medium" className="mb-1">Public</Text>
                  <Text size="sm" tone="muted">
                    Anyone on campus can find and join this space
                  </Text>
                </div>
              </div>
            </button>

            <button
              onClick={() => setIsPublic(false)}
              className={cn(
                'w-full p-4 rounded-lg text-left transition-colors',
                'border',
                !isPublic
                  ? 'bg-white/[0.06] border-white/[0.06]'
                  : 'bg-white/[0.06] border-white/[0.06] hover:bg-white/[0.06]'
              )}
            >
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-white/50 flex-shrink-0 mt-0.5" />
                <div>
                  <Text weight="medium" className="mb-1">Private</Text>
                  <Text size="sm" tone="muted">
                    Only people with an invite link can join
                  </Text>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 pt-4 border-t border-white/[0.06]"
          >
            <Button
              variant="cta"
              size="default"
              onClick={handleSave}
              disabled={isSaving}
              loading={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="ghost"
              size="default"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </motion.div>
        )}
      </div>
    </>
  );
}
