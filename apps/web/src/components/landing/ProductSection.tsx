'use client';

const clashDisplay = "font-[family-name:'Clash_Display',var(--hive-font-display)]";

const sections = [
  {
    label: 'SPACES',
    title: 'One place for everything.',
    body: 'Chat, events, tools, members. Not another group chat.',
    reverse: false,
  },
  {
    label: 'CREATE',
    title: 'Describe it. HIVE builds it.',
    body: 'Polls, signups, countdowns. No code. No Google Forms.',
    reverse: true,
  },
  {
    label: 'EVENTS',
    title: "What's happening tonight.",
    body: 'Every campus event. Personalized to you.',
    reverse: false,
  },
] as const;

export function ProductSection() {
  return (
    <section className="bg-black px-6 py-20 md:py-32">
      <div className="mx-auto flex max-w-7xl justify-center">
        <div className="flex flex-wrap items-center justify-center gap-8">
          <span className="text-[13px] font-mono text-white/30">698 organizations</span>
          <span className="text-white/10">·</span>
          <span className="text-[13px] font-mono text-white/30">2,467 events</span>
          <span className="text-white/10">·</span>
          <span className="text-[13px] font-mono text-white/30">35 creation tools</span>
        </div>
      </div>

      <div className="mt-20 space-y-20 md:mt-24 md:space-y-32">
        {sections.map((section) => (
          <div
            key={section.label}
            className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2"
          >
            <div className={`space-y-5 ${section.reverse ? 'lg:order-2' : ''}`}>
              <span className="block font-mono text-[11px] uppercase tracking-[0.2em] text-[#FFD700]">
                {section.label}
              </span>
              <h3 className={`${clashDisplay} text-4xl font-semibold tracking-tight text-white`}>
                {section.title}
              </h3>
              <p className="max-w-md text-base leading-relaxed text-white/50">
                {section.body}
              </p>
            </div>

            <div
              className={`h-[300px] rounded-2xl border border-white/[0.06] bg-white/[0.02] ${section.reverse ? 'lg:order-1' : ''}`}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
