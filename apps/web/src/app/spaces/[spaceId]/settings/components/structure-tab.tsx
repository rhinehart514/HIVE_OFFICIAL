"use client";

import * as React from "react";
import { motion, type Variants } from "framer-motion";
import {
  PlusIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  EyeSlashIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { Button, Card, cn, AddTabModal, AddWidgetModal } from "@hive/ui";
import type { AddTabInput, AddWidgetInputUI } from "@hive/ui";
import { springPresets } from "@hive/tokens";

interface Tab {
  id: string;
  name: string;
  type: string;
  isDefault?: boolean;
  isVisible?: boolean;
}

interface Widget {
  id: string;
  title: string;
  type: string;
  isEnabled?: boolean;
}

interface LeaderActions {
  updateTab: (tabId: string, updates: { isVisible?: boolean }) => Promise<boolean>;
  addTab: (input: AddTabInput) => Promise<string | null>;
  addWidget: (input: AddWidgetInputUI) => Promise<string | null>;
}

interface StructureTabProps {
  tabs: Tab[];
  widgets: Widget[];
  leaderActions: LeaderActions | null;
  variants?: Variants;
}

const listItemVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: springPresets.snappy,
  },
};

export function StructureTab({
  tabs,
  widgets,
  leaderActions,
  variants,
}: StructureTabProps) {
  const [addTabModalOpen, setAddTabModalOpen] = React.useState(false);
  const [addWidgetModalOpen, setAddWidgetModalOpen] = React.useState(false);

  const handleToggleTab = async (tabId: string, isVisible: boolean) => {
    if (!leaderActions) return;
    await leaderActions.updateTab(tabId, { isVisible });
  };

  const handleAddTab = async (input: AddTabInput) => {
    if (!leaderActions) return;
    const result = await leaderActions.addTab(input);
    if (result) {
      setAddTabModalOpen(false);
    }
  };

  const handleAddWidget = async (input: AddWidgetInputUI) => {
    if (!leaderActions) return;
    const result = await leaderActions.addWidget(input);
    if (result) {
      setAddWidgetModalOpen(false);
    }
  };

  return (
    <>
      <motion.div
        key="structure"
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-4"
      >
        {/* Tabs Management */}
        <Card className="p-6 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Tabs</h2>
            {leaderActions && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddTabModalOpen(true)}
                className="border-neutral-700 text-neutral-300 hover:bg-white/5"
              >
                <PlusIcon className="h-4 w-4 mr-1.5" />
                Add Tab
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {tabs.map((tab, index) => (
              <motion.div
                key={tab.id}
                variants={listItemVariants}
                custom={index}
                className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/30 border border-neutral-700/50"
              >
                <div className="flex items-center gap-3">
                  <EllipsisVerticalIcon className="h-4 w-4 text-neutral-600 cursor-grab" />
                  <div>
                    <p className="text-sm font-medium text-white">{tab.name}</p>
                    <p className="text-xs text-neutral-500 capitalize">
                      {tab.type}
                      {tab.isDefault && " • Default"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleTab(tab.id, !tab.isVisible)}
                    className={cn(
                      "p-1.5 rounded transition-colors",
                      tab.isVisible
                        ? "text-life-gold hover:bg-life-gold/10"
                        : "text-neutral-500 hover:bg-white/5"
                    )}
                  >
                    {tab.isVisible ? (
                      <EyeIcon className="h-4 w-4" />
                    ) : (
                      <EyeSlashIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Widgets Management */}
        <Card className="p-6 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Widgets</h2>
            {leaderActions && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddWidgetModalOpen(true)}
                className="border-neutral-700 text-neutral-300 hover:bg-white/5"
              >
                <PlusIcon className="h-4 w-4 mr-1.5" />
                Add Widget
              </Button>
            )}
          </div>

          {widgets.length === 0 ? (
            <div className="py-8 text-center text-neutral-500">
              <Squares2X2Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No widgets configured</p>
              <p className="text-xs mt-1">
                Add widgets to customize your space
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {widgets.map((widget, index) => (
                <motion.div
                  key={widget.id}
                  variants={listItemVariants}
                  custom={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/30 border border-neutral-700/50"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {widget.title}
                    </p>
                    <p className="text-xs text-neutral-500 capitalize">
                      {widget.type}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-xs",
                        widget.isEnabled
                          ? "bg-green-500/10 text-green-400"
                          : "bg-neutral-700/50 text-neutral-400"
                      )}
                    >
                      {widget.isEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Modals */}
      {leaderActions && (
        <>
          <AddTabModal
            open={addTabModalOpen}
            onOpenChange={setAddTabModalOpen}
            onSubmit={handleAddTab}
            existingTabNames={tabs.map((t) => t.name)}
          />
          <AddWidgetModal
            open={addWidgetModalOpen}
            onOpenChange={setAddWidgetModalOpen}
            onSubmit={handleAddWidget}
          />
        </>
      )}
    </>
  );
}
