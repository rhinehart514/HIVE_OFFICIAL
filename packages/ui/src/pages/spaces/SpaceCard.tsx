import { motion, AnimatePresence } from "framer-motion";
import { CheckIcon } from "@heroicons/react/24/outline";
import * as React from "react";

// Aliases for lucide compatibility
const Check = CheckIcon;
import { springPresets } from "@hive/tokens";

import { Avatar, AvatarFallback, AvatarImage } from "../../design-system/primitives/Avatar";
import { Badge } from "../../design-system/primitives/Badge";
import { Button } from "../../design-system/primitives/Button";
import { Surface } from "../../layout";
import { duration, easing } from "../../lib/motion-variants";
import { cn } from "../../lib/utils";

export interface SpaceCardHost {
  name: string;
  avatarUrl?: string;
  initials?: string;
  role?: string;
}

export interface SpaceCardMetric {
  label: string;
  value: string;
}

export interface SpaceCardData {
  id: string;
  name: string;
  description: string;
  members: number;
  momentum?: string;
  tags?: string[];
  bannerImage?: string;
  bannerColor?: string;
  category?: string;
  hosts?: SpaceCardHost[];
  metrics?: SpaceCardMetric[];
  isInviteOnly?: boolean;
}

export interface SpaceCardProps {
  space: SpaceCardData;
  ctaLabel?: string;
  onJoin?: (spaceId: string) => void;
  onClick?: () => void;
  showFriends?: boolean;
  showExclusive?: boolean;
}

export function SpaceCard({ space, ctaLabel = "Join space", onJoin }: SpaceCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [joinState, setJoinState] = React.useState<'idle' | 'joining' | 'joined'>('idle');

  const handleJoin = () => {
    if (joinState !== 'idle') return;
    setJoinState('joining');
    onJoin?.(space.id);
    // Simulate success after a brief delay for optimistic UI
    setTimeout(() => setJoinState('joined'), 300);
  };

  // Card hover animation variants
  const cardVariants = {
    initial: { y: 0, scale: 1 },
    hover: {
      y: -6,
      scale: 1.02,
      transition: {
        duration: duration.quick,
        ease: easing.smooth,
      },
    },
    tap: {
      scale: 0.99,
      transition: {
        duration: duration.instant,
        ease: easing.snap,
      },
    },
  };

  return (
    <motion.div
      className="flex h-full flex-col justify-between rounded-3xl border border-[var(--hive-border-default,#292c3c)] bg-[var(--hive-background-secondary,#10111a)] p-6"
      variants={cardVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="space-y-4">
        {/* Banner with image zoom animation */}
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border border-[var(--hive-border-subtle,#232536)] bg-gradient-to-br from-[var(--hive-background-tertiary,#181a27)] to-[var(--hive-background-secondary,#10111a)]",
            space.bannerColor,
          )}
        >
          {space.bannerImage ? (
            <motion.img
              src={space.bannerImage}
              alt=""
              className="h-28 w-full object-cover opacity-90"
              animate={{
                scale: isHovered ? 1.05 : 1,
              }}
              transition={{
                duration: duration.standard,
                ease: easing.smooth,
              }}
            />
          ) : (
            <div className="h-28 w-full bg-gradient-to-r from-[rgba(255,214,102,0.25)] via-transparent to-[rgba(255,214,102,0.05)]" />
          )}
          {space.category ? (
            <span className="absolute left-4 top-4 rounded-full bg-[rgba(7,8,13,0.7)] px-3 py-1 text-xs font-semibold uppercase tracking-caps-wide text-[var(--hive-text-muted,#8d93a7)]">
              {space.category}
            </span>
          ) : null}
          {/* Momentum badge with spring animation */}
          <AnimatePresence>
            {space.momentum ? (
              <motion.span
                className="absolute bottom-4 left-4 rounded-full bg-[rgba(7,8,13,0.8)] px-3 py-1 text-xs font-semibold text-[var(--hive-brand-primary,#ffd166)]"
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                }}
              >
                {space.momentum}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-[var(--hive-text-primary,#f5f5ff)]">{space.name}</h3>
            {space.isInviteOnly ? (
              <Badge variant="neutral">
                Invite only
              </Badge>
            ) : null}
          </div>
          <p className="text-sm leading-6 text-[var(--hive-text-secondary,#bfc3d8)]">{space.description}</p>
          {/* Member count with pulse on hover */}
          <motion.p
            className="text-xs uppercase tracking-caps-wider text-[var(--hive-text-muted,#8d93a7)]"
            animate={{
              scale: isHovered ? 1.02 : 1,
            }}
            transition={{
              duration: duration.quick,
              ease: easing.smooth,
            }}
          >
            {space.members.toLocaleString()} members on campus
          </motion.p>
        </div>

        {space.tags && space.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {space.tags.map((tag) => (
              <Badge key={tag} variant="neutral">
                #{tag}
              </Badge>
            ))}
          </div>
        ) : null}

        {space.hosts && space.hosts.length > 0 ? (
          <div className="rounded-2xl border border-[var(--hive-border-subtle,#232536)] bg-[var(--hive-background-tertiary,#161827)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-caps-wider text-[var(--hive-text-muted,#8c91a7)]">
              Hosts
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {space.hosts.map((host) => (
                <div key={host.name} className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    {host.avatarUrl ? (
                      <AvatarImage src={host.avatarUrl} alt={host.name} />
                    ) : (
                      <AvatarFallback>{host.initials ?? host.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="text-xs font-semibold text-[var(--hive-text-primary,#f5f5ff)]">{host.name}</p>
                    {host.role ? (
                      <p className="text-body-xs uppercase tracking-caps-wide text-[var(--hive-text-muted,#8d93a7)]">
                        {host.role}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {space.metrics && space.metrics.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-[var(--hive-border-subtle,#232536)] bg-[var(--hive-background-tertiary,#171828)] p-4">
            {space.metrics.map((metric) => (
              <div key={metric.label}>
                <p className="text-xs uppercase tracking-caps-wide text-[var(--hive-text-muted,#8d93a7)]">
                  {metric.label}
                </p>
                <p className="text-sm font-semibold text-[var(--hive-text-primary,#f5f5ff)]">{metric.value}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Action buttons with smooth transitions */}
      <div className="mt-6 flex items-center justify-between">
        <motion.div
          whileHover={joinState === 'idle' ? { scale: 1.02 } : undefined}
          whileTap={joinState === 'idle' ? { scale: 0.98 } : undefined}
          transition={springPresets.snappy}
        >
          <Button
            variant={joinState === 'joined' ? "default" : "secondary"}
            className={cn(
              "rounded-full transition-all",
              joinState === 'joined' && "bg-green-500/20 text-green-400 border-green-500/30"
            )}
            onClick={handleJoin}
            disabled={joinState !== 'idle'}
          >
            <AnimatePresence mode="wait">
              {joinState === 'idle' && (
                <motion.span
                  key="join"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: duration.instant }}
                >
                  {ctaLabel}
                </motion.span>
              )}
              {joinState === 'joining' && (
                <motion.span
                  key="joining"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: duration.instant }}
                  className="flex items-center gap-2"
                >
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                  />
                  Joining...
                </motion.span>
              )}
              {joinState === 'joined' && (
                <motion.span
                  key="joined"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={springPresets.bouncy}
                  className="flex items-center gap-2"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={springPresets.bouncy}
                  >
                    <Check className="h-4 w-4" />
                  </motion.div>
                  Joined!
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={springPresets.snappy}
        >
          <Button variant="ghost" className="text-xs uppercase tracking-caps-wide">
            View rituals
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
