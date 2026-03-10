'use client';

import { MyAppsSection } from './my-apps-section';

const EXAMPLE_PROMPTS = [
  'Best dining hall on campus?',
  'Who\'s coming to the pregame tonight?',
  'Rate the professors — tournament style',
  'Sign up for the bake sale',
];

export function IdleExamples({
  onSubmit,
  showMyApps,
}: {
  onSubmit: (prompt: string) => void;
  showMyApps: boolean;
}) {
  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs text-white/50">People are making:</p>
      <div className="flex flex-wrap gap-2">
        {EXAMPLE_PROMPTS.map((example) => (
          <button
            key={example}
            onClick={() => onSubmit(example)}
            className="px-3 py-1.5 rounded-full text-xs text-white/50 bg-white/[0.06]
              border border-white/[0.10] hover:bg-white/[0.08] hover:text-white/70
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
