'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowRight,
  CalendarPlus,
  ClipboardList,
  Sparkles,
  Timer,
  Vote,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CreatePromptBarProps {
  spaceHandle?: string | null;
  spaceName?: string | null;
  isVisible?: boolean;
  onClose?: () => void;
  className?: string;
}

interface QuickCreateOption {
  id: 'poll' | 'event' | 'signup' | 'countdown';
  label: 'Poll' | 'Event' | 'Signup' | 'Countdown';
  icon: React.ComponentType<{ className?: string }>;
}

const QUICK_CREATE_OPTIONS: QuickCreateOption[] = [
  { id: 'poll', label: 'Poll', icon: Vote },
  { id: 'event', label: 'Event', icon: CalendarPlus },
  { id: 'signup', label: 'Signup', icon: ClipboardList },
  { id: 'countdown', label: 'Countdown', icon: Timer },
];

function getPlaceholder({
  pathname,
  spaceHandle,
  spaceName,
}: {
  pathname: string;
  spaceHandle?: string | null;
  spaceName?: string | null;
}): string {
  if (spaceHandle) {
    const resolvedSpaceName = spaceName?.trim() || `@${spaceHandle}`;
    return `Make something for ${resolvedSpaceName}...`;
  }

  if (pathname === '/profile' || pathname.startsWith('/profile/')) {
    return 'Start a new project...';
  }

  return 'What do you want to make?';
}

export function CreatePromptBar({
  spaceHandle = null,
  spaceName = null,
  isVisible = false,
  onClose,
  className,
}: CreatePromptBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [inputValue, setInputValue] = React.useState('');
  const [isFocused, setIsFocused] = React.useState(false);

  const placeholder = React.useMemo(
    () => getPlaceholder({ pathname, spaceHandle, spaceName }),
    [pathname, spaceHandle, spaceName]
  );

  const navigateToCreate = React.useCallback(
    (prompt: string) => {
      const params = new URLSearchParams({
        prompt,
      });

      if (spaceHandle) {
        params.set('space', spaceHandle);
      }

      router.push(`/lab/new?${params.toString()}`);
      setIsFocused(false);
      setInputValue('');
      inputRef.current?.blur();

      if (isVisible) {
        onClose?.();
      }
    },
    [isVisible, onClose, router, spaceHandle]
  );

  const handleSubmit = React.useCallback(
    (event?: React.FormEvent<HTMLFormElement>) => {
      event?.preventDefault();

      const trimmedValue = inputValue.trim();
      if (!trimmedValue) {
        return;
      }

      navigateToCreate(trimmedValue);
    },
    [inputValue, navigateToCreate]
  );

  const handleEscape = React.useCallback(() => {
    setIsFocused(false);
    inputRef.current?.blur();

    if (isVisible) {
      onClose?.();
    }
  }, [isVisible, onClose]);

  React.useEffect(() => {
    if (!isFocused && !isVisible) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      handleEscape();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [handleEscape, isFocused, isVisible]);

  const content = (
    <div className="w-full">
      <AnimatePresence initial={false}>
        {isFocused && (
          <motion.div
            className="mb-2 flex flex-wrap items-center gap-2 px-1"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {QUICK_CREATE_OPTIONS.map((option, index) => {
              const Icon = option.icon;
              return (
                <motion.button
                  key={option.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => navigateToCreate(`Create a ${option.label.toLowerCase()}`)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.06] px-3 py-1 text-xs text-white/70 transition-colors duration-150 hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/40"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2, delay: index * 0.03, ease: 'easeOut' }}
                >
                  <Icon className="h-3 w-3 text-white/70" />
                  <span>{option.label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.form
        initial={false}
        animate={{
          scale: isFocused ? 1.015 : 1,
          y: isFocused ? -1 : 0,
          boxShadow: isFocused
            ? '0 0 20px rgba(255,215,0,0.1)'
            : '0 0 0 rgba(255,215,0,0)',
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onSubmit={handleSubmit}
        onClick={() => inputRef.current?.focus()}
        className={cn(
          'flex h-12 w-full items-center gap-2 rounded-2xl border bg-white/[0.06] px-3 text-white backdrop-blur-sm transition-colors duration-150',
          isFocused ? 'border-[#FFD700]/50' : 'border-white/[0.06]'
        )}
      >
        <Sparkles className="h-4 w-4 shrink-0 text-[#FFD700]" aria-hidden />

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              handleEscape();
            }
          }}
          className="h-full flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/50"
          placeholder={placeholder}
          aria-label="Create prompt"
        />

        <button
          type="submit"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFD700] text-black transition-all duration-150 hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/50"
          aria-label="Submit create prompt"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </motion.form>
    </div>
  );

  return (
    <>
      <div
        className={cn(
          'pointer-events-none fixed bottom-4 left-0 right-0 z-50 hidden px-4 md:block',
          className
        )}
      >
        <div className="pointer-events-auto mx-auto w-full max-w-[600px]">{content}</div>
      </div>

      <AnimatePresence initial={false}>
        {isVisible && (
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close create prompt"
              className="absolute inset-0 bg-black/40 backdrop-blur-xl"
            />

            <motion.div
              className={cn(
                'absolute inset-x-0 bottom-0 px-4 pb-[calc(env(safe-area-inset-bottom)+5rem)] pt-4',
                className
              )}
              initial={{ y: 22, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 22, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <div className="mx-auto w-full max-w-[600px]">
                <div className="mb-2 flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.06] text-white/70 transition-colors duration-150 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/40"
                    aria-label="Dismiss create bar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {content}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default CreatePromptBar;
