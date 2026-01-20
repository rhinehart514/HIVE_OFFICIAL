'use client';

/**
 * /spaces/[spaceId]/roles — Roles Management
 *
 * Archetype: Discovery
 * Purpose: Manage space roles and permissions
 * Shell: ON
 *
 * Per HIVE App Map v1:
 * - View and manage custom roles
 * - Assign roles to members
 * - Set role permissions
 */

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Text, Heading, Card, Button, Badge } from '@hive/ui/design-system/primitives';
import { DiscoveryLayout, DiscoveryList, DiscoveryEmpty } from '@hive/ui';
import { useAuth } from '@hive/auth-logic';

interface Role {
  id: string;
  name: string;
  color?: string;
  memberCount: number;
  permissions: string[];
  isDefault?: boolean;
}

export default function SpaceRolesPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const spaceId = params?.spaceId as string;

  const [roles, setRoles] = React.useState<Role[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);

  // Check admin status and fetch roles
  React.useEffect(() => {
    async function fetchData() {
      if (!spaceId || !isAuthenticated) return;

      try {
        // Check if user is admin
        const memberRes = await fetch(`/api/spaces/${spaceId}/member`, {
          credentials: 'include',
        });
        if (memberRes.ok) {
          const memberData = await memberRes.json();
          setIsAdmin(memberData.role === 'owner' || memberData.role === 'admin');
        }

        // Fetch roles
        const rolesRes = await fetch(`/api/spaces/${spaceId}/roles`, {
          credentials: 'include',
        });
        if (rolesRes.ok) {
          const data = await rolesRes.json();
          setRoles(data.roles || []);
        }
      } catch {
        // Failed to fetch roles
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [spaceId, isAuthenticated]);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    router.push(`/enter?from=/spaces/${spaceId}/roles`);
    return null;
  }

  // Header with back navigation
  const header = (
    <div className="flex items-center gap-3">
      <Link
        href={`/spaces/${spaceId}/settings`}
        className="p-2 -ml-2 text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <div>
        <Heading level={1} className="text-xl">
          Roles
        </Heading>
        <Text size="sm" tone="muted">
          Manage permissions and access levels
        </Text>
      </div>
    </div>
  );

  return (
    <DiscoveryLayout header={header}>
      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      )}

      {/* Access denied */}
      {!isLoading && !isAdmin && (
        <DiscoveryEmpty
          message="You don't have permission to manage roles"
          action={
            <Button
              variant="secondary"
              onClick={() => router.push(`/spaces/${spaceId}`)}
            >
              Back to Space
            </Button>
          }
        />
      )}

      {/* Roles list */}
      {!isLoading && isAdmin && (
        <div className="space-y-6">
          {/* Actions */}
          <div className="flex justify-end">
            <Button variant="default" size="sm">
              <Shield className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </div>

          {/* Empty state */}
          {roles.length === 0 && (
            <DiscoveryEmpty
              message="No custom roles yet"
              action={
                <Text size="sm" tone="muted">
                  Create roles to organize member permissions
                </Text>
              }
            />
          )}

          {/* Roles */}
          <DiscoveryList gap="md">
            {roles.map((role) => (
              <Card
                key={role.id}
                interactive
                className="p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: role.color || '#666' }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Text weight="medium">{role.name}</Text>
                        {role.isDefault && (
                          <Badge variant="neutral" size="sm">
                            Default
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <Text size="sm" tone="muted" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {role.memberCount} members
                        </Text>
                        <Text size="sm" tone="muted">
                          {role.permissions.length} permissions
                        </Text>
                      </div>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </DiscoveryList>

          {/* Default roles info */}
          <Card className="p-4 bg-white/[0.02]">
            <Text size="sm" tone="muted">
              <strong className="text-white/70">Default roles:</strong> Owner, Admin, and Member
              are built-in and cannot be deleted. You can create custom roles with specific
              permissions.
            </Text>
          </Card>
        </div>
      )}
    </DiscoveryLayout>
  );
}
