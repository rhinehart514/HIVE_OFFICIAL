'use client';

import { MyAppsSection } from './my-apps-section';

function getExamplePrompts(): string[] {
  const hour = new Date().getHours();
  const base = [
    'Best dining hall at UB?',
    'Rate the professors — bracket style',
    'Vote on next meeting topic',
  ];
  if (hour >= 5 && hour < 12) {
    return [...base, 'Sign up for today\'s study group', 'Where should we get lunch?'];
  }
  if (hour >= 17 && hour < 22) {
    return [...base, 'Who\'s coming to the pregame?', 'RSVP for tonight\'s event'];
  }
  if (hour >= 22 || hour < 5) {
    return [...base, 'Best late-night food near campus?', 'Who\'s still studying?'];
  }
  return [...base, 'Sign up for our fundraiser', 'Who\'s coming to the pregame?'];
}

export function IdleExamples({
  onSubmit,
  showMyApps,
}: {
  onSubmit: (prompt: string) => void;
  showMyApps: boolean;
}) {
  const examples = getExamplePrompts();

  return (
    <div className="mt-4 space-y-2">
      <p className="font-mono text-[11px] uppercase tracking-wider text-white/30">Try one</p>
      <div className="flex flex-wrap gap-2">
        {examples.map((example) => (
          <button
            key={example}
            onClick={() => onSubmit(example)}
            className="px-3 py-1.5 rounded-full text-xs text-white/50 bg-white/[0.05]
              border border-white/[0.05] hover:bg-white/[0.10] hover:text-white/70
              transition-colors duration-100"
          >
            {example}
          </button>
        ))}
      </div>
      {showMyApps && <MyAppsSection />}
    </div>
  );
}
