/**
 * ProfileStat - Animated stat display
 */

import { AnimatedNumber, numberSpringPresets } from '@hive/ui';

interface ProfileStatProps {
  label: string;
  value: number;
  accent?: boolean;
  delay?: number;
}

export function ProfileStat({
  label,
  value,
  accent = false,
  delay = 0,
}: ProfileStatProps) {
  return (
    <div className="text-center px-4 sm:px-6">
      <AnimatedNumber
        value={value}
        animateOnView
        springOptions={{
          ...numberSpringPresets.standard,
          duration: 1500 + delay * 200,
        }}
        className={`text-2xl font-semibold ${accent ? 'text-[var(--life-gold)]' : 'text-white'}`}
      />
      <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mt-1">
        {label}
      </div>
    </div>
  );
}
