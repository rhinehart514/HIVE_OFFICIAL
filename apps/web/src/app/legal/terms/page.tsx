import type { Metadata } from "next";
import { ArrowLeft, Scale } from "lucide-react";
import Link from "next/link";
import { TermsContent } from "@/components/legal/terms-content";

export const metadata: Metadata = {
  title: "Terms of Service | HIVE",
  description:
    "Terms of Service for HIVE - the social platform for college students.",
};

// Force dynamic rendering to avoid SSG issues
export const dynamic = 'force-dynamic';

export default function TermsOfServicePage() {
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
                <Scale className="h-4 w-4" />
                <span className="text-sm">Legal Document</span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Effective: January 15, 2025
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-white">
            Terms of Service
          </h1>
          <p className="text-gray-400">
            Version 2025-01-15 • Effective January 15, 2025
          </p>
        </div>

        <TermsContent />
      </div>
    </div>
  );
}
