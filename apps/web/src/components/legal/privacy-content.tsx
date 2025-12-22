"use client";

/**
 * Shared Privacy Policy content component.
 * Used by both the standalone page and the landing page modal.
 */
export function PrivacyContent() {
  return (
    <div className="prose prose-invert max-w-none">
      <div className="mb-8 rounded-lg border border-[var(--hive-brand-primary)]/20 bg-[var(--hive-brand-primary)]/5 p-6">
        <h2 className="mt-0 text-xl font-semibold text-[var(--hive-brand-primary)]">
          Your Privacy Matters
        </h2>
        <p className="mb-0 text-gray-300">
          We collect minimal data to make HIVE work well for you. Analytics are
          anonymized by default, you control your profile visibility, and we
          never sell your personal information.
        </p>
      </div>

      <h2>1. Information We Collect</h2>
      <p>When you create a HIVE account, we collect:</p>
      <ul>
        <li>Email address (for authentication and communication)</li>
        <li>Full name and chosen handle</li>
        <li>Academic information (major, graduation year)</li>
        <li>School affiliation (derived from email domain)</li>
        <li>Profile photo (optional)</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>We use your information to:</p>
      <ul>
        <li>Provide HIVE's features and services</li>
        <li>Personalize your experience</li>
        <li>Communicate important updates</li>
        <li>Improve the platform</li>
        <li>Ensure safety and security</li>
      </ul>

      <h2>3. Data Security</h2>
      <p>We protect your information through:</p>
      <ul>
        <li>Encryption in transit and at rest</li>
        <li>Secure authentication systems</li>
        <li>Regular security audits</li>
        <li>Access controls and monitoring</li>
      </ul>

      <h2>4. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access your personal data</li>
        <li>Correct inaccurate information</li>
        <li>Request deletion of your account</li>
        <li>Export your data</li>
        <li>Control your privacy settings</li>
      </ul>

      <h2>5. Contact Us</h2>
      <p>
        For privacy-related questions, contact us at{" "}
        <a
          href="mailto:privacy@hive.college"
          className="text-[var(--hive-brand-primary)] hover:text-[var(--hive-brand-primary)]/80"
        >
          privacy@hive.college
        </a>
      </p>
    </div>
  );
}
