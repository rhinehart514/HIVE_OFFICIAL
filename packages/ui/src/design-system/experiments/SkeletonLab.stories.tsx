'use client';

/**
 * SkeletonLab - Shimmer Animation Experiments
 *
 * Testing: shimmer effects for loading states
 * DECISIONS.md says "Skeletons with shimmer, not spinners" - need to implement shimmer
 */

import type { Meta } from '@storybook/react';
import React from 'react';

const meta: Meta = {
  title: 'Experiments/Skeleton Lab',
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
};

export default meta;

const CardWrapper = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <div className="space-y-3">
    <div className="text-xs text-white/50 font-mono">{label}</div>
    <div
      className="rounded-2xl p-8 backdrop-blur-xl min-w-[300px] flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, rgba(28,28,28,0.95) 0%, rgba(18,18,18,0.92) 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      {children}
    </div>
  </div>
);

// ============================================
// ANIMATION OPTIONS
// ============================================
export const Animation_Options = () => {
  // A: Pulse (current Tailwind default)
  const PulseSkeleton = () => (
    <div className="w-full space-y-3">
      <div className="h-4 rounded bg-white/10 animate-pulse" style={{ width: '80%' }} />
      <div className="h-4 rounded bg-white/10 animate-pulse" style={{ width: '60%' }} />
      <div className="h-4 rounded bg-white/10 animate-pulse" style={{ width: '70%' }} />
    </div>
  );

  // B: Shimmer (gradient sweep)
  const ShimmerSkeleton = () => (
    <div className="w-full space-y-3">
      {[80, 60, 70].map((width, i) => (
        <div
          key={i}
          className="h-4 rounded relative overflow-hidden"
          style={{
            width: `${width}%`,
            background: 'rgba(255,255,255,0.08)',
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
              animation: 'shimmer 1.5s infinite',
            }}
          />
        </div>
      ))}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );

  // C: Wave (opacity wave)
  const WaveSkeleton = () => (
    <div className="w-full space-y-3">
      {[80, 60, 70].map((width, i) => (
        <div
          key={i}
          className="h-4 rounded"
          style={{
            width: `${width}%`,
            background: 'rgba(255,255,255,0.08)',
            animation: `wave 1.5s ease-in-out infinite`,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );

  // D: Glow (subtle inner glow pulse)
  const GlowSkeleton = () => (
    <div className="w-full space-y-3">
      {[80, 60, 70].map((width, i) => (
        <div
          key={i}
          className="h-4 rounded"
          style={{
            width: `${width}%`,
            background: 'rgba(255,255,255,0.06)',
            animation: `glow 2s ease-in-out infinite`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes glow {
          0%, 100% {
            background: rgba(255,255,255,0.06);
            box-shadow: none;
          }
          50% {
            background: rgba(255,255,255,0.12);
            box-shadow: inset 0 0 8px rgba(255,255,255,0.05);
          }
        }
      `}</style>
    </div>
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Animation Options</h2>
        <p className="text-sm text-white/50">Pick the skeleton animation style</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: Pulse (current)">
          <PulseSkeleton />
        </CardWrapper>

        <CardWrapper label="B: Shimmer (sweep)">
          <ShimmerSkeleton />
        </CardWrapper>

        <CardWrapper label="C: Wave (staggered)">
          <WaveSkeleton />
        </CardWrapper>

        <CardWrapper label="D: Glow (inner)">
          <GlowSkeleton />
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// SHIMMER SPEED OPTIONS
// ============================================
export const Speed_Options = () => {
  const ShimmerSkeleton = ({ duration }: { duration: number }) => (
    <div className="w-full space-y-3">
      {[80, 60, 70].map((width, i) => (
        <div
          key={i}
          className="h-4 rounded relative overflow-hidden"
          style={{
            width: `${width}%`,
            background: 'rgba(255,255,255,0.08)',
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
              animation: `shimmer-${duration} ${duration}s infinite`,
            }}
          />
        </div>
      ))}
      <style>{`
        @keyframes shimmer-${duration} {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Shimmer Speed</h2>
        <p className="text-sm text-white/50">How fast should the shimmer sweep?</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: Fast (1s)">
          <ShimmerSkeleton duration={1} />
        </CardWrapper>

        <CardWrapper label="B: Normal (1.5s)">
          <ShimmerSkeleton duration={1.5} />
        </CardWrapper>

        <CardWrapper label="C: Slow (2s)">
          <ShimmerSkeleton duration={2} />
        </CardWrapper>

        <CardWrapper label="D: Very Slow (3s)">
          <ShimmerSkeleton duration={3} />
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// SHIMMER INTENSITY OPTIONS
// ============================================
export const Intensity_Options = () => {
  const ShimmerSkeleton = ({ baseOpacity, highlightOpacity }: { baseOpacity: number; highlightOpacity: number }) => (
    <div className="w-full space-y-3">
      {[80, 60, 70].map((width, i) => (
        <div
          key={i}
          className="h-4 rounded relative overflow-hidden"
          style={{
            width: `${width}%`,
            background: `rgba(255,255,255,${baseOpacity})`,
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,${highlightOpacity}) 50%, transparent 100%)`,
              animation: 'shimmer-int 1.5s infinite',
            }}
          />
        </div>
      ))}
      <style>{`
        @keyframes shimmer-int {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Shimmer Intensity</h2>
        <p className="text-sm text-white/50">Base vs highlight opacity</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: Subtle (6% / 8%)">
          <ShimmerSkeleton baseOpacity={0.06} highlightOpacity={0.08} />
        </CardWrapper>

        <CardWrapper label="B: Normal (8% / 12%)">
          <ShimmerSkeleton baseOpacity={0.08} highlightOpacity={0.12} />
        </CardWrapper>

        <CardWrapper label="C: Strong (10% / 18%)">
          <ShimmerSkeleton baseOpacity={0.10} highlightOpacity={0.18} />
        </CardWrapper>

        <CardWrapper label="D: Bold (12% / 25%)">
          <ShimmerSkeleton baseOpacity={0.12} highlightOpacity={0.25} />
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// RADIUS OPTIONS
// ============================================
export const Radius_Options = () => {
  const ShimmerSkeleton = ({ radius }: { radius: string }) => (
    <div className="w-full space-y-3">
      {[80, 60, 70].map((width, i) => (
        <div
          key={i}
          className={`h-4 ${radius} relative overflow-hidden`}
          style={{
            width: `${width}%`,
            background: 'rgba(255,255,255,0.08)',
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
              animation: 'shimmer-rad 1.5s infinite',
            }}
          />
        </div>
      ))}
      <style>{`
        @keyframes shimmer-rad {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Radius Options</h2>
        <p className="text-sm text-white/50">Corner radius for skeleton bars</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: rounded (4px)">
          <ShimmerSkeleton radius="rounded" />
        </CardWrapper>

        <CardWrapper label="B: rounded-md (6px)">
          <ShimmerSkeleton radius="rounded-md" />
        </CardWrapper>

        <CardWrapper label="C: rounded-lg (8px)">
          <ShimmerSkeleton radius="rounded-lg" />
        </CardWrapper>

        <CardWrapper label="D: rounded-full (pill)">
          <ShimmerSkeleton radius="rounded-full" />
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// COMPOSITIONS
// ============================================
export const Compositions = () => {
  const shimmerStyle = `
    @keyframes shimmer-comp {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `;

  const ShimmerBar = ({ width, height = 16 }: { width: string; height?: number }) => (
    <div
      className="rounded relative overflow-hidden"
      style={{
        width,
        height,
        background: 'rgba(255,255,255,0.08)',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
          animation: 'shimmer-comp 1.5s infinite',
        }}
      />
    </div>
  );

  const ShimmerCircle = ({ size }: { size: number }) => (
    <div
      className="rounded-lg relative overflow-hidden flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: 'rgba(255,255,255,0.08)',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
          animation: 'shimmer-comp 1.5s infinite',
        }}
      />
    </div>
  );

  return (
    <div className="space-y-8 p-4">
      <style>{shimmerStyle}</style>
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Skeleton Compositions</h2>
        <p className="text-sm text-white/50">Common loading patterns</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="List Item">
          <div className="w-full flex items-center gap-3">
            <ShimmerCircle size={40} />
            <div className="flex-1 space-y-2">
              <ShimmerBar width="60%" height={14} />
              <ShimmerBar width="40%" height={12} />
            </div>
          </div>
        </CardWrapper>

        <CardWrapper label="Chat Message">
          <div className="w-full flex gap-2">
            <ShimmerCircle size={32} />
            <div className="space-y-1.5">
              <div
                className="rounded-xl relative overflow-hidden"
                style={{
                  width: 180,
                  height: 48,
                  background: 'rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                    animation: 'shimmer-comp 1.5s infinite',
                  }}
                />
              </div>
              <ShimmerBar width="60px" height={10} />
            </div>
          </div>
        </CardWrapper>

        <CardWrapper label="Card">
          <div className="w-full space-y-3">
            <div
              className="rounded-lg relative overflow-hidden"
              style={{
                width: '100%',
                height: 100,
                background: 'rgba(255,255,255,0.08)',
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                  animation: 'shimmer-comp 1.5s infinite',
                }}
              />
            </div>
            <ShimmerBar width="70%" height={16} />
            <ShimmerBar width="50%" height={12} />
          </div>
        </CardWrapper>

        <CardWrapper label="Profile Header">
          <div className="w-full flex flex-col items-center gap-3">
            <ShimmerCircle size={64} />
            <ShimmerBar width="100px" height={16} />
            <ShimmerBar width="140px" height={12} />
          </div>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// RECOMMENDATIONS
// ============================================
export const Recommendations = () => {
  const shimmerStyle = `
    @keyframes shimmer-rec {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `;

  return (
    <div className="space-y-8 p-4">
      <style>{shimmerStyle}</style>
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Recommendations</h2>
        <p className="text-sm text-white/50">My picks for skeleton</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="ANIMATION: B - Shimmer">
          <div className="w-full space-y-3">
            {[80, 60].map((width, i) => (
              <div
                key={i}
                className="h-4 rounded relative overflow-hidden"
                style={{
                  width: `${width}%`,
                  background: 'rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                    animation: 'shimmer-rec 1.5s infinite',
                  }}
                />
              </div>
            ))}
          </div>
        </CardWrapper>

        <CardWrapper label="SPEED: B - Normal (1.5s)">
          <div className="w-full space-y-3">
            {[80, 60].map((width, i) => (
              <div
                key={i}
                className="h-4 rounded relative overflow-hidden"
                style={{
                  width: `${width}%`,
                  background: 'rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                    animation: 'shimmer-rec 1.5s infinite',
                  }}
                />
              </div>
            ))}
          </div>
        </CardWrapper>

        <CardWrapper label="INTENSITY: B - Normal (8%/12%)">
          <div className="w-full space-y-3">
            {[80, 60].map((width, i) => (
              <div
                key={i}
                className="h-4 rounded relative overflow-hidden"
                style={{
                  width: `${width}%`,
                  background: 'rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
                    animation: 'shimmer-rec 1.5s infinite',
                  }}
                />
              </div>
            ))}
          </div>
        </CardWrapper>

        <CardWrapper label="RADIUS: A - rounded (4px)">
          <div className="w-full space-y-3">
            {[80, 60].map((width, i) => (
              <div
                key={i}
                className="h-4 rounded relative overflow-hidden"
                style={{
                  width: `${width}%`,
                  background: 'rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                    animation: 'shimmer-rec 1.5s infinite',
                  }}
                />
              </div>
            ))}
          </div>
        </CardWrapper>
      </div>

      <CardWrapper label="SUMMARY">
        <div className="text-xs space-y-2 text-left w-full">
          <p className="text-amber-400">Animation: B - Shimmer (gradient sweep)</p>
          <p className="text-amber-400">Speed: B - 1.5s (not too fast, not too slow)</p>
          <p className="text-amber-400">Intensity: B - 8% base / 12% highlight</p>
          <p className="text-amber-400">Radius: A - rounded (4px) for text-like bars</p>
          <p className="text-amber-400">Shapes: rounded-lg for avatars (matches Avatar)</p>
          <div className="border-t border-white/10 pt-2 mt-2">
            <p className="text-white/50">Result: Premium shimmer loading that matches the dark glass aesthetic</p>
          </div>
        </div>
      </CardWrapper>
    </div>
  );
};
