'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button, Card, toast } from '@hive/ui';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { logger } from '@/lib/structured-logger';

// Max interests allowed
const MAX_INTERESTS = 10;

// Common interest suggestions for autocomplete
const INTEREST_SUGGESTIONS = [
  'Programming', 'Web Development', 'AI/ML', 'Data Science', 'Cybersecurity',
  'Basketball', 'Football', 'Soccer', 'Tennis', 'Running', 'Gym', 'Volleyball',
  'Photography', 'Painting', 'Film', 'Theater', 'Dance', 'Music', 'Guitar', 'Piano',
  'Video Games', 'Board Games', 'Chess', 'D&D', 'Esports',
  'Volunteering', 'Networking', 'Greek Life', 'Clubs', 'Events',
  'Hiking', 'Camping', 'Biking', 'Yoga', 'Meditation', 'Fitness',
  'Cooking', 'Baking', 'Coffee', 'Travel', 'Languages', 'Reading', 'Writing',
  'Startups', 'Hackathons', 'Leadership', 'Public Speaking',
];

interface InterestsSectionProps {
  interests: string[];
  onUpdate: (interests: string[]) => Promise<void>;
  isUpdating?: boolean;
}

export function InterestsSection({
  interests,
  onUpdate,
  isUpdating = false,
}: InterestsSectionProps) {
  const [localInterests, setLocalInterests] = useState<string[]>(interests);
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Sync local state with props
  useEffect(() => {
    setLocalInterests(interests);
  }, [interests]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter suggestions based on input
  const filteredSuggestions = inputValue.trim()
    ? INTEREST_SUGGESTIONS.filter(
        (s) =>
          s.toLowerCase().includes(inputValue.toLowerCase()) &&
          !localInterests.some((i) => i.toLowerCase() === s.toLowerCase())
      ).slice(0, 6)
    : INTEREST_SUGGESTIONS.filter(
        (s) => !localInterests.some((i) => i.toLowerCase() === s.toLowerCase())
      ).slice(0, 6);

  const hasChanges = JSON.stringify(localInterests) !== JSON.stringify(interests);

  const handleAddInterest = (interest: string) => {
    const trimmed = interest.trim();
    if (!trimmed) return;

    if (localInterests.length >= MAX_INTERESTS) {
      toast.error(`Maximum ${MAX_INTERESTS} interests allowed`);
      return;
    }

    if (localInterests.some((i) => i.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Interest already added');
      return;
    }

    if (trimmed.length < 2) {
      toast.error('Interest must be at least 2 characters');
      return;
    }

    if (trimmed.length > 50) {
      toast.error('Interest must be under 50 characters');
      return;
    }

    // Title case the interest
    const formatted = trimmed.replace(/\b\w/g, (char) => char.toUpperCase());
    setLocalInterests([...localInterests, formatted]);
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleRemoveInterest = (interest: string) => {
    setLocalInterests(localInterests.filter((i) => i !== interest));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddInterest(inputValue);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(localInterests);
      toast.success('Interests updated');
    } catch (error) {
      logger.error('Failed to update interests', { component: 'InterestsSection' }, error instanceof Error ? error : undefined);
      toast.error('Failed to update interests');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-6 bg-white/[0.06] border-white/[0.06]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Interests</h3>
        <span className="text-sm text-white/50">
          {localInterests.length}/{MAX_INTERESTS}
        </span>
      </div>
      <p className="text-sm text-white/50 mb-4">
        Add interests to help others discover shared passions and connect with you.
      </p>

      {/* Current Interests */}
      <div className="flex flex-wrap gap-2 mb-4">
        {localInterests.length === 0 ? (
          <p className="text-sm text-white/50 italic">No interests added yet</p>
        ) : (
          localInterests.map((interest) => (
            <span
              key={interest}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] text-sm text-white"
            >
              {interest}
              <button
                onClick={() => handleRemoveInterest(interest)}
                className="p-0.5 rounded hover:bg-white/[0.06] transition-colors"
                aria-label={`Remove ${interest}`}
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Add Interest Input */}
      {localInterests.length < MAX_INTERESTS && (
        <div className="relative">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder="Add an interest..."
              className="flex-1 px-3 py-2 bg-white/[0.06] border border-white/[0.06] rounded-lg text-white placeholder:text-white/50 focus:border-white/50 focus:outline-none"
            />
            <Button
              variant="secondary"
              onClick={() => handleAddInterest(inputValue)}
              disabled={!inputValue.trim()}
              className="border-white/[0.06] text-white hover:bg-white/[0.06]"
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-1 py-1 bg-[var(--bg-surface-hover)] border border-white/[0.06] rounded-lg z-50 max-h-48 overflow-y-auto"
            >
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleAddInterest(suggestion)}
                  className="w-full px-3 py-2 text-left text-sm text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save Button */}
      {hasChanges && (
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <Button
            onClick={handleSave}
            disabled={isSaving || isUpdating}
            variant="solid"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </Card>
  );
}
