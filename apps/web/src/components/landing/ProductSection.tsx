'use client';

const clashDisplay = "font-[family-name:'Clash_Display',var(--font-clash)]";

const sections = [
  {
    label: 'SPACES',
    title: 'One place for everything.',
    body: 'Chat, events, creations, members. Not another group chat.',
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

function SpacesMockup() {
  const channels = [
    { name: 'general', unread: 3 },
    { name: 'announcements', unread: 0 },
    { name: 'photo-walks', unread: 1 },
    { name: 'gear-talk', unread: 0 },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 pb-3 border-b border-white/[0.06]">
        <div className="w-9 h-9 rounded-[10px] bg-[#FFD700]/20 flex items-center justify-center text-sm">📷</div>
        <div>
          <div className="text-[13px] font-semibold text-white">UB Photography Club</div>
          <div className="text-[10px] text-white/30 font-sans">47 members · 4 channels</div>
        </div>
      </div>
      <div className="space-y-1">
        {channels.map((ch) => (
          <div key={ch.name} className="flex items-center gap-2 rounded-lg px-3 py-2">
            <span className="text-[11px] text-white/30">#</span>
            <span className="text-[12px] text-white/50 flex-1">{ch.name}</span>
            {ch.unread > 0 && (
              <span className="min-w-[18px] text-center rounded-full bg-[#FFD700] px-1.5 py-0.5 text-[9px] font-semibold text-black">
                {ch.unread}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
        <div className="flex -space-x-1.5">
          {['bg-blue-400/40', 'bg-emerald-400/40', 'bg-purple-400/40'].map((bg, i) => (
            <div key={i} className={`h-5 w-5 rounded-full border border-[#080808] ${bg}`} />
          ))}
        </div>
        <span className="text-[10px] text-white/30 font-sans">12 online</span>
      </div>
    </div>
  );
}

function CreateMockup() {
  const tools = [
    { icon: '📊', name: 'Poll', desc: 'Vote on anything' },
    { icon: '📋', name: 'Signup Sheet', desc: 'Collect RSVPs' },
    { icon: '⏳', name: 'Countdown', desc: 'Track deadlines' },
    { icon: '🏆', name: 'Leaderboard', desc: 'Rank members' },
    { icon: '📝', name: 'Form', desc: 'Collect responses' },
    { icon: '📅', name: 'Schedule', desc: 'Plan meetings' },
  ];
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-sans text-white/30 uppercase tracking-wider">Describe what you need</div>
      <div className="rounded-[12px] border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <span className="text-[12px] text-white/40">&quot;A poll for our next meeting topic&quot;</span>
        <span className="ml-1 inline-block w-[2px] h-3 bg-[#FFD700] animate-pulse" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {tools.map((t) => (
          <div key={t.name} className="rounded-[12px] border border-white/[0.06] bg-white/[0.02] p-3 text-center">
            <div className="text-base mb-1">{t.icon}</div>
            <div className="text-[11px] font-medium text-white/70">{t.name}</div>
            <div className="text-[9px] text-white/30 mt-0.5">{t.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventsMockup() {
  const events = [
    { name: 'Spring Concert', org: 'SA Events', time: 'Tonight · 8 PM', going: 234 },
    { name: 'Hackathon Kickoff', org: 'UB ACM', time: 'Tomorrow · 6 PM', going: 89 },
    { name: 'Art Gallery Opening', org: 'CFA', time: 'Fri · 5 PM', going: 45 },
  ];
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-sans text-white/30 uppercase tracking-wider">Happening on campus</div>
      {events.map((ev) => (
        <div key={ev.name} className="flex items-center gap-3 rounded-[12px] border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="w-10 h-10 rounded-[10px] bg-white/[0.04] flex items-center justify-center text-sm">🎪</div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium text-white/80 truncate">{ev.name}</div>
            <div className="text-[10px] text-white/30">{ev.org} · {ev.time}</div>
          </div>
          <div className="text-[10px] font-sans text-white/30 shrink-0">{ev.going} going</div>
        </div>
      ))}
    </div>
  );
}

export function ProductSection() {
  return (
    <section className="bg-black px-6 py-20 md:py-32">
      <div className="mx-auto flex max-w-7xl justify-center">
        <div className="flex flex-wrap items-center justify-center gap-8">
          <span className="text-[13px] font-sans text-white/30">Hundreds of student orgs</span>
          <span className="text-white/10">·</span>
          <span className="text-[13px] font-sans text-white/30">Thousands of campus events</span>
          <span className="text-white/10">·</span>
          <span className="text-[13px] font-sans text-white/30">Dozens of creations</span>
        </div>
      </div>

      <div className="mt-20 space-y-20 md:mt-24 md:space-y-32">
        {sections.map((section) => (
          <div
            key={section.label}
            className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2"
          >
            <div className={`space-y-5 ${section.reverse ? 'lg:order-2' : ''}`}>
              <span className="block font-sans text-[11px] uppercase tracking-[0.2em] text-[#FFD700]">
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
              className={`rounded-[16px] border border-white/[0.06] bg-[#080808] p-5 ${section.reverse ? 'lg:order-1' : ''}`}
            >
              {section.label === 'SPACES' && <SpacesMockup />}
              {section.label === 'CREATE' && <CreateMockup />}
              {section.label === 'EVENTS' && <EventsMockup />}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
