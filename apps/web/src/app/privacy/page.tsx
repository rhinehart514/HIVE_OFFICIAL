"use client";

import Link from "next/link";

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-neutral-500 mb-12">
          Last updated: December 2025
        </p>

        <div className="prose prose-invert prose-neutral max-w-none">
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">Our Commitment</h2>
            <p className="text-neutral-400 leading-relaxed mb-4">
              HIVE is built by students, for students. Your privacy is fundamental to our mission.
              We collect only what we need to provide the service, and we never sell your data.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">What We Collect</h2>
            <div className="space-y-4 text-neutral-400 leading-relaxed">
              <p>
                <strong className="text-neutral-200">Account Information:</strong> Your .edu email address
                (to verify student status), display name, and optional profile information you choose to add.
              </p>
              <p>
                <strong className="text-neutral-200">Usage Data:</strong> How you interact with HIVE—which
                spaces you join, messages you send, and tools you create. This helps us improve the platform.
              </p>
              <p>
                <strong className="text-neutral-200">Device Information:</strong> Browser type, device type,
                and IP address for security and to ensure HIVE works properly on your device.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">How We Use Your Data</h2>
            <ul className="space-y-3 text-neutral-400">
              <li className="flex items-start gap-3">
                <span className="text-neutral-600 mt-1">•</span>
                To provide and maintain HIVE services
              </li>
              <li className="flex items-start gap-3">
                <span className="text-neutral-600 mt-1">•</span>
                To verify you&apos;re a student at a supported campus
              </li>
              <li className="flex items-start gap-3">
                <span className="text-neutral-600 mt-1">•</span>
                To improve the platform based on how people use it
              </li>
              <li className="flex items-start gap-3">
                <span className="text-neutral-600 mt-1">•</span>
                To communicate important updates about your account or spaces
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">What We Never Do</h2>
            <ul className="space-y-3 text-neutral-400">
              <li className="flex items-start gap-3">
                <span className="text-red-500/60 mt-1">×</span>
                Sell your data to advertisers or third parties
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500/60 mt-1">×</span>
                Show you ads or sponsored content
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500/60 mt-1">×</span>
                Share your information with your university without your consent
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500/60 mt-1">×</span>
                Use dark patterns to manipulate your behavior
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">Your Rights</h2>
            <div className="space-y-4 text-neutral-400 leading-relaxed">
              <p>
                <strong className="text-neutral-200">Access:</strong> You can request a copy of all data
                we have about you.
              </p>
              <p>
                <strong className="text-neutral-200">Deletion:</strong> You can delete your account at any
                time. When you do, we delete your data within 30 days.
              </p>
              <p>
                <strong className="text-neutral-200">Portability:</strong> You can export your data in a
                standard format.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">Data Security</h2>
            <p className="text-neutral-400 leading-relaxed">
              We use industry-standard security measures including encryption in transit and at rest,
              secure authentication, and regular security audits. Your data is stored on Firebase/Google
              Cloud infrastructure with enterprise-grade security.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">Contact Us</h2>
            <p className="text-neutral-400 leading-relaxed">
              Questions about privacy? Email us at{" "}
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
              <Link href="/privacy" className="text-white">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <a href="mailto:team@hivecampus.com" className="hover:text-white transition-colors">Contact</a>
            </div>
            <div>&copy; {new Date().getFullYear()} HIVE</div>
          </div>
        </div>
      </footer>
    </main>
  );
}
