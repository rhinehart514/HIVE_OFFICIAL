'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Users, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { Button, Input } from '@hive/ui';
import {
  staggerContainer,
  staggerItem,
  transitionSilk,
  transitionSpring,
  GLOW_GOLD_SUBTLE,
} from '@/lib/motion-primitives';
import type { UserType } from '../shared/types';

interface Space {
  id: string;
  name: string;
  members: number;
  category: string;
}

interface SpacesStepProps {
  userType: UserType;
  isSubmitting: boolean;
  mustSelectSpace: boolean;
  onComplete: (redirectTo: string, selectedSpaceIds?: string[]) => Promise<boolean>;
}

export function SpacesStep({ userType, isSubmitting, mustSelectSpace, onComplete }: SpacesStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpaces, setSelectedSpaces] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real spaces from API
  useEffect(() => {
    async function fetchSpaces() {
      try {
        const response = await fetch('/api/spaces/browse-v2?limit=20');
        if (response.ok) {
          const data = await response.json();
          const formattedSpaces: Space[] = (data.spaces || []).map((s: Record<string, unknown>) => ({
            id: s.id as string,
            name: (s.name as string) || 'Unnamed Space',
            members: (s.memberCount as number) || (s.metrics as { memberCount?: number })?.memberCount || 0,
            category: (s.category as string) || 'General',
          }));
          setSpaces(formattedSpaces);
        }
      } catch (err) {
        console.error('Failed to fetch spaces:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSpaces();
  }, []);

  const filteredSpaces = spaces.filter((space) =>
    space.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSpaceSelection = (spaceId: string) => {
    setSelectedSpaces(prev =>
      prev.includes(spaceId)
        ? prev.filter(id => id !== spaceId)
        : [...prev, spaceId]
    );
  };

  const handleClaimSpace = async () => {
    if (mustSelectSpace && selectedSpaces.length === 0) {
      setError('Select at least one space to continue.');
      return;
    }
    setError(null);
    // Pass selected spaces to the completion handler
    await onComplete('/feed', selectedSpaces);
  };

  const handleCreateSpace = async () => {
    setError(null);
    // Still pass any selected spaces before redirecting to create
    await onComplete('/spaces/create', selectedSpaces);
  };

  const handleSkip = async () => {
    if (mustSelectSpace) {
      setError('Please pick or create a space to finish setup.');
      return;
    }
    setError(null);
    await onComplete('/feed', []);
  };

  const isFaculty = userType === 'faculty';

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-5"
    >
      {/* Context message */}
      <motion.div variants={staggerItem} transition={transitionSilk}>
        <p className="text-sm text-neutral-400 text-center">
          {isFaculty
            ? "Create or claim your department's official space"
            : 'Find your club or start a new space'}
        </p>
      </motion.div>

      {/* Search */}
      <motion.div variants={staggerItem} transition={transitionSilk}>
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for your club..."
          prefixIcon={<Search className="h-4 w-4" />}
        />
      </motion.div>

      {/* Spaces list */}
      <motion.div variants={staggerItem} transition={transitionSilk}>
        <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-800">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredSpaces.length > 0 ? (
                filteredSpaces.map((space, index) => {
                  const isSelected = selectedSpaces.includes(space.id);
                  return (
                    <motion.button
                      key={space.id}
                      type="button"
                      onClick={() => toggleSpaceSelection(space.id)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ ...transitionSpring, delay: index * 0.03 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-gold-500/10 border-gold-500'
                          : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700'
                      }`}
                      style={isSelected ? { boxShadow: GLOW_GOLD_SUBTLE } : {}}
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div
                          className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-gold-500/20'
                              : 'bg-neutral-800'
                          }`}
                        >
                          <Users
                            className={`h-5 w-5 ${
                              isSelected ? 'text-gold-500' : 'text-neutral-400'
                            }`}
                          />
                        </div>
                        <div>
                          <p
                            className={`font-medium text-sm ${
                              isSelected ? 'text-white' : 'text-neutral-300'
                            }`}
                          >
                            {space.name}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {space.members} members · {space.category}
                          </p>
                        </div>
                      </div>
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 180 }}
                            transition={transitionSpring}
                            className="h-6 w-6 rounded-full border-2 border-gold-500 bg-gold-500/10 flex items-center justify-center"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-gold-500" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <p className="text-sm text-neutral-500">
                    {searchQuery ? `No spaces found matching "${searchQuery}"` : 'No spaces available yet'}
                  </p>
                  <p className="text-xs text-neutral-600 mt-1">Try a different search or create a new space</p>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>

      {/* Claim selected spaces button */}
      <AnimatePresence>
        {selectedSpaces.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 8, height: 0 }}
            transition={transitionSilk}
          >
            <Button
              onClick={handleClaimSpace}
              state={isSubmitting ? 'loading' : 'idle'}
              disabled={mustSelectSpace && selectedSpaces.length === 0}
              showArrow
              fullWidth
              size="lg"
            >
              {selectedSpaces.length === 1
                ? 'Join this space'
                : `Join ${selectedSpaces.length} spaces`}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Divider */}
      <motion.div variants={staggerItem} transition={transitionSilk}>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-neutral-800" />
          <span className="text-xs text-neutral-600">or</span>
          <div className="flex-1 h-px bg-neutral-800" />
        </div>
      </motion.div>

      {/* Create new space */}
      <motion.div variants={staggerItem} transition={transitionSilk}>
        <Button
          variant="secondary"
          onClick={handleCreateSpace}
          state={isSubmitting ? 'loading' : 'idle'}
          leadingIcon={<Plus className="h-4 w-4" />}
          fullWidth
          size="lg"
        >
          Create a new space
        </Button>
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-sm font-medium text-red-400 text-center"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Skip option */}
      <motion.div variants={staggerItem} transition={transitionSilk}>
        <motion.button
          type="button"
          onClick={handleSkip}
          disabled={isSubmitting || mustSelectSpace}
          className="w-full text-sm text-neutral-500 hover:text-white py-3 transition-colors flex items-center justify-center gap-2"
          whileHover={{ x: 4 }}
        >
          Skip for now
          <ArrowRight className="h-3.5 w-3.5" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
