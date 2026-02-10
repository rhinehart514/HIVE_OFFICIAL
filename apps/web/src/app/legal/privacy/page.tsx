import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for HIVE — how we collect, use, and protect your information.',
};

export const dynamic = 'force-dynamic';

const SECTIONS = [
  { id: 'overview', title: 'Overview' },
  { id: 'collect', title: 'What We Collect' },
  { id: 'use', title: 'How We Use It' },
  { id: 'sharing', title: 'Sharing' },
  { id: 'security', title: 'Security' },
  { id: 'rights', title: 'Your Rights' },
  { id: 'retention', title: 'Retention' },
  { id: 'children', title: 'Children' },
  { id: 'changes', title: 'Changes' },
  { id: 'contact', title: 'Contact' },
];

export default function PrivacyPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-6">
        {/* Header */}
        <header className="mb-16">
          <p className="mb-3 text-body-sm font-medium uppercase tracking-wider text-[var(--color-gold)]/70">
            Legal
          </p>
          <h1 className="mb-4 text-heading-lg font-semibold leading-[1.1] tracking-tight text-white md:text-display-sm">
            Privacy Policy
          </h1>
          <p className="text-body leading-relaxed text-white/50">
            Effective January 15, 2025 · Version 1.0
          </p>
        </header>

        {/* Summary card */}
        <div className="mb-16 rounded-lg border border-[var(--color-gold)]/10 bg-[var(--color-gold)]/[0.03] p-6">
          <p className="mb-2 text-label-sm font-semibold uppercase tracking-wider text-[var(--color-gold)]/60">
            The short version
          </p>
          <p className="text-body leading-relaxed text-white/50">
            I will not sell your data. I'm not going to. There are no ads. There's no secret business model where you're the product. I built this for students, not to harvest information from them. The stuff below explains exactly what we collect and why — no legal gymnastics.
          </p>
        </div>

        {/* Table of Contents */}
        <nav className="mb-16 rounded-lg border border-white/[0.06] bg-white/[0.06] p-6">
          <p className="mb-4 text-label-sm font-semibold uppercase tracking-wider text-white/50">
            Contents
          </p>
          <ol className="grid gap-2 text-body md:grid-cols-2">
            {SECTIONS.map((section, i) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="flex items-baseline gap-3 text-white/50 transition-colors hover:text-white"
                >
                  <span className="text-label text-white/50">{String(i + 1).padStart(2, '0')}</span>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Content */}
        <article className="space-y-12">
          <Section id="overview" number="01" title="Overview">
            <p>
              This is what we do with your information. I'm going to be straightforward
              because I hate reading privacy policies that are designed to confuse you.
            </p>
            <p>
              HIVE is built on Firebase (Google Cloud). That's where your data lives.
              It's encrypted, it's secure, and I picked it because it's reliable — not
              because I wanted to hand your data to Google. They're a processor, not
              the owner. I am. And I'm telling you exactly what happens with it.
            </p>
          </Section>

          <Section id="collect" number="02" title="What We Collect">
            <p>
              <strong>Your .edu email</strong> — This is how we verify you're actually a student.
              We check the domain to figure out your school. That's it. We don't read your emails
              or access your inbox.
            </p>
            <p>
              <strong>Basic profile stuff</strong> — Name, handle, major, graduation year.
              Whatever you choose to add. Profile photo if you want one. All optional
              except the handle (we need something to call you).
            </p>
            <p>
              <strong>What you post</strong> — Messages, posts, events, whatever you create
              on HIVE. Obviously we store this — that's how the app works. Your content
              lives in your Spaces and is visible to members of those Spaces.
            </p>
            <p>
              <strong>Basic analytics</strong> — Page views, what features get used, crash reports.
              This is anonymized. I use it to figure out what's broken and what people actually
              use. I don't track you as an individual — I track patterns.
            </p>
            <p>
              <strong>What we don't collect</strong> — Your location (unless you explicitly share it
              for an event). Your contacts. Your browsing history outside HIVE. Your messages
              on other platforms. None of that.
            </p>
          </Section>

          <Section id="use" number="03" title="How We Use It">
            <p>Pretty simple:</p>
            <ul>
              <li>To make HIVE work (showing your posts, letting you join Spaces, etc.)</li>
              <li>To verify you're a student at the school you claim</li>
              <li>To send you important stuff (verification codes, security alerts)</li>
              <li>To fix bugs and improve features based on what people actually use</li>
              <li>To keep the platform safe (removing spam, handling reports)</li>
            </ul>
            <p>
              That's it. No "personalized advertising." No "sharing with partners for marketing
              purposes." No selling lists of college students to recruiters. None of that garbage.
            </p>
          </Section>

          <Section id="sharing" number="04" title="Sharing">
            <p>
              <strong>I will not sell your data.</strong> Not to advertisers. Not to recruiters.
              Not to your school. Not to anyone. This isn't a negotiable thing that might
              change when we need money. It's a core principle.
            </p>
            <p>Here's who can see your stuff:</p>
            <ul>
              <li><strong>Other HIVE users</strong> — Based on your privacy settings and what Spaces you're in. You control this.</li>
              <li><strong>Service providers</strong> — Firebase (hosting/database), Resend (email delivery), Vercel (website hosting). They process data to make things work. They don't own it or use it for their own purposes.</li>
              <li><strong>Law enforcement</strong> — If I get a valid legal order, I have to comply. I'll tell you if I legally can. I'm not going to fight the FBI for your meme posts, but I'm also not handing things over without proper legal process.</li>
            </ul>
          </Section>

          <Section id="security" number="05" title="Security">
            <p>Your data is protected by:</p>
            <ul>
              <li>Encryption in transit (HTTPS/TLS everywhere)</li>
              <li>Encryption at rest (Firebase handles this)</li>
              <li>Email verification for authentication (no passwords to steal)</li>
              <li>Security rules that prevent users from accessing each other's private data</li>
            </ul>
            <p>
              Is it perfect? No. Nothing is. But I take this seriously. If there's ever a
              breach, I'll tell you directly — not bury it in a press release six months later.
            </p>
          </Section>

          <Section id="rights" number="06" title="Your Rights">
            <p>You can:</p>
            <ul>
              <li><strong>See your data</strong> — Ask me and I'll send you everything we have on you</li>
              <li><strong>Fix it</strong> — Update anything that's wrong in your profile</li>
              <li><strong>Delete it</strong> — Nuke your account and we'll remove your data within 30 days</li>
              <li><strong>Export it</strong> — Get a copy of your stuff if you want to leave</li>
            </ul>
            <p>
              If you're in the EU (GDPR) or California (CCPA), you have additional legal rights.
              Email me and I'll help you exercise them. I'm not going to make you jump through hoops.
            </p>
          </Section>

          <Section id="retention" number="07" title="Retention">
            <p>
              Your data exists as long as your account exists. Delete your account, and I
              delete your data within 30 days. Some stuff might stick around longer if
              the law requires it (financial records, legal disputes, etc.), but that's rare.
            </p>
            <p>
              Anonymized analytics stick around because they can't be traced back to you anyway.
            </p>
          </Section>

          <Section id="children" number="08" title="Children">
            <p>
              HIVE is for college students. You need a .edu email. If you're under 13,
              you shouldn't be here, and if I find out you are, I'll delete your account.
              This isn't because I don't like kids — it's because COPPA (the children's
              privacy law) has specific requirements I'm not set up to handle.
            </p>
          </Section>

          <Section id="changes" number="09" title="Changes">
            <p>
              If I change this policy in any meaningful way, I'll tell you. Email, in-app
              notification, something obvious. I won't just quietly update the page and
              hope you don't notice.
            </p>
            <p>
              Minor wording changes or clarifications might happen without notice, but
              nothing that affects your actual privacy.
            </p>
          </Section>

          <Section id="contact" number="10" title="Contact">
            <p>
              Questions? Concerns? Want your data? Email me:{' '}
              <a
                href="mailto:hiveconnects@gmail.com"
                className="text-[var(--color-gold)]/80 hover:text-[var(--color-gold)]"
              >
                hiveconnects@gmail.com
              </a>
            </p>
            <p className="text-body text-white/50">
              HIVE<br />
              Built in Buffalo, NY
            </p>
          </Section>
        </article>

        {/* Version footer */}
        <footer className="mt-20 border-t border-white/[0.06] pt-8">
          <p className="text-label text-white/50">
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
        <span className="text-body-sm font-medium text-[var(--color-gold)]/50">{number}</span>
        <h2 className="text-title font-semibold text-white">{title}</h2>
      </div>
      <div className="space-y-4 text-body leading-relaxed text-white/50 [&_a]:underline [&_a]:underline-offset-2 [&_li]:pl-1 [&_strong]:font-medium [&_strong]:text-white [&_ul]:ml-4 [&_ul]:list-disc [&_ul]:space-y-2">
        {children}
      </div>
    </section>
  );
}
