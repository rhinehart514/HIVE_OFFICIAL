import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for HIVE — the rules, but explained like a human.',
};

export const dynamic = 'force-dynamic';

const SECTIONS = [
  { id: 'deal', title: 'The Deal' },
  { id: 'what-hive-is', title: 'What HIVE Is' },
  { id: 'who-can-use', title: 'Who Can Use This' },
  { id: 'your-stuff', title: 'Your Stuff' },
  { id: 'dont-be-an-ass', title: "Don't Be an Ass" },
  { id: 'tools', title: 'HiveLab Tools' },
  { id: 'privacy', title: 'Privacy' },
  { id: 'kicking-you-out', title: 'Kicking You Out' },
  { id: 'if-things-break', title: 'If Things Break' },
  { id: 'changes', title: 'Changes' },
  { id: 'contact', title: 'Contact' },
];

export default function TermsPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-6">
        {/* Header */}
        <header className="mb-16">
          <p className="mb-3 text-[13px] font-medium uppercase tracking-wider text-[var(--color-gold)]/70">
            Legal
          </p>
          <h1 className="mb-4 text-[40px] font-semibold leading-[1.1] tracking-tight text-white md:text-[48px]">
            Terms of Service
          </h1>
          <p className="text-[15px] leading-relaxed text-white/50">
            Effective January 15, 2025 · Version 1.0
          </p>
        </header>

        {/* Summary card */}
        <div className="mb-16 rounded-2xl border border-[var(--color-gold)]/10 bg-[var(--color-gold)]/[0.03] p-6">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-gold)]/60">
            The short version
          </p>
          <p className="text-[15px] leading-relaxed text-white/70">
            Be a decent human. Don't break things on purpose. Your stuff is yours. I'm building this for students, not lawyers. But lawyers exist, so here's the real terms below.
          </p>
        </div>

        {/* Table of Contents */}
        <nav className="mb-16 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-white/30">
            Contents
          </p>
          <ol className="grid gap-2 text-[14px] md:grid-cols-2">
            {SECTIONS.map((section, i) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="flex items-baseline gap-3 text-white/50 transition-colors hover:text-white"
                >
                  <span className="text-[12px] text-white/20">{String(i + 1).padStart(2, '0')}</span>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Content */}
        <article className="space-y-12">
          <Section id="deal" number="01" title="The Deal">
            <p>
              By using HIVE, you're agreeing to these terms. I know you're not going to
              read all of this — nobody does — but I wrote it in plain English so you
              actually could if you wanted to.
            </p>
            <p>
              If you disagree with something here, you shouldn't use HIVE. That's not
              me being a jerk — that's just how legal agreements work.
            </p>
          </Section>

          <Section id="what-hive-is" number="02" title="What HIVE Is">
            <p>
              HIVE is a platform for college students. Here's what you get:
            </p>
            <ul>
              <li><strong>Spaces</strong> — Your orgs, clubs, and communities. You run them, not me.</li>
              <li><strong>Feed</strong> — What's happening on campus. No algorithm deciding what you see.</li>
              <li><strong>Profiles</strong> — Your identity on HIVE. Keep it real or keep it anonymous — your call.</li>
              <li><strong>HiveLab</strong> — Build tools for your campus. Polls, forms, whatever you need.</li>
            </ul>
            <p>
              Things will change. I'm actively building this. New features will show up,
              old ones might get better. I'll try to give you a heads up when big changes
              happen.
            </p>
          </Section>

          <Section id="who-can-use" number="03" title="Who Can Use This">
            <p>You need:</p>
            <ul>
              <li>A .edu email address (that's how I verify you're a student)</li>
              <li>To be at least 13 years old (COPPA rules, not mine)</li>
              <li>To not lie about who you are during signup</li>
            </ul>
            <p>
              Your account is yours. If someone else uses it and does something dumb,
              that's on you. Keep your login secure.
            </p>
          </Section>

          <Section id="your-stuff" number="04" title="Your Stuff">
            <p>
              <strong>Everything you create on HIVE is yours.</strong> Your posts, your
              events, your Tools, your memes — all yours.
            </p>
            <p>
              But here's the thing: for HIVE to work, I need to be able to show your
              content to other users. So when you post something, you're giving me
              permission to display it on the platform. That's it. I'm not going to
              take your content and sell it or use it for ads. It just needs to show
              up in the app.
            </p>
            <p>
              Don't post stuff that isn't yours. Don't upload copyrighted content you
              don't have rights to. Common sense.
            </p>
          </Section>

          <Section id="dont-be-an-ass" number="05" title="Don't Be an Ass">
            <p>
              HIVE is for students to build together. That only works if people aren't
              being terrible to each other.
            </p>
            <p>Things that will get you removed:</p>
            <ul>
              <li>Harassment, bullying, hate speech (zero tolerance)</li>
              <li>Spam or scams</li>
              <li>Pretending to be someone you're not</li>
              <li>Anything illegal</li>
              <li>Trying to break the platform</li>
            </ul>
            <p>
              Space leaders moderate their own Spaces. They're the first line. If
              something gets past them and it's bad, I'll handle it. But I'd rather
              Space leaders handle their own communities.
            </p>
          </Section>

          <Section id="tools" number="06" title="HiveLab Tools">
            <p>
              You can build Tools on HIVE — interactive things for your campus. Cool.
              But don't:
            </p>
            <ul>
              <li>Build anything malicious (malware, phishing, etc.)</li>
              <li>Secretly collect data from people using your Tools</li>
              <li>Make Tools that break or slow down the platform</li>
            </ul>
            <p>
              If your Tool is sketchy, I'll restrict or remove it. If it's actually
              dangerous, your whole account is gone.
            </p>
          </Section>

          <Section id="privacy" number="07" title="Privacy">
            <p>
              Short version: I'm not selling your data. I'm not showing you ads. I
              collect what I need to make HIVE work and nothing more.
            </p>
            <p>
              Read the full{' '}
              <a href="/legal/privacy" className="text-[var(--color-gold)]/80 hover:text-[var(--color-gold)]">
                Privacy Policy
              </a>{' '}
              — I wrote that one in plain English too.
            </p>
          </Section>

          <Section id="kicking-you-out" number="08" title="Kicking You Out">
            <p>
              If you violate these terms, I can suspend or delete your account. If you
              do something really bad, it'll happen immediately without warning.
            </p>
            <p>
              You can also delete your own account whenever you want. Go to settings,
              hit delete. Your data will be removed within 30 days. Some stuff might
              stick around longer if the law requires it, but that's rare.
            </p>
          </Section>

          <Section id="if-things-break" number="09" title="If Things Break">
            <p>
              I'm one person building this thing. Sometimes it will break. Sometimes
              features won't work. Sometimes the whole thing might go down.
            </p>
            <p>
              I can't promise HIVE will be perfect or always available. I can promise
              I'll fix things as fast as I can when they break.
            </p>
            <p>
              Legally: HIVE is provided "as is." If something goes wrong and you lose
              something important, I'm sorry, but I can't be liable for that. Don't
              use HIVE as your only backup for anything critical.
            </p>
          </Section>

          <Section id="changes" number="10" title="Changes">
            <p>
              These terms might change. If they change in any way that actually matters,
              I'll tell you — email, notification, something obvious. Not just a quiet
              update to this page.
            </p>
            <p>
              If you keep using HIVE after the terms change, you're agreeing to the
              new terms. If you don't like the changes, you can delete your account.
            </p>
          </Section>

          <Section id="contact" number="11" title="Contact">
            <p>
              Questions? Concerns? Think I got something wrong? Email me:{' '}
              <a
                href="mailto:hiveconnects@gmail.com"
                className="text-[var(--color-gold)]/80 hover:text-[var(--color-gold)]"
              >
                hiveconnects@gmail.com
              </a>
            </p>
            <p className="text-[14px] text-white/40">
              HIVE<br />
              Built in Buffalo, NY
            </p>
          </Section>
        </article>

        {/* Version footer */}
        <footer className="mt-20 border-t border-white/[0.06] pt-8">
          <p className="text-[12px] text-white/30">
            Version 1.0 · Effective January 15, 2025
          </p>
        </footer>
      </div>
    </div>
  );
}

function Section({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-4 flex items-baseline gap-3">
        <span className="text-[13px] font-medium text-[var(--color-gold)]/50">{number}</span>
        <h2 className="text-[20px] font-semibold text-white">{title}</h2>
      </div>
      <div className="space-y-4 text-[15px] leading-relaxed text-white/60 [&_a]:underline [&_a]:underline-offset-2 [&_li]:pl-1 [&_strong]:font-medium [&_strong]:text-white/80 [&_ul]:ml-4 [&_ul]:list-disc [&_ul]:space-y-2">
        {children}
      </div>
    </section>
  );
}
