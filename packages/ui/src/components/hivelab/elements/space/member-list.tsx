'use client';

/**
 * MemberList Element (Space Tier)
 *
 * Display space members with roles and join dates.
 * Requires: spaceId context (leaders only).
 *
 * GTM Polish Pass (January 2026):
 * - Added Framer Motion animations
 * - Improved loading skeletons with shimmer
 * - Better empty state with illustrations
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import { UsersIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { springPresets } from '@hive/tokens';
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

  // Preview mode: show mock data in IDE
  const isPreviewMode = !context?.spaceId;
  const mockMembers: Member[] = [
    { id: 'mock-1', name: 'Alex Chen', role: 'leader', joinedAt: '2025-09-15' },
    { id: 'mock-2', name: 'Jordan Lee', role: 'admin', joinedAt: '2025-10-02' },
    { id: 'mock-3', name: 'Sam Wilson', role: 'member', joinedAt: '2025-11-20' },
    { id: 'mock-4', name: 'Riley Brooks', role: 'member', joinedAt: '2025-12-05' },
  ];
  const displayMembers = isPreviewMode ? mockMembers : members;

  const handleMemberClick = (member: Member) => {
    setSelectedMember(member.id);
    onChange?.({ selectedMember: member, members });
    onAction?.('select', { selectedMember: member, members });
  };

  return (
    <Card className={isPreviewMode ? 'border-dashed border-primary/30' : ''}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">Space Members</span>
            {isPreviewMode && <Badge variant="outline" className="text-xs text-primary">Preview</Badge>}
          </div>
          <Badge variant="outline">{isLoading ? '...' : displayMembers.length}</Badge>
        </div>

        {isLoading && !isPreviewMode ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 bg-muted rounded w-24 animate-pulse" style={{ animationDelay: `${i * 100 + 50}ms` }} />
                  <div className="h-3 bg-muted rounded w-16 animate-pulse" style={{ animationDelay: `${i * 100 + 100}ms` }} />
                </div>
              </div>
            ))}
          </div>
        ) : displayMembers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springPresets.gentle}
            className="py-8 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1], rotate: [0, 3, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center mx-auto mb-3"
            >
              <UsersIcon className="h-7 w-7 text-blue-500/50" />
            </motion.div>
            <p className="font-medium text-foreground mb-1">No members yet</p>
            <p className="text-sm text-muted-foreground">Members will appear as they join</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {displayMembers.slice(0, maxMembers).map((member, index) => (
                <motion.div
                  key={member.id || index}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ delay: index * 0.04, ...springPresets.snappy }}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                    selectedMember === member.id ? 'bg-primary/10 ring-1 ring-primary' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleMemberClick(member)}
                  whileHover={{ x: 2 }}
                  whileTap={{ opacity: 0.8 }}
                >
                  {member.photoURL ? (
                    <motion.img
                      src={member.photoURL}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.04 + 0.1 }}
                    />
                  ) : (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.04 + 0.1 }}
                      className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"
                    >
                      <span className="text-xs font-medium">{member.name?.[0] || '?'}</span>
                    </motion.div>
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
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
