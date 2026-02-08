"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowTopRightOnSquareIcon,
  CodeBracketIcon,
  UsersIcon,
  StarIcon,
  BookOpenIcon,
  WrenchScrewdriverIcon,
  SparklesIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

// Inline components for this page
function Card({
  children,
  className = "",
  onClick,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  [key: string]: unknown;
}) {
  return (
    <div
      className={`border rounded-xl ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

function Button({
  children,
  variant = "default",
  className = "",
  ...props
}: {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "ghost";
  className?: string;
  [key: string]: unknown;
}) {
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center";
  const variantStyles = {
    default: "bg-gold-500 text-black hover:bg-gold-500/90",
    secondary: "border border-white/20 text-white hover:bg-white/10",
    ghost: "text-white/60 hover:text-white hover:bg-overlay-subtle"
  };

  return (
    <button className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export default function ResourcesPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-foundation-gray-1000">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-foundation-gray-1000">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 text-sm text-white/50 mb-4">
            <BookOpenIcon className="h-4 w-4" />
            <span>Resources</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Get Started with HIVE</h1>
          <p className="text-white/60">Everything you need to build tools and grow your space</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Card
            className="p-5 bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.10] transition-all cursor-pointer group"
            onClick={() => router.push('/lab/new')}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center group-hover:opacity-80 transition-transform">
                <WrenchScrewdriverIcon className="h-5 w-5 text-gold-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white group-hover:text-gold-500 transition-colors">Create a Tool</h3>
                <p className="text-xs text-white/50">Build with HiveLab</p>
              </div>
            </div>
          </Card>

          <Card
            className="p-5 bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.10] transition-all cursor-pointer group"
            onClick={() => router.push('/spaces')}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center group-hover:opacity-80 transition-transform">
                <UsersIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white group-hover:text-gold-500 transition-colors">Find Spaces</h3>
                <p className="text-xs text-white/50">Join your community</p>
              </div>
            </div>
          </Card>

          <Card
            className="p-5 bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.10] transition-all cursor-pointer group"
            onClick={() => router.push('/lab')}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center group-hover:opacity-80 transition-transform">
                <SparklesIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white group-hover:text-gold-500 transition-colors">My Tools</h3>
                <p className="text-xs text-white/50">Manage your creations</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Getting Started Section */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <StarIcon className="h-5 w-5 text-gold-500" />
            Getting Started
          </h2>
          <div className="space-y-3">
            <Card
              className="p-5 bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.10] transition-all cursor-pointer group"
              onClick={() => router.push('/lab/new')}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1 group-hover:text-gold-500 transition-colors">
                    Build Your First Tool
                  </h3>
                  <p className="text-sm text-white/50 mb-3">
                    Use HiveLab's visual builder to create interactive tools for your space. No coding required.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-white/40">
                    <span className="flex items-center gap-1">
                      <RocketLaunchIcon className="h-3 w-3" />
                      5 min to create
                    </span>
                    <span>27 elements available</span>
                  </div>
                </div>
                <ArrowTopRightOnSquareIcon className="h-4 w-4 text-white/30 group-hover:text-gold-500 flex-shrink-0 ml-4 transition-colors" />
              </div>
            </Card>

            <Card
              className="p-5 bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.10] transition-all cursor-pointer group"
              onClick={() => router.push('/spaces/new')}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1 group-hover:text-gold-500 transition-colors">
                    Start a Space
                  </h3>
                  <p className="text-sm text-white/50 mb-3">
                    Create a community hub for your club, organization, or interest group.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-white/40">
                    <span className="flex items-center gap-1">
                      <UsersIcon className="h-3 w-3" />
                      Real-time chat
                    </span>
                    <span>Event management</span>
                    <span>Custom tools</span>
                  </div>
                </div>
                <ArrowTopRightOnSquareIcon className="h-4 w-4 text-white/30 group-hover:text-gold-500 flex-shrink-0 ml-4 transition-colors" />
              </div>
            </Card>

            <Card
              className="p-5 bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.10] transition-all cursor-pointer group"
              onClick={() => router.push('/spaces/claim')}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1 group-hover:text-gold-500 transition-colors">
                    Claim Your Organization
                  </h3>
                  <p className="text-sm text-white/50 mb-3">
                    Already have a club on campus? Claim it and unlock leader features.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-white/40">
                    <span>400+ UB organizations available</span>
                  </div>
                </div>
                <ArrowTopRightOnSquareIcon className="h-4 w-4 text-white/30 group-hover:text-gold-500 flex-shrink-0 ml-4 transition-colors" />
              </div>
            </Card>
          </div>
        </div>

        {/* HiveLab Section */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <CodeBracketIcon className="h-5 w-5" />
            HiveLab Elements
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { name: "Text Input", tier: "Universal" },
              { name: "Number Slider", tier: "Universal" },
              { name: "Dropdown", tier: "Universal" },
              { name: "Checklist", tier: "Universal" },
              { name: "Date Picker", tier: "Universal" },
              { name: "File Upload", tier: "Universal" },
              { name: "Calculator", tier: "Universal" },
              { name: "Timer", tier: "Universal" },
              { name: "Progress Bar", tier: "Universal" },
              { name: "Member Picker", tier: "Connected" },
              { name: "Event Embed", tier: "Connected" },
              { name: "Poll", tier: "Space" },
            ].map((element) => (
              <Card
                key={element.name}
                className="p-4 bg-white/[0.02] border-white/[0.06]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">{element.name}</span>
                  <span className={`text-label-xs px-2 py-0.5 rounded-full ${
                    element.tier === "Universal" ? "bg-white/[0.06] text-white/50" :
                    element.tier === "Connected" ? "bg-blue-500/20 text-blue-400" :
                    "bg-gold-500/20 text-gold-500"
                  }`}>
                    {element.tier}
                  </span>
                </div>
              </Card>
            ))}
          </div>
          <p className="text-xs text-white/40 mt-4 text-center">
            27 total elements across 3 tiers. <span className="text-white/60 cursor-pointer hover:text-gold-500" onClick={() => router.push('/lab/new')}>Explore all in HiveLab →</span>
          </p>
        </div>

        {/* Help Section */}
        <Card className="p-8 bg-gradient-to-br from-gold-500/10 via-gold-500/5 to-transparent border-gold-500/20">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-2">Need help?</h2>
            <p className="text-white/50 mb-6 max-w-md mx-auto">
              We're here to help you build something great. Reach out anytime.
            </p>
            <Button
              onClick={() => window.location.href = 'mailto:hello@hive.college'}
            >
              Contact Us
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
