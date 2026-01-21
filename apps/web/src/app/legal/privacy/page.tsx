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
          <p className="mb-3 text-[13px] font-medium uppercase tracking-wider text-[var(--color-gold)]/70">
            Legal
          </p>
          <h1 className="mb-4 text-[40px] font-semibold leading-[1.1] tracking-tight text-white md:text-[48px]">
            Privacy Policy
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
            We collect minimal data to make HIVE work. Analytics are anonymized by default.
            We never sell your personal information. You control your data.
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
          <Section id="overview" number="01" title="Overview">
            <p>
              This Privacy Policy explains how HIVE collects, uses, and protects your
              personal information. We believe in transparency and giving you control
              over your data.
            </p>
            <p>
              By using HIVE, you agree to the collection and use of information in
              accordance with this policy.
            </p>
          </Section>

          <Section id="collect" number="02" title="What We Collect">
            <p>
              <strong>Account information</strong> — When you create an account, we collect
              your email address, name, chosen handle, and academic information (major,
              graduation year). Your school affiliation is derived from your email domain.
            </p>
            <p>
              <strong>Profile information</strong> — You may optionally add a profile photo,
              bio, and other details. This information is visible to other users as you configure.
            </p>
            <p>
              <strong>Usage data</strong> — We collect anonymized analytics about how you use
              HIVE, including pages visited, features used, and interactions. This helps us
              improve the platform.
            </p>
            <p>
              <strong>Content</strong> — Posts, comments, and other content you create are
              stored to provide the service.
            </p>
          </Section>

          <Section id="use" number="03" title="How We Use It">
            <p>We use your information to:</p>
            <ul>
              <li>Provide, maintain, and improve HIVE's features</li>
              <li>Personalize your experience based on your interests and connections</li>
              <li>Communicate important updates about the service</li>
              <li>Ensure safety, security, and enforce our terms</li>
              <li>Analyze usage patterns to improve the platform (anonymized)</li>
            </ul>
          </Section>

          <Section id="sharing" number="04" title="Sharing">
            <p>
              <strong>We never sell your personal information.</strong>
            </p>
            <p>We may share information with:</p>
            <ul>
              <li><strong>Service providers</strong> — Third parties that help us operate (hosting, analytics, email). They're bound by confidentiality agreements.</li>
              <li><strong>Legal requirements</strong> — When required by law, subpoena, or to protect rights and safety.</li>
              <li><strong>Your consent</strong> — When you explicitly agree to sharing.</li>
            </ul>
            <p>
              Content you post publicly is visible to other users according to your privacy settings.
            </p>
          </Section>

          <Section id="security" number="05" title="Security">
            <p>We protect your information through:</p>
            <ul>
              <li>Encryption in transit (TLS) and at rest</li>
              <li>Secure authentication with email verification</li>
              <li>Regular security reviews and monitoring</li>
              <li>Access controls limiting who can view your data</li>
            </ul>
            <p>
              No system is perfectly secure. We encourage you to use a strong,
              unique password and enable any additional security features we offer.
            </p>
          </Section>

          <Section id="rights" number="06" title="Your Rights">
            <p>You have the right to:</p>
            <ul>
              <li><strong>Access</strong> — Request a copy of your personal data</li>
              <li><strong>Correct</strong> — Update inaccurate information</li>
              <li><strong>Delete</strong> — Request deletion of your account and data</li>
              <li><strong>Export</strong> — Download your data in a portable format</li>
              <li><strong>Control</strong> — Manage privacy settings for your profile and content</li>
            </ul>
            <p>
              EU residents have additional rights under GDPR. California residents have
              rights under CCPA. Contact us to exercise these rights.
            </p>
          </Section>

          <Section id="retention" number="07" title="Retention">
            <p>
              We retain your data for as long as your account is active or as needed to
              provide services. When you delete your account, we remove your personal
              data within 30 days, except where retention is required by law.
            </p>
            <p>
              Anonymized analytics data may be retained indefinitely as it cannot be
              linked back to you.
            </p>
          </Section>

          <Section id="children" number="08" title="Children">
            <p>
              HIVE is designed for college students. Users must be at least 13 years old.
              We do not knowingly collect information from children under 13. If we learn
              we have collected such information, we will delete it promptly.
            </p>
          </Section>

          <Section id="changes" number="09" title="Changes">
            <p>
              We may update this policy from time to time. Material changes will be
              communicated through the service or via email at least 30 days before
              taking effect.
            </p>
            <p>
              We encourage you to review this policy periodically.
            </p>
          </Section>

          <Section id="contact" number="10" title="Contact">
            <p>
              Questions about your privacy? Contact us at{' '}
              <a
                href="mailto:privacy@hive.college"
                className="text-[var(--color-gold)]/80 hover:text-[var(--color-gold)]"
              >
                privacy@hive.college
              </a>
            </p>
            <p className="text-[14px] text-white/40">
              HIVE<br />
              Buffalo, NY
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
