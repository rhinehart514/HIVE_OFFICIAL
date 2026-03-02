'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { CreatePromptBar } from './CreatePromptBar';
import { colors } from '@hive/tokens';

/**
 * Shell Create Bar — global creation affordance.
 *
 * Detects space context from pathname (/s/[handle]) and passes it
 * to CreatePromptBar so creation is pre-scoped to that space.
 */
export function ShellCreateBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Extract space handle from pathname if we're viewing a space
  const spaceMatch = pathname.match(/^\/s\/([^/]+)/);
  const spaceHandle = spaceMatch ? spaceMatch[1] : null;

  return (
    <>
      {/* Desktop: fixed bottom bar (CreatePromptBar handles the positioning) */}
      <CreatePromptBar
        spaceHandle={spaceHandle}
        isVisible={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Mobile: floating + button to trigger the overlay */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full shadow-lg shadow-black/30 active:scale-95 transition-transform md:hidden"
        style={{ backgroundColor: colors.accentGreen }}
        aria-label={spaceHandle ? `Build for this space` : 'Create something'}
      >
        <Sparkles className="h-5 w-5 text-black" />
      </button>
    </>
  );
}
