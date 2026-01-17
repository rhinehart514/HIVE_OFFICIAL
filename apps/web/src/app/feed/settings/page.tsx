'use client';

/**
 * /feed/settings — Feed Preferences
 *
 * Archetype: Orientation
 * Purpose: Configure feed preferences
 * Shell: ON
 *
 * Per HIVE App Map v1:
 * - Control what appears in your feed
 * - Mute spaces, filter content types
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bell, Filter, EyeOff, Sparkles } from 'lucide-react';
import { Text, Heading, Card, Button, Switch } from '@hive/ui/design-system/primitives';
import { useAuth } from '@hive/auth-logic';

interface FeedPreferences {
  showPosts: boolean;
  showEvents: boolean;
  showToolUpdates: boolean;
  showAnnouncements: boolean;
  personalizedContent: boolean;
  mutedSpaces: string[];
}

export default function FeedSettingsPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  const [preferences, setPreferences] = React.useState<FeedPreferences>({
    showPosts: true,
    showEvents: true,
    showToolUpdates: true,
    showAnnouncements: true,
    personalizedContent: true,
    mutedSpaces: [],
  });
  const [isSaving, setIsSaving] = React.useState(false);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/enter?from=/feed/settings');
    }
  }, [isLoading, isAuthenticated, router]);

  // Save preferences
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement API call to save preferences
      await new Promise(resolve => setTimeout(resolve, 500));
      router.push('/feed');
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const togglePreference = (key: keyof FeedPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-ground)] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-ground)]">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/feed"
            className="p-2 -ml-2 text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <Heading level={1} className="text-xl">
              Feed Settings
            </Heading>
            <Text size="sm" tone="muted">
              Customize what appears in your feed
            </Text>
          </div>
        </div>

        {/* Content Types */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-white/40" />
            <Text weight="medium" className="uppercase text-xs tracking-wider text-white/40">
              Content Types
            </Text>
          </div>

          <Card className="divide-y divide-white/[0.04]">
            <SettingRow
              title="Posts"
              description="Updates and discussions from your spaces"
              checked={preferences.showPosts}
              onChange={() => togglePreference('showPosts')}
            />
            <SettingRow
              title="Events"
              description="Upcoming events from your spaces"
              checked={preferences.showEvents}
              onChange={() => togglePreference('showEvents')}
            />
            <SettingRow
              title="Tool Updates"
              description="New tools and updates in your spaces"
              checked={preferences.showToolUpdates}
              onChange={() => togglePreference('showToolUpdates')}
            />
            <SettingRow
              title="Announcements"
              description="Important announcements from space leaders"
              checked={preferences.showAnnouncements}
              onChange={() => togglePreference('showAnnouncements')}
            />
          </Card>
        </section>

        {/* Personalization */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-white/40" />
            <Text weight="medium" className="uppercase text-xs tracking-wider text-white/40">
              Personalization
            </Text>
          </div>

          <Card>
            <SettingRow
              title="Personalized Content"
              description="Show content based on your interests and activity"
              checked={preferences.personalizedContent}
              onChange={() => togglePreference('personalizedContent')}
            />
          </Card>
        </section>

        {/* Muted Spaces */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <EyeOff className="h-4 w-4 text-white/40" />
            <Text weight="medium" className="uppercase text-xs tracking-wider text-white/40">
              Muted Spaces
            </Text>
          </div>

          <Card className="p-4">
            {preferences.mutedSpaces.length === 0 ? (
              <Text size="sm" tone="muted" className="text-center py-4">
                No muted spaces. Mute a space from its settings to hide it from your feed.
              </Text>
            ) : (
              <div className="space-y-2">
                {preferences.mutedSpaces.map((spaceId) => (
                  <div
                    key={spaceId}
                    className="flex items-center justify-between py-2"
                  >
                    <Text size="sm">{spaceId}</Text>
                    <Button variant="ghost" size="sm">
                      Unmute
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>

        {/* Save button */}
        <div className="flex gap-3">
          <Button
            variant="default"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push('/feed')}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function SettingRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4">
      <div>
        <Text weight="medium" size="sm">{title}</Text>
        <Text size="xs" tone="muted">{description}</Text>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
