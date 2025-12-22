/**
 * Dock - Bottom Navigation Bar
 *
 * Design Direction:
 * - Position: fixed bottom
 * - Height: 56px
 * - Background: #0A0A0A with subtle blur
 * - Border-top: 1px #2A2A2A
 * - Items: 5-6 pinned spaces + add + ⌘K
 * - Gold dot for unread
 * - Hover: space name + online count tooltip
 * - ⌘1-6 jump to pinned space
 */
'use client';

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Command } from "lucide-react";
import * as React from "react";

import { dockItemVariants } from "../../../lib/motion-variants";
import { cn } from "../../../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../atoms/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../atoms/tooltip";

export interface DockSpace {
  id: string;
  name: string;
  icon?: string;
  avatarUrl?: string;
  hasUnread: boolean;
  onlineCount?: number;
  isActive?: boolean;
}

export interface DockProps {
  /** Pinned spaces to display (max 6 recommended) */
  spaces: DockSpace[];
  /** Currently active space ID */
  activeSpaceId?: string;
  /** Called when a space is clicked */
  onSpaceClick: (id: string) => void;
  /** Called when add button is clicked */
  onAddClick: () => void;
  /** Called when command palette button is clicked */
  onCommandPalette: () => void;
  /** Additional class name */
  className?: string;
  /** Whether the dock is visible */
  visible?: boolean;
}

export function Dock({
  spaces,
  activeSpaceId,
  onSpaceClick,
  onAddClick,
  onCommandPalette,
  className,
  visible = true,
}: DockProps) {
  // Keyboard shortcuts for ⌘1-6
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key >= "1" && e.key <= "6") {
        const index = parseInt(e.key) - 1;
        if (spaces[index]) {
          e.preventDefault();
          onSpaceClick(spaces[index].id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [spaces, onSpaceClick]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={cn(
            "fixed bottom-0 left-0 right-0 z-40",
            "h-14 px-4",
            "bg-[#0A0A0A]/95 backdrop-blur-md",
            "border-t border-[#2A2A2A]",
            "flex items-center justify-center gap-1",
            className
          )}
        >
          <TooltipProvider delayDuration={200}>
            <div className="flex items-center gap-1">
              {/* Pinned Spaces */}
              {spaces.slice(0, 6).map((space, index) => (
                <DockItem
                  key={space.id}
                  space={space}
                  isActive={space.id === activeSpaceId}
                  onClick={() => onSpaceClick(space.id)}
                  shortcut={index < 6 ? `⌘${index + 1}` : undefined}
                />
              ))}

              {/* Separator */}
              <div className="w-px h-8 bg-[#2A2A2A] mx-2" />

              {/* Add Space Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    variants={dockItemVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={onAddClick}
                    className={cn(
                      "w-10 h-10 rounded-xl",
                      "bg-[#141414] border border-[#2A2A2A]",
                      "flex items-center justify-center",
                      "text-[#818187] hover:text-[#FAFAFA]",
                      "hover:border-[#3A3A3A] hover:bg-[#1A1A1A]",
                      "transition-colors duration-100",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                    )}
                  >
                    <Plus className="w-5 h-5" />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Create or join space</p>
                </TooltipContent>
              </Tooltip>

              {/* Command Palette Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    variants={dockItemVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={onCommandPalette}
                    className={cn(
                      "h-10 px-3 rounded-xl",
                      "bg-[#141414] border border-[#2A2A2A]",
                      "flex items-center gap-1.5",
                      "text-[#818187] hover:text-[#FAFAFA]",
                      "hover:border-[#3A3A3A] hover:bg-[#1A1A1A]",
                      "transition-colors duration-100",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                    )}
                  >
                    <Command className="w-4 h-4" />
                    <span className="text-xs font-medium">K</span>
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Command palette</p>
                  <p className="text-[#818187]">⌘K</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface DockItemProps {
  space: DockSpace;
  isActive: boolean;
  onClick: () => void;
  shortcut?: string;
}

function DockItem({ space, isActive, onClick, shortcut }: DockItemProps) {
  const initials = space.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          variants={dockItemVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={onClick}
          className={cn(
            "relative w-10 h-10 rounded-xl",
            "flex items-center justify-center",
            "transition-all duration-100",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
            isActive
              ? "bg-white/[0.12] ring-2 ring-white/20"
              : "bg-[#141414] border border-[#2A2A2A] hover:border-[#3A3A3A] hover:bg-[#1A1A1A]"
          )}
        >
          {/* Avatar */}
          <Avatar className="w-7 h-7">
            {space.avatarUrl && <AvatarImage src={space.avatarUrl} alt={space.name} />}
            <AvatarFallback className="text-xs bg-[#1A1A1A] text-[#A1A1A6]">
              {space.icon || initials}
            </AvatarFallback>
          </Avatar>

          {/* Unread Indicator */}
          {space.hasUnread && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "absolute -top-0.5 -right-0.5",
                "w-2.5 h-2.5 rounded-full",
                "bg-[#FFD700]",
                "border-2 border-[#0A0A0A]"
              )}
            />
          )}

          {/* Active Indicator */}
          {isActive && (
            <motion.span
              layoutId="dock-active"
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FAFAFA]"
            />
          )}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="top" className="flex flex-col gap-0.5">
        <p className="font-medium">{space.name}</p>
        {space.onlineCount !== undefined && space.onlineCount > 0 && (
          <p className="text-[#818187] text-xs">{space.onlineCount} online</p>
        )}
        {shortcut && (
          <p className="text-[#818187] text-xs">{shortcut}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

export { DockItem };
