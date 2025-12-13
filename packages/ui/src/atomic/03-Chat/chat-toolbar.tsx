'use client';

/**
 * ChatToolbar - Tool insertion toolbar for space chat
 *
 * A toolbar above the chat input that provides quick access to
 * inserting tools (polls, events, countdowns) into the chat.
 *
 * ## Buttons
 * - [+] Attach/More tools
 * - [Poll] Insert quick poll
 * - [Event] Link to event
 * - [Timer] Insert countdown
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Plus, BarChart2, Calendar, Timer, MoreHorizontal, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../00-Global/atoms/popover';
import { cn } from '../../lib/utils';

// ============================================================
// Types
// ============================================================

export type ToolType = 'poll' | 'event' | 'countdown' | 'custom';

export interface ToolInsertData {
  type: ToolType;
  config: Record<string, unknown>;
}

export interface ChatToolbarProps {
  /** Callback when a tool is selected for insertion */
  onInsertTool: (data: ToolInsertData) => void;
  /** Callback when more tools is clicked (opens gallery) */
  onOpenGallery?: () => void;
  /** Whether to show the toolbar */
  visible?: boolean;
  /** Whether user can insert tools */
  canInsert?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================================
// Toolbar Button Component
// ============================================================

interface ToolbarButtonProps {
  icon: typeof Plus;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
  disabled?: boolean;
  reducedMotion?: boolean;
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  isActive,
  disabled,
  reducedMotion,
}: ToolbarButtonProps) {
  return (
    <motion.button
      whileHover={reducedMotion ? undefined : { scale: 1.02 }}
      whileTap={reducedMotion ? undefined : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm',
        'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/40',
        disabled && 'opacity-50 cursor-not-allowed',
        isActive
          ? 'bg-[#FFD700]/10 text-[#FFD700]'
          : 'text-neutral-400 hover:text-white hover:bg-white/5'
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  );
}

// ============================================================
// Poll Creator Popover
// ============================================================

interface PollCreatorProps {
  onSubmit: (question: string, options: string[]) => void;
  onClose: () => void;
  reducedMotion?: boolean;
}

function PollCreator({ onSubmit, onClose, reducedMotion }: PollCreatorProps) {
  const [question, setQuestion] = React.useState('');
  const [options, setOptions] = React.useState(['', '']);

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = () => {
    const validOptions = options.filter((o) => o.trim());
    if (question.trim() && validOptions.length >= 2) {
      onSubmit(question.trim(), validOptions);
      onClose();
    }
  };

  const canSubmit = question.trim() && options.filter((o) => o.trim()).length >= 2;

  return (
    <div className="w-72 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Create Poll</h3>
        <button
          onClick={onClose}
          className="p-1 text-neutral-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question..."
          className={cn(
            'w-full px-3 py-2 rounded-lg text-sm',
            'bg-neutral-800 border border-neutral-700',
            'text-white placeholder:text-neutral-500',
            'focus:outline-none focus:ring-2 focus:ring-[#FFD700]/40'
          )}
          autoFocus
        />

        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className={cn(
                  'flex-1 px-3 py-1.5 rounded-lg text-sm',
                  'bg-neutral-800/50 border border-neutral-700/50',
                  'text-white placeholder:text-neutral-500',
                  'focus:outline-none focus:ring-2 focus:ring-[#FFD700]/40'
                )}
              />
              {options.length > 2 && (
                <button
                  onClick={() => removeOption(index)}
                  className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {options.length < 6 && (
          <button
            onClick={addOption}
            className="text-xs text-neutral-400 hover:text-[#FFD700] transition-colors"
          >
            + Add option
          </button>
        )}
      </div>

      <motion.button
        whileHover={reducedMotion ? undefined : { scale: 1.01 }}
        whileTap={reducedMotion ? undefined : { scale: 0.99 }}
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={cn(
          'w-full py-2 rounded-lg text-sm font-medium transition-colors',
          canSubmit
            ? 'bg-[#FFD700] text-black hover:brightness-110'
            : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
        )}
      >
        Create Poll
      </motion.button>
    </div>
  );
}

// ============================================================
// Countdown Creator Popover
// ============================================================

interface CountdownCreatorProps {
  onSubmit: (title: string, targetDate: string) => void;
  onClose: () => void;
  reducedMotion?: boolean;
}

function CountdownCreator({ onSubmit, onClose, reducedMotion }: CountdownCreatorProps) {
  const [title, setTitle] = React.useState('');
  const [date, setDate] = React.useState('');
  const [time, setTime] = React.useState('');

  const handleSubmit = () => {
    if (title.trim() && date) {
      const targetDate = time ? `${date}T${time}` : `${date}T23:59:59`;
      onSubmit(title.trim(), targetDate);
      onClose();
    }
  };

  const canSubmit = title.trim() && date;

  return (
    <div className="w-72 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Add Countdown</h3>
        <button
          onClick={onClose}
          className="p-1 text-neutral-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What are you counting down to?"
          className={cn(
            'w-full px-3 py-2 rounded-lg text-sm',
            'bg-neutral-800 border border-neutral-700',
            'text-white placeholder:text-neutral-500',
            'focus:outline-none focus:ring-2 focus:ring-[#FFD700]/40'
          )}
          autoFocus
        />

        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={cn(
              'flex-1 px-3 py-1.5 rounded-lg text-sm',
              'bg-neutral-800/50 border border-neutral-700/50',
              'text-white',
              'focus:outline-none focus:ring-2 focus:ring-[#FFD700]/40'
            )}
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={cn(
              'w-24 px-2 py-1.5 rounded-lg text-sm',
              'bg-neutral-800/50 border border-neutral-700/50',
              'text-white',
              'focus:outline-none focus:ring-2 focus:ring-[#FFD700]/40'
            )}
          />
        </div>
      </div>

      <motion.button
        whileHover={reducedMotion ? undefined : { scale: 1.01 }}
        whileTap={reducedMotion ? undefined : { scale: 0.99 }}
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={cn(
          'w-full py-2 rounded-lg text-sm font-medium transition-colors',
          canSubmit
            ? 'bg-[#FFD700] text-black hover:brightness-110'
            : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
        )}
      >
        Add Countdown
      </motion.button>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function ChatToolbar({
  onInsertTool,
  onOpenGallery,
  visible = true,
  canInsert = true,
  className,
}: ChatToolbarProps) {
  const [activeTool, setActiveTool] = React.useState<ToolType | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const handlePollSubmit = (question: string, options: string[]) => {
    onInsertTool({
      type: 'poll',
      config: {
        question,
        options,
        allowMultipleVotes: false,
        showResults: true,
      },
    });
    setActiveTool(null);
  };

  const handleCountdownSubmit = (title: string, targetDate: string) => {
    onInsertTool({
      type: 'countdown',
      config: {
        title,
        targetDate,
        showDays: true,
        showHours: true,
        showMinutes: true,
        showSeconds: true,
      },
    });
    setActiveTool(null);
  };

  if (!visible) return null;

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
      transition={shouldReduceMotion ? { duration: 0 } : undefined}
      className={cn(
        'flex items-center gap-1 px-3 py-2',
        'border-b border-neutral-800/50',
        className
      )}
    >
      {/* Poll button with popover */}
      <Popover open={activeTool === 'poll'} onOpenChange={(open) => setActiveTool(open ? 'poll' : null)}>
        <PopoverTrigger asChild>
          <div>
            <ToolbarButton
              icon={BarChart2}
              label="Poll"
              isActive={activeTool === 'poll'}
              disabled={!canInsert}
              reducedMotion={!!shouldReduceMotion}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          className="w-auto p-0 bg-neutral-900 border-neutral-800"
        >
          <PollCreator
            onSubmit={handlePollSubmit}
            onClose={() => setActiveTool(null)}
            reducedMotion={!!shouldReduceMotion}
          />
        </PopoverContent>
      </Popover>

      {/* Countdown button with popover */}
      <Popover open={activeTool === 'countdown'} onOpenChange={(open) => setActiveTool(open ? 'countdown' : null)}>
        <PopoverTrigger asChild>
          <div>
            <ToolbarButton
              icon={Timer}
              label="Countdown"
              isActive={activeTool === 'countdown'}
              disabled={!canInsert}
              reducedMotion={!!shouldReduceMotion}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          className="w-auto p-0 bg-neutral-900 border-neutral-800"
        >
          <CountdownCreator
            onSubmit={handleCountdownSubmit}
            onClose={() => setActiveTool(null)}
            reducedMotion={!!shouldReduceMotion}
          />
        </PopoverContent>
      </Popover>

      {/* Event button */}
      <ToolbarButton
        icon={Calendar}
        label="Event"
        onClick={() => {
          onInsertTool({
            type: 'event',
            config: {},
          });
        }}
        disabled={!canInsert}
        reducedMotion={!!shouldReduceMotion}
      />

      {/* Spacer */}
      <div className="flex-1" />

      {/* More tools */}
      {onOpenGallery && (
        <ToolbarButton
          icon={MoreHorizontal}
          label="More"
          onClick={onOpenGallery}
          disabled={!canInsert}
          reducedMotion={!!shouldReduceMotion}
        />
      )}
    </motion.div>
  );
}

export default ChatToolbar;
