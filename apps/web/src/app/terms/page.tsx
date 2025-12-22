"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen antialiased" style={{ background: "#050505" }}>
      {/* Header */}
      <header className="border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 md:px-12 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-neutral-400 hover:text-white transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to HIVE
          </Link>
        </div>
      </header>

      {/* Content */}
      <article className="max-w-4xl mx-auto px-6 md:px-12 py-16 md:py-24">
        <p className="font-mono text-sm text-neutral-500 tracking-wide uppercase mb-4">
          Legal
        </p>
        <h1 className="font-manifesto text-4xl md:text-5xl font-semibold text-white mb-4">
          Terms of Service
        </h1>
        <p className="text-neutral-500 mb-12">
          Last updated: December 2025
        </p>

        <div className="prose prose-invert prose-neutral max-w-none">
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">Agreement to Terms</h2>
            <p className="text-neutral-400 leading-relaxed">
              By accessing or using HIVE, you agree to be bound by these Terms of Service.
              HIVE is designed for students at supported universities. You must have a valid
              .edu email address to create an account.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">Who Can Use HIVE</h2>
            <ul className="space-y-3 text-neutral-400">
              <li className="flex items-start gap-3">
                <span className="text-neutral-600 mt-1">•</span>
                You must be a current student, faculty, or staff member at a supported university
              </li>
              <li className="flex items-start gap-3">
                <span className="text-neutral-600 mt-1">•</span>
                You must provide accurate information when creating your account
              </li>
              <li className="flex items-start gap-3">
                <span className="text-neutral-600 mt-1">•</span>
                You must be at least 18 years old or the age of majority in your jurisdiction
              </li>
              <li className="flex items-start gap-3">
                <span className="text-neutral-600 mt-1">•</span>
                You are responsible for maintaining the security of your account
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">Your Content</h2>
            <div className="space-y-4 text-neutral-400 leading-relaxed">
              <p>
                You own the content you create on HIVE. By posting content, you grant HIVE a license
                to display and distribute it within the platform as necessary to operate the service.
              </p>
              <p>
                You are responsible for the content you post. Content that violates these terms,
                including harassment, spam, or illegal material, may be removed and may result in
                account suspension.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">Community Guidelines</h2>
            <div className="space-y-4">
              <p className="text-neutral-400 leading-relaxed mb-4">
                HIVE is a platform for students to connect, collaborate, and build. To maintain
                a productive environment:
              </p>
              <ul className="space-y-3 text-neutral-400">
                <li className="flex items-start gap-3">
                  <span className="text-green-500/60 mt-1">✓</span>
                  Be respectful of other members
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500/60 mt-1">✓</span>
                  Keep content relevant to your spaces and communities
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500/60 mt-1">✓</span>
                  Report issues through proper channels
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500/60 mt-1">×</span>
                  No harassment, hate speech, or discrimination
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500/60 mt-1">×</span>
                  No spam, scams, or deceptive content
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500/60 mt-1">×</span>
                  No illegal content or activities
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">Spaces & Tools</h2>
            <div className="space-y-4 text-neutral-400 leading-relaxed">
              <p>
                <strong className="text-neutral-200">Spaces:</strong> When you create or claim a space,
                you are responsible for managing it according to these terms. Space leaders may set
                additional rules for their communities.
              </p>
              <p>
                <strong className="text-neutral-200">HiveLab Tools:</strong> Tools you create using
                HiveLab are your property. However, tools must not be used to collect data beyond
                what is necessary for their stated purpose, or to circumvent platform security.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">Intellectual Property</h2>
            <p className="text-neutral-400 leading-relaxed">
              HIVE and its original content, features, and functionality are owned by HIVE and
              are protected by intellectual property laws. You may not copy, modify, or create
              derivative works of the platform without permission.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">Termination</h2>
            <p className="text-neutral-400 leading-relaxed">
              You can delete your account at any time. We may suspend or terminate accounts that
              violate these terms. Upon termination, your right to use HIVE ceases immediately,
              but provisions that should survive termination will remain in effect.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">Disclaimers</h2>
            <div className="space-y-4 text-neutral-400 leading-relaxed">
              <p>
                HIVE is provided &quot;as is&quot; without warranties of any kind. We do not guarantee
                uninterrupted access or that the platform will be error-free.
              </p>
              <p>
                We are not responsible for the content posted by users, the actions of space
                leaders, or any third-party services integrated with HIVE.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">Changes to Terms</h2>
            <p className="text-neutral-400 leading-relaxed">
              We may update these terms from time to time. When we make significant changes,
              we&apos;ll notify you through the platform. Continued use of HIVE after changes
              constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">Contact</h2>
            <p className="text-neutral-400 leading-relaxed">
              Questions about these terms? Email us at{" "}
              <a
                href="mailto:team@hivecampus.com"
                className="text-gold-500/80 hover:text-gold-400 transition-colors"
              >
                team@hivecampus.com
              </a>
            </p>
          </section>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 md:px-12 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-500">
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="text-white">Terms</Link>
              <a href="mailto:team@hivecampus.com" className="hover:text-white transition-colors">Contact</a>
            </div>
            <div>&copy; {new Date().getFullYear()} HIVE</div>
          </div>
        </div>
      </footer>
    </main>
  );
}
