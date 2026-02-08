'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Flag, Bug, Beaker, Eye, X } from 'lucide-react';
import { useAdminToolbarSafe } from './AdminToolbarProvider';
import { DebugPanel } from './tabs/DebugPanel';
import { FlagOverrides } from './tabs/FlagOverrides';
import { DataFactory } from './tabs/DataFactory';
import { ViewAsPanel } from './tabs/ViewAsPanel';

const TABS = [
  { id: 'flags' as const, label: 'Flags', icon: Flag },
  { id: 'debug' as const, label: 'Debug', icon: Bug },
  { id: 'factory' as const, label: 'Factory', icon: Beaker },
  { id: 'viewas' as const, label: 'View As', icon: Eye },
];

const EASE = [0.25, 0.1, 0.25, 1] as const;

function AdminToolbarInner() {
  const ctx = useAdminToolbarSafe();

  // Not an admin — no context provided
  if (!ctx) return null;

  const { isOpen, setIsOpen, activeTab, setActiveTab, hasOverrides, impersonation } = ctx;

  return (
    <>
      {/* FAB — left side to avoid HiveLab deploy button, above BottomNav on mobile */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 left-4 lg:bottom-6 lg:left-6 z-[9990] w-9 h-9 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-lg flex items-center justify-center shadow-lg hover:bg-white/10 transition-colors"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        title="Admin Toolbar (⌘⇧D)"
      >
        <ShieldCheck size={16} className="text-white/60" />

        {/* Pulsing dot when overrides active or impersonating */}
        {(hasOverrides || impersonation) && (
          <motion.span
            className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${
              impersonation ? 'bg-red-400' : 'bg-blue-400'
            }`}
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-36 left-4 lg:bottom-[72px] lg:left-6 z-[9990] w-[min(400px,calc(100vw-2rem))] max-h-[70vh] bg-[#1A1A1A]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-white/50" />
                <span className="text-[12px] font-semibold text-white/70 tracking-wide uppercase">
                  Admin Toolbar
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/[0.06] rounded-md transition-colors"
              >
                <X size={14} className="text-white/40" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/[0.06]">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-[11px] font-medium transition-colors relative ${
                      isActive ? 'text-white/90' : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    <Icon size={12} />
                    {tab.label}
                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-2 right-2 h-[1.5px] bg-white/40 rounded-full"
                        layoutId="admin-tab-indicator"
                        transition={{ duration: 0.2, ease: EASE }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {activeTab === 'flags' && <FlagOverrides />}
              {activeTab === 'debug' && <DebugPanel />}
              {activeTab === 'factory' && <DataFactory />}
              {activeTab === 'viewas' && <ViewAsPanel />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Default export for dynamic import
export default function AdminToolbar() {
  return <AdminToolbarInner />;
}
