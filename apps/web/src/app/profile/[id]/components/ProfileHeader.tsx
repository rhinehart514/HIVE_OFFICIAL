/**
 * ProfileHeader - Hero header with avatar, identity, and metadata
 */

import { motion } from 'framer-motion';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  premiumContainerVariants,
  premiumItemVariants,
} from '@hive/ui';
import {
  MapPinIcon,
  AcademicCapIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import type { ProfileV2ApiResponse } from '@/components/profile/profile-adapter';
import { ProfileStat } from './ProfileStat';
import { ProfileActions } from './ProfileActions';
import { ProfileInterests } from './ProfileInterests';

interface ProfileHeaderProps {
  profileData: ProfileV2ApiResponse;
  initials: string;
  isOnline: boolean;
  presenceText: string;
  isSpaceLeader: boolean;
  spacesLed: ProfileV2ApiResponse['spaces'];
  primarySpace: ProfileV2ApiResponse['spaces'][0] | null;
  statItems: Array<{ label: string; value: number }>;
  isOwnProfile: boolean;
  onEditProfile: () => void;
}

export function ProfileHeader({
  profileData,
  initials,
  isOnline,
  presenceText,
  isSpaceLeader,
  spacesLed,
  primarySpace,
  statItems,
  isOwnProfile,
  onEditProfile,
}: ProfileHeaderProps) {
  return (
    <motion.header
      variants={premiumContainerVariants}
      initial="hidden"
      animate="visible"
      className="relative w-full border-b border-[var(--border)]"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        {/* Avatar + Identity Row */}
        <motion.div
          variants={premiumItemVariants}
          className="flex flex-col sm:flex-row items-center sm:items-start gap-6"
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {isOnline && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 -m-2 rounded-full blur-xl"
                style={{ backgroundColor: 'var(--life-glow)' }}
              />
            )}
            <Avatar className="relative h-24 w-24 border-2 border-[var(--border)]">
              <AvatarImage
                src={profileData.profile.avatarUrl ?? undefined}
                alt={profileData.profile.fullName}
                className="object-cover"
              />
              <AvatarFallback className="text-2xl font-semibold bg-[var(--bg-surface)] text-white/80">
                {initials}
              </AvatarFallback>
            </Avatar>
            {isOnline && (
              <div
                className="absolute bottom-2 right-2 w-4 h-4 rounded-full border-2"
                style={{
                  backgroundColor: 'var(--life-gold)',
                  borderColor: 'var(--bg-void)',
                }}
              />
            )}
          </div>

          {/* Identity */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                {profileData.profile.fullName}
              </h1>
              {isSpaceLeader && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--life-gold)]/10 border border-[var(--life-gold)]/20"
                  title={`Leading ${spacesLed.length} space${spacesLed.length > 1 ? 's' : ''}`}
                >
                  <TrophyIcon className="w-3.5 h-3.5 text-[var(--life-gold)]" />
                  <span className="text-xs font-medium text-[var(--life-gold)]">Founding Leader</span>
                </motion.div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[var(--text-secondary)] text-base">
              <span>@{profileData.profile.handle}</span>
              {primarySpace && (
                <>
                  <span className="text-[var(--text-muted)]">·</span>
                  <span className="text-[var(--text-muted)]">Active in {primarySpace.name}</span>
                </>
              )}
            </div>
            {profileData.profile.bio && (
              <p className="text-[var(--text-secondary)] text-base leading-relaxed max-w-md">
                {profileData.profile.bio}
              </p>
            )}

            {/* Location/Major */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5">
                <MapPinIcon className="w-3.5 h-3.5" />
                {profileData.profile.campusId.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
              {profileData.profile.major && (
                <span className="flex items-center gap-1.5">
                  <AcademicCapIcon className="w-3.5 h-3.5" />
                  {profileData.profile.major}
                </span>
              )}
              <span
                className="flex items-center gap-1.5"
                style={{ color: isOnline ? 'var(--life-gold)' : 'var(--text-muted)' }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: isOnline ? 'var(--life-gold)' : 'var(--text-muted)' }}
                />
                {presenceText}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          variants={premiumItemVariants}
          className="mt-8 flex flex-wrap justify-center sm:justify-start items-center gap-4 sm:gap-8 py-4 border-t border-b border-[var(--border)]"
        >
          <ProfileStat label={statItems[0].label} value={statItems[0].value} delay={0} />
          <ProfileStat label={statItems[1].label} value={statItems[1].value} delay={1} />
          <ProfileStat label={statItems[2].label} value={statItems[2].value} delay={2} />
          <ProfileStat label={statItems[3].label} value={statItems[3].value} delay={3} accent />
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={premiumItemVariants} className="mt-6">
          <ProfileActions isOwnProfile={isOwnProfile} onEditProfile={onEditProfile} />
        </motion.div>

        {/* Interests */}
        <ProfileInterests
          interests={profileData.profile.interests ?? []}
          variants={premiumItemVariants}
        />
      </div>
    </motion.header>
  );
}
