'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDownIcon,
  BuildingLibraryIcon,
  LinkIcon,
  Cog6ToothIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface Space {
  id: string;
  name: string;
  memberCount?: number;
}

interface DeployDropdownProps {
  toolId: string;
  toolName: string;
  onDeploy: (spaceId: string) => Promise<void>;
  onShareLink: () => void;
  onAdvancedSettings: () => void;
  userSpaces?: Space[];
  isDeploying?: boolean;
  defaultOpen?: boolean;
  preselectedSpaceId?: string | null;
}

export function DeployDropdown({
  toolId: _toolId,
  toolName: _toolName,
  onDeploy,
  onShareLink,
  onAdvancedSettings,
  userSpaces = [],
  isDeploying = false,
  defaultOpen = false,
  preselectedSpaceId = null,
}: DeployDropdownProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showSpacePicker, setShowSpacePicker] = useState(defaultOpen && !!preselectedSpaceId);
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSpacePicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setShowSpacePicker(false);
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSpaceSelect = async (spaceId: string) => {
    setSelectedSpace(spaceId);
    await onDeploy(spaceId);
    setIsOpen(false);
    setShowSpacePicker(false);
    setSelectedSpace(null);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Deploy Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isDeploying}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg
          bg-[var(--surface-elevated)] border border-life-gold/30
          text-life-gold font-medium text-sm
          transition-all duration-200
          hover:bg-[var(--surface-hover)] hover:border-life-gold/50
          active:opacity-80
          focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]
          disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isDeploying ? (
          <>
            <div className="w-4 h-4 border-2 border-life-gold/30 border-t-life-gold rounded-full " />
            Deploying...
          </>
        ) : (
          <>
            Deploy
            <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && !showSpacePicker && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-full mt-2 w-64 rounded-lg
              bg-[var(--surface-elevated)] border border-[var(--border-subtle)]
              py-1 z-50 overflow-hidden"
          >
            {/* Add to a space */}
            <button
              onClick={() => setShowSpacePicker(true)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left
                text-[var(--text-primary)] hover:bg-[var(--surface-hover)]
                transition-colors duration-150"
            >
              <BuildingLibraryIcon className="w-5 h-5 text-[var(--text-secondary)]" />
              <div>
                <div className="font-medium">Add to a space...</div>
                <div className="text-xs text-[var(--text-tertiary)]">Deploy to your space sidebar</div>
              </div>
            </button>

            <div className="h-px bg-[var(--surface-elevated)] mx-2" />

            {/* Share as public link */}
            <button
              onClick={() => {
                onShareLink();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left
                text-[var(--text-primary)] hover:bg-[var(--surface-hover)]
                transition-colors duration-150"
            >
              <LinkIcon className="w-5 h-5 text-[var(--text-secondary)]" />
              <div>
                <div className="font-medium">Share as public link</div>
                <div className="text-xs text-[var(--text-tertiary)]">Anyone with the link can use</div>
              </div>
            </button>

            <div className="h-px bg-[var(--surface-elevated)] mx-2" />

            {/* Advanced settings */}
            <button
              onClick={() => {
                onAdvancedSettings();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left
                text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]
                transition-colors duration-150"
            >
              <Cog6ToothIcon className="w-5 h-5" />
              <div className="font-medium">Advanced settings...</div>
            </button>
          </motion.div>
        )}

        {/* Space Picker */}
        {isOpen && showSpacePicker && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-full mt-2 w-72 rounded-lg
              bg-[var(--surface-elevated)] border border-[var(--border-subtle)]
              z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
              <button
                onClick={() => setShowSpacePicker(false)}
                className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] mb-1"
              >
                ← Back
              </button>
              <div className="font-medium text-[var(--text-primary)]">Select a space</div>
            </div>

            {/* Space List */}
            <div className="max-h-64 overflow-y-auto py-1">
              {userSpaces.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-[var(--text-tertiary)] text-sm">No spaces yet</p>
                  <p className="text-[var(--text-muted)] text-xs mt-1">Create a space first</p>
                </div>
              ) : (
                userSpaces.map((space) => (
                  <button
                    key={space.id}
                    onClick={() => handleSpaceSelect(space.id)}
                    disabled={selectedSpace === space.id}
                    className="w-full flex items-center justify-between px-4 py-3 text-left
                      hover:bg-[var(--surface-hover)] transition-colors duration-150
                      disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--surface-elevated)] flex items-center justify-center">
                        <BuildingLibraryIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                      </div>
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">{space.name}</div>
                        {space.memberCount && (
                          <div className="text-xs text-[var(--text-tertiary)]">
                            {space.memberCount} members
                          </div>
                        )}
                      </div>
                    </div>
                    {selectedSpace === space.id && (
                      <div className="w-5 h-5 rounded-full bg-life-gold/20 flex items-center justify-center">
                        <CheckIcon className="w-3 h-3 text-life-gold" />
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
