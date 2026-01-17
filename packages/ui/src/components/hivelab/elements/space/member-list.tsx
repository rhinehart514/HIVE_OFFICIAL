'use client';

/**
 * MemberList Element (Space Tier)
 *
 * Display space members with roles and join dates.
 * Requires: spaceId context (leaders only).
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import { UsersIcon } from '@heroicons/react/24/outline';
import { Card, CardContent } from '../../../../design-system/primitives';
import { Badge } from '../../../../design-system/primitives';
import type { ElementProps } from '../../../../lib/hivelab/element-system';

interface Member {
  id: string;
  name: string;
  photoURL?: string;
  role?: string;
  joinedAt?: string;
}

export function MemberListElement({ config, data, context, onChange, onAction }: ElementProps) {
  const [members, setMembers] = useState<Member[]>(data?.members || []);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const maxMembers = config.maxMembers || 20;

  useEffect(() => {
    if (!context?.spaceId) return;

    const fetchMembers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/spaces/${context.spaceId}/members`, {
          credentials: 'include',
        });
        if (response.ok) {
          const result = await response.json();
          const memberData = (result.members || []).map((m: Record<string, unknown>) => ({
            id: m.userId || m.id,
            name: m.displayName || m.name || 'Unknown',
            photoURL: m.avatarUrl || m.photoURL,
            role: m.role,
            joinedAt: m.joinedAt,
          }));
          setMembers(memberData);
          onChange?.({ members: memberData });
        }
      } catch (err) {
        console.error('Failed to fetch members:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [context?.spaceId]);

  if (!context?.spaceId) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          <UsersIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>Member List requires space context</p>
          <p className="text-xs mt-1">Deploy to a space to see members</p>
        </CardContent>
      </Card>
    );
  }

  const handleMemberClick = (member: Member) => {
    setSelectedMember(member.id);
    onChange?.({ selectedMember: member, members });
    onAction?.('select', { selectedMember: member, members });
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">Space Members</span>
          </div>
          <Badge variant="outline">{isLoading ? '...' : members.length}</Badge>
        </div>

        {isLoading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div className="flex-1 h-4 bg-muted rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : members.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No members yet
          </div>
        ) : (
          <div className="space-y-2">
            {members.slice(0, maxMembers).map((member, index) => (
              <div
                key={member.id || index}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                  selectedMember === member.id ? 'bg-primary/10 ring-1 ring-primary' : 'hover:bg-muted/50'
                }`}
                onClick={() => handleMemberClick(member)}
              >
                {member.photoURL ? (
                  <img src={member.photoURL} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-medium">{member.name?.[0] || '?'}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{member.name || 'Unknown'}</div>
                  {config.showRole && member.role && (
                    <Badge variant="outline" className="text-xs mt-0.5">{member.role}</Badge>
                  )}
                </div>
                {config.showJoinDate && member.joinedAt && (
                  <span className="text-xs text-muted-foreground">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
