'use client';

/**
 * SpaceSettings - Space configuration panel
 * CREATED: Jan 21, 2026
 *
 * Settings panel for space leaders to manage their space.
 * Sections: General, Members, Boards, Danger Zone
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Save,
  AlertTriangle,
  Image as ImageIcon,
  Globe,
  Lock,
  Users,
  Hash,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Text, Button } from '@hive/ui';
import { MOTION } from '@hive/tokens';

interface SpaceSettingsProps {
  space: {
    id: string;
    name: string;
    handle: string;
    description?: string;
    avatarUrl?: string;
    isPublic?: boolean;
    category?: string;
  };
  onUpdate?: (updates: Partial<SpaceSettingsProps['space']>) => Promise<void>;
  onDelete?: () => Promise<void>;
  className?: string;
}

export function SpaceSettings({ space, onUpdate, onDelete, className }: SpaceSettingsProps) {
  const [activeSection, setActiveSection] = React.useState<'general' | 'members' | 'boards' | 'danger'>('general');
  const [isSaving, setIsSaving] = React.useState(false);

  // Form state
  const [name, setName] = React.useState(space.name);
  const [description, setDescription] = React.useState(space.description || '');
  const [isPublic, setIsPublic] = React.useState(space.isPublic ?? true);

  const hasChanges = name !== space.name || description !== (space.description || '') || isPublic !== space.isPublic;

  const handleSave = async () => {
    if (!hasChanges || !onUpdate) return;

    setIsSaving(true);
    try {
      await onUpdate({ name, description, isPublic });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={cn('flex h-full', className)}>
      {/* Sidebar Navigation */}
      <div className="w-56 border-r border-white/[0.06] p-4 flex-shrink-0">
        <nav className="space-y-1">
          <SettingsNavItem
            active={activeSection === 'general'}
            onClick={() => setActiveSection('general')}
            icon={<Globe className="w-4 h-4" />}
            label="General"
          />
          <SettingsNavItem
            active={activeSection === 'members'}
            onClick={() => setActiveSection('members')}
            icon={<Users className="w-4 h-4" />}
            label="Members"
          />
          <SettingsNavItem
            active={activeSection === 'boards'}
            onClick={() => setActiveSection('boards')}
            icon={<Hash className="w-4 h-4" />}
            label="Boards"
          />
          <SettingsNavItem
            active={activeSection === 'danger'}
            onClick={() => setActiveSection('danger')}
            icon={<AlertTriangle className="w-4 h-4" />}
            label="Danger Zone"
            variant="danger"
          />
        </nav>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, ease: MOTION.ease.premium }}
          className="max-w-2xl p-6"
        >
          {activeSection === 'general' && (
            <>
              <h2
                className="text-title-lg font-semibold text-white mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                General Settings
              </h2>
              <Text size="sm" tone="muted" className="mb-8">
                Update your space's basic information and visibility
              </Text>

              <div className="space-y-6">
                {/* Space Name */}
                <div>
                  <label className="block mb-2">
                    <Text size="sm" weight="medium">
                      Space Name
                    </Text>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Space name"
                    className={cn(
                      'w-full px-4 py-2.5',
                      'rounded-xl text-sm',
                      'bg-white/[0.04] border border-white/[0.08]',
                      'text-white placeholder:text-white/30',
                      'focus:outline-none focus:ring-2 focus:ring-white/20',
                      'transition-all duration-150'
                    )}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block mb-2">
                    <Text size="sm" weight="medium">
                      Description
                    </Text>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What's your space about?"
                    rows={4}
                    className={cn(
                      'w-full px-4 py-2.5',
                      'rounded-xl text-sm',
                      'bg-white/[0.04] border border-white/[0.08]',
                      'text-white placeholder:text-white/30',
                      'resize-none',
                      'focus:outline-none focus:ring-2 focus:ring-white/20',
                      'transition-all duration-150'
                    )}
                  />
                </div>

                {/* Visibility */}
                <div>
                  <label className="block mb-3">
                    <Text size="sm" weight="medium">
                      Visibility
                    </Text>
                  </label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setIsPublic(true)}
                      className={cn(
                        'w-full p-4 rounded-xl text-left transition-all',
                        'border',
                        isPublic
                          ? 'bg-white/[0.06] border-white/[0.12]'
                          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Globe className="w-5 h-5 text-white/60 flex-shrink-0 mt-0.5" />
                        <div>
                          <Text weight="medium" className="mb-1">
                            Public
                          </Text>
                          <Text size="sm" tone="muted">
                            Anyone on campus can find and join this space
                          </Text>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setIsPublic(false)}
                      className={cn(
                        'w-full p-4 rounded-xl text-left transition-all',
                        'border',
                        !isPublic
                          ? 'bg-white/[0.06] border-white/[0.12]'
                          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Lock className="w-5 h-5 text-white/60 flex-shrink-0 mt-0.5" />
                        <div>
                          <Text weight="medium" className="mb-1">
                            Private
                          </Text>
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
                      variant="default"
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
                      onClick={() => {
                        setName(space.name);
                        setDescription(space.description || '');
                        setIsPublic(space.isPublic ?? true);
                      }}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </motion.div>
                )}
              </div>
            </>
          )}

          {activeSection === 'members' && (
            <>
              <h2
                className="text-title-lg font-semibold text-white mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Member Management
              </h2>
              <Text size="sm" tone="muted" className="mb-8">
                Manage roles, permissions, and member access
              </Text>
              <Text tone="muted">Member management features coming soon</Text>
            </>
          )}

          {activeSection === 'boards' && (
            <>
              <h2
                className="text-title-lg font-semibold text-white mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Board Management
              </h2>
              <Text size="sm" tone="muted" className="mb-8">
                Organize and configure your space's boards
              </Text>
              <Text tone="muted">Board management features coming soon</Text>
            </>
          )}

          {activeSection === 'danger' && (
            <>
              <h2
                className="text-title-lg font-semibold text-red-400 mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Danger Zone
              </h2>
              <Text size="sm" tone="muted" className="mb-8">
                Irreversible actions — proceed with caution
              </Text>

              <div className="p-4 rounded-xl bg-red-500/[0.06] border border-red-500/20">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <Text weight="medium" className="text-red-400 mb-1">
                      Delete Space
                    </Text>
                    <Text size="sm" className="text-red-400/70">
                      Once deleted, this space and all its content will be permanently removed.
                      This action cannot be undone.
                    </Text>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="text-red-400 hover:bg-red-500/10"
                >
                  Delete Space
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

interface SettingsNavItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant?: 'default' | 'danger';
}

function SettingsNavItem({
  active,
  onClick,
  icon,
  label,
  variant = 'default',
}: SettingsNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
        'transition-all duration-150',
        'text-left',
        active
          ? 'bg-white/[0.08] text-white'
          : variant === 'danger'
          ? 'text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.04]'
          : 'text-white/60 hover:text-white/80 hover:bg-white/[0.04]'
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      <Text size="sm" weight={active ? 'medium' : 'normal'}>
        {label}
      </Text>
    </button>
  );
}

SpaceSettings.displayName = 'SpaceSettings';
