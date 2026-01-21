'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@hive/ui';
import { apiClient } from '@/lib/api-client';
import {
  UserCircleIcon,
  BuildingOffice2Icon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

// Aliases for lucide compatibility
const UserCircle = UserCircleIcon;
const Building = BuildingOffice2Icon;
const Sparkles = SparklesIcon;

/**
 * HiveLab Context Selection Page
 *
 * Forces users to select where they're building:
 * - Their profile (personal tools)
 * - A space they lead (space tools)
 *
 * This ensures all tools have proper context from creation.
 */

type Space = {
  id: string;
  name: string;
  description?: string;
  role?: string;
  memberCount?: number;
};

export default function SelectContextPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('return');

  // If context is already provided (e.g., from space page), skip selection
  const preselectedContext = searchParams.get('context');
  const preselectedSpaceId = searchParams.get('spaceId');
  const preselectedSpaceName = searchParams.get('spaceName');

  const [isClient, setIsClient] = useState(false);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auto-redirect if context is pre-selected
  useEffect(() => {
    if (!isClient) return;

    if (preselectedContext === 'space' && preselectedSpaceId && preselectedSpaceName) {
      // Skip selection, go straight to create
      const params = new URLSearchParams({
        context: 'space',
        spaceId: preselectedSpaceId,
        spaceName: preselectedSpaceName,
      });
      if (returnUrl) params.set('return', returnUrl);
      router.replace(`/create?${params.toString()}`);
    } else if (preselectedContext === 'profile') {
      // Skip selection, go straight to create
      const params = new URLSearchParams({
        context: 'profile',
      });
      if (returnUrl) params.set('return', returnUrl);
      router.replace(`/create?${params.toString()}`);
    }
  }, [isClient, preselectedContext, preselectedSpaceId, preselectedSpaceName, returnUrl, router]);

  // Fetch user and their leadable spaces
  useEffect(() => {
    if (!isClient) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Get current user
        const auth = getAuth();
        const user = auth.currentUser;

        if (user) {
          setUserName(user.displayName || 'My Profile');
        }

        // Fetch spaces where user can deploy (leader/admin/builder roles)
        const spacesResponse = await apiClient.get('/api/profile/my-spaces');
        if (spacesResponse.ok) {
          const spacesData = await spacesResponse.json();
          const allSpaces = (spacesData.spaces || spacesData || []) as Space[];

          // Filter to spaces where user can deploy tools
          const leadSpaces = allSpaces.filter(
            (s) => s.role === 'leader' || s.role === 'admin' || s.role === 'builder'
          );

          setSpaces(leadSpaces);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isClient]);

  const handleSelectProfile = () => {
    const params = new URLSearchParams({
      context: 'profile',
    });
    if (returnUrl) params.set('return', returnUrl);
    router.push(`/create?${params.toString()}`);
  };

  const handleSelectSpace = (spaceId: string, spaceName: string) => {
    const params = new URLSearchParams({
      context: 'space',
      spaceId,
      spaceName,
    });
    if (returnUrl) params.set('return', returnUrl);
    router.push(`/create?${params.toString()}`);
  };

  if (!isClient || isLoading) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-6">
        <div className="max-w-4xl w-full space-y-8">
          <div className="text-center space-y-3">
            <Skeleton className="h-10 w-64 mx-auto" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-[var(--hive-status-error)]">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="text-[var(--hive-brand-primary)] hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--hive-brand-primary)]/10 rounded-2xl mb-4">
            <Sparkles className="w-8 h-8 text-[var(--hive-brand-primary)]" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--hive-text-primary)]">
            Where are you building?
          </h1>
          <p className="text-[var(--hive-text-secondary)] max-w-2xl mx-auto">
            Choose whether you're building a tool for your personal profile or for a space you lead.
            This helps us provide the right context and deployment options.
          </p>
        </div>

        {/* Context Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Option */}
          <Card
            className="bg-[var(--hive-background-secondary)] border-[var(--hive-border-default)] hover:border-[var(--hive-brand-primary)] transition-all cursor-pointer group"
            onClick={handleSelectProfile}
          >
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-[var(--hive-brand-primary)]/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-[var(--hive-brand-primary)]/20 transition-colors">
                <UserCircle className="w-6 h-6 text-[var(--hive-brand-primary)]" />
              </div>
              <CardTitle className="text-xl text-[var(--hive-text-primary)]">
                Personal Profile
              </CardTitle>
              <CardDescription className="text-[var(--hive-text-secondary)]">
                Build a tool for your own profile page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-[var(--hive-text-tertiary)]">
                  Create tools that appear on your profile and showcase your work to the campus community.
                </p>
                <Button
                  className="w-full bg-[var(--hive-brand-primary)] text-black hover:bg-[var(--hive-brand-hover)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectProfile();
                  }}
                >
                  Build for Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Space Options */}
          {spaces.length > 0 ? (
            spaces.slice(0, 3).map((space) => (
              <Card
                key={space.id}
                className="bg-[var(--hive-background-secondary)] border-[var(--hive-border-default)] hover:border-[var(--hive-brand-primary)] transition-all cursor-pointer group"
                onClick={() => handleSelectSpace(space.id, space.name)}
              >
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-[var(--hive-brand-primary)]/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-[var(--hive-brand-primary)]/20 transition-colors">
                    <Building className="w-6 h-6 text-[var(--hive-brand-primary)]" />
                  </div>
                  <CardTitle className="text-xl text-[var(--hive-text-primary)] truncate">
                    {space.name}
                  </CardTitle>
                  <CardDescription className="text-[var(--hive-text-secondary)] line-clamp-2">
                    {space.description || 'Build a tool for this space'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {space.memberCount && (
                      <p className="text-xs text-[var(--hive-text-tertiary)]">
                        {space.memberCount} members
                      </p>
                    )}
                    <Button
                      className="w-full bg-[var(--hive-brand-primary)] text-black hover:bg-[var(--hive-brand-hover)]"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSpace(space.id, space.name);
                      }}
                    >
                      Build for {space.name}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-[var(--hive-background-secondary)] border-dashed border-2 border-[var(--hive-border-default)]">
              <CardContent className="py-12 text-center">
                <Building className="w-12 h-12 text-[var(--hive-text-tertiary)] mx-auto mb-4" />
                <h3 className="font-semibold text-[var(--hive-text-primary)] mb-2">
                  No Spaces Available
                </h3>
                <p className="text-sm text-[var(--hive-text-secondary)] mb-4">
                  You need to be a leader, admin, or builder in a space to create tools for it.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000', '_blank')}
                >
                  Browse Spaces
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Show more spaces if available */}
          {spaces.length > 3 && (
            <Card className="bg-[var(--hive-background-secondary)] border-[var(--hive-border-default)]">
              <CardContent className="py-12 text-center">
                <p className="text-sm text-[var(--hive-text-secondary)] mb-4">
                  +{spaces.length - 3} more space{spaces.length - 3 !== 1 ? 's' : ''} available
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // For now, just show the first space. In the future, could add a full selection modal
                    if (spaces[3]) {
                      handleSelectSpace(spaces[3].id, spaces[3].name);
                    }
                  }}
                >
                  View All Spaces
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Feed Preview (Coming Soon) */}
        <div className="pt-8 border-t border-[var(--hive-border-default)]">
          <Card className="bg-[var(--hive-background-secondary)] border-[var(--hive-border-default)] opacity-60">
            <CardContent className="py-8 text-center">
              <Sparkles className="w-10 h-10 text-[var(--hive-text-tertiary)] mx-auto mb-3" />
              <h3 className="font-semibold text-[var(--hive-text-primary)] mb-2">
                Feed Tools Coming Soon
              </h3>
              <p className="text-sm text-[var(--hive-text-secondary)]">
                Soon you'll be able to build tools that appear in the campus feed
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
