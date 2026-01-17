/**
 * ProfileInterests - Display user interests as tags
 */

import { motion, type Variants } from 'framer-motion';

interface ProfileInterestsProps {
  interests: string[];
  variants?: Variants;
}

export function ProfileInterests({ interests, variants }: ProfileInterestsProps) {
  if (!interests || interests.length === 0) return null;

  return (
    <motion.div variants={variants} className="mt-6">
      {/* Mobile horizontal scroll */}
      <div className="sm:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex gap-2 pb-2">
          {interests.slice(0, 6).map((tag) => (
            <span
              key={tag}
              className="flex-shrink-0 px-3 py-1 rounded-full text-sm text-[var(--text-secondary)] bg-[var(--bg-surface)] border border-[var(--border)]"
            >
              {tag}
            </span>
          ))}
          {interests.length > 6 && (
            <span className="flex-shrink-0 px-3 py-1 text-sm text-[var(--text-muted)]">
              +{interests.length - 6}
            </span>
          )}
        </div>
      </div>

      {/* Desktop wrap */}
      <div className="hidden sm:flex flex-wrap gap-2">
        {interests.slice(0, 8).map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 rounded-full text-sm text-[var(--text-secondary)] bg-[var(--bg-surface)] border border-[var(--border)]"
          >
            {tag}
          </span>
        ))}
        {interests.length > 8 && (
          <span className="px-3 py-1 text-sm text-[var(--text-muted)]">
            +{interests.length - 8} more
          </span>
        )}
      </div>
    </motion.div>
  );
}
