import type { Metadata } from "next";
import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import { PrivacyContent } from "@/components/legal/privacy-content";

export const metadata: Metadata = {
  title: "Privacy Policy | HIVE",
  description:
    "Privacy Policy for HIVE - how we collect, use, and protect your personal information.",
};

// Force dynamic rendering to avoid SSG issues
export const dynamic = 'force-dynamic';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-950/50">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="inline-flex items-center gap-2 px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to HIVE
              </Link>
              <div className="h-6 w-px bg-gray-700" />
              <div className="flex items-center gap-2 text-gray-400">
                <Shield className="h-4 w-4" />
                <span className="text-sm">Privacy & Data Protection</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-white">Privacy Policy</h1>
          <p className="text-gray-400">Effective: January 15, 2025</p>
        </div>

        <PrivacyContent />
      </div>
    </div>
  );
}