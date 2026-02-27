'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMySpaces, type MySpace } from '@/hooks/queries/use-my-spaces';
import { cn } from '@/lib/utils';

const DEPLOY_ROLES = new Set(['builder', 'admin', 'moderator', 'owner', 'leader']);

interface SpacePickerSheetProps {
  toolId: string;
  onDeploy: (toolId: string, spaceId: string) => void;
  onClose: () => void;
  deployingSpaceId?: string | null;
  deployedSpaceId?: string | null;
}

export function SpacePickerSheet({ toolId, onDeploy, onClose, deployingSpaceId, deployedSpaceId }: SpacePickerSheetProps) {
  const { data: spaces = [], isLoading } = useMySpaces();
  const eligible = spaces.filter(s => DEPLOY_ROLES.has(s.membership.role) || s.membership.isOwner || s.membership.isAdmin);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Sheet */}
      <motion.div
        className="relative w-full max-w-[400px] max-h-[70vh] rounded-t-2xl sm:rounded-2xl bg-[#111] border border-white/[0.08] shadow-2xl shadow-black/50 overflow-hidden flex flex-col"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div>
            <h3 className="text-[15px] font-semibold text-white">Add to space</h3>
            <p className="text-[12px] text-white/30 mt-0.5">Pick a space to install this app</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/60 hover:bg-white/[0.10] transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Space list */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-2 py-2">
          {isLoading ? (
            <div className="space-y-1 px-3 py-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <div className="w-9 h-9 rounded-full bg-white/[0.04] animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-24 bg-white/[0.04] rounded animate-pulse" />
                    <div className="h-2 w-16 bg-white/[0.03] rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : eligible.length === 0 ? (
            <div className="py-10 px-6 text-center">
              <p className="text-[14px] text-white/40 font-medium">No spaces yet</p>
              <p className="text-[12px] text-white/25 mt-1.5 leading-relaxed">
                Join a space to start adding apps
              </p>
              <Link
                href="/spaces"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-[13px] text-white/60 hover:text-white/80 hover:bg-white/[0.08] transition-all font-medium"
              >
                Browse spaces
              </Link>
            </div>
          ) : (
            eligible.map(space => {
              const isDeploying = deployingSpaceId === space.id;
              const isDeployed = deployedSpaceId === space.id;

              return (
                <button
                  key={space.id}
                  onClick={() => !isDeploying && !isDeployed && onDeploy(toolId, space.id)}
                  disabled={isDeploying || isDeployed}
                  className={cn(
                    'flex items-center gap-3 w-full rounded-xl px-3 py-3 text-left transition-all duration-150',
                    isDeployed
                      ? 'bg-emerald-500/[0.06]'
                      : 'hover:bg-white/[0.04] active:scale-[0.98]'
                  )}
                >
                  <SpaceIcon space={space} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white/70 font-medium truncate">{space.name}</p>
                    <p className="text-[11px] text-white/25 truncate">{space.type} · {space.membership.role}</p>
                  </div>
                  {isDeployed ? (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </motion.div>
                  ) : isDeploying ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white/[0.08] border-t-white/30 animate-spin" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-white/[0.04] flex items-center justify-center text-white/25 group-hover:text-white/40">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function SpaceIcon({ space }: { space: MySpace }) {
  if (space.iconURL) {
    return <img src={space.iconURL} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />;
  }
  return (
    <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
      <span className="text-[13px] font-medium text-white/40">{space.name[0]?.toUpperCase()}</span>
    </div>
  );
}
