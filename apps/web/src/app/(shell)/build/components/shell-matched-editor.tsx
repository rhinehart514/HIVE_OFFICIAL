'use client';

import { motion } from 'framer-motion';
import { Sparkles, Zap, Wand2 } from 'lucide-react';
import { MOTION } from '@hive/tokens';
import type { ShellFormat, ShellConfig } from '@/lib/shells/types';
import { ShellConfigEditor } from './shell-config-editors';

const EASE = MOTION.ease.premium;

export function ShellMatchedEditor({
  shellFormat,
  shellConfig,
  confidence,
  registryName,
  hasUser,
  onUpdateConfig,
  onDeploy,
  onEscalate,
}: {
  shellFormat: ShellFormat;
  shellConfig: ShellConfig;
  confidence: number;
  registryName: string | undefined;
  hasUser: boolean;
  onUpdateConfig: (config: ShellConfig) => void;
  onDeploy: () => void;
  onEscalate: () => void;
}) {
  return (
    <motion.div
      key="shell-editor"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, ease: EASE }}
      className="mt-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Wand2 className="w-3.5 h-3.5 text-[#FFD700]/50" />
          <span className="text-xs font-medium text-white/50">
            {registryName} detected
          </span>
        </div>
        <span className="text-[11px] text-white/30 px-2 py-0.5 rounded-full bg-white/[0.05]">
          {Math.round(confidence * 100)}% match
        </span>
      </div>

      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
        <ShellConfigEditor
          format={shellFormat}
          config={shellConfig}
          onChange={onUpdateConfig}
        />
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={onDeploy}
          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-full
            bg-[#FFD700] text-black font-semibold text-sm hover:bg-[#FFD700]/90 transition-colors duration-100"
        >
          <Zap className="w-4 h-4" />
          {hasUser ? 'Deploy' : 'Sign in to deploy'}
        </button>
        <button
          onClick={onEscalate}
          className="flex items-center justify-center gap-1.5 h-10 px-4 rounded-full
            text-sm text-white/50 bg-white/[0.05] hover:bg-white/[0.10] hover:text-white
            transition-colors duration-100"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Make it custom
        </button>
      </div>
    </motion.div>
  );
}
