"use client";

/**
 * Shared Terms of Service content component.
 * Used by both the standalone page and the landing page modal.
 */
export function TermsContent() {
  return (
    <div className="prose prose-invert max-w-none">
      <div className="mb-8 rounded-lg border border-[var(--hive-brand-primary)]/20 bg-[var(--hive-brand-primary)]/5 p-6">
        <h2 className="mt-0 text-xl font-semibold text-[var(--hive-brand-primary)]">
          TL;DR - The Essentials
        </h2>
        <p className="mb-0 text-gray-300">
          HIVE is your campus social platform. You keep ownership of what you
          create, we provide the space. Be respectful, follow community
          guidelines, and help us build something amazing together.
        </p>
      </div>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using HIVE ("the Service"), you agree to be bound by
        these Terms of Service ("Terms"). If you disagree with any part of these
        terms, you may not access the Service.
      </p>

      <h2>2. Description of Service</h2>
      <div className="mb-4 rounded border-l-4 border-[var(--hive-brand-primary)]/50 bg-[var(--hive-background-tertiary)]/50 p-4">
        <p className="mb-2 font-medium text-[var(--hive-brand-primary)]">
          TL;DR: HIVE connects students through Spaces, Tools, and social
          features.
        </p>
      </div>
      <p>
        HIVE is a social platform designed for college students, providing
        features including but not limited to:
      </p>
      <ul>
        <li>
          <strong>Spaces:</strong> Community groups organized around majors,
          interests, and residential areas
        </li>
        <li>
          <strong>Feed:</strong> Social posting and interaction within Spaces
        </li>
        <li>
          <strong>Profiles:</strong> Personal and public identity management
        </li>
        <li>
          <strong>Tools:</strong> Interactive elements and experiences created
          by users
        </li>
        <li>
          <strong>Analytics:</strong> Usage insights and engagement metrics
        </li>
        <li>
          <strong>Future Features:</strong> Additional social and productivity
          features as announced
        </li>
      </ul>

      <h2>3. User Accounts and Eligibility</h2>
      <div className="mb-4 rounded border-l-4 border-[var(--hive-brand-primary)]/50 bg-[var(--hive-background-tertiary)]/50 p-4">
        <p className="mb-2 font-medium text-[var(--hive-brand-primary)]">
          TL;DR: Must be 13+ with a valid .edu email address.
        </p>
      </div>
      <p>To use HIVE, you must:</p>
      <ul>
        <li>Be at least 13 years of age (COPPA compliance)</li>
        <li>Have a valid educational institution email address</li>
        <li>Provide accurate and complete registration information</li>
        <li>Maintain the security of your account credentials</li>
      </ul>

      <h2>4. User-Generated Content and Intellectual Property</h2>
      <div className="mb-4 rounded border-l-4 border-[var(--hive-brand-primary)]/50 bg-[var(--hive-background-tertiary)]/50 p-4">
        <p className="mb-2 font-medium text-[var(--hive-brand-primary)]">
          TL;DR: You own your content, we get permission to display it.
        </p>
      </div>
      <p>
        You retain ownership of all intellectual property rights in content you
        create on HIVE, including:
      </p>
      <ul>
        <li>Posts, comments, and other text content</li>
        <li>Images, videos, and multimedia content</li>
        <li>Tools and interactive elements you create</li>
        <li>Profile information and customizations</li>
      </ul>
      <p>
        By posting content on HIVE, you grant us a non-exclusive, worldwide,
        royalty-free license to:
      </p>
      <ul>
        <li>
          Display, distribute, and promote your content within the Service
        </li>
        <li>
          Create derivative works for technical purposes (e.g., formatting,
          compression)
        </li>
        <li>
          Allow other users to interact with your content as intended by the
          Service features
        </li>
      </ul>

      <h2>5. Community Guidelines and Moderation</h2>
      <div className="mb-4 rounded border-l-4 border-[var(--hive-brand-primary)]/50 bg-[var(--hive-background-tertiary)]/50 p-4">
        <p className="mb-2 font-medium text-[var(--hive-brand-primary)]">
          TL;DR: Space builders moderate first, we have final say on serious
          violations.
        </p>
      </div>
      <p>HIVE maintains a safe and respectful environment through:</p>
      <ul>
        <li>
          <strong>Community Moderation:</strong> Space builders serve as
          first-line moderators for their communities
        </li>
        <li>
          <strong>Platform Oversight:</strong> HIVE reserves the right to
          review, remove, or restrict content that violates these Terms
        </li>
        <li>
          <strong>Escalation Process:</strong> Serious violations may result in
          account suspension or termination
        </li>
      </ul>
      <p>
        Prohibited content includes but is not limited to harassment, hate
        speech, spam, illegal activities, and content that violates others'
        intellectual property rights.
      </p>

      <h2>6. Tool Creation and Sharing</h2>
      <div className="mb-4 rounded border-l-4 border-[var(--hive-brand-primary)]/50 bg-[var(--hive-background-tertiary)]/50 p-4">
        <p className="mb-2 font-medium text-[var(--hive-brand-primary)]">
          TL;DR: Create awesome tools, but keep them safe and functional.
        </p>
      </div>
      <p>When creating and sharing Tools on HIVE:</p>
      <ul>
        <li>
          Tools must not contain malicious code or security vulnerabilities
        </li>
        <li>
          Tools must not violate other users' privacy or collect unauthorized
          data
        </li>
        <li>
          HIVE may sandbox, restrict, or remove Tools that pose security or
          performance risks
        </li>
        <li>
          You are responsible for the functionality and content of Tools you
          create
        </li>
      </ul>

      <h2>7. Privacy and Data Collection</h2>
      <div className="mb-4 rounded border-l-4 border-[var(--hive-brand-primary)]/50 bg-[var(--hive-background-tertiary)]/50 p-4">
        <p className="mb-2 font-medium text-[var(--hive-brand-primary)]">
          TL;DR: We collect minimal data, anonymize analytics, and respect your
          privacy.
        </p>
      </div>
      <p>Our data practices include:</p>
      <ul>
        <li>
          <strong>Analytics:</strong> Usage data is anonymized by default
        </li>
        <li>
          <strong>Opt-out Controls:</strong> Privacy controls and opt-out
          options are available
        </li>
        <li>
          <strong>Data Rights:</strong> EU users have GDPR rights, California
          users have CCPA rights
        </li>
        <li>
          <strong>Retention:</strong> Data is retained only as long as necessary
          for Service operation
        </li>
      </ul>
      <p>
        For complete details, see our{" "}
        <span className="text-[var(--hive-brand-primary)]">
          Privacy Policy
        </span>
        .
      </p>

      <h2>8. Account Suspension and Termination</h2>
      <div className="mb-4 rounded border-l-4 border-[var(--hive-brand-primary)]/50 bg-[var(--hive-background-tertiary)]/50 p-4">
        <p className="mb-2 font-medium text-[var(--hive-brand-primary)]">
          TL;DR: Serious or repeated violations may result in account
          restrictions.
        </p>
      </div>
      <p>HIVE may suspend or terminate accounts for:</p>
      <ul>
        <li>Violation of these Terms of Service</li>
        <li>Violation of Community Guidelines</li>
        <li>Illegal activities or content</li>
        <li>Repeated policy violations after warnings</li>
        <li>Security threats to the platform or other users</li>
      </ul>

      <h2>9. Limitation of Liability</h2>
      <p>
        HIVE is provided "as is" without warranties of any kind. We are not
        liable for indirect, incidental, or consequential damages arising from
        your use of the Service.
      </p>

      <h2>10. Changes to Terms</h2>
      <p>
        We may update these Terms from time to time. Material changes will be
        communicated through the Service or via email. Continued use after
        changes constitutes acceptance of the new Terms.
      </p>

      <h2>11. Contact Information</h2>
      <p>
        For questions about these Terms, contact us at:{" "}
        <a href="mailto:legal@hive.co" className="text-[var(--hive-brand-primary)] hover:text-[var(--hive-brand-primary)]/80">
          legal@hive.co
        </a>
      </p>

      <div className="mt-12 border-t border-gray-800 pt-8">
        <h3 className="text-lg font-semibold text-[var(--hive-brand-primary)]">Version History</h3>
        <p className="mt-4 text-sm text-gray-400">
          Version 2025-01-15 (Current) — Initial Terms of Service
        </p>
      </div>
    </div>
  );
}
