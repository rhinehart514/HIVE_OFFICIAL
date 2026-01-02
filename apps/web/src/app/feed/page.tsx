"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button, HiveLogo } from "@hive/ui";
import { Sparkles, Users, Calendar, Zap, ArrowRight } from "lucide-react";

/**
 * Feed Coming Soon Page
 *
 * HIVE-branded placeholder that feels intentional, not broken.
 * Communicates value is coming while directing users to working features.
 *
 * Design principles:
 * - 95% grayscale, 5% gold (HIVE identity)
 * - Build anticipation without frustration
 * - Tease what Feed will be
 * - Clear CTAs to working features
 */

const COMING_SOON_FEATURES = [
  {
    icon: Users,
    title: "Activity from your spaces",
    description: "See what's happening across all communities you're part of",
  },
  {
    icon: Calendar,
    title: "Upcoming events",
    description: "Never miss what's happening on campus",
  },
  {
    icon: Zap,
    title: "Tool highlights",
    description: "Discover new tools your spaces are using",
  },
  {
    icon: Sparkles,
    title: "Personalized for you",
    description: "Content that matches your interests and engagement",
  },
];

// Honeycomb pattern for background
function HoneycombPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-[0.03]">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="honeycomb"
            width="56"
            height="100"
            patternUnits="userSpaceOnUse"
            patternTransform="scale(2)"
          >
            <path
              d="M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
            <path
              d="M28 0L28 34L0 50L0 84L28 100L56 84L56 50L28 34"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#honeycomb)" />
      </svg>
    </div>
  );
}

// Ghost card preview
function GhostCard({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="rounded-xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-sm"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-white/5 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 rounded bg-white/5 animate-pulse" />
          <div className="h-2 w-16 rounded bg-white/5 animate-pulse" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-2 w-full rounded bg-white/5 animate-pulse" />
        <div className="h-2 w-4/5 rounded bg-white/5 animate-pulse" />
        <div className="h-2 w-3/5 rounded bg-white/5 animate-pulse" />
      </div>
      <div className="mt-4 flex gap-4">
        <div className="h-6 w-16 rounded bg-white/5 animate-pulse" />
        <div className="h-6 w-16 rounded bg-white/5 animate-pulse" />
        <div className="h-6 w-16 rounded bg-white/5 animate-pulse" />
      </div>
    </motion.div>
  );
}

export default function FeedComingSoonPage() {
  return (
    <div className="relative min-h-screen bg-[#0A0A0A] overflow-hidden">
      {/* Background pattern */}
      <HoneycombPattern />

      {/* Gradient orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-500/5 via-transparent to-transparent blur-3xl" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            {/* Logo badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 mb-6">
              <HiveLogo size="sm" showIcon showText={false} />
              <span className="text-xs font-medium text-amber-500/80">Coming Soon</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Your{" "}
              <span className="relative">
                <span className="relative z-10 bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                  Feed
                </span>
                <motion.span
                  className="absolute -bottom-1 left-0 h-[2px] w-full bg-gradient-to-r from-amber-400/50 to-transparent"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
              </span>
              <br />
              is on the way
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-lg text-[#A1A1A6] leading-relaxed max-w-lg mx-auto lg:mx-0">
              We're building a personalized campus pulse that shows what matters
              across all your spaces. Posts, events, tools, and more — all in one place.
            </p>

            {/* Feature list */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {COMING_SOON_FEATURES.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  className="flex items-start gap-3 text-left"
                >
                  <div className="flex-shrink-0 rounded-lg bg-white/5 p-2">
                    <feature.icon className="h-4 w-4 text-[#A1A1A6]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{feature.title}</p>
                    <p className="text-xs text-[#818187]">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button asChild size="lg" className="gap-2">
                <Link href="/spaces">
                  Explore Spaces
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/tools/create">Build a Tool</Link>
              </Button>
            </div>
          </motion.div>

          {/* Right: Ghost preview cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            {/* Glass container */}
            <div className="relative rounded-2xl border border-white/5 bg-white/[0.01] p-6 backdrop-blur-sm">
              {/* Fake tab bar */}
              <div className="mb-6 flex gap-4 border-b border-white/5 pb-4">
                <div className="h-8 w-20 rounded-lg bg-white/5" />
                <div className="h-8 w-24 rounded-lg bg-white/[0.02]" />
                <div className="h-8 w-16 rounded-lg bg-white/[0.02]" />
              </div>

              {/* Ghost cards */}
              <div className="space-y-4">
                <GhostCard delay={0.3} />
                <GhostCard delay={0.4} />
                <GhostCard delay={0.5} />
              </div>

              {/* Overlay gradient */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
            </div>

            {/* Floating notification */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="absolute -bottom-4 -left-8 rounded-xl border border-amber-500/20 bg-[#141414] p-4 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-amber-500/10 p-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Personalized for you</p>
                  <p className="text-xs text-[#818187]">Based on your interests</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="mt-24 text-center"
        >
          <p className="text-sm text-[#818187]">
            In the meantime, your spaces are buzzing with activity.{" "}
            <Link href="/spaces" className="text-amber-500/80 hover:text-amber-500 transition-colors">
              Jump in →
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
