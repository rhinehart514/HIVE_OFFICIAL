'use client';

/**
 * SpaceSettings - Space configuration panel
 * CREATED: Jan 21, 2026
 * UPDATED: Jan 25, 2026 - Added board management, invite links
 * UPDATED: Feb 3, 2026 - Added Moderation, Join Requests, Analytics tabs
 *
 * Settings panel for space leaders to manage their space.
 * Sections: General, Contact, Members, Moderation, Requests, Boards, Automations, Analytics, Danger Zone
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  AlertTriangle,
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
  ArrowRightLeft,
  Crown,
  ChevronDown,
  Check,
  Loader2,
  Shield,
  UserCheck,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Inbox,
  Wrench,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Text, Button, toast, ConfirmDialog, Avatar, AvatarImage, AvatarFallback, getInitials } from '@hive/ui';
import { MOTION } from '@hive/tokens';
import { InviteLinkModal } from '@/components/spaces/invite-link-modal';
import { MemberManagement } from './member-management';
import { ModerationPanel } from './moderation-panel';
import { AnalyticsPanel } from './analytics-panel';

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
  onTransferOwnership?: (newOwnerId: string) => Promise<void>;
  className?: string;
}

export function SpaceSettings({ space, boards = [], isLeader = false, currentUserId, currentUserRole = 'member', onUpdate, onDelete, onLeave, onBoardDelete, onBoardUpdate, onTransferOwnership, className }: SpaceSettingsProps) {
  const [activeSection, setActiveSection] = React.useState<'general' | 'contact' | 'members' | 'moderation' | 'requests' | 'boards' | 'tools' | 'automations' | 'analytics' | 'danger'>('general');
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLeaving, setIsLeaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showInviteModal, setShowInviteModal] = React.useState(false);
  const [deletingBoardId, setDeletingBoardId] = React.useState<string | null>(null);
  const [editingBoardId, setEditingBoardId] = React.useState<string | null>(null);
  const [boardEdits, setBoardEdits] = React.useState<Record<string, { name: string; description: string }>>({});

  // Automations state
  const [automations, setAutomations] = React.useState<any[]>([]);
  const [automationsLoading, setAutomationsLoading] = React.useState(false);
  const [showAutomationBuilder, setShowAutomationBuilder] = React.useState(false);
  const [showTemplates, setShowTemplates] = React.useState(false);
  const [editingAutomation, setEditingAutomation] = React.useState<any | null>(null);

  // Moderation panel state
  const [showModerationPanel, setShowModerationPanel] = React.useState(false);

  // Analytics panel state
  const [showAnalyticsPanel, setShowAnalyticsPanel] = React.useState(false);

  // Tools state
  const [showAddToolModal, setShowAddToolModal] = React.useState(false);
  const [spaceTools, setSpaceTools] = React.useState<Array<{ id: string; name: string; icon?: string; description?: string }>>([]);
  const [spaceToolsLoading, setSpaceToolsLoading] = React.useState(false);

  // Join requests state
  const [joinRequests, setJoinRequests] = React.useState<Array<{
    id: string;
    userId: string;
    status: string;
    message?: string;
    createdAt: string | null;
    user: { id: string; displayName: string; handle?: string; avatarUrl?: string } | null;
  }>>([]);
  const [joinRequestsLoading, setJoinRequestsLoading] = React.useState(false);
  const [joinRequestActionId, setJoinRequestActionId] = React.useState<string | null>(null);

  const isAdminOrOwner = currentUserRole === 'owner' || currentUserRole === 'admin';
  const isModeratorOrAbove = isAdminOrOwner || currentUserRole === 'moderator';

  // Transfer ownership state
  const isOwner = currentUserRole === 'owner';
  const [transferCandidates, setTransferCandidates] = React.useState<Array<{ id: string; name: string; username: string; avatar?: string; role: string }>>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = React.useState(false);
  const [selectedTransferTarget, setSelectedTransferTarget] = React.useState<string | null>(null);
  const [showTransferConfirm, setShowTransferConfirm] = React.useState(false);
  const [isTransferring, setIsTransferring] = React.useState(false);
  const [showTransferDropdown, setShowTransferDropdown] = React.useState(false);
  const [confirmLeave, setConfirmLeave] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const transferDropdownRef = React.useRef<HTMLDivElement>(null);

  // Load eligible transfer candidates (admins and moderators first)
  React.useEffect(() => {
    if (activeSection === 'danger' && isOwner && onTransferOwnership && transferCandidates.length === 0) {
      setIsLoadingCandidates(true);
      fetch(`/api/spaces/${space.id}/members?limit=100`, { credentials: 'include' })
        .then(res => res.ok ? res.json() : { data: { members: [] } })
        .then(data => {
          const allMembers = data.data?.members || data.members || [];
          const eligible = allMembers
            .filter((m: { id?: string; userId?: string; membership?: { role?: string } }) => {
              const memberId = m.id || m.userId;
              return memberId !== currentUserId;
            })
            .map((m: { id?: string; userId?: string; profile?: { displayName?: string; handle?: string; avatar?: string }; name?: string; username?: string; avatar?: string; membership?: { role?: string }; role?: string }) => ({
              id: m.id || m.userId || '',
              name: m.profile?.displayName || m.name || 'Unknown',
              username: m.profile?.handle || m.username || '',
              avatar: m.profile?.avatar || m.avatar,
              role: m.membership?.role || m.role || 'member',
            }))
            .sort((a: { role: string }, b: { role: string }) => {
              const order: Record<string, number> = { admin: 0, moderator: 1, member: 2 };
              return (order[a.role] ?? 3) - (order[b.role] ?? 3);
            });
          setTransferCandidates(eligible);
        })
        .catch(() => setTransferCandidates([]))
        .finally(() => setIsLoadingCandidates(false));
    }
  }, [activeSection, isOwner, onTransferOwnership, space.id, currentUserId, transferCandidates.length]);

  // Close transfer dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (transferDropdownRef.current && !transferDropdownRef.current.contains(event.target as Node)) {
        setShowTransferDropdown(false);
      }
    }
    if (showTransferDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTransferDropdown]);

  const selectedCandidate = transferCandidates.find(c => c.id === selectedTransferTarget);

  const handleTransferOwnership = async () => {
    if (!onTransferOwnership || !selectedTransferTarget) return;
    setIsTransferring(true);
    try {
      await onTransferOwnership(selectedTransferTarget);
      setShowTransferConfirm(false);
      setSelectedTransferTarget(null);
    } catch {
      // Error handled by caller
    } finally {
      setIsTransferring(false);
    }
  };

  const handleLeave = async () => {
    if (!onLeave) return;
    setIsLeaving(true);
    try {
      await onLeave();
    } finally {
      setIsLeaving(false);
      setConfirmLeave(false);
    }
  };

  const handleBoardDelete = async (boardId: string, boardName: string) => {
    if (!onBoardDelete) return;
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

  // Fetch space tools when section is active
  React.useEffect(() => {
    if (activeSection === 'tools' && isLeader && spaceTools.length === 0) {
      setSpaceToolsLoading(true);
      fetch(`/api/spaces/${space.id}/tools`, { credentials: 'include' })
        .then(res => res.ok ? res.json() : { tools: [] })
        .then(data => {
          const tools = data.data?.tools || data.tools || [];
          setSpaceTools(tools.map((t: { id: string; name: string; description?: string; emoji?: string }) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            icon: t.emoji,
          })));
        })
        .catch(() => setSpaceTools([]))
        .finally(() => setSpaceToolsLoading(false));
    }
  }, [activeSection, isLeader, space.id, spaceTools.length]);

  const handleQuickDeploy = async (template: any) => {
    try {
      const response = await fetch(`/api/spaces/${space.id}/tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ templateId: template.id, name: template.name }),
      });
      if (!response.ok) throw new Error('Failed to deploy tool');
      const data = await response.json();
      const newTool = data.data?.tool || data.tool;
      if (newTool) {
        setSpaceTools(prev => [...prev, { id: newTool.id, name: newTool.name, description: newTool.description, icon: newTool.emoji }]);
      }
      toast.success('Tool deployed', `"${template.name}" has been added to your space`);
    } catch {
      toast.error('Failed to deploy tool', 'Please try again');
    }
  };

  const handleDeployExistingTool = async (toolId: string) => {
    try {
      const response = await fetch(`/api/spaces/${space.id}/tools/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ toolId }),
      });
      if (!response.ok) throw new Error('Failed to deploy tool');
      toast.success('Tool deployed to space');
      setSpaceTools([]);
    } catch {
      toast.error('Failed to deploy tool', 'Please try again');
    }
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
  const handleAutomationSave = async (automation: any) => {
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

  // Fetch join requests when section is active
  const fetchJoinRequests = React.useCallback(async () => {
    setJoinRequestsLoading(true);
    try {
      const response = await fetch(`/api/spaces/${space.id}/join-requests?status=pending`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setJoinRequests(data.data?.requests || []);
      } else {
        setJoinRequests([]);
      }
    } catch {
      setJoinRequests([]);
    } finally {
      setJoinRequestsLoading(false);
    }
  }, [space.id]);

  const spaceIsPrivate = !(space.isPublic ?? true);

  React.useEffect(() => {
    if (activeSection === 'requests' && isModeratorOrAbove && spaceIsPrivate) {
      fetchJoinRequests();
    }
  }, [activeSection, isModeratorOrAbove, spaceIsPrivate, fetchJoinRequests]);

  // Handle join request approval/rejection
  const handleJoinRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
    setJoinRequestActionId(requestId);
    try {
      const response = await fetch(`/api/spaces/${space.id}/join-requests`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ requestId, action }),
      });

      if (!response.ok) {
        throw new Error('Action failed');
      }

      toast.success(
        action === 'approve' ? 'Request approved' : 'Request declined',
        action === 'approve' ? 'Member has been added to the space' : 'The request has been declined'
      );

      // Remove from local list
      setJoinRequests(prev => prev.filter(r => r.id !== requestId));
    } catch {
      toast.error('Action failed', 'Please try again');
    } finally {
      setJoinRequestActionId(null);
    }
  };

  // Handle moderation nav click - open panel as overlay
  const handleModerationNavClick = () => {
    setActiveSection('moderation');
    setShowModerationPanel(true);
  };

  // Handle analytics nav click - open panel as overlay
  const handleAnalyticsNavClick = () => {
    setActiveSection('analytics');
    setShowAnalyticsPanel(true);
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
          {isModeratorOrAbove && (
            <SettingsNavItem
              active={activeSection === 'moderation'}
              onClick={handleModerationNavClick}
              icon={<Shield className="w-4 h-4" />}
              label="Moderation"
            />
          )}
          {isModeratorOrAbove && !(space.isPublic ?? true) && (
            <SettingsNavItem
              active={activeSection === 'requests'}
              onClick={() => setActiveSection('requests')}
              icon={<UserCheck className="w-4 h-4" />}
              label="Requests"
            />
          )}
          <SettingsNavItem
            active={activeSection === 'boards'}
            onClick={() => setActiveSection('boards')}
            icon={<Hash className="w-4 h-4" />}
            label="Boards"
          />
          {isLeader && (
            <SettingsNavItem
              active={activeSection === 'tools'}
              onClick={() => setActiveSection('tools')}
              icon={<Wrench className="w-4 h-4" />}
              label="Tools"
            />
          )}
          {isLeader && (
            <SettingsNavItem
              active={activeSection === 'automations'}
              onClick={() => setActiveSection('automations')}
              icon={<Zap className="w-4 h-4" />}
              label="Automations"
            />
          )}
          {isAdminOrOwner && (
            <SettingsNavItem
              active={activeSection === 'analytics'}
              onClick={handleAnalyticsNavClick}
              icon={<BarChart3 className="w-4 h-4" />}
              label="Analytics"
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
                style={{ fontFamily: 'var(--font-clash)' }}
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
                      'rounded-lg text-sm',
                      'bg-white/[0.06] border border-white/[0.06]',
                      'text-white placeholder:text-white/50',
                      'focus:outline-none focus:ring-2 focus:ring-white/50',
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
                      'rounded-lg text-sm',
                      'bg-white/[0.06] border border-white/[0.06]',
                      'text-white placeholder:text-white/50',
                      'resize-none',
                      'focus:outline-none focus:ring-2 focus:ring-white/50',
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
                        'w-full p-4 rounded-lg text-left transition-all',
                        'border',
                        isPublic
                          ? 'bg-white/[0.06] border-white/[0.06]'
                          : 'bg-white/[0.06] border-white/[0.06] hover:bg-white/[0.06]'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Globe className="w-5 h-5 text-white/50 flex-shrink-0 mt-0.5" />
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
                        'w-full p-4 rounded-lg text-left transition-all',
                        'border',
                        !isPublic
                          ? 'bg-white/[0.06] border-white/[0.06]'
                          : 'bg-white/[0.06] border-white/[0.06] hover:bg-white/[0.06]'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Lock className="w-5 h-5 text-white/50 flex-shrink-0 mt-0.5" />
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
                style={{ fontFamily: 'var(--font-clash)' }}
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

          {activeSection === 'moderation' && isModeratorOrAbove && (
            <>
              <h2
                className="text-title-lg font-semibold text-white mb-2"
                style={{ fontFamily: 'var(--font-clash)' }}
              >
                Moderation
              </h2>
              <Text size="sm" tone="muted" className="mb-8">
                Review flagged content and manage community guidelines
              </Text>

              <div
                className="p-6 rounded-lg bg-white/[0.06] border border-white/[0.06] cursor-pointer hover:bg-white/[0.06] transition-colors"
                onClick={() => setShowModerationPanel(true)}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-white/[0.06]">
                    <Shield className="w-6 h-6 text-white/50" />
                  </div>
                  <div className="flex-1">
                    <Text weight="medium" className="mb-1">Open Moderation Queue</Text>
                    <Text size="sm" tone="muted">
                      Review and act on flagged or hidden content in your space
                    </Text>
                  </div>
                  <ChevronDown className="w-5 h-5 text-white/50 -rotate-90" />
                </div>
              </div>
            </>
          )}

          {activeSection === 'requests' && isModeratorOrAbove && spaceIsPrivate && (
            <>
              <h2
                className="text-title-lg font-semibold text-white mb-2"
                style={{ fontFamily: 'var(--font-clash)' }}
              >
                Join Requests
              </h2>
              <Text size="sm" tone="muted" className="mb-8">
                Review and manage pending membership requests
              </Text>

              {joinRequestsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6  text-white/50" />
                </div>
              ) : joinRequests.length === 0 ? (
                <div className="text-center py-12 rounded-lg bg-white/[0.06] border border-white/[0.06]">
                  <Inbox className="w-10 h-10 mx-auto mb-4 text-white/50" />
                  <Text weight="medium" className="text-white/50 mb-1">
                    No pending requests
                  </Text>
                  <Text size="sm" tone="muted">
                    New join requests from prospective members will appear here
                  </Text>
                </div>
              ) : (
                <div className="space-y-3">
                  <Text size="xs" weight="medium" className="uppercase tracking-wider text-white/50 px-1">
                    Pending ({joinRequests.length})
                  </Text>
                  {joinRequests.map((request) => {
                    const isProcessing = joinRequestActionId === request.id;
                    return (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: MOTION.ease.premium }}
                        className="p-4 rounded-lg bg-white/[0.06] border border-white/[0.06]"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar size="default">
                            {request.user?.avatarUrl && (
                              <AvatarImage src={request.user.avatarUrl} />
                            )}
                            <AvatarFallback>
                              {request.user ? getInitials(request.user.displayName) : '?'}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <Text size="sm" weight="medium" className="truncate">
                              {request.user?.displayName || 'Unknown User'}
                            </Text>
                            {request.user?.handle && (
                              <Text size="xs" tone="muted" className="font-sans truncate">
                                @{request.user.handle}
                              </Text>
                            )}
                            {request.createdAt && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <Clock className="w-3 h-3 text-white/50" />
                                <Text size="xs" tone="muted">
                                  {new Date(request.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </Text>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleJoinRequestAction(request.id, 'reject')}
                              disabled={isProcessing}
                              className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                            >
                              {isProcessing && joinRequestActionId === request.id ? (
                                <Loader2 className="w-4 h-4 " />
                              ) : (
                                <XCircle className="w-4 h-4 mr-1.5" />
                              )}
                              Decline
                            </Button>
                            <Button
                              variant="cta"
                              size="sm"
                              onClick={() => handleJoinRequestAction(request.id, 'approve')}
                              disabled={isProcessing}
                            >
                              {isProcessing && joinRequestActionId === request.id ? (
                                <Loader2 className="w-4 h-4  mr-1.5" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-1.5" />
                              )}
                              Approve
                            </Button>
                          </div>
                        </div>

                        {request.message && (
                          <div className="mt-3 p-3 rounded-lg bg-white/[0.06] border border-white/[0.06]">
                            <Text size="xs" tone="muted" className="mb-1">Message</Text>
                            <Text size="sm" className="text-white/50">
                              {request.message}
                            </Text>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeSection === 'analytics' && isAdminOrOwner && (
            <>
              <h2
                className="text-title-lg font-semibold text-white mb-2"
                style={{ fontFamily: 'var(--font-clash)' }}
              >
                Analytics
              </h2>
              <Text size="sm" tone="muted" className="mb-8">
                Understand your space's growth and engagement
              </Text>

              <div
                className="p-6 rounded-lg bg-white/[0.06] border border-white/[0.06] cursor-pointer hover:bg-white/[0.06] transition-colors"
                onClick={() => setShowAnalyticsPanel(true)}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-white/[0.06]">
                    <BarChart3 className="w-6 h-6 text-white/50" />
                  </div>
                  <div className="flex-1">
                    <Text weight="medium" className="mb-1">Open Analytics Dashboard</Text>
                    <Text size="sm" tone="muted">
                      View member growth, engagement metrics, and activity insights
                    </Text>
                  </div>
                  <ChevronDown className="w-5 h-5 text-white/50 -rotate-90" />
                </div>
              </div>
            </>
          )}

          {activeSection === 'contact' && isLeader && (
            <>
              <h2
                className="text-title-lg font-semibold text-white mb-2"
                style={{ fontFamily: 'var(--font-clash)' }}
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
                      'rounded-lg text-sm',
                      'bg-white/[0.06] border border-white/[0.06]',
                      'text-white placeholder:text-white/50',
                      'focus:outline-none focus:ring-2 focus:ring-white/50',
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
                      'rounded-lg text-sm',
                      'bg-white/[0.06] border border-white/[0.06]',
                      'text-white placeholder:text-white/50',
                      'focus:outline-none focus:ring-2 focus:ring-white/50',
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
                      <LinkIcon className="w-4 h-4 text-white/50 flex-shrink-0" />
                      <input
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://your-website.com"
                        className={cn(
                          'flex-1 px-4 py-2.5',
                          'rounded-lg text-sm',
                          'bg-white/[0.06] border border-white/[0.06]',
                          'text-white placeholder:text-white/50',
                          'focus:outline-none focus:ring-2 focus:ring-white/50',
                          'transition-all duration-150'
                        )}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Text size="xs" className="w-4 text-white/50 text-center flex-shrink-0">IG</Text>
                      <input
                        type="url"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                        placeholder="https://instagram.com/yourhandle"
                        className={cn(
                          'flex-1 px-4 py-2.5',
                          'rounded-lg text-sm',
                          'bg-white/[0.06] border border-white/[0.06]',
                          'text-white placeholder:text-white/50',
                          'focus:outline-none focus:ring-2 focus:ring-white/50',
                          'transition-all duration-150'
                        )}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Text size="xs" className="w-4 text-white/50 text-center flex-shrink-0">X</Text>
                      <input
                        type="url"
                        value={twitterUrl}
                        onChange={(e) => setTwitterUrl(e.target.value)}
                        placeholder="https://twitter.com/yourhandle"
                        className={cn(
                          'flex-1 px-4 py-2.5',
                          'rounded-lg text-sm',
                          'bg-white/[0.06] border border-white/[0.06]',
                          'text-white placeholder:text-white/50',
                          'focus:outline-none focus:ring-2 focus:ring-white/50',
                          'transition-all duration-150'
                        )}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Text size="xs" className="w-4 text-white/50 text-center flex-shrink-0">FB</Text>
                      <input
                        type="url"
                        value={facebookUrl}
                        onChange={(e) => setFacebookUrl(e.target.value)}
                        placeholder="https://facebook.com/yourpage"
                        className={cn(
                          'flex-1 px-4 py-2.5',
                          'rounded-lg text-sm',
                          'bg-white/[0.06] border border-white/[0.06]',
                          'text-white placeholder:text-white/50',
                          'focus:outline-none focus:ring-2 focus:ring-white/50',
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
                style={{ fontFamily: 'var(--font-clash)' }}
              >
                Board Management
              </h2>
              <Text size="sm" tone="muted" className="mb-8">
                Organize and configure your space's boards
              </Text>

              {boards.length === 0 ? (
                <div className="p-4 rounded-lg bg-white/[0.06] border border-white/[0.06]">
                  <Text size="sm" tone="muted">No boards yet</Text>
                </div>
              ) : (
                <div className="space-y-3">
                  {boards.map((board) => (
                    <div
                      key={board.id}
                      className="p-4 rounded-lg bg-white/[0.06] border border-white/[0.06]"
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
                                'bg-white/[0.06] border border-white/[0.06]',
                                'text-white placeholder:text-white/50',
                                'focus:outline-none focus:ring-2 focus:ring-white/50',
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
                                'bg-white/[0.06] border border-white/[0.06]',
                                'text-white placeholder:text-white/50',
                                'resize-none',
                                'focus:outline-none focus:ring-2 focus:ring-white/50',
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
                            <Hash className="w-4 h-4 text-white/50 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <Text weight="medium">{board.name}</Text>
                              {board.description && (
                                <Text size="sm" tone="muted" className="mt-0.5 line-clamp-2">
                                  {board.description}
                                </Text>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                {board.isDefault && (
                                  <Text size="xs" className="text-white/50">Default</Text>
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

          {activeSection === 'tools' && isLeader && (
            <>
              <h2
                className="text-title-lg font-semibold text-white mb-2"
                style={{ fontFamily: 'var(--font-clash)' }}
              >
                Tools
              </h2>
              <Text size="sm" tone="muted" className="mb-8">
                Add tools to engage your members
              </Text>

              {/* Deployed tools list */}
              {spaceToolsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6  text-white/50" />
                </div>
              ) : spaceTools.length === 0 ? (
                <div className="text-center py-12 rounded-lg bg-white/[0.06] border border-white/[0.06]">
                  <Wrench className="w-10 h-10 mx-auto mb-4 text-white/50" />
                  <Text weight="medium" className="text-white/50 mb-1">
                    No tools deployed yet
                  </Text>
                  <Text size="sm" tone="muted" className="mb-6 max-w-sm mx-auto">
                    Add polls, sign-ups, countdowns, and more to make your space.
                  </Text>
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="cta"
                      size="default"
                      onClick={() => setShowAddToolModal(true)}
                    >
                      <Wrench className="w-4 h-4 mr-2" />
                      Add Tool
                    </Button>
                    <a
                      href={`/lab/new?spaceId=${space.id}&spaceName=${encodeURIComponent(space.name)}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white/50 hover:text-white transition-colors"
                    >
                      Build a tool
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Text size="sm" weight="medium" tone="muted">
                      {spaceTools.length} {spaceTools.length === 1 ? 'tool' : 'tools'} deployed
                    </Text>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddToolModal(true)}
                    >
                      <Wrench className="w-3 h-3 mr-1.5" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {spaceTools.map((tool) => (
                      <div
                        key={tool.id}
                        className="p-4 rounded-lg bg-white/[0.06] border border-white/[0.06] flex items-center gap-3"
                      >
                        <span className="text-xl">{tool.icon || '🔧'}</span>
                        <div className="flex-1 min-w-0">
                          <Text size="sm" weight="medium" className="truncate">
                            {tool.name}
                          </Text>
                          {tool.description && (
                            <Text size="xs" tone="muted" className="truncate">
                              {tool.description}
                            </Text>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-white/[0.06]">
                    <a
                      href={`/lab/new?spaceId=${space.id}&spaceName=${encodeURIComponent(space.name)}`}
                      className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white/50 transition-colors"
                    >
                      Build custom tools in HiveLab
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </>
          )}

          {activeSection === 'automations' && isLeader && (
            <>
              <h2
                className="text-title-lg font-semibold text-white mb-2"
                style={{ fontFamily: 'var(--font-clash)' }}
              >
                Automations
              </h2>
              <Text size="sm" tone="muted" className="mb-8">
                Set up automated workflows to engage members
              </Text>

              {/* Empty state with templates */}
              {automations.length === 0 && !automationsLoading && (
                <div className="text-center py-12 rounded-lg bg-white/[0.06] border border-white/[0.06]">
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
                  {/* Automations deferred */}
                </div>
              )}
            </>
          )}

          {activeSection === 'danger' && (
            <>
              <h2
                className="text-title-lg font-semibold text-red-400 mb-2"
                style={{ fontFamily: 'var(--font-clash)' }}
              >
                Danger Zone
              </h2>
              <Text size="sm" tone="muted" className="mb-8">
                Irreversible actions — proceed with caution
              </Text>

              <div className="space-y-4">
                {/* Leave Space - Available to all members (P1.6) */}
                {onLeave && (
                  <div className="p-4 rounded-lg bg-orange-500/[0.06] border border-orange-500/20">
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
                      onClick={() => setConfirmLeave(true)}
                      disabled={isLeaving || isDeleting || confirmLeave}
                      className="text-orange-400 hover:bg-orange-500/10"
                    >
                      Leave Space
                    </Button>

                    {confirmLeave && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 mt-3">
                        <p className="text-sm text-white/50 flex-1">Are you sure you want to leave this space?</p>
                        <button
                          onClick={handleLeave}
                          disabled={isLeaving}
                          className="text-sm text-orange-400 font-medium hover:text-orange-300 disabled:opacity-50"
                        >
                          {isLeaving ? 'Leaving...' : 'Leave'}
                        </button>
                        <button
                          onClick={() => setConfirmLeave(false)}
                          disabled={isLeaving}
                          className="text-sm text-white/50 hover:text-white/50"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Transfer Ownership - Only for owner */}
                {isOwner && onTransferOwnership && (
                  <div className="p-4 rounded-lg bg-amber-500/[0.06] border border-amber-500/20">
                    <div className="flex items-start gap-3 mb-4">
                      <ArrowRightLeft className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <Text weight="medium" className="text-amber-400 mb-1">
                          Transfer Ownership
                        </Text>
                        <Text size="sm" className="text-amber-400/70">
                          Hand off ownership to another member. You will become an admin.
                          This cannot be undone without the new owner's consent.
                        </Text>
                      </div>
                    </div>

                    {/* Candidate selector */}
                    <div className="mb-3">
                      <Text size="xs" weight="medium" tone="muted" className="mb-2 block">
                        Select new owner
                      </Text>

                      {isLoadingCandidates ? (
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.06] border border-white/[0.06]">
                          <Loader2 className="w-4 h-4  text-white/50" />
                          <Text size="sm" tone="muted">Loading members...</Text>
                        </div>
                      ) : transferCandidates.length === 0 ? (
                        <div className="px-3 py-2.5 rounded-lg bg-white/[0.06] border border-white/[0.06]">
                          <Text size="sm" tone="muted">No eligible members found</Text>
                        </div>
                      ) : (
                        <div className="relative" ref={transferDropdownRef}>
                          <button
                            type="button"
                            onClick={() => setShowTransferDropdown(!showTransferDropdown)}
                            className={cn(
                              'w-full flex items-center justify-between px-3 py-2.5',
                              'rounded-lg text-sm text-left',
                              'bg-white/[0.06] border border-white/[0.06]',
                              'hover:bg-white/[0.06] transition-colors',
                              showTransferDropdown && 'ring-2 ring-white/20'
                            )}
                          >
                            {selectedCandidate ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md bg-white/[0.06] flex items-center justify-center text-xs font-medium text-white/50 overflow-hidden flex-shrink-0">
                                  {selectedCandidate.avatar ? (
                                    <img src={selectedCandidate.avatar} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    selectedCandidate.name.charAt(0).toUpperCase()
                                  )}
                                </div>
                                <span className="text-white">{selectedCandidate.name}</span>
                                <span className={cn(
                                  'text-xs px-1.5 py-0.5 rounded-md',
                                  selectedCandidate.role === 'admin' ? 'bg-[var(--color-gold)]/10 text-[var(--color-gold)]' :
                                  selectedCandidate.role === 'moderator' ? 'bg-white/[0.06] text-white/50' :
                                  'bg-white/[0.06] text-white/50'
                                )}>
                                  {selectedCandidate.role === 'admin' ? 'Leader' : selectedCandidate.role === 'moderator' ? 'Mod' : 'Member'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-white/50">Choose a member...</span>
                            )}
                            <ChevronDown className={cn(
                              'w-4 h-4 text-white/50 transition-transform',
                              showTransferDropdown && 'rotate-180'
                            )} />
                          </button>

                          <AnimatePresence>
                            {showTransferDropdown && (
                              <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className={cn(
                                  'absolute left-0 right-0 top-full mt-1 z-50',
                                  'max-h-[240px] overflow-y-auto',
                                  'rounded-lg border border-white/[0.06] bg-[var(--bg-elevated)]',
                                  'py-1'
                                )}
                              >
                                {transferCandidates.map((candidate) => (
                                  <button
                                    key={candidate.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedTransferTarget(candidate.id);
                                      setShowTransferDropdown(false);
                                    }}
                                    className={cn(
                                      'w-full flex items-center gap-2 px-3 py-2 text-left',
                                      'hover:bg-white/[0.06] transition-colors',
                                      selectedTransferTarget === candidate.id && 'bg-white/[0.06]'
                                    )}
                                  >
                                    <div className="w-6 h-6 rounded-md bg-white/[0.06] flex items-center justify-center text-xs font-medium text-white/50 overflow-hidden flex-shrink-0">
                                      {candidate.avatar ? (
                                        <img src={candidate.avatar} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        candidate.name.charAt(0).toUpperCase()
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <Text size="sm" weight="medium" className="truncate">{candidate.name}</Text>
                                      {candidate.username && (
                                        <Text size="xs" tone="muted" className="font-sans truncate">@{candidate.username}</Text>
                                      )}
                                    </div>
                                    <span className={cn(
                                      'text-xs px-1.5 py-0.5 rounded-md flex-shrink-0',
                                      candidate.role === 'admin' ? 'bg-[var(--color-gold)]/10 text-[var(--color-gold)]' :
                                      candidate.role === 'moderator' ? 'bg-white/[0.06] text-white/50' :
                                      'bg-white/[0.06] text-white/50'
                                    )}>
                                      {candidate.role === 'admin' ? 'Leader' : candidate.role === 'moderator' ? 'Mod' : 'Member'}
                                    </span>
                                    {selectedTransferTarget === candidate.id && (
                                      <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                    )}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTransferConfirm(true)}
                      disabled={!selectedTransferTarget || isTransferring}
                      className="text-amber-400 hover:bg-amber-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Transfer Ownership
                    </Button>
                  </div>
                )}

                {/* Delete Space - Only for leaders */}
                {isLeader && onDelete && (
                  <div className="p-4 rounded-lg bg-red-500/[0.06] border border-red-500/20">
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
                      onClick={() => setConfirmDelete(true)}
                      disabled={isDeleting || isLeaving || confirmDelete}
                      className="text-red-400 hover:bg-red-500/10"
                    >
                      Delete Space
                    </Button>

                    {confirmDelete && (
                      <div className="flex flex-col gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mt-3">
                        <p className="text-sm text-red-400/80">
                          This will permanently delete <span className="font-medium text-red-400">{space.name}</span> and all its content. This cannot be undone.
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={async () => {
                              setIsDeleting(true);
                              try {
                                await onDelete();
                              } finally {
                                setIsDeleting(false);
                                setConfirmDelete(false);
                              }
                            }}
                            disabled={isDeleting}
                            className="text-sm text-red-400 font-medium hover:text-red-300 disabled:opacity-50"
                          >
                            {isDeleting ? 'Deleting...' : 'Yes, delete permanently'}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(false)}
                            disabled={isDeleting}
                            className="text-sm text-white/50 hover:text-white/50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
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

      {/* Transfer Ownership Confirmation */}
      <ConfirmDialog
        open={showTransferConfirm}
        onOpenChange={setShowTransferConfirm}
        variant="warning"
        title="Transfer ownership?"
        description={
          selectedCandidate
            ? `You are about to make ${selectedCandidate.name} the owner of "${space.name}". You will be demoted to admin. Only the new owner can reverse this.`
            : 'Select a member to transfer ownership to.'
        }
        confirmText={isTransferring ? 'Transferring...' : 'Transfer Ownership'}
        onConfirm={handleTransferOwnership}
        loading={isTransferring}
      />

      {/* Automation Builder Modal — deferred */}

      {/* Moderation Panel Overlay */}
      <ModerationPanel
        isOpen={showModerationPanel}
        onClose={() => setShowModerationPanel(false)}
        spaceId={space.id}
        spaceName={space.name}
      />

      {/* Analytics Panel Overlay */}
      <AnalyticsPanel
        isOpen={showAnalyticsPanel}
        onClose={() => setShowAnalyticsPanel(false)}
        spaceId={space.id}
      />

      {/* Add Tool — redirects to lab templates */}
      {showAddToolModal && (() => {
        setShowAddToolModal(false);
        window.location.href = `/lab/templates?spaceId=${space.id}&spaceName=${encodeURIComponent(space.name)}`;
        return null;
      })()}

      {/* Automation Templates Picker */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 "
            onClick={() => setShowTemplates(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 bg-[var(--bg-surface-hover)] rounded-lg border border-white/[0.06] max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-[var(--bg-surface-hover)] border-b border-white/[0.06] p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Automation Templates</h3>
              <button
                onClick={() => setShowTemplates(false)}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/50 hover:text-white transition-colors"
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
                  className="w-full p-4 rounded-lg bg-white/[0.06] border border-white/[0.06] hover:border-amber-500/30 transition-all text-left group"
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
                  className="text-sm text-white/50 hover:text-white transition-colors"
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
          ? 'bg-white/[0.06] text-white'
          : variant === 'danger'
          ? 'text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.04]'
          : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
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
