'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Input, Card } from '@hive/ui';
import {
  ChevronLeft,
  Settings,
  Users,
  Shield,
  Wrench,
  Trash2,
  Save,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@hive/auth-logic';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { useToast } from '@/hooks/use-toast';
import { _motion } from 'framer-motion';

// Animation variants
const _fadeVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const _transition = {
  duration: 0.2,
  ease: [0.22, 1, 0.36, 1],
};

// =============================================================================
// TYPES
// =============================================================================

interface SpaceSettings {
  id: string;
  name: string;
  description: string;
  category: string;
  joinPolicy: 'open' | 'approval' | 'invite_only';
  isPublic: boolean;
}

type SettingsTab = 'general' | 'members' | 'permissions' | 'integrations' | 'danger';

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function SpaceSettingsPage() {
  const router = useRouter();
  const params = useParams<{ spaceId: string }>();
  const spaceId = params.spaceId;
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState<SpaceSettings | null>(null);
  const [isLeader, setIsLeader] = useState(false);

  // Load space settings
  useEffect(() => {
    const _loadSettings = async () => {
      if (!spaceId || !user) return;

      try {
        setLoading(true);
        const res = await secureApiFetch(`/api/spaces/${spaceId}`);
        if (!res.ok) {
          router.push(`/spaces/${spaceId}`);
          return;
        }

        const data = await res.json();
        setSettings({
          id: data.id,
          name: data.name || '',
          description: data.description || '',
          category: data.category || 'student_org',
          joinPolicy: data.joinPolicy || 'open',
          isPublic: data.isPublic !== false,
        });

        // Check if user is leader
        const memberRes = await secureApiFetch(`/api/spaces/${spaceId}/members/me`);
        if (memberRes.ok) {
          const memberData = await memberRes.json();
          setIsLeader(['owner', 'admin'].includes(memberData.role));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast({
          title: 'Failed to load settings',
          description: 'Please try again.',
          type: 'error',
          duration: 5000
        });
      } finally {
        setLoading(false);
      }
    };

    _loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast/router are stable
  }, [spaceId, user]);

  // Redirect non-leaders
  useEffect(() => {
    if (!loading && !isLeader) {
      toast({
        title: 'Access denied',
        description: 'Only leaders can access settings.',
        type: 'error',
        duration: 5000
      });
      router.push(`/spaces/${spaceId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isLeader]);

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const res = await secureApiFetch(`/api/spaces/${spaceId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: settings.name,
          description: settings.description,
          category: settings.category,
          joinPolicy: settings.joinPolicy,
          isPublic: settings.isPublic,
        })
      });

      if (!res.ok) throw new Error('Failed to save');

      toast({
        title: 'Settings saved',
        description: 'Your changes have been applied.',
        type: 'success',
        duration: 3000
      });
    } catch (error) {
      console.error('Failed to save:', error);
      toast({
        title: 'Failed to save',
        description: 'Please try again.',
        type: 'error',
        duration: 5000
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSpace = async () => {
    if (!confirm('Are you sure you want to delete this space? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await secureApiFetch(`/api/spaces/${spaceId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete');

      toast({
        title: 'Space deleted',
        description: 'The space has been permanently deleted.',
        type: 'success',
        duration: 3000
      });
      router.push('/spaces');
    } catch (error) {
      console.error('Failed to delete:', error);
      toast({
        title: 'Failed to delete',
        description: 'Please try again.',
        type: 'error',
        duration: 5000
      });
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Settings className="h-4 w-4" /> },
    { id: 'members', label: 'Members', icon: <Users className="h-4 w-4" /> },
    { id: 'permissions', label: 'Permissions', icon: <Shield className="h-4 w-4" /> },
    { id: 'integrations', label: 'Integrations', icon: <Wrench className="h-4 w-4" /> },
    { id: 'danger', label: 'Danger Zone', icon: <AlertTriangle className="h-4 w-4" /> },
  ];

  // =============================================================================
  // RENDER
  // =============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--hive-background-primary)]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-[var(--hive-background-secondary)] rounded" />
            <div className="h-4 w-64 bg-[var(--hive-background-secondary)] rounded" />
            <div className="h-64 bg-[var(--hive-background-secondary)] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-[var(--hive-background-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--hive-background-primary)]/80 backdrop-blur-xl border-b border-[var(--hive-border-default)]">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/spaces/${spaceId}`)}
                className="p-2 -ml-2 rounded-lg text-[var(--hive-text-secondary)] hover:text-[var(--hive-text-primary)] hover:bg-[var(--hive-background-secondary)] transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-[var(--hive-text-primary)]">Space Settings</h1>
                <p className="text-sm text-[var(--hive-text-secondary)]">{settings.name}</p>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-white text-black hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none"
            >
              <Save className="h-4 w-4 mr-1.5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar tabs */}
          <nav className="md:w-48 flex-shrink-0">
            <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none ${
                    activeTab === tab.id
                      ? 'bg-[var(--hive-background-secondary)] text-[var(--hive-text-primary)]'
                      : 'text-[var(--hive-text-secondary)] hover:text-[var(--hive-text-primary)] hover:bg-[var(--hive-background-secondary)]'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Tab content */}
          <div className="flex-1">
            {activeTab === 'general' && (
              <Card className="p-6 bg-[var(--hive-background-secondary)] border-[var(--hive-border-default)]">
                <h2 className="text-lg font-semibold text-[var(--hive-text-primary)] mb-6">General Settings</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--hive-text-secondary)] mb-1.5">
                      Space Name
                    </label>
                    <Input
                      value={settings.name}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, name: e.target.value } : null)}
                      className="bg-[var(--hive-background-tertiary)] border-[var(--hive-border-default)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--hive-text-secondary)] mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={settings.description}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, description: e.target.value } : null)}
                      rows={4}
                      className="w-full bg-[var(--hive-background-tertiary)] border border-[var(--hive-border-default)] rounded-lg px-3 py-2 text-[var(--hive-text-primary)] text-sm resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--hive-text-secondary)] mb-1.5">
                      Category
                    </label>
                    <select
                      value={settings.category}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, category: e.target.value } : null)}
                      className="w-full bg-[var(--hive-background-tertiary)] border border-[var(--hive-border-default)] rounded-lg px-3 py-2 text-[var(--hive-text-primary)] text-sm"
                    >
                      <option value="student_org">Student Org</option>
                      <option value="residential">Residential</option>
                      <option value="university_org">University Org</option>
                      <option value="greek_life">Greek Life</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--hive-text-secondary)] mb-1.5">
                      Join Policy
                    </label>
                    <select
                      value={settings.joinPolicy}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, joinPolicy: e.target.value as 'open' | 'approval' | 'invite_only' } : null)}
                      className="w-full bg-[var(--hive-background-tertiary)] border border-[var(--hive-border-default)] rounded-lg px-3 py-2 text-[var(--hive-text-primary)] text-sm"
                    >
                      <option value="open">Open - Anyone can join</option>
                      <option value="approval">Approval Required</option>
                      <option value="invite_only">Invite Only</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-sm font-medium text-[var(--hive-text-primary)]">Public Space</p>
                      <p className="text-xs text-[var(--hive-text-tertiary)]">Anyone can discover this space</p>
                    </div>
                    <button
                      onClick={() => setSettings(prev => prev ? { ...prev, isPublic: !prev.isPublic } : null)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        settings.isPublic
                          ? 'bg-[var(--hive-brand-primary)]'
                          : 'bg-[var(--hive-background-tertiary)]'
                      }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        settings.isPublic ? 'left-6' : 'left-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'members' && (
              <Card className="p-6 bg-[var(--hive-background-secondary)] border-[var(--hive-border-default)]">
                <h2 className="text-lg font-semibold text-[var(--hive-text-primary)] mb-4">Member Management</h2>
                <p className="text-[var(--hive-text-secondary)]">
                  View and manage space members, promote to admin, or remove members.
                </p>
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => router.push(`/spaces/${spaceId}/members`)}
                >
                  <Users className="h-4 w-4 mr-1.5" />
                  Manage Members
                </Button>
              </Card>
            )}

            {activeTab === 'permissions' && (
              <Card className="p-6 bg-[var(--hive-background-secondary)] border-[var(--hive-border-default)]">
                <h2 className="text-lg font-semibold text-[var(--hive-text-primary)] mb-4">Permissions</h2>
                <p className="text-[var(--hive-text-secondary)]">
                  Configure what different roles can do in your space.
                </p>
                <div className="mt-4 p-4 bg-[var(--hive-background-tertiary)] rounded-lg border border-[var(--hive-border-default)]">
                  <p className="text-sm text-[var(--hive-text-tertiary)]">
                    Advanced permissions coming soon.
                  </p>
                </div>
              </Card>
            )}

            {activeTab === 'integrations' && (
              <Card className="p-6 bg-[var(--hive-background-secondary)] border-[var(--hive-border-default)]">
                <h2 className="text-lg font-semibold text-[var(--hive-text-primary)] mb-4">Integrations</h2>
                <p className="text-[var(--hive-text-secondary)]">
                  Enable tools like calendar, polls, and custom HiveLab tools for your space.
                </p>
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => router.push(`/spaces/${spaceId}/tools`)}
                >
                  <Wrench className="h-4 w-4 mr-1.5" />
                  Manage Tools
                </Button>
              </Card>
            )}

            {activeTab === 'danger' && (
              <Card className="p-6 bg-[var(--hive-background-secondary)] border border-[var(--hive-status-error)]/30">
                <h2 className="text-lg font-semibold text-[var(--hive-status-error)] mb-4">Danger Zone</h2>
                <p className="text-[var(--hive-text-secondary)] mb-4">
                  These actions are irreversible. Please be certain.
                </p>

                <div className="p-4 bg-[var(--hive-status-error)]/10 rounded-lg border border-[var(--hive-status-error)]/30">
                  <h3 className="font-medium text-[var(--hive-text-primary)] mb-2">Delete Space</h3>
                  <p className="text-sm text-[var(--hive-text-secondary)] mb-3">
                    Permanently delete this space and all its content. This cannot be undone.
                  </p>
                  <Button
                    variant="secondary"
                    onClick={handleDeleteSpace}
                    className="border-[var(--hive-status-error)] text-[var(--hive-status-error)] hover:bg-[var(--hive-status-error)]/10"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Delete Space
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
