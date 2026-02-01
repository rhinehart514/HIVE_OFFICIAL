'use client';

/**
 * SpaceSettings - Space configuration panel
 * CREATED: Jan 21, 2026
 * UPDATED: Jan 25, 2026 - Added board management, invite links
 *
 * Settings panel for space leaders to manage their space.
 * Sections: General, Members, Boards, Danger Zone
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  AlertTriangle,
  Image as ImageIcon,
  Globe,
  Lock,
  Users,
  Hash,
  Mail,
  Link as LinkIcon,
  Trash2,
  UserPlus,
  Pencil,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Text, Button, toast, AutomationsPanel, AutomationBuilderModal, type AutomationItem, type AutomationData } from '@hive/ui';
import { MOTION } from '@hive/tokens';
import { InviteLinkModal } from '@/components/spaces/invite-link-modal';
import { MemberManagement } from './member-management';

interface Board {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  isLocked?: boolean;
  isVisible?: boolean;
}

interface SpaceSettingsProps {
  space: {
    id: string;
    name: string;
    handle: string;
    description?: string;
    avatarUrl?: string;
    isPublic?: boolean;
    category?: string;
    // CampusLabs metadata (P2.4)
    email?: string;
    contactName?: string;
    socialLinks?: {
      website?: string;
      instagram?: string;
      twitter?: string;
      facebook?: string;
      linkedin?: string;
      youtube?: string;
    };
  };
  boards?: Board[];
  isLeader?: boolean;
  currentUserId?: string;
  currentUserRole?: 'owner' | 'admin' | 'moderator' | 'member';
  onUpdate?: (updates: Record<string, unknown>) => Promise<void>;
  onDelete?: () => Promise<void>;
  onLeave?: () => Promise<void>;
  onBoardDelete?: (boardId: string) => Promise<void>;
  onBoardUpdate?: (boardId: string, updates: { name?: string; description?: string; isVisible?: boolean }) => Promise<void>;
  className?: string;
}

export function SpaceSettings({ space, boards = [], isLeader = false, currentUserId, currentUserRole = 'member', onUpdate, onDelete, onLeave, onBoardDelete, onBoardUpdate, className }: SpaceSettingsProps) {
  const [activeSection, setActiveSection] = React.useState<'general' | 'contact' | 'members' | 'boards' | 'automations' | 'danger'>('general');
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLeaving, setIsLeaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showInviteModal, setShowInviteModal] = React.useState(false);
  const [deletingBoardId, setDeletingBoardId] = React.useState<string | null>(null);
  const [editingBoardId, setEditingBoardId] = React.useState<string | null>(null);
  const [boardEdits, setBoardEdits] = React.useState<Record<string, { name: string; description: string }>>({});

  // Automations state
  const [automations, setAutomations] = React.useState<AutomationItem[]>([]);
  const [automationsLoading, setAutomationsLoading] = React.useState(false);
  const [showAutomationBuilder, setShowAutomationBuilder] = React.useState(false);
  const [showTemplates, setShowTemplates] = React.useState(false);
  const [editingAutomation, setEditingAutomation] = React.useState<AutomationData | null>(null);

  const handleLeave = async () => {
    if (!onLeave) return;
    const confirmed = window.confirm(
      'Are you sure you want to leave this space? You can rejoin at any time.'
    );
    if (!confirmed) return;
    setIsLeaving(true);
    try {
      await onLeave();
    } finally {
      setIsLeaving(false);
    }
  };

  const handleBoardDelete = async (boardId: string, boardName: string) => {
    if (!onBoardDelete) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete "${boardName}"? This will archive all messages in this board.`
    );
    if (!confirmed) return;
    setDeletingBoardId(boardId);
    try {
      await onBoardDelete(boardId);
      toast.success('Board archived', `"${boardName}" has been archived`);
    } catch {
      toast.error('Failed to delete board', 'Please try again');
    } finally {
      setDeletingBoardId(null);
    }
  };

  const handleBoardEdit = (board: Board) => {
    setEditingBoardId(board.id);
    setBoardEdits({
      ...boardEdits,
      [board.id]: {
        name: board.name,
        description: board.description || '',
      },
    });
  };

  const handleBoardSave = async (boardId: string) => {
    if (!onBoardUpdate || !boardEdits[boardId]) return;
    const edits = boardEdits[boardId];
    const board = boards.find((b) => b.id === boardId);
    if (!board) return;

    // Only send changed fields
    const updates: { name?: string; description?: string } = {};
    if (edits.name !== board.name) updates.name = edits.name;
    if (edits.description !== (board.description || '')) updates.description = edits.description;

    if (Object.keys(updates).length === 0) {
      setEditingBoardId(null);
      return;
    }

    try {
      await onBoardUpdate(boardId, updates);
      toast.success('Board updated', 'Changes saved successfully');
      setEditingBoardId(null);
    } catch {
      toast.error('Failed to update board', 'Please try again');
    }
  };

  const handleBoardCancel = () => {
    setEditingBoardId(null);
  };

  // Fetch automations when section is active
  React.useEffect(() => {
    if (activeSection === 'automations' && isLeader && automations.length === 0) {
      setAutomationsLoading(true);
      fetch(`/api/spaces/${space.id}/automations`, { credentials: 'include' })
        .then(res => res.ok ? res.json() : { automations: [] })
        .then(data => setAutomations(data.automations || []))
        .catch(() => setAutomations([]))
        .finally(() => setAutomationsLoading(false));
    }
  }, [activeSection, isLeader, space.id, automations.length]);

  // Handle automation save
  const handleAutomationSave = async (automation: AutomationData) => {
    try {
      const isEdit = !!automation.id;
      const response = await fetch(
        isEdit ? `/api/spaces/${space.id}/automations/${automation.id}` : `/api/spaces/${space.id}/automations`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(automation),
        }
      );
      if (!response.ok) throw new Error('Failed to save');
      const data = await response.json();
      if (isEdit) {
        setAutomations(prev => prev.map(a => a.id === automation.id ? data.automation : a));
      } else {
        setAutomations(prev => [...prev, data.automation]);
      }
      setShowAutomationBuilder(false);
      setEditingAutomation(null);
      toast.success(isEdit ? 'Automation updated' : 'Automation created');
    } catch {
      toast.error('Failed to save automation');
      throw new Error('Failed to save automation');
    }
  };

  // Form state - General
  const [name, setName] = React.useState(space.name);
  const [description, setDescription] = React.useState(space.description || '');
  const [isPublic, setIsPublic] = React.useState(space.isPublic ?? true);

  // Form state - Contact (P2.4)
  const [email, setEmail] = React.useState(space.email || '');
  const [contactName, setContactName] = React.useState(space.contactName || '');
  const [websiteUrl, setWebsiteUrl] = React.useState(space.socialLinks?.website || '');
  const [instagramUrl, setInstagramUrl] = React.useState(space.socialLinks?.instagram || '');
  const [twitterUrl, setTwitterUrl] = React.useState(space.socialLinks?.twitter || '');
  const [facebookUrl, setFacebookUrl] = React.useState(space.socialLinks?.facebook || '');

  const hasGeneralChanges = name !== space.name || description !== (space.description || '') || isPublic !== space.isPublic;

  const hasContactChanges =
    email !== (space.email || '') ||
    contactName !== (space.contactName || '') ||
    websiteUrl !== (space.socialLinks?.website || '') ||
    instagramUrl !== (space.socialLinks?.instagram || '') ||
    twitterUrl !== (space.socialLinks?.twitter || '') ||
    facebookUrl !== (space.socialLinks?.facebook || '');

  const hasChanges = hasGeneralChanges || hasContactChanges;

  const handleSave = async () => {
    if (!hasChanges || !onUpdate) return;

    setIsSaving(true);
    try {
      const updates: Record<string, unknown> = {};

      // General settings
      if (name !== space.name) updates.name = name;
      if (description !== (space.description || '')) updates.description = description;
      if (isPublic !== space.isPublic) updates.visibility = isPublic ? 'public' : 'private';

      // Contact info (P2.4)
      if (email !== (space.email || '')) updates.email = email || null;
      if (contactName !== (space.contactName || '')) updates.contactName = contactName || null;

      // Social links
      if (
        websiteUrl !== (space.socialLinks?.website || '') ||
        instagramUrl !== (space.socialLinks?.instagram || '') ||
        twitterUrl !== (space.socialLinks?.twitter || '') ||
        facebookUrl !== (space.socialLinks?.facebook || '')
      ) {
        updates.socialLinks = {
          website: websiteUrl || null,
          instagram: instagramUrl || null,
          twitter: twitterUrl || null,
          facebook: facebookUrl || null,
        };
      }

      await onUpdate(updates);
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
          {isLeader && (
            <SettingsNavItem
              active={activeSection === 'contact'}
              onClick={() => setActiveSection('contact')}
              icon={<Mail className="w-4 h-4" />}
              label="Contact Info"
            />
          )}
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
          {isLeader && (
            <SettingsNavItem
              active={activeSection === 'automations'}
              onClick={() => setActiveSection('automations')}
              icon={<Zap className="w-4 h-4" />}
              label="Automations"
            />
          )}
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

              {/* Invite Members Section */}
              {isLeader && (
                <div className="mb-8 pb-6 border-b border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <div>
                      <Text weight="medium" className="mb-1">Invite Members</Text>
                      <Text size="sm" tone="muted">
                        Generate invite links to share with potential members
                      </Text>
                    </div>
                    <Button
                      variant="cta"
                      size="sm"
                      onClick={() => setShowInviteModal(true)}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create Invite Link
                    </Button>
                  </div>
                </div>
              )}

              {/* Member Management */}
              {currentUserId && (
                <MemberManagement
                  spaceId={space.id}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                />
              )}
            </>
          )}

          {activeSection === 'contact' && isLeader && (
            <>
              <h2
                className="text-title-lg font-semibold text-white mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Contact Information
              </h2>
              <Text size="sm" tone="muted" className="mb-8">
                Update contact details and social links for your space
              </Text>

              <div className="space-y-6">
                {/* Contact Email */}
                <div>
                  <label className="block mb-2">
                    <Text size="sm" weight="medium">
                      Contact Email
                    </Text>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@organization.edu"
                    className={cn(
                      'w-full px-4 py-2.5',
                      'rounded-xl text-sm',
                      'bg-white/[0.04] border border-white/[0.08]',
                      'text-white placeholder:text-white/30',
                      'focus:outline-none focus:ring-2 focus:ring-white/20',
                      'transition-all duration-150'
                    )}
                  />
                  <Text size="xs" tone="muted" className="mt-1">
                    Displayed on browse cards and space info
                  </Text>
                </div>

                {/* Contact Name */}
                <div>
                  <label className="block mb-2">
                    <Text size="sm" weight="medium">
                      Contact Name
                    </Text>
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g., Club President"
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

                {/* Social Links */}
                <div>
                  <label className="block mb-3">
                    <Text size="sm" weight="medium">
                      Social Links
                    </Text>
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <LinkIcon className="w-4 h-4 text-white/40 flex-shrink-0" />
                      <input
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://your-website.com"
                        className={cn(
                          'flex-1 px-4 py-2.5',
                          'rounded-xl text-sm',
                          'bg-white/[0.04] border border-white/[0.08]',
                          'text-white placeholder:text-white/30',
                          'focus:outline-none focus:ring-2 focus:ring-white/20',
                          'transition-all duration-150'
                        )}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Text size="xs" className="w-4 text-white/40 text-center flex-shrink-0">IG</Text>
                      <input
                        type="url"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                        placeholder="https://instagram.com/yourhandle"
                        className={cn(
                          'flex-1 px-4 py-2.5',
                          'rounded-xl text-sm',
                          'bg-white/[0.04] border border-white/[0.08]',
                          'text-white placeholder:text-white/30',
                          'focus:outline-none focus:ring-2 focus:ring-white/20',
                          'transition-all duration-150'
                        )}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Text size="xs" className="w-4 text-white/40 text-center flex-shrink-0">X</Text>
                      <input
                        type="url"
                        value={twitterUrl}
                        onChange={(e) => setTwitterUrl(e.target.value)}
                        placeholder="https://twitter.com/yourhandle"
                        className={cn(
                          'flex-1 px-4 py-2.5',
                          'rounded-xl text-sm',
                          'bg-white/[0.04] border border-white/[0.08]',
                          'text-white placeholder:text-white/30',
                          'focus:outline-none focus:ring-2 focus:ring-white/20',
                          'transition-all duration-150'
                        )}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Text size="xs" className="w-4 text-white/40 text-center flex-shrink-0">FB</Text>
                      <input
                        type="url"
                        value={facebookUrl}
                        onChange={(e) => setFacebookUrl(e.target.value)}
                        placeholder="https://facebook.com/yourpage"
                        className={cn(
                          'flex-1 px-4 py-2.5',
                          'rounded-xl text-sm',
                          'bg-white/[0.04] border border-white/[0.08]',
                          'text-white placeholder:text-white/30',
                          'focus:outline-none focus:ring-2 focus:ring-white/20',
                          'transition-all duration-150'
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                {hasContactChanges && (
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
                      onClick={() => {
                        setEmail(space.email || '');
                        setContactName(space.contactName || '');
                        setWebsiteUrl(space.socialLinks?.website || '');
                        setInstagramUrl(space.socialLinks?.instagram || '');
                        setTwitterUrl(space.socialLinks?.twitter || '');
                        setFacebookUrl(space.socialLinks?.facebook || '');
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

              {boards.length === 0 ? (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <Text size="sm" tone="muted">No boards yet</Text>
                </div>
              ) : (
                <div className="space-y-3">
                  {boards.map((board) => (
                    <div
                      key={board.id}
                      className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                    >
                      {editingBoardId === board.id ? (
                        // Edit mode
                        <div className="space-y-4">
                          <div>
                            <label className="block mb-2">
                              <Text size="xs" weight="medium" tone="muted">Name</Text>
                            </label>
                            <input
                              type="text"
                              value={boardEdits[board.id]?.name || ''}
                              onChange={(e) => setBoardEdits({
                                ...boardEdits,
                                [board.id]: { ...boardEdits[board.id], name: e.target.value },
                              })}
                              className={cn(
                                'w-full px-3 py-2',
                                'rounded-lg text-sm',
                                'bg-white/[0.04] border border-white/[0.08]',
                                'text-white placeholder:text-white/30',
                                'focus:outline-none focus:ring-2 focus:ring-white/20',
                                'transition-all duration-150'
                              )}
                            />
                          </div>
                          <div>
                            <label className="block mb-2">
                              <Text size="xs" weight="medium" tone="muted">Description</Text>
                            </label>
                            <textarea
                              value={boardEdits[board.id]?.description || ''}
                              onChange={(e) => setBoardEdits({
                                ...boardEdits,
                                [board.id]: { ...boardEdits[board.id], description: e.target.value },
                              })}
                              placeholder="What's this board for?"
                              rows={2}
                              className={cn(
                                'w-full px-3 py-2',
                                'rounded-lg text-sm',
                                'bg-white/[0.04] border border-white/[0.08]',
                                'text-white placeholder:text-white/30',
                                'resize-none',
                                'focus:outline-none focus:ring-2 focus:ring-white/20',
                                'transition-all duration-150'
                              )}
                            />
                            <Text size="xs" tone="muted" className="mt-1">
                              {(boardEdits[board.id]?.description || '').length}/500 characters
                            </Text>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="cta"
                              size="sm"
                              onClick={() => handleBoardSave(board.id)}
                            >
                              <Save className="w-3 h-3 mr-1.5" />
                              Save
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleBoardCancel}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <Hash className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <Text weight="medium">{board.name}</Text>
                              {board.description && (
                                <Text size="sm" tone="muted" className="mt-0.5 line-clamp-2">
                                  {board.description}
                                </Text>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                {board.isDefault && (
                                  <Text size="xs" className="text-blue-400">Default</Text>
                                )}
                                {board.isLocked && (
                                  <Text size="xs" className="text-orange-400">Locked</Text>
                                )}
                                {board.isVisible === false && (
                                  <Text size="xs" className="text-yellow-400">Hidden</Text>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action buttons */}
                          {isLeader && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {onBoardUpdate && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleBoardEdit(board)}
                                  className="text-white/50 hover:text-white hover:bg-white/[0.06]"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              )}
                              {!board.isDefault && onBoardDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleBoardDelete(board.id, board.name)}
                                  disabled={deletingBoardId === board.id}
                                  className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                                >
                                  {deletingBoardId === board.id ? (
                                    <span className="text-xs">...</span>
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!isLeader && (
                <Text size="sm" tone="muted" className="mt-4">
                  Only space leaders can manage boards
                </Text>
              )}
            </>
          )}

          {activeSection === 'automations' && isLeader && (
            <>
              <h2
                className="text-title-lg font-semibold text-white mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Automations
              </h2>
              <Text size="sm" tone="muted" className="mb-8">
                Set up automated workflows to engage members
              </Text>

              {/* Empty state with templates */}
              {automations.length === 0 && !automationsLoading && (
                <div className="text-center py-12 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <Zap className="w-12 h-12 mx-auto mb-4 text-amber-500/40" />
                  <Text weight="medium" className="mb-2">No automations yet</Text>
                  <Text size="sm" tone="muted" className="mb-6 max-w-sm mx-auto">
                    Automations let you send welcome messages, schedule reminders, and more.
                  </Text>
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="cta"
                      size="default"
                      onClick={() => setShowTemplates(true)}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Use Template
                    </Button>
                    <Button
                      variant="ghost"
                      size="default"
                      onClick={() => setShowAutomationBuilder(true)}
                    >
                      Create Custom
                    </Button>
                  </div>
                </div>
              )}

              {/* Automations list */}
              {automations.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Text size="sm" weight="medium" tone="muted">
                      {automations.filter(a => a.enabled).length} active
                    </Text>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTemplates(true)}
                    >
                      <Zap className="w-3 h-3 mr-1.5" />
                      Add
                    </Button>
                  </div>
                  <AutomationsPanel
                    automations={automations}
                    isLeader={isLeader}
                    isLoading={automationsLoading}
                    onToggle={async (id) => {
                      try {
                        const response = await fetch(`/api/spaces/${space.id}/automations/${id}/toggle`, {
                          method: 'POST',
                          credentials: 'include',
                        });
                        if (response.ok) {
                          setAutomations(prev =>
                            prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a)
                          );
                          return true;
                        }
                        return false;
                      } catch {
                        toast.error('Failed to toggle automation');
                        return false;
                      }
                    }}
                    onDelete={async (id) => {
                      if (!window.confirm('Delete this automation?')) return false;
                      try {
                        const response = await fetch(`/api/spaces/${space.id}/automations/${id}`, {
                          method: 'DELETE',
                          credentials: 'include',
                        });
                        if (response.ok) {
                          setAutomations(prev => prev.filter(a => a.id !== id));
                          toast.success('Automation deleted');
                          return true;
                        }
                        return false;
                      } catch {
                        toast.error('Failed to delete automation');
                        return false;
                      }
                    }}
                    onAdd={() => setShowTemplates(true)}
                  />
                </div>
              )}
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

              <div className="space-y-4">
                {/* Leave Space - Available to all members (P1.6) */}
                {onLeave && (
                  <div className="p-4 rounded-xl bg-orange-500/[0.06] border border-orange-500/20">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <Text weight="medium" className="text-orange-400 mb-1">
                          Leave Space
                        </Text>
                        <Text size="sm" className="text-orange-400/70">
                          You will lose access to this space's chat, events, and tools.
                          You can rejoin at any time if the space is public.
                        </Text>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLeave}
                      disabled={isLeaving || isDeleting}
                      loading={isLeaving}
                      className="text-orange-400 hover:bg-orange-500/10"
                    >
                      {isLeaving ? 'Leaving...' : 'Leave Space'}
                    </Button>
                  </div>
                )}

                {/* Delete Space - Only for leaders */}
                {isLeader && onDelete && (
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
                      onClick={async () => {
                        const confirmed = window.confirm(
                          'Are you absolutely sure you want to delete this space? This action cannot be undone.'
                        );
                        if (!confirmed) return;
                        setIsDeleting(true);
                        try {
                          await onDelete();
                        } finally {
                          setIsDeleting(false);
                        }
                      }}
                      disabled={isDeleting || isLeaving}
                      loading={isDeleting}
                      className="text-red-400 hover:bg-red-500/10"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Space'}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Invite Link Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <InviteLinkModal
            spaceId={space.id}
            spaceName={space.name}
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Automation Builder Modal */}
      {showAutomationBuilder && (
        <AutomationBuilderModal
          isOpen={showAutomationBuilder}
          onClose={() => {
            setShowAutomationBuilder(false);
            setEditingAutomation(null);
          }}
          onSave={handleAutomationSave}
          initialData={editingAutomation || undefined}
          mode={editingAutomation ? 'edit' : 'create'}
        />
      )}

      {/* Automation Templates Picker */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowTemplates(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 bg-[#1A1A1A] rounded-2xl border border-white/[0.08] shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-[#1A1A1A] border-b border-white/[0.06] p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Automation Templates</h3>
              <button
                onClick={() => setShowTemplates(false)}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {/* Quick Templates */}
              {[
                {
                  name: 'Welcome Message',
                  description: 'Send a greeting when new members join',
                  trigger: { type: 'event' as const, elementId: '', event: 'member_join' },
                  actions: [{ type: 'notify' as const, channel: 'push' as const, title: 'Welcome!', body: 'Welcome to the space!' }],
                },
                {
                  name: 'Weekly Digest',
                  description: 'Send a summary every Monday',
                  trigger: { type: 'schedule' as const, cron: '0 9 * * 1', timezone: 'America/New_York' },
                  actions: [{ type: 'notify' as const, channel: 'email' as const, title: 'Weekly Update', body: 'Here is what happened this week...' }],
                },
                {
                  name: 'Event Reminder',
                  description: 'Notify members 30 minutes before events',
                  trigger: { type: 'schedule' as const, cron: '0 * * * *', timezone: 'America/New_York' },
                  actions: [{ type: 'notify' as const, channel: 'push' as const, title: 'Event Starting Soon', body: 'Your event starts in 30 minutes!' }],
                },
              ].map((template) => (
                <button
                  key={template.name}
                  onClick={() => {
                    setShowTemplates(false);
                    setEditingAutomation({
                      name: template.name,
                      description: template.description,
                      enabled: true,
                      trigger: template.trigger,
                      conditions: [],
                      actions: template.actions,
                      limits: { maxRunsPerDay: 100, cooldownSeconds: 0 },
                    });
                    setShowAutomationBuilder(true);
                  }}
                  className="w-full p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/30 transition-all text-left group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                      <Zap className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <Text weight="medium" className="mb-1">{template.name}</Text>
                      <Text size="sm" tone="muted">{template.description}</Text>
                    </div>
                  </div>
                </button>
              ))}
              <div className="pt-4 border-t border-white/[0.06] text-center">
                <button
                  onClick={() => {
                    setShowTemplates(false);
                    setShowAutomationBuilder(true);
                  }}
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Or create from scratch →
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
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
