import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for HIVE — the social platform for college students.',
};

export const dynamic = 'force-dynamic';

const SECTIONS = [
  { id: 'acceptance', title: 'Acceptance of Terms' },
  { id: 'service', title: 'The Service' },
  { id: 'eligibility', title: 'Eligibility' },
  { id: 'content', title: 'Your Content' },
  { id: 'conduct', title: 'Conduct' },
  { id: 'tools', title: 'Tools' },
  { id: 'privacy', title: 'Privacy' },
  { id: 'termination', title: 'Termination' },
  { id: 'liability', title: 'Liability' },
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
          <Section id="acceptance" number="01" title="Acceptance of Terms">
            <p>
              By accessing or using HIVE, you agree to be bound by these Terms of Service.
              If you disagree with any part of these terms, you may not access the service.
            </p>
            <p>
              These terms constitute a legally binding agreement between you and HIVE.
              We recommend reading them carefully before using the platform.
            </p>
          </Section>

          <Section id="service" number="02" title="The Service">
            <p>
              HIVE is a social platform designed for college students. We provide:
            </p>
            <ul>
              <li><strong>Spaces</strong> — Communities organized around majors, interests, and residential areas</li>
              <li><strong>Feed</strong> — Social posting and interaction within your communities</li>
              <li><strong>Profiles</strong> — Personal identity and connection management</li>
              <li><strong>Tools</strong> — Interactive experiences created by users</li>
            </ul>
            <p>
              We continuously improve the service. Features may change, and new features
              will be announced through the platform.
            </p>
          </Section>

          <Section id="eligibility" number="03" title="Eligibility">
            <p>To use HIVE, you must:</p>
            <ul>
              <li>Be at least 13 years of age</li>
              <li>Have a valid educational institution email address</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
            </ul>
            <p>
              You are responsible for all activity that occurs under your account.
              Notify us immediately if you suspect unauthorized access.
            </p>
          </Section>

          <Section id="content" number="04" title="Your Content">
            <p>
              You retain ownership of all content you create on HIVE, including posts,
              comments, images, videos, and Tools.
            </p>
            <p>
              By posting content, you grant us a non-exclusive, worldwide, royalty-free
              license to display, distribute, and promote your content within the service.
              This license enables the platform to function — we don't claim ownership
              of your work.
            </p>
            <p>
              You're responsible for your content. Don't post anything you don't have
              the right to share.
            </p>
          </Section>

          <Section id="conduct" number="05" title="Conduct">
            <p>
              HIVE is built on mutual respect. We maintain community standards through
              Space-level moderation and platform oversight.
            </p>
            <p>Prohibited activities include:</p>
            <ul>
              <li>Harassment, bullying, or hate speech</li>
              <li>Spam or misleading content</li>
              <li>Impersonation or fraud</li>
              <li>Illegal activities</li>
              <li>Violating others' intellectual property rights</li>
            </ul>
            <p>
              Space leaders serve as first-line moderators. HIVE reserves the right
              to review and remove content that violates these terms.
            </p>
          </Section>

          <Section id="tools" number="06" title="Tools">
            <p>
              Tools are interactive experiences you can create and share. When building Tools:
            </p>
            <ul>
              <li>Don't include malicious code or security vulnerabilities</li>
              <li>Don't collect unauthorized data from users</li>
              <li>Ensure your Tools function as described</li>
            </ul>
            <p>
              We may sandbox, restrict, or remove Tools that pose security or
              performance risks to the platform.
            </p>
          </Section>

          <Section id="privacy" number="07" title="Privacy">
            <p>
              We collect minimal data to make HIVE work well. Analytics are anonymized
              by default, and we never sell your personal information.
            </p>
            <p>
              For complete details on data collection, usage, and your rights, see our{' '}
              <a href="/legal/privacy" className="text-[var(--color-gold)]/80 hover:text-[var(--color-gold)]">
                Privacy Policy
              </a>.
            </p>
          </Section>

          <Section id="termination" number="08" title="Termination">
            <p>
              We may suspend or terminate accounts for violations of these terms,
              illegal activities, or security threats. Serious violations may result
              in immediate termination without warning.
            </p>
            <p>
              You may delete your account at any time through your settings.
              Some information may be retained as required by law.
            </p>
          </Section>

          <Section id="liability" number="09" title="Liability">
            <p>
              HIVE is provided "as is" without warranties of any kind, express or implied.
              We are not liable for indirect, incidental, or consequential damages
              arising from your use of the service.
            </p>
            <p>
              Our total liability is limited to the amount you paid us in the
              twelve months preceding any claim — which, for most users, is zero.
            </p>
          </Section>

          <Section id="changes" number="10" title="Changes">
            <p>
              We may update these terms from time to time. Material changes will be
              communicated through the service or via email at least 30 days before
              taking effect.
            </p>
            <p>
              Continued use after changes constitutes acceptance of the new terms.
            </p>
          </Section>

          <Section id="contact" number="11" title="Contact">
            <p>
              Questions about these terms? Contact us at{' '}
              <a
                href="mailto:legal@hive.college"
                className="text-[var(--color-gold)]/80 hover:text-[var(--color-gold)]"
              >
                legal@hive.college
              </a>
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
