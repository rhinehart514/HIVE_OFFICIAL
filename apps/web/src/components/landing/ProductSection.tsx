'use client';

const clashDisplay = "font-[family-name:'Clash_Display',var(--hive-font-display)]";

const features = [
  {
    label: 'Discover',
    title: 'Find your people',
    description:
      'Search the live UB directory. Every registered org already has a space — just claim it.',
    span: 'lg:col-span-2',
  },
  {
    label: 'Create',
    title: 'Build tools in seconds',
    description:
      'Polls, sign-ups, countdowns, RSVP forms. Describe what you need and deploy it instantly.',
    span: 'lg:col-span-1',
  },
  {
    label: 'Spaces',
    title: 'Run everything from one place',
    description:
      'Chat, events, tools, and members — all in your space. No more GroupMe + Google Forms + Remind.',
    span: 'lg:col-span-3',
  },
] as const;

export function ProductSection() {
  return (
    <section className="py-20 md:py-28 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section label */}
        <div className="flex items-center gap-2 mb-12">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-white/50">
            HOW IT WORKS
          </span>
        </div>

        {/* Screenshot cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {features.map((feature) => (
            <div
              key={feature.label}
              className={`rounded-2xl bg-[#0A0A0A] border border-white/[0.08] p-8 ${feature.span}`}
            >
              <span className="text-[11px] uppercase tracking-[0.15em] font-mono text-[#FFD700] mb-3 block">
                {feature.label}
              </span>
              <h3 className={`${clashDisplay} text-2xl lg:text-3xl font-semibold text-white mb-3`}>
                {feature.title}
              </h3>
              <p className="text-[15px] text-white/50 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
