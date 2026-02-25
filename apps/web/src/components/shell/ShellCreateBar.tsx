'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { CreatePromptBar } from './CreatePromptBar';

export function ShellCreateBar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop: fixed bottom bar (CreatePromptBar handles the positioning) */}
      <CreatePromptBar
        isVisible={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Mobile: floating + button to trigger the overlay */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-[#FFD700] shadow-lg shadow-black/30 active:scale-95 transition-transform md:hidden"
        aria-label="Create something"
      >
        <Sparkles className="h-5 w-5 text-black" />
      </button>
    </>
  );
}
