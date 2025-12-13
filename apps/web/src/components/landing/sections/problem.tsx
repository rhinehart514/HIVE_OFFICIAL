"use client";

import { X, Check } from "lucide-react";

const before = [
  "15 different GroupMes",
  "Missed events you'd have loved",
  "Flyers no one sees",
  "No idea what's happening on campus",
];

const after = [
  "One feed for everything",
  "Never miss what matters",
  "Your clubs, always updated",
  "Real-time campus pulse",
];

export function ProblemSection() {
  return (
    <section className="relative py-24 md:py-32 px-6 bg-black overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/0 via-neutral-950/50 to-neutral-950/0" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            Campus life is fragmented
          </h2>
          <p className="mt-4 text-lg text-neutral-400">
            Until now.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Before */}
          <div className="p-6 md:p-8 rounded-2xl bg-neutral-950 border border-neutral-800">
            <div className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-6">
              Before HIVE
            </div>
            <ul className="space-y-4">
              {before.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <X className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                  <span className="text-neutral-400">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* After */}
          <div className="p-6 md:p-8 rounded-2xl bg-neutral-950 border border-gold-500/20 shadow-[0_0_30px_rgba(245,200,66,0.05)]">
            <div className="text-sm font-medium text-gold-500 uppercase tracking-wider mb-6">
              With HIVE
            </div>
            <ul className="space-y-4">
              {after.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-gold-500 mt-0.5 shrink-0" />
                  <span className="text-white">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
