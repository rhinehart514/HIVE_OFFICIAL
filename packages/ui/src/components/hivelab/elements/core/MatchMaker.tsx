'use client';

/**
 * MatchMaker Element
 *
 * Preference-based matching for study groups, mentorship, etc.
 * Config: preferenceFields, title, matchSize
 * Actions: submit_preferences, accept_match, reject_match, rematch
 * State: collections.pool, collections.matches, counters.poolSize
 */

import * as React from 'react';
import { useState, useCallback, useMemo } from 'react';
import {
  SparklesIcon,
  UserGroupIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { springPresets } from '@hive/tokens';

import { Button } from '../../../../design-system/primitives';
import { Card, CardContent } from '../../../../design-system/primitives';
import { AnimatedNumber, numberSpringPresets } from '../../../motion-primitives/animated-number';

import type { ElementProps } from '../../../../lib/hivelab/element-system';
import { StateContainer, type ElementMode } from '../core';

// ============================================================
// Types
// ============================================================

interface PreferenceField {
  key: string;
  label: string;
  type: 'multi-select' | 'text' | 'single-select';
  options?: string[];
}

interface PoolEntry {
  id: string;
  createdAt: string;
  createdBy: string;
  data: {
    userId: string;
    userName: string;
    preferences: Record<string, unknown>;
  };
}

interface MatchEntry {
  id: string;
  createdAt: string;
  createdBy: string;
  data: {
    users: Array<{ userId: string; userName: string; preferences: Record<string, unknown> }>;
    status: 'pending' | 'accepted' | 'rejected';
    compatibility: number;
  };
}

interface MatchMakerConfig {
  title?: string;
  preferenceFields?: PreferenceField[];
  matchSize?: number;
}

interface MatchMakerElementProps extends ElementProps {
  config: MatchMakerConfig;
  mode?: ElementMode;
}

// ============================================================
// MatchMaker Element
// ============================================================

export function MatchMakerElement({
  id,
  config,
  onAction,
  sharedState,
  userState,
  context,
  mode = 'runtime',
}: MatchMakerElementProps) {
  const prefersReducedMotion = useReducedMotion();
  const instanceId = id || 'match-maker';

  const [preferences, setPreferences] = useState<Record<string, unknown>>({});
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const title = config.title || 'MatchMaker';
  const preferenceFields: PreferenceField[] = config.preferenceFields || [
    { key: 'interests', label: 'Interests', type: 'multi-select', options: ['Study', 'Research', 'Social', 'Projects'] },
    { key: 'availability', label: 'Availability', type: 'multi-select', options: ['Morning', 'Afternoon', 'Evening', 'Weekend'] },
    { key: 'note', label: 'A note about you', type: 'text' },
  ];

  const poolKey = `${instanceId}:pool`;
  const matchesKey = `${instanceId}:matches`;
  const poolMap = (sharedState?.collections?.[poolKey] || {}) as Record<string, PoolEntry>;
  const matchesMap = (sharedState?.collections?.[matchesKey] || {}) as Record<string, MatchEntry>;

  const poolSize = sharedState?.counters?.[`${instanceId}:poolSize`] ?? Object.keys(poolMap).length;
  const currentUserId = context?.userId || userState?.userId as string || '';

  const hasSubmitted = userState?.participation?.[`${instanceId}:submitted_preferences`] === true
    || Object.values(poolMap).some(e => e.data?.userId === currentUserId);

  const isMatched = userState?.participation?.[`${instanceId}:matched`] === true;

  const myMatches = useMemo(() => {
    return Object.values(matchesMap).filter(m =>
      m.data?.users?.some(u => u.userId === currentUserId)
    );
  }, [matchesMap, currentUserId]);

  const handleSubmitPreferences = useCallback(() => {
    setLoadingAction('submitting');
    onAction?.('submit_preferences', { preferences });
    setLoadingAction(null);
  }, [onAction, preferences]);

  const handleAcceptMatch = useCallback((matchId: string) => {
    setLoadingAction(matchId);
    onAction?.('accept_match', { matchId });
    setLoadingAction(null);
  }, [onAction]);

  const handleRejectMatch = useCallback((matchId: string) => {
    setLoadingAction(matchId);
    onAction?.('reject_match', { matchId });
    setLoadingAction(null);
  }, [onAction]);

  const handleRematch = useCallback(() => {
    setLoadingAction('rematch');
    onAction?.('rematch', {});
    setLoadingAction(null);
  }, [onAction]);

  const toggleMultiSelect = (fieldKey: string, option: string) => {
    setPreferences(prev => {
      const current = (prev[fieldKey] as string[]) || [];
      const next = current.includes(option)
        ? current.filter(o => o !== option)
        : [...current, option];
      return { ...prev, [fieldKey]: next };
    });
  };

  return (
    <StateContainer status="success">
      <Card className="overflow-hidden">
        <CardContent className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-primary" />
              <span className="font-semibold">{title}</span>
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              <AnimatedNumber value={poolSize} springOptions={numberSpringPresets.quick} /> in pool
            </span>
          </div>

          {/* Match Results */}
          {myMatches.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-medium flex items-center gap-1.5">
                <UserGroupIcon className="h-4 w-4 text-primary" />
                Your Matches
              </div>
              <AnimatePresence>
                {myMatches.map((match) => {
                  const otherUsers = match.data?.users?.filter(u => u.userId !== currentUserId) || [];
                  return (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={prefersReducedMotion ? { duration: 0 } : springPresets.snappy}
                      className="border rounded-lg p-3 space-y-2"
                    >
                      {otherUsers.map((user) => (
                        <div key={user.userId} className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">{user.userName || 'Anonymous'}</div>
                            {user.preferences && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {Object.entries(user.preferences).map(([key, val]) => {
                                  const display = Array.isArray(val) ? val.join(', ') : String(val);
                                  if (!display) return null;
                                  return (
                                    <span key={key} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                      {display}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {match.data?.compatibility != null && (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-primary rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${match.data.compatibility}%` }}
                              transition={prefersReducedMotion ? { duration: 0 } : springPresets.default}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {Math.round(match.data.compatibility)}% match
                          </span>
                        </div>
                      )}

                      {match.data?.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleAcceptMatch(match.id)}
                            disabled={loadingAction === match.id}
                            size="sm"
                            className="h-7 px-3 text-xs"
                          >
                            <CheckIcon className="h-3.5 w-3.5 mr-1" />
                            Accept
                          </Button>
                          <Button
                            onClick={() => handleRejectMatch(match.id)}
                            disabled={loadingAction === match.id}
                            variant="ghost"
                            size="sm"
                            className="h-7 px-3 text-xs text-destructive hover:text-destructive"
                          >
                            <XMarkIcon className="h-3.5 w-3.5 mr-1" />
                            Pass
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              <Button
                onClick={handleRematch}
                disabled={loadingAction === 'rematch'}
                variant="outline"
                size="sm"
                className="h-7 px-3 text-xs w-full"
              >
                <ArrowPathIcon className="h-3.5 w-3.5 mr-1" />
                Find New Match
              </Button>
            </div>
          )}

          {/* Waiting State */}
          {hasSubmitted && myMatches.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6 space-y-2"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="inline-block"
              >
                <SparklesIcon className="h-8 w-8 text-primary/50" />
              </motion.div>
              <div className="text-sm text-muted-foreground">
                Waiting for matches...
              </div>
              <div className="text-xs text-muted-foreground">
                <AnimatedNumber value={poolSize} springOptions={numberSpringPresets.quick} /> people in the pool
              </div>
            </motion.div>
          )}

          {/* Preference Form */}
          {!hasSubmitted && myMatches.length === 0 && (
            <div className="space-y-3">
              {preferenceFields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{field.label}</label>

                  {field.type === 'multi-select' && field.options && (
                    <div className="flex flex-wrap gap-1.5">
                      {field.options.map(option => {
                        const selected = ((preferences[field.key] as string[]) || []).includes(option);
                        return (
                          <button
                            key={option}
                            onClick={() => toggleMultiSelect(field.key, option)}
                            className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                              selected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {field.type === 'single-select' && field.options && (
                    <div className="flex flex-wrap gap-1.5">
                      {field.options.map(option => {
                        const selected = preferences[field.key] === option;
                        return (
                          <button
                            key={option}
                            onClick={() => setPreferences(prev => ({ ...prev, [field.key]: option }))}
                            className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                              selected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {field.type === 'text' && (
                    <input
                      type="text"
                      value={(preferences[field.key] as string) || ''}
                      onChange={(e) => setPreferences(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                    />
                  )}
                </div>
              ))}

              <Button
                onClick={handleSubmitPreferences}
                disabled={loadingAction === 'submitting'}
                size="sm"
                className="w-full"
              >
                <SparklesIcon className="h-3.5 w-3.5 mr-1" />
                Find My Match
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </StateContainer>
  );
}

export default MatchMakerElement;
