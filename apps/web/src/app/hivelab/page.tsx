'use client';

import { useEffect } from 'react';

/**
 * HiveLab Hub - Redirects to External HiveLab App
 *
 * HiveLab is a standalone application. This page provides info and external link.
 */
export default function HiveLabPage() {
  useEffect(() => {
    // Check if we're in production with a configured HiveLab URL
    const hiveLabUrl = process.env.NEXT_PUBLIC_HIVELAB_URL;

    if (hiveLabUrl && hiveLabUrl !== 'http://localhost:3002') {
      // Production: redirect to external HiveLab app
      window.location.href = `${hiveLabUrl}/select-context`;
    } else {
      // Development or no URL configured: show instructions
      console.log('HiveLab URL not configured. Using local development setup.');
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-2xl font-bold text-[var(--hive-text-primary)]">
          HiveLab
        </h1>
        <p className="text-[var(--hive-text-secondary)]">
          HiveLab is HIVE's tool creation environment.
        </p>
        <a
          href="http://localhost:3002"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-3 bg-[var(--hive-brand-primary)] text-black rounded-lg font-medium hover:bg-[var(--hive-brand-hover)] transition-colors"
        >
          Open HiveLab (Dev)
        </a>
        <p className="text-xs text-[var(--hive-text-tertiary)]">
          In development: HiveLab runs on localhost:3002
        </p>
      </div>
    </div>
  );
}
