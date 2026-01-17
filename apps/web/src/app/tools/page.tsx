'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@hive/auth-logic';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { TemplateScroller, type TemplateItem } from '@hive/ui/design-system/primitives';
import { useConfirmDialog } from '@hive/ui';

// Premium easing
const EASE = [0.22, 1, 0.36, 1] as const;

// ============================================
// TEMPLATE DATA
// ============================================

const PollIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h2v8H3zM9 9h2v12H9zM15 5h2v16h-2zM21 3h-2v18h2z" />
  </svg>
);

const TimerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <circle cx="12" cy="13" r="8" />
    <path strokeLinecap="round" d="M12 9v4l2.5 2.5M12 5V3M10 3h4" />
  </svg>
);

const FormIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path strokeLinecap="round" d="M7 9h10M7 13h6M7 17h8" />
  </svg>
);

const ChecklistIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
  </svg>
);

const QuizIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9a3 3 0 115.12 2.12c-.6.6-1.12 1.26-1.12 2.38M12 17h.01" />
  </svg>
);

const RSVPIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l2 2 4-4" />
  </svg>
);

const AnnouncementIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
  </svg>
);

const FeedbackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
  </svg>
);

const TOOL_TEMPLATES: TemplateItem[] = [
  // Engagement
  {
    id: 'poll',
    name: 'Poll',
    description: 'Voting for club meetings',
    category: 'Engagement',
    icon: <PollIcon />,
    featured: true,
  },
  {
    id: 'quiz',
    name: 'Quiz',
    description: 'Trivia & study games',
    category: 'Engagement',
    icon: <QuizIcon />,
  },
  {
    id: 'announcement',
    name: 'Announcement',
    description: 'Broadcast updates',
    category: 'Engagement',
    icon: <AnnouncementIcon />,
  },
  // Collection
  {
    id: 'signup',
    name: 'Sign-up Form',
    description: 'Event registration',
    category: 'Collection',
    icon: <FormIcon />,
    featured: true,
  },
  {
    id: 'rsvp',
    name: 'RSVP',
    description: 'Attendance tracking',
    category: 'Collection',
    icon: <RSVPIcon />,
  },
  {
    id: 'feedback',
    name: 'Feedback Form',
    description: 'Gather member input',
    category: 'Collection',
    icon: <FeedbackIcon />,
  },
  // Organization
  {
    id: 'checklist',
    name: 'Checklist',
    description: 'Task tracking',
    category: 'Organization',
    icon: <ChecklistIcon />,
  },
  // Utility
  {
    id: 'timer',
    name: 'Countdown Timer',
    description: 'Event countdowns',
    category: 'Utility',
    icon: <TimerIcon />,
  },
];

type Tool = {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: 'draft' | 'published' | 'deployed';
  createdAt: Date | string;
  updatedAt: Date | string;
  ownerId: string;
  usageCount?: number;
};

// ============================================
// THE VOID - Minimal AI Prompt Entry
// ============================================

function TheVoid({ onEnter, onSelectTemplate }: {
  onEnter: (prompt?: string) => void;
  onSelectTemplate: (templateId: string) => void;
}) {
  const [prompt, setPrompt] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onEnter(prompt || undefined);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Soft ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 40%, rgba(255,255,255,0.02) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 50% 60%, rgba(255,215,0,0.015) 0%, transparent 50%)
          `,
        }}
      />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative z-10 w-full max-w-4xl text-center"
      >
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
          className="text-[clamp(2.5rem,6vw,4.5rem)] font-semibold text-white tracking-[-0.03em] mb-16"
        >
          What will you build?
        </motion.h1>

        {/* AI Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
          className="relative mb-6"
        >
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="A voting poll for club meetings..."
            className="w-full bg-transparent text-center text-2xl md:text-3xl text-white/90
                       placeholder:text-white/25 py-4 focus:outline-none transition-all duration-300
                       caret-[var(--hive-gold)]"
          />
        </motion.div>

        {/* Enter hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-sm text-white/25 mb-12"
        >
          press <span className="text-white/40 font-medium">enter</span> to create with AI
        </motion.p>

        {/* Template section - uses TemplateScroller primitive */}
        <AnimatePresence>
          {!prompt && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, delay: 0.5, ease: EASE }}
              className="mb-12"
            >
              <TemplateScroller
                templates={TOOL_TEMPLATES}
                onValueChange={onSelectTemplate}
                size="default"
                showBlankOption
                onCreateBlank={() => onEnter()}
                title="Or start from a template"
              />
              <a
                href="/tools/templates"
                className="inline-block mt-4 text-xs text-white/25 hover:text-white/40 transition-colors"
              >
                See all templates →
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Bottom branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="absolute bottom-8 text-xs text-white/10 tracking-widest uppercase"
      >
        HiveLab
      </motion.div>
    </div>
  );
}

// ============================================
// TOOL CARD
// ============================================

interface ToolCardProps {
  tool: Tool;
  index: number;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

function ToolCard({ tool, index, onClick, onDelete }: ToolCardProps) {
  const statusColor = {
    deployed: 'bg-emerald-400',
    published: 'bg-white/40',
    draft: 'bg-white/20',
  }[tool.status];

  const formatUsage = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: EASE }}
      onClick={onClick}
      className="group relative"
    >
      <div
        className="relative p-5 rounded-2xl cursor-pointer
          bg-white/[0.02] border border-white/[0.06]
          transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
          hover:bg-white/[0.04] hover:border-white/[0.10]
          hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.4)]"
      >
        {/* Delete */}
        <button
          onClick={onDelete}
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5
            text-white/20 hover:text-red-400 rounded-lg transition-all duration-200
            hover:bg-red-500/10"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Status row with usage badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
            <span className="text-xs font-mono text-white/30 uppercase tracking-wider">
              {tool.status === 'deployed' ? 'Live' : tool.status === 'published' ? 'Ready' : 'Draft'}
            </span>
          </div>

          {/* Usage badge - only show for deployed tools with usage */}
          {tool.status === 'deployed' && (tool.usageCount ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-white/30" title="Total interactions">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h2v8H3zM9 9h2v12H9zM15 5h2v16h-2z" />
              </svg>
              <span className="font-mono">{formatUsage(tool.usageCount ?? 0)}</span>
            </div>
          )}
        </div>

        {/* Name */}
        <h3 className="text-base font-medium text-white/90 mb-1.5 pr-8">
          {tool.name}
        </h3>

        {/* Description */}
        {tool.description && (
          <p className="text-sm text-white/35 line-clamp-2 leading-relaxed">
            {tool.description}
          </p>
        )}

        {/* Arrow */}
        <div className="absolute right-5 bottom-5 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5">
          <svg className="w-5 h-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// TOOLS LIBRARY VIEW
// ============================================

function ToolsLibrary({
  tools,
  onOpen,
  onCreate,
  onSelectTemplate,
  onDelete
}: {
  tools: Tool[];
  onOpen: (id: string) => void;
  onCreate: () => void;
  onSelectTemplate: (templateId: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}) {
  return (
    <div className="min-h-screen">
      {/* Gradient */}
      <div
        className="absolute inset-x-0 top-0 h-[50vh] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,255,255,0.02) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="flex items-end justify-between mb-8"
        >
          <div>
            <h1 className="font-display text-3xl font-semibold text-white tracking-[-0.02em] mb-1">
              Your tools
            </h1>
            <p className="text-sm text-white/30 font-mono">
              {tools.length} {tools.length === 1 ? 'creation' : 'creations'}
            </p>
          </div>

          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2.5 px-5 py-3
              text-black text-sm font-medium rounded-full
              bg-white transition-all duration-200
              hover:shadow-[0_0_30px_rgba(255,255,255,0.12)]
              active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New tool
          </button>
        </motion.div>

        {/* Quick Start Templates */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white/40">Quick start</span>
            <a
              href="/tools/templates"
              className="text-xs text-white/25 hover:text-white/40 transition-colors"
            >
              See all →
            </a>
          </div>
          <TemplateScroller
            templates={TOOL_TEMPLATES}
            onValueChange={onSelectTemplate}
            size="sm"
            showBlankOption
            onCreateBlank={onCreate}
          />
        </motion.div>

        {/* Your Tools Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
        >
          <h2 className="text-sm font-medium text-white/60 mb-4">Your creations</h2>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tools.map((tool, i) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                index={i}
                onClick={() => onOpen(tool.id)}
                onDelete={(e) => onDelete(e, tool.id)}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================
// ACCESS GATE
// ============================================

function AccessGate({ onAction }: { onAction: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="max-w-sm text-center"
      >
        <h2 className="font-display text-2xl font-semibold text-white mb-3">
          For space leaders
        </h2>
        <p className="text-sm text-white/35 mb-8 leading-relaxed">
          Lead a space to unlock the workshop.
        </p>
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-6 py-3
            text-white/70 text-sm font-medium rounded-full
            border border-white/[0.1] bg-white/[0.02]
            transition-all duration-200
            hover:bg-white/[0.05] hover:border-white/[0.15] hover:text-white"
        >
          Find a space to lead
        </button>
      </motion.div>
    </div>
  );
}

// ============================================
// GUEST PREVIEW - Shows HiveLab without auth
// ============================================

function GuestPreview({ onSignUp }: { onSignUp: () => void }) {
  const [prompt, setPrompt] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSignUp();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Soft ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 40%, rgba(255,255,255,0.02) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 50% 60%, rgba(255,215,0,0.015) 0%, transparent 50%)
          `,
        }}
      />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative z-10 w-full max-w-4xl text-center"
      >
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
          className="text-[clamp(2.5rem,6vw,4.5rem)] font-semibold text-white tracking-[-0.03em] mb-16"
        >
          What will you build?
        </motion.h1>

        {/* AI Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
          className="relative mb-6"
        >
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="A voting poll for club meetings..."
            className="w-full bg-transparent text-center text-2xl md:text-3xl text-white/90
                       placeholder:text-white/25 py-4 focus:outline-none transition-all duration-300
                       caret-[var(--hive-gold)]"
          />
        </motion.div>

        {/* Enter hint with sign up nudge */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-sm text-white/25 mb-12"
        >
          press <span className="text-white/40 font-medium">enter</span> to sign up and build with AI
        </motion.p>

        {/* Template section */}
        <AnimatePresence>
          {!prompt && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, delay: 0.5, ease: EASE }}
              className="mb-12"
            >
              <TemplateScroller
                templates={TOOL_TEMPLATES}
                onValueChange={onSignUp}
                size="default"
                showBlankOption
                onCreateBlank={onSignUp}
                title="Or start from a template"
              />
              <a
                href="/tools/templates"
                className="inline-block mt-4 text-xs text-white/25 hover:text-white/40 transition-colors"
              >
                See all templates →
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sign up CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7, ease: EASE }}
        >
          <button
            onClick={onSignUp}
            className="inline-flex items-center gap-2.5 px-6 py-3
              text-black text-sm font-medium rounded-full
              bg-white transition-all duration-200
              hover:shadow-[0_0_30px_rgba(255,255,255,0.12)]
              active:scale-[0.98]"
          >
            Sign up to start building
          </button>
        </motion.div>
      </motion.div>

      {/* Bottom branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="absolute bottom-8 text-xs text-white/10 tracking-widest uppercase"
      >
        HiveLab
      </motion.div>
    </div>
  );
}

// ============================================
// LOADING
// ============================================

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-5 h-5 border-2 border-white/10 border-t-white/50 rounded-full animate-spin"
      />
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function ToolsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { confirm, Dialog: ConfirmDialog } = useConfirmDialog();

  const { data: tools = [], isLoading: toolsLoading } = useQuery({
    queryKey: ['personal-tools', user?.uid],
    queryFn: async () => {
      const response = await apiClient.get('/api/tools');
      if (!response.ok) throw new Error('Failed to fetch tools');
      const data = await response.json();
      return (data.tools || []) as Tool[];
    },
    enabled: !!user,
    staleTime: 60000,
  });

  // Fetch usage stats to merge with tools
  const { data: usageStats } = useQuery({
    queryKey: ['tool-usage-stats', user?.uid],
    queryFn: async () => {
      const response = await apiClient.get('/api/tools/usage-stats');
      if (!response.ok) return { topTools: [] };
      const data = await response.json();
      return data.stats as { topTools: Array<{ id: string; usageCount: number }> };
    },
    enabled: !!user && tools.length > 0,
    staleTime: 300000, // 5 minutes
  });

  // Merge usage counts into tools
  const toolsWithUsage = tools.map(tool => {
    const usage = usageStats?.topTools?.find(t => t.id === tool.id);
    return { ...tool, usageCount: usage?.usageCount || tool.usageCount || 0 };
  });

  // Guest preview - show HiveLab to unauthenticated users
  if (!authLoading && !user) {
    return (
      <div style={{ backgroundColor: 'var(--bg-void, #050504)' }}>
        <GuestPreview onSignUp={() => router.push('/enter?redirect=/tools')} />
      </div>
    );
  }

  // HiveLab is open to all authenticated users (no gate)
  const isLoading = authLoading || toolsLoading;

  if (isLoading) {
    return (
      <div style={{ backgroundColor: 'var(--bg-void, #050504)' }}>
        <Loading />
      </div>
    );
  }

  const handleCreate = (prompt?: string) => {
    if (prompt) {
      // Store prompt for the create page to pick up
      sessionStorage.setItem('hivelab_initial_prompt', prompt);
    }
    router.push('/tools/create');
  };

  const handleSelectTemplate = (templateId: string) => {
    // Store template selection for the create page
    sessionStorage.setItem('hivelab_template_id', templateId);
    router.push('/tools/create');
  };

  const handleOpen = (id: string) => router.push(`/tools/${id}`);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Delete this tool?',
      description: 'This action cannot be undone. The tool will be permanently removed.',
      variant: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;
    try {
      await apiClient.delete(`/api/tools/${id}`);
      queryClient.invalidateQueries({ queryKey: ['personal-tools'] });
      toast({ title: 'Deleted', type: 'success' });
    } catch {
      toast({ title: 'Failed to delete', type: 'error' });
    }
  };

  const hasTools = tools.length > 0;

  return (
    <div className="relative" style={{ backgroundColor: 'var(--bg-void, #050504)' }}>
      {hasTools ? (
        <ToolsLibrary
          tools={toolsWithUsage}
          onOpen={handleOpen}
          onCreate={() => handleCreate()}
          onSelectTemplate={handleSelectTemplate}
          onDelete={handleDelete}
        />
      ) : (
        <TheVoid onEnter={handleCreate} onSelectTemplate={handleSelectTemplate} />
      )}
      {/* Branded delete confirmation dialog */}
      {ConfirmDialog}
    </div>
  );
}
