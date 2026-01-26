'use client';

/**
 * User Selector Element - Refactored with Core Abstractions
 *
 * User/member picker with:
 * - Search with API integration
 * - Photo and handle display
 * - Loading and error states
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import { UsersIcon } from '@heroicons/react/24/outline';

import { Input } from '../../../../design-system/primitives';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../design-system/primitives';

import type { ElementProps } from '../../../../lib/hivelab/element-system';
import type { ElementMode } from '../core';

// ============================================================
// Types
// ============================================================

interface UserOption {
  id: string;
  name: string;
  handle: string;
  photoURL?: string;
}

interface UserSelectorConfig {
  label?: string;
  spaceId?: string;
  maxResults?: number;
  allowMultiple?: boolean;
}

interface UserSelectorElementProps extends ElementProps {
  config: UserSelectorConfig;
  mode?: ElementMode;
}

// ============================================================
// Main User Selector Element
// ============================================================

export function UserSelectorElement({
  config,
  onChange,
  data,
  context,
  onAction,
  mode = 'runtime',
}: UserSelectorElementProps) {
  const [selectedUser, setSelectedUser] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveSpaceId = context?.spaceId || config.spaceId || data?.spaceId;

  useEffect(() => {
    const fetchUsers = async () => {
      if (data?.users && Array.isArray(data.users)) {
        setUsers(data.users.map((u: Record<string, unknown>) => ({
          id: u.id as string,
          name: u.fullName as string || u.name as string || 'Unknown',
          handle: u.handle as string || `@${(u.id as string).slice(0, 8)}`,
          photoURL: u.photoURL as string | undefined
        })));
        return;
      }

      if (!searchQuery && !effectiveSpaceId) {
        setUsers([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/users/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: searchQuery || 'a',
            limit: config.maxResults || 20,
            spaceId: effectiveSpaceId,
            campusId: context?.campusId,
            sortBy: 'relevance'
          })
        });

        if (!response.ok) throw new Error('Failed to fetch users');

        const result = await response.json();
        setUsers((result.users || []).map((u: Record<string, unknown>) => ({
          id: u.id as string,
          name: u.fullName as string || 'Unknown',
          handle: u.handle as string || `@${(u.id as string).slice(0, 8)}`,
          photoURL: u.photoURL as string | undefined
        })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, effectiveSpaceId, config.maxResults, data?.users, context?.campusId]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <UsersIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{config.label || 'Select user'}</span>
      </div>

      <Input
        value={searchQuery}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
        placeholder="Search members..."
        className="mb-2"
      />

      <Select
        value={selectedUser}
        onValueChange={(value) => {
          setSelectedUser(value);
          const user = users.find(u => u.id === value);
          onChange?.({ selectedUser: value, userId: value, selectedUserData: user });
          onAction?.('select', { selectedUser: value, userId: value, selectedUserData: user });
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? "Loading..." : "Choose a member"} />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Loading users...</div>
          ) : error ? (
            <div className="px-3 py-2 text-sm text-red-500">{error}</div>
          ) : users.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {searchQuery ? 'No users found' : 'Type to search for members'}
            </div>
          ) : (
            users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                <div className="flex items-center gap-2">
                  {user.photoURL && (
                    <img src={user.photoURL} alt="" className="h-5 w-5 rounded-full object-cover" />
                  )}
                  <div className="flex flex-col">
                    <span>{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.handle}</span>
                  </div>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {config.allowMultiple && (
        <div className="text-xs text-muted-foreground">
          Hold Ctrl/Cmd to select multiple members
        </div>
      )}
    </div>
  );
}

export default UserSelectorElement;
