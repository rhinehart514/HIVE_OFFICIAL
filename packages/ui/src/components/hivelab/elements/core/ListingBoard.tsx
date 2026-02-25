'use client';

/**
 * ListingBoard Element
 *
 * Card-grid listing board for textbook exchanges, free stuff, ride boards, etc.
 * Config: categories, listingFields, claimBehavior, title
 * Actions: post_listing, claim_listing, unclaim, mark_done, delete_listing
 * State: collections.listings, counters.listingCount, counters.claimedCount
 */

import * as React from 'react';
import { useState, useCallback, useMemo } from 'react';
import {
  RectangleStackIcon,
  PlusIcon,
  XMarkIcon,
  TagIcon,
  TrashIcon,
  CheckCircleIcon,
  HandRaisedIcon,
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

interface ListingEntry {
  id: string;
  createdAt: string;
  createdBy: string;
  data: {
    title: string;
    description: string;
    price: string;
    category: string;
    image: string;
    status: 'open' | 'claimed' | 'done';
    claimedBy?: string;
    postedBy: string;
    postedByName: string;
  };
}

interface ListingBoardConfig {
  title?: string;
  categories?: string[];
  listingFields?: Array<{ key: string; label: string; type: string; required?: boolean }>;
  claimBehavior?: 'instant' | 'request';
}

interface ListingBoardElementProps extends ElementProps {
  config: ListingBoardConfig;
  mode?: ElementMode;
}

// ============================================================
// ListingBoard Element
// ============================================================

export function ListingBoardElement({
  id,
  config,
  onAction,
  sharedState,
  userState,
  context,
  mode = 'runtime',
}: ListingBoardElementProps) {
  const prefersReducedMotion = useReducedMotion();
  const instanceId = id || 'listing-board';

  const [showPostForm, setShowPostForm] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const categories = config.categories || ['Textbooks', 'Free Stuff', 'Rides', 'Other'];
  const title = config.title || 'Listing Board';

  const listingsKey = `${instanceId}:listings`;
  const listingsMap = (sharedState?.collections?.[listingsKey] || {}) as Record<string, ListingEntry>;
  const allListings = Object.values(listingsMap);

  const listingCount = sharedState?.counters?.[`${instanceId}:listingCount`] ?? allListings.length;
  const claimedCount = sharedState?.counters?.[`${instanceId}:claimedCount`] ?? 0;

  const currentUserId = context?.userId || userState?.userId as string || '';

  const filteredListings = useMemo(() => {
    let result = allListings.filter(l => l.data?.status !== 'done');
    if (activeCategory) {
      result = result.filter(l => l.data?.category === activeCategory);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allListings, activeCategory]);

  const handlePost = useCallback(() => {
    if (!formData.title?.trim()) return;
    setLoadingAction('posting');

    onAction?.('post_listing', {
      title: formData.title,
      description: formData.description || '',
      price: formData.price || '',
      category: formData.category || categories[0],
      image: '',
    });

    setFormData({});
    setShowPostForm(false);
    setLoadingAction(null);
  }, [formData, onAction, categories]);

  const handleClaim = useCallback((listingId: string) => {
    setLoadingAction(listingId);
    onAction?.('claim_listing', { listingId });
    setLoadingAction(null);
  }, [onAction]);

  const handleUnclaim = useCallback((listingId: string) => {
    setLoadingAction(listingId);
    onAction?.('unclaim', { listingId });
    setLoadingAction(null);
  }, [onAction]);

  const handleDelete = useCallback((listingId: string) => {
    onAction?.('delete_listing', { listingId });
  }, [onAction]);

  const handleMarkDone = useCallback((listingId: string) => {
    onAction?.('mark_done', { listingId });
  }, [onAction]);

  return (
    <StateContainer status="success">
      <Card className="overflow-hidden">
        <CardContent className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RectangleStackIcon className="h-5 w-5 text-primary" />
              <span className="font-semibold">{title}</span>
              <span className="text-xs text-muted-foreground tabular-nums ml-1">
                <AnimatedNumber value={listingCount} springOptions={numberSpringPresets.quick} /> listings
              </span>
            </div>
            <Button
              onClick={() => setShowPostForm(!showPostForm)}
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
            >
              {showPostForm ? (
                <>
                  <XMarkIcon className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </>
              ) : (
                <>
                  <PlusIcon className="h-3.5 w-3.5 mr-1" />
                  Post Listing
                </>
              )}
            </Button>
          </div>

          {/* Post Form */}
          <AnimatePresence>
            {showPostForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : springPresets.snappy}
                className="border rounded-lg p-4 space-y-3 bg-muted/20"
              >
                <input
                  type="text"
                  placeholder="Title *"
                  value={formData.title || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <textarea
                  placeholder="Description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Price (optional)"
                    value={formData.price || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="flex-1 px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <select
                    value={formData.category || categories[0]}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="flex-1 px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={handlePost}
                  disabled={!formData.title?.trim() || loadingAction === 'posting'}
                  size="sm"
                  className="w-full"
                >
                  Post Listing
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                !activeCategory
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Listings Grid */}
          {filteredListings.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No listings yet. Be the first to post!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AnimatePresence>
                {filteredListings.map((listing) => {
                  const isOwner = listing.data?.postedBy === currentUserId || listing.createdBy === currentUserId;
                  const isClaimed = listing.data?.status === 'claimed';
                  const isClaimedByMe = listing.data?.claimedBy === currentUserId;

                  return (
                    <motion.div
                      key={listing.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={prefersReducedMotion ? { duration: 0 } : springPresets.snappy}
                      className={`border rounded-lg p-3 space-y-2 transition-colors ${
                        isOwner ? 'border-primary/30 bg-primary/5' : isClaimed ? 'border-border bg-muted/30' : 'border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">{listing.data?.title}</div>
                          {listing.data?.description && (
                            <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {listing.data.description}
                            </div>
                          )}
                        </div>
                        {listing.data?.price && (
                          <span className="text-xs font-semibold text-primary whitespace-nowrap">
                            {listing.data.price}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <TagIcon className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {listing.data?.category || 'Other'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            &middot; {listing.data?.postedByName || 'Anonymous'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isOwner ? (
                          <>
                            <Button
                              onClick={() => handleMarkDone(listing.id)}
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                            >
                              <CheckCircleIcon className="h-3 w-3 mr-1" />
                              Done
                            </Button>
                            <Button
                              onClick={() => handleDelete(listing.id)}
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                            >
                              <TrashIcon className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </>
                        ) : isClaimed ? (
                          isClaimedByMe ? (
                            <Button
                              onClick={() => handleUnclaim(listing.id)}
                              disabled={loadingAction === listing.id}
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                            >
                              <XMarkIcon className="h-3 w-3 mr-1" />
                              Unclaim
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Claimed</span>
                          )
                        ) : (
                          <Button
                            onClick={() => handleClaim(listing.id)}
                            disabled={loadingAction === listing.id}
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-xs"
                          >
                            <HandRaisedIcon className="h-3 w-3 mr-1" />
                            Claim
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </StateContainer>
  );
}

export default ListingBoardElement;
