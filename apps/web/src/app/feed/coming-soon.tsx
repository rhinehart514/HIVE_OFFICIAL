'use client';

/**
 * Feed Coming Soon - Shown when feed feature flag is disabled
 *
 * Explains the Activity Stream is in development and provides
 * alternative navigation rather than silently redirecting.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@hive/ui';
import {
  SparklesIcon,
  BellIcon,
  CalendarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

const features = [
  {
    icon: <SparklesIcon className="h-5 w-5" />,
    title: 'AI-Ranked Activity',
    description: 'Personalized content from your spaces',
  },
  {
    icon: <CalendarIcon className="h-5 w-5" />,
    title: 'Event Updates',
    description: 'Never miss what\'s happening on campus',
  },
  {
    icon: <BellIcon className="h-5 w-5" />,
    title: 'Tool Outputs',
    description: 'See what builders are creating',
  },
];

export default function FeedComingSoon() {
  return (
    <div className="min-h-screen bg-ground flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-life-gold/10 flex items-center justify-center">
          <SparklesIcon className="h-8 w-8 text-life-gold" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-semibold text-white mb-2">
          Activity Stream
        </h1>
        <p className="text-white/50 mb-8">
          Coming soon to HIVE
        </p>

        {/* Feature preview */}
        <div className="space-y-3 mb-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center text-life-gold flex-shrink-0">
                {feature.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{feature.title}</p>
                <p className="text-xs text-white/50">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button asChild className="w-full bg-life-gold text-ground hover:bg-life-gold/90">
            <Link href="/spaces">
              <UsersIcon className="h-4 w-4 mr-2" />
              Explore Spaces
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/notifications">
              <BellIcon className="h-4 w-4 mr-2" />
              View Notifications
            </Link>
          </Button>
        </div>

        {/* Footer note */}
        <p className="text-xs text-white/30 mt-8">
          The Activity Stream aggregates events, announcements, and tool outputs from your spaces into a personalized feed.
        </p>
      </motion.div>
    </div>
  );
}
