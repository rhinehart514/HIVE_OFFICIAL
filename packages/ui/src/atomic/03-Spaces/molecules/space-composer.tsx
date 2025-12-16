'use client';

/**
 * SpaceComposer - Minimal in-space composer with reduced chrome
 * No avatar, consolidated attachment button
 * Based on YC/SF minimalism: focus on the content, not the chrome
 */

import { Plus, Image, Calendar, Wrench } from 'lucide-react';
import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { durationSeconds, easingArrays } from '@hive/tokens';

import { MotionDiv } from '../../../shells/motion-safe';
import { Button } from '../../00-Global/atoms/button';
import { Textarea } from '../../00-Global/atoms/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../00-Global/molecules/dropdown-menu';

export interface SpaceComposerProps {
  /** Space name for context */
  spaceName: string;
  /** Whether user can create events */
  canCreateEvents?: boolean;
  /** Whether user can use tools */
  canUseTools?: boolean;
  /** Submit post handler */
  onSubmit?: (content: string, attachments: { type: 'image' | 'event' | 'tool'; data: unknown }[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Callback when image attachment is requested */
  onAddImage?: () => void;
  /** Callback when event attachment is requested */
  onAddEvent?: () => void;
  /** Callback when tool attachment is requested */
  onAddTool?: () => void;
}

/** Ref handle for SpaceComposer - allows parent to add attachments */
export interface SpaceComposerRef {
  /** Add an attachment programmatically (after modal closes) */
  addAttachment: (type: 'image' | 'event' | 'tool', data: unknown) => void;
  /** Clear all attachments */
  clearAttachments: () => void;
}

export const SpaceComposer = forwardRef<SpaceComposerRef, SpaceComposerProps>(function SpaceComposer({
  spaceName,
  canCreateEvents = false,
  canUseTools = false,
  onSubmit,
  placeholder = "What's happening?",
  onAddImage,
  onAddEvent,
  onAddTool,
}, ref) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Array<{ type: 'image' | 'event' | 'tool'; data: unknown }>>([]);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    addAttachment: (type: 'image' | 'event' | 'tool', data: unknown) => {
      setAttachments((prev) => [...prev, { type, data }]);
    },
    clearAttachments: () => {
      setAttachments([]);
    },
  }), []);

  const handleSubmit = () => {
    if (!content.trim() && attachments.length === 0) return;
    onSubmit?.(content, attachments);
    setContent('');
    setAttachments([]);
  };

  const handleAddAttachment = (type: 'image' | 'event' | 'tool') => {
    // Invoke the appropriate callback based on attachment type
    switch (type) {
      case 'image':
        onAddImage?.();
        break;
      case 'event':
        onAddEvent?.();
        break;
      case 'tool':
        onAddTool?.();
        break;
    }
  };

  const canPost = content.trim().length > 0 || attachments.length > 0;

  return (
    <MotionDiv
      className="bg-[#0A0A0A]/20 border border-[#2A2A2A] rounded-xl p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: durationSeconds.smooth, ease: easingArrays.default }}
    >
      {/* Textarea - NO avatar, clean input */}
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="min-h-[80px] bg-transparent border-none text-[#FAFAFA] placeholder:text-[#818187] focus-visible:ring-0 resize-none"
      />

      {/* Attachments preview (if any) */}
      {attachments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {attachments.map((att, i) => (
            <div
              key={i}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70"
            >
              {att.type === 'image' && '📷 Image'}
              {att.type === 'event' && '📅 Event'}
              {att.type === 'tool' && '🔧 Tool'}
            </div>
          ))}
        </div>
      )}

      {/* Actions row */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2A2A2A]">
        {/* Left: [+ Add] dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#A1A1A6] hover:text-[#FAFAFA] hover:bg-white/5 gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-[#0A0A0A]/95 border-[#2A2A2A]">
            <DropdownMenuItem
              onClick={() => handleAddAttachment('image')}
              className="text-[#A1A1A6] hover:text-[#FAFAFA] cursor-pointer"
            >
              <Image className="w-4 h-4 mr-2" />
              Photo
            </DropdownMenuItem>

            {canCreateEvents && (
              <DropdownMenuItem
                onClick={() => handleAddAttachment('event')}
                className="text-[#A1A1A6] hover:text-[#FAFAFA] cursor-pointer"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Event
              </DropdownMenuItem>
            )}

            {canUseTools && (
              <DropdownMenuItem
                onClick={() => handleAddAttachment('tool')}
                className="text-[#A1A1A6] hover:text-[#FAFAFA] cursor-pointer"
              >
                <Wrench className="w-4 h-4 mr-2" />
                Tool
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Right: Post button */}
        <Button
          variant="brand"
          size="sm"
          onClick={handleSubmit}
          disabled={!canPost}
          className="min-w-[80px]"
        >
          Post
        </Button>
      </div>
    </MotionDiv>
  );
});
