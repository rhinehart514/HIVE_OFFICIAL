'use client';

import * as React from 'react';
import Link from 'next/link';

import { ArrowRight, Wrench } from 'lucide-react';
import {
  ProfileToolModal,
  ReportContentModal,
  toast,
  type ProfileActivityTool,
  type ReportContentInput,
} from '@hive/ui';
import { useProfileByHandle } from './hooks';

const clashDisplay = "font-[family-name:'Clash_Display',var(--font-clash)]";

function ProfileLoadingState() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-white/[0.06] mx-auto mb-4" />
        <p className="text-white/50 text-sm">Loading profile...</p>
      </div>
    </div>
  );
}

function ProfileNotFoundState({ handle }: { handle: string }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <h1 className={`${clashDisplay} text-2xl font-semibold text-white mb-3`}>
          Not Found
        </h1>
        <p className="text-sm text-white/50 mb-6">
          No one with the handle <span className="font-mono text-white/50">@{handle}</span> exists.
        </p>
        <Link
          href="/discover"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.06] text-white/50 text-sm font-medium hover:bg-white/[0.06] transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

function ProfileErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <h1 className={`${clashDisplay} text-2xl font-semibold text-white mb-3`}>
          Something broke
        </h1>
        <p className="text-sm text-white/50 mb-6">
          Couldn&apos;t load this profile.
        </p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FFD700] text-black text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export default function ProfilePageContent() {
  const state = useProfileByHandle();
  const [showReportModal, setShowReportModal] = React.useState(false);

  const {
    handle,
    handleError,
    profileId,
    isOwnProfile,
    isLoading,
    error,
    profileData,
    heroUser,
    heroPresence,
    profileSpaces,
    profileTools,
    selectedTool,
    handleEditProfile,
    handleToolModalClose,
    handleToolUpdateVisibility,
    handleToolRemove,
    handleSpaceClick,
    handleToolClick,
  } = state;

  const handleSubmitReport = async (data: ReportContentInput) => {
    const response = await fetch('/api/content/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to submit report');
    }
    toast.success('Report submitted');
  };

  if (isLoading) return <ProfileLoadingState />;
  if (handleError === 'not_found') return <ProfileNotFoundState handle={handle} />;
  if (handleError === 'private') return <ProfileNotFoundState handle={handle} />;
  if (handleError === 'error' || error) return <ProfileErrorState onRetry={() => window.location.reload()} />;
  if (!profileData || !heroUser) return <ProfileNotFoundState handle={handle} />;

  const activityTools: ProfileActivityTool[] = profileTools
    .sort((a, b) => (b.runs || 0) - (a.runs || 0))
    .map((tool) => ({
      id: tool.id,
      name: tool.name,
      emoji: tool.emoji,
      runs: tool.runs || 0,
    }));

  const hasTools = activityTools.length > 0;
  const hasSpaces = profileSpaces.length > 0;
  const infoLine = [heroUser.major, heroUser.classYear, heroUser.campusName]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="min-h-full w-full bg-black">
      <div className="max-w-[480px] mx-auto px-6 py-12">
        {/* Edit button (own profile) */}
        {isOwnProfile && (
          <div className="flex justify-end mb-6">
            <button
              onClick={handleEditProfile}
              className="text-[13px] text-white/50 hover:text-white transition-colors"
            >
              Edit
            </button>
          </div>
        )}

        {/* Report button (other profiles) */}
        {!isOwnProfile && (
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setShowReportModal(true)}
              className="text-[13px] text-white/50 hover:text-white transition-colors"
            >
              Report
            </button>
          </div>
        )}

        {/* Identity */}
        <div className="text-center mb-8">
          {/* Avatar */}
          {heroUser.avatarUrl ? (
            <img
              src={heroUser.avatarUrl}
              alt=""
              className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-white/[0.06] mx-auto mb-4 flex items-center justify-center">
              <span className="text-xl font-medium text-white/50">
                {heroUser.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Name */}
          <h1 className={`${clashDisplay} text-[40px] font-semibold leading-tight text-white mb-1`}>
            {heroUser.fullName}
          </h1>

          {/* Handle */}
          <p className="font-mono text-[14px] text-white/50 mb-2">
            @{heroUser.handle}
          </p>

          {/* Online status */}
          {heroPresence.isOnline && (
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FFD700] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FFD700]" />
              </span>
              <span className="text-[12px] text-white/50">Online</span>
            </div>
          )}

          {/* Bio / info line */}
          {heroUser.bio && (
            <p className="text-[14px] text-white/50 max-w-sm mx-auto mb-1">
              {heroUser.bio}
            </p>
          )}
          {infoLine && (
            <p className="text-[13px] text-white/50">{infoLine}</p>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.06] mb-8" />

        {/* Tools Built */}
        {hasTools && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] uppercase tracking-[0.15em] font-mono text-white/50">
                Tools Built
              </h2>
              {isOwnProfile && (
                <Link
                  href="/lab"
                  className="text-[11px] text-white/50 hover:text-white transition-colors flex items-center gap-1"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {activityTools.slice(0, 6).map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool.id)}
                  className="rounded-2xl bg-[#080808] border border-white/[0.06] p-4 text-left hover:bg-white/[0.03] transition-colors"
                >
                  <span className="text-lg block mb-2">{tool.emoji || '🔧'}</span>
                  <p className="text-[13px] font-medium text-white truncate">
                    {tool.name}
                  </p>
                  <p className="text-[11px] font-mono text-white/30 mt-1">
                    {tool.runs} uses
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Build something prompt (own profile, no tools) */}
        {isOwnProfile && !hasTools && (
          <section className="mb-8">
            <Link
              href="/lab"
              className="flex items-center gap-3 rounded-2xl bg-[#080808] border border-white/[0.06] p-5 hover:bg-white/[0.03] transition-colors"
            >
              <Wrench className="w-5 h-5 text-white/30" />
              <div className="flex-1">
                <p className="text-[14px] font-medium text-white">Build a tool</p>
                <p className="text-[12px] text-white/50">Polls, sign-ups, countdowns, and more</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/30" />
            </Link>
          </section>
        )}

        {/* Spaces */}
        {hasSpaces && (
          <section className="mb-8">
            <h2 className="text-[11px] uppercase tracking-[0.15em] font-mono text-white/50 mb-4">
              Spaces
            </h2>

            <div className="space-y-0">
              {profileSpaces.map((space) => (
                <button
                  key={space.id}
                  onClick={() => handleSpaceClick(space.id)}
                  className="flex items-center justify-between w-full py-2.5 text-left group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {space.emoji && (
                      <span className="text-sm">{space.emoji}</span>
                    )}
                    <span className="text-[14px] text-white/50 group-hover:text-white transition-colors truncate">
                      {space.name}
                    </span>
                    {space.isLeader && (
                      <span className="text-[10px] font-mono text-[#FFD700]/60 uppercase">
                        Lead
                      </span>
                    )}
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Tool Modal */}
      <ProfileToolModal
        tool={selectedTool}
        isOpen={!!selectedTool}
        onClose={handleToolModalClose}
        onUpdateVisibility={isOwnProfile ? handleToolUpdateVisibility : undefined}
        onRemove={isOwnProfile ? handleToolRemove : undefined}
        isOwner={isOwnProfile}
      />

      {/* Report Modal */}
      <ReportContentModal
        open={showReportModal}
        onOpenChange={setShowReportModal}
        contentId={profileId || ''}
        contentType="profile"
        authorName={heroUser?.fullName}
        onSubmit={handleSubmitReport}
      />
    </div>
  );
}
