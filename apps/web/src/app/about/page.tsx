'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const clashDisplay = "font-[family-name:'Clash_Display',var(--hive-font-display)]";

const CONTRIBUTORS = [
  { name: 'Brunda', role: 'Development', linkedin: 'https://www.linkedin.com/in/brunda-venkatesh/' },
  { name: 'Daniel', role: 'Marketing', linkedin: 'https://www.linkedin.com/in/danielohebshalom/' },
  { name: 'Gavin', role: 'Marketing', linkedin: 'https://www.linkedin.com/in/malecgavin/' },
  { name: 'Mirka', role: 'Marketing', linkedin: 'https://www.linkedin.com/in/mirka-arevalo/' },
  { name: 'Noah', role: 'Operations', linkedin: 'https://www.linkedin.com/in/noahowsh/' },
  { name: 'Rachana', role: 'Development', linkedin: 'https://www.linkedin.com/in/rachana-ramesh-0414a6164/' },
  { name: 'Samarth', role: 'Marketing', linkedin: 'https://www.linkedin.com/in/samarth-yaralakatte-mallappa/' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Minimal header */}
      <header className="px-6 py-6">
        <div className="max-w-[640px] mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" aria-label="HIVE home">
            <span className="h-5 w-5 rounded-full bg-[#FFD700]" aria-hidden />
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-white/50">
              HIVE
            </span>
          </Link>
          <Link href="/" className="text-[13px] text-white/50 hover:text-white transition-colors">
            Back
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[640px] mx-auto px-6">
        {/* Hero */}
        <section className="pt-16 pb-[120px]">
          <h1 className={`${clashDisplay} text-[clamp(36px,8vw,48px)] font-semibold leading-[1.05] text-white mb-6`}>
            We stopped waiting
            <br />
            <span className="text-white/50">for institutions.</span>
          </h1>
          <p className="text-base text-white/50 leading-relaxed max-w-md">
            So we built the infrastructure students were missing.
          </p>
        </section>

        {/* What HIVE Is */}
        <section className="pb-[120px]">
          <h2 className={`${clashDisplay} text-2xl font-semibold text-white mb-8`}>
            What HIVE is
          </h2>
          <div className="space-y-6 text-base leading-relaxed text-white">
            <p>
              HIVE is a permanent operating layer for student communities. Each organization gets
              a Space: a durable environment with chat, events, tools, and membership that
              doesn&apos;t vanish when officers graduate.
            </p>
            <p>
              Universities have hundreds of student groups, but no shared infrastructure. Information
              is scattered across GroupMe threads that die, Drive folders no one inherits, and legacy
              platforms built for administration — not students.
            </p>
            <p>
              The result isn&apos;t a lack of activity. It&apos;s a lack of continuity. Every year,
              leadership resets. Knowledge disappears. Groups rebuild from scratch.
            </p>
          </div>
        </section>

        {/* Pull quote */}
        <section className="pb-[120px]">
          <p className={`${clashDisplay} text-[24px] font-medium leading-snug text-[#FFD700]`}>
            &ldquo;The feed isn&apos;t the product. The Space is. Legibility, memory, and ownership are.&rdquo;
          </p>
        </section>

        {/* Why */}
        <section className="pb-[120px]">
          <h2 className={`${clashDisplay} text-2xl font-semibold text-white mb-8`}>
            Why it took two years
          </h2>
          <div className="space-y-6 text-base leading-relaxed text-white">
            <p>
              I didn&apos;t start this alone. Two years ago I had a team. Good people who saw
              the same problem. We&apos;d sit in O&apos;Brian basement trying to figure this out.
            </p>
            <p>
              Honestly? We spent more time planning than building. Eventually the team moved on,
              but the vision stuck. So I built it myself. Not because I thought I could do it
              better — but because someone had to ship something.
            </p>
            <p>
              Two years of nights and weekends. Stretches where I didn&apos;t touch it for weeks.
              Other times up until 3am. The thing is finally at a point where other people can use it.
            </p>
            <p className={`${clashDisplay} text-[20px] font-medium text-[#FFD700]`}>
              If you use it, tell me what sucks. I need the feedback loop.
            </p>
            <p className="text-white/30 text-sm mt-4">— Jacob</p>
          </div>
        </section>

        {/* What's In It */}
        <section className="pb-[120px]">
          <h2 className={`${clashDisplay} text-2xl font-semibold text-white mb-8`}>
            What&apos;s in the app
          </h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-[15px] font-medium text-white mb-2">Spaces</h3>
              <p className="text-base text-white leading-relaxed">
                Every org gets a permanent space with chat, events, tools, and membership. When
                leadership graduates, the Space stays. Knowledge compounds.
              </p>
            </div>
            <div>
              <h3 className="text-[15px] font-medium text-white mb-2">Tool Builder</h3>
              <p className="text-base text-white leading-relaxed">
                Describe what you need in plain language. The AI scaffolds an application.
                Polls, sign-ups, countdowns, RSVP forms — deploy directly to your Space.
              </p>
            </div>
            <div>
              <h3 className="text-[15px] font-medium text-white mb-2">Profile</h3>
              <p className="text-base text-white leading-relaxed">
                A verifiable record of actual work: events organized, tools built,
                communities led. Proof of work, not self-reported bullet points.
              </p>
            </div>
          </div>
        </section>

        {/* Contributors */}
        <section className="pb-[120px]">
          <h2 className="text-[11px] uppercase tracking-[0.15em] font-mono text-white/50 mb-6">
            Contributors
          </h2>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {CONTRIBUTORS.map((person) => (
              <a
                key={person.name}
                href={person.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14px] text-white/50 hover:text-white transition-colors"
              >
                {person.name}
              </a>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="pb-32 text-center">
          <h2 className={`${clashDisplay} text-[clamp(28px,6vw,40px)] font-semibold text-white mb-6`}>
            Your club is already here.
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/enter"
              className="px-7 py-3.5 bg-[#FFD700] text-black text-[15px] font-medium rounded-full hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/discover"
              className="px-7 py-3.5 bg-[#1A1A1A] text-white text-[15px] font-medium rounded-full border border-white/[0.1] hover:bg-white/[0.06] transition-colors"
            >
              Browse spaces
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-white/[0.06]">
        <div className="max-w-[640px] mx-auto flex items-center justify-between text-[12px] text-white/30">
          <span>&copy; {new Date().getFullYear()} HIVE</span>
          <div className="flex gap-4">
            <Link href="/legal/terms" className="hover:text-white/50 transition-colors">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-white/50 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
