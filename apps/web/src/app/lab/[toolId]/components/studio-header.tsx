'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  EyeIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { DeployDropdown } from './deploy-dropdown';

interface Space {
  id: string;
  name: string;
  memberCount?: number;
}

interface StudioHeaderProps {
  toolId: string;
  toolName: string;
  onNameChange: (name: string) => void;
  onPreview: () => void;
  onDeploy: (spaceId: string) => Promise<void>;
  onShareLink: () => void;
  onAdvancedSettings: () => void;
  userSpaces?: Space[];
  isDeploying?: boolean;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  showDeployOnMount?: boolean;
  preselectedSpaceId?: string | null;
}

export function StudioHeader({
  toolId,
  toolName,
  onNameChange,
  onPreview,
  onDeploy,
  onShareLink,
  onAdvancedSettings,
  userSpaces = [],
  isDeploying = false,
  isSaving = false,
  hasUnsavedChanges = false,
  showDeployOnMount = false,
  preselectedSpaceId = null,
}: StudioHeaderProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(toolName);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Update local value when prop changes
  useEffect(() => {
    setEditValue(toolName);
  }, [toolName]);

  const handleStartEdit = () => {
    setEditValue(toolName);
    setIsEditing(true);
  };

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== toolName) {
      onNameChange(trimmed);
    } else {
      setEditValue(toolName);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(toolName);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push('/tools');
      }
    } else {
      router.push('/tools');
    }
  };

  return (
    <header className="flex items-center justify-between h-14 px-4 bg-[#0A0A09] border-b border-white/[0.06]">
      {/* Left: Back + Name */}
      <div className="flex items-center gap-4">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-8 h-8 rounded-lg
            text-[#6B6B70] hover:text-[#A3A19E] hover:bg-white/[0.04]
            transition-colors duration-150"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>

        {/* Tool name (editable) */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                className="px-2 py-1 rounded-lg bg-white/[0.06] border border-white/[0.12]
                  text-[#FAF9F7] text-lg font-semibold
                  outline-none focus:border-white/[0.24]
                  min-w-[200px]"
                placeholder="Tool name"
              />
              <button
                onClick={handleSave}
                className="p-1 rounded text-green-500 hover:bg-green-500/10"
              >
                <CheckIcon className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancel}
                className="p-1 rounded text-[#6B6B70] hover:bg-white/[0.04]"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleStartEdit}
              className="group flex items-center gap-2 px-2 py-1 rounded-lg
                hover:bg-white/[0.04] transition-colors duration-150"
            >
              <span className="text-[#FAF9F7] text-lg font-semibold">
                {toolName || 'Untitled Tool'}
              </span>
              <PencilIcon className="w-3.5 h-3.5 text-[#3D3D42] group-hover:text-[#6B6B70]" />
            </button>
          )}

          {/* Save status */}
          {isSaving && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-[#6B6B70]"
            >
              Saving...
            </motion.span>
          )}
          {hasUnsavedChanges && !isSaving && (
            <span className="w-2 h-2 rounded-full bg-[var(--life-gold)]" title="Unsaved changes" />
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Preview button */}
        <button
          onClick={onPreview}
          className="flex items-center gap-2 px-3 py-2 rounded-lg
            text-[#A3A19E] text-sm font-medium
            transition-colors duration-200
            hover:text-[#FAF9F7] hover:bg-white/[0.04]"
        >
          <EyeIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Preview</span>
        </button>

        {/* Deploy dropdown */}
        <DeployDropdown
          toolId={toolId}
          toolName={toolName}
          onDeploy={onDeploy}
          onShareLink={onShareLink}
          onAdvancedSettings={onAdvancedSettings}
          userSpaces={userSpaces}
          isDeploying={isDeploying}
          defaultOpen={showDeployOnMount}
          preselectedSpaceId={preselectedSpaceId}
        />
      </div>
    </header>
  );
}
