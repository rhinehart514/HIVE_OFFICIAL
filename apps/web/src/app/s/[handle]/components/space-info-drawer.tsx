'use client';

/**
 * SpaceInfoDrawer - Full space metadata display
 * CREATED: Jan 25, 2026
 *
 * Shows all CampusLabs imported metadata and space details.
 * Triggered from header info icon or space name click.
 *
 * @version 1.0.0 - Spaces Launch Readiness (P2.3)
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Globe,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Youtube,
  Mail,
  User,
  Calendar,
  ExternalLink,
  Building2,
  Tag,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Text,
  Button,
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
} from '@hive/ui';
import { MOTION, durationSeconds } from '@hive/tokens';

interface SpaceInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  space: {
    id: string;
    handle: string;
    name: string;
    description?: string;
    avatarUrl?: string;
    memberCount: number;
    isVerified?: boolean;
    // CampusLabs metadata
    email?: string;
    contactName?: string;
    orgTypeName?: string;
    foundedDate?: string;
    source?: 'ublinked' | 'user-created';
    sourceUrl?: string;
    socialLinks?: {
      website?: string;
      instagram?: string;
      twitter?: string;
      facebook?: string;
      linkedin?: string;
      youtube?: string;
    };
  };
  className?: string;
}

export function SpaceInfoDrawer({
  isOpen,
  onClose,
  space,
  className,
}: SpaceInfoDrawerProps) {
  // Format founding date
  const formattedFoundingDate = React.useMemo(() => {
    if (!space.foundedDate) return null;
    try {
      const date = new Date(space.foundedDate);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  }, [space.foundedDate]);

  const hasSocialLinks = space.socialLinks && Object.values(space.socialLinks).some(Boolean);
  const hasContactInfo = space.email || space.contactName;
  const hasMetadata = space.orgTypeName || space.foundedDate || space.source === 'ublinked';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: durationSeconds.quick }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 "
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Drawer Panel */}
          <motion.div
            className={cn(
              'relative h-full w-full max-w-md bg-[var(--bg-ground)] border-l border-white/[0.06] overflow-y-auto',
              className
            )}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: durationSeconds.smooth, ease: MOTION.ease.premium }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[var(--bg-ground)]">
              <Text weight="medium" className="text-white">
                About this space
              </Text>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white/50 hover:text-white/50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Space Identity */}
              <div className="flex items-start gap-4">
                <Avatar size="lg" className="ring-1 ring-white/[0.06]">
                  {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
                  <AvatarFallback className="text-lg">
                    {getInitials(space.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h2
                    className="text-title font-semibold text-white mb-1"
                    style={{ fontFamily: 'var(--font-clash)' }}
                  >
                    {space.name}
                  </h2>
                  <Text size="sm" tone="muted" className="font-mono">
                    @{space.handle}
                  </Text>
                  <div className="flex items-center gap-2 mt-2">
                    <Users className="h-3.5 w-3.5 text-white/50" />
                    <Text size="xs" tone="muted">
                      {space.memberCount > 0 ? `${space.memberCount} members` : 'Be the first to join'}
                    </Text>
                  </div>
                </div>
              </div>

              {/* Description */}
              {space.description && (
                <div>
                  <Text size="xs" weight="medium" className="text-white/50 uppercase tracking-wider mb-2">
                    About
                  </Text>
                  <Text size="sm" className="text-white/50 leading-relaxed">
                    {space.description}
                  </Text>
                </div>
              )}

              {/* Organization Metadata */}
              {hasMetadata && (
                <div className="space-y-3">
                  <Text size="xs" weight="medium" className="text-white/50 uppercase tracking-wider">
                    Organization Info
                  </Text>

                  {space.orgTypeName && (
                    <div className="flex items-center gap-3">
                      <Tag className="h-4 w-4 text-white/50" />
                      <Text size="sm" className="text-white/50">
                        {space.orgTypeName}
                      </Text>
                    </div>
                  )}

                  {formattedFoundingDate && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-white/50" />
                      <Text size="sm" className="text-white/50">
                        Founded {formattedFoundingDate}
                      </Text>
                    </div>
                  )}

                  {space.source === 'ublinked' && (
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-white/50" />
                      <div className="flex items-center gap-2">
                        <Text size="sm" className="text-white/50">
                          Imported from CampusLabs
                        </Text>
                        {space.sourceUrl && (
                          <a
                            href={space.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Contact Information */}
              {hasContactInfo && (
                <div className="space-y-3">
                  <Text size="xs" weight="medium" className="text-white/50 uppercase tracking-wider">
                    Contact
                  </Text>

                  {space.contactName && (
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-white/50" />
                      <Text size="sm" className="text-white/50">
                        {space.contactName}
                      </Text>
                    </div>
                  )}

                  {space.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-white/50" />
                      <a
                        href={`mailto:${space.email}`}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {space.email}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Social Links */}
              {hasSocialLinks && (
                <div className="space-y-3">
                  <Text size="xs" weight="medium" className="text-white/50 uppercase tracking-wider">
                    Social Links
                  </Text>

                  <div className="flex flex-wrap gap-3">
                    {space.socialLinks?.website && (
                      <a
                        href={space.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <Globe className="h-4 w-4" />
                        <Text size="xs">Website</Text>
                      </a>
                    )}
                    {space.socialLinks?.instagram && (
                      <a
                        href={space.socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <Instagram className="h-4 w-4" />
                        <Text size="xs">Instagram</Text>
                      </a>
                    )}
                    {space.socialLinks?.twitter && (
                      <a
                        href={space.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <Twitter className="h-4 w-4" />
                        <Text size="xs">Twitter</Text>
                      </a>
                    )}
                    {space.socialLinks?.facebook && (
                      <a
                        href={space.socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <Facebook className="h-4 w-4" />
                        <Text size="xs">Facebook</Text>
                      </a>
                    )}
                    {space.socialLinks?.linkedin && (
                      <a
                        href={space.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <Linkedin className="h-4 w-4" />
                        <Text size="xs">LinkedIn</Text>
                      </a>
                    )}
                    {space.socialLinks?.youtube && (
                      <a
                        href={space.socialLinks.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <Youtube className="h-4 w-4" />
                        <Text size="xs">YouTube</Text>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

SpaceInfoDrawer.displayName = 'SpaceInfoDrawer';
