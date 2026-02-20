'use client';

/**
 * DirectoryList Element
 *
 * Searchable member/contact directory.
 * Config: fields (key, label, type), entries, useSpaceMembers
 * Actions: None (read-only)
 * State: None needed
 */

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  EnvelopeIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { springPresets } from '@hive/tokens';

import { Card, CardContent } from '../../../../design-system/primitives';

// ElementProps and ElementMode defined inline to avoid circular dependency
type ElementMode = 'edit' | 'runtime' | 'preview';

interface ElementProps {
  id: string;
  config: Record<string, any>;
  data?: any;
  onChange?: (data: any) => void;
  onAction?: (action: string, payload: any) => void;
  context?: {
    userId?: string;
    campusId?: string;
    spaceId?: string;
    isSpaceLeader?: boolean;
  };
  sharedState?: any;
  userState?: any;
}

// ============================================================
// Types
// ============================================================

interface DirectoryField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'role';
}

interface DirectoryListConfig {
  fields?: DirectoryField[];
  entries?: Array<Record<string, string>>;
  useSpaceMembers?: boolean;
  title?: string;
}

interface DirectoryListElementProps extends ElementProps {
  config: DirectoryListConfig;
  mode?: ElementMode;
}

// ============================================================
// API member shape (from GET /api/spaces/[spaceId]/members)
// ============================================================

interface SpaceMemberResponse {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  role: string;
  status: string;
  joinedAt: string;
  major?: string;
  graduationYear?: string;
}

// ============================================================
// Hook: fetch space members
// ============================================================

function useSpaceMembersData(
  enabled: boolean,
  spaceId: string | undefined,
) {
  const [members, setMembers] = useState<Array<Record<string, string>>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async (sid: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/spaces/${sid}/members?limit=100`);
      if (!res.ok) {
        throw new Error(res.status === 403 ? 'Permission denied' : `Failed to load members`);
      }

      const json = await res.json();
      const apiMembers: SpaceMemberResponse[] = json.data?.members ?? json.members ?? [];

      const mapped = apiMembers.map((m) => ({
        name: m.name || 'Unknown',
        role: m.role || 'member',
        email: '', // email not exposed by the members API for privacy
        username: m.username || '',
        status: m.status || 'offline',
      }));

      setMembers(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !spaceId) return;
    fetchMembers(spaceId);
  }, [enabled, spaceId, fetchMembers]);

  return { members, isLoading, error };
}

// ============================================================
// Field value renderer
// ============================================================

function FieldValue({ field, value }: { field: DirectoryField; value: string | undefined }) {
  if (!value) return null;

  switch (field.type) {
    case 'email':
      return (
        <a
          href={`mailto:${value}`}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          aria-label={`Email ${value}`}
        >
          <EnvelopeIcon className="h-3.5 w-3.5" />
          {value}
        </a>
      );
    case 'phone':
      return (
        <a
          href={`tel:${value}`}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          aria-label={`Call ${value}`}
        >
          <PhoneIcon className="h-3.5 w-3.5" />
          {value}
        </a>
      );
    case 'role':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium">
          {value}
        </span>
      );
    default:
      return <span className="text-sm text-foreground">{value}</span>;
  }
}

// ============================================================
// DirectoryList Element
// ============================================================

export function DirectoryListElement({
  id,
  config,
  data,
  context,
  mode = 'runtime',
}: DirectoryListElementProps) {
  const prefersReducedMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState('');

  const shouldFetchMembers = Boolean(config.useSpaceMembers && context?.spaceId);
  const {
    members: fetchedMembers,
    isLoading,
    error: fetchError,
  } = useSpaceMembersData(shouldFetchMembers, context?.spaceId);

  const fields: DirectoryField[] = config.fields || [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'role', label: 'Role', type: 'role' },
    ...(shouldFetchMembers
      ? [{ key: 'username', label: 'Username', type: 'text' as const }]
      : [{ key: 'email', label: 'Email', type: 'email' as const }]),
  ];

  // Use fetched members when useSpaceMembers is enabled and fetch succeeded;
  // fall back to config.entries on error or when the flag is off.
  const entries: Array<Record<string, string>> =
    shouldFetchMembers && !fetchError ? fetchedMembers : (config.entries || []);

  // Filter entries by search query
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;

    const query = searchQuery.toLowerCase();
    return entries.filter((entry) =>
      fields.some((field) => {
        const value = entry[field.key];
        return value && value.toLowerCase().includes(query);
      })
    );
  }, [entries, searchQuery, fields]);

  // Get the "name" field for the card title (first text field, or first field)
  const nameField = fields.find(f => f.key === 'name') || fields.find(f => f.type === 'text') || fields[0];
  const otherFields = fields.filter(f => f !== nameField);

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5 text-primary" />
              <span className="font-semibold">{config.title || 'Directory'}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {isLoading ? '...' : `${filteredEntries.length} ${filteredEntries.length === 1 ? 'member' : 'members'}`}
            </span>
          </div>

          {/* Search */}
          {entries.length > 3 && (
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search directory..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                aria-label="Search directory"
              />
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="space-y-2" aria-label="Loading members">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border border-border rounded-lg p-3 animate-pulse">
                  <div className="h-4 w-32 bg-muted rounded mb-2" />
                  <div className="flex gap-4">
                    <div className="h-3 w-20 bg-muted/60 rounded" />
                    <div className="h-3 w-24 bg-muted/60 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error banner — subtle, still shows fallback data below */}
          {fetchError && shouldFetchMembers && (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
              <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
              <span>Could not load members — showing saved entries</span>
            </div>
          )}

          {/* Entries */}
          {!isLoading && (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredEntries.map((entry, index) => (
                <motion.div
                  key={entry[nameField?.key || 'name'] || index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { ...springPresets.gentle, delay: index * 0.03 }}
                  className="border border-border rounded-lg p-3"
                >
                  {/* Name / primary field */}
                  <div className="font-medium text-sm mb-1">
                    {entry[nameField?.key || 'name'] || 'Unknown'}
                  </div>

                  {/* Other fields */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    {otherFields.map((field) => {
                      const value = entry[field.key];
                      if (!value) return null;
                      return (
                        <div key={field.key} className="flex items-center gap-1">
                          <FieldValue field={field} value={value} />
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredEntries.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {searchQuery ? 'No results found' : (shouldFetchMembers ? 'No members found' : 'No entries yet')}
              </div>
            )}
          </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default DirectoryListElement;
