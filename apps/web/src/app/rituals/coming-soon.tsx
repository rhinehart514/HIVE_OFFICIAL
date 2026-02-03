"use client";

/**
 * Rituals Coming Soon Page
 *
 * Shown when the rituals feature flag is disabled.
 * Provides a teaser of what's coming with the Rituals feature.
 */

import { useRouter } from "next/navigation";
import { toast } from "@hive/ui";
import {
  FireIcon,
  CalendarIcon,
  UserGroupIcon,
  TrophyIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export function RitualsComingSoon() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-ground">
      {/* Hero section */}
      <div className="relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-6 py-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-8">
            <SparklesIcon className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-400">Coming Soon</span>
          </div>

          {/* Hero icon */}
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20">
            <FireIcon className="h-12 w-12 text-amber-400" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Campus Rituals
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Build powerful habits together. Rituals are campus-wide challenges that bring students together
            through shared goals, friendly competition, and collective achievement.
          </p>

          {/* Feature grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 text-left">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                <CalendarIcon className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Daily Challenges</h3>
              <p className="text-sm text-white/50">
                Simple actions you can do every day to build momentum and earn streaks.
              </p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
                <UserGroupIcon className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Collective Goals</h3>
              <p className="text-sm text-white/50">
                Unlock rewards when enough students complete the challenge together.
              </p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4">
                <TrophyIcon className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Achievements</h3>
              <p className="text-sm text-white/50">
                Earn badges and climb leaderboards as you complete more rituals.
              </p>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => {
                toast.success("You're on the list!", "We'll notify you when Rituals launches.");
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 text-black font-semibold hover:bg-amber-400 transition-colors"
            >
              <SparklesIcon className="h-5 w-5" />
              Get Notified at Launch
            </button>
            <button
              onClick={() => router.push("/spaces")}
              className="inline-flex items-center gap-2 rounded-xl bg-white/[0.06] border border-white/[0.08] px-6 py-3.5 text-white font-medium hover:bg-white/[0.08] transition-colors"
            >
              Explore Spaces
            </button>
          </div>
        </div>
      </div>

      {/* Example rituals preview */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-white mb-2">Example Rituals</h2>
          <p className="text-sm text-white/50">Here's what you'll be able to participate in</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { icon: "BookOpen", name: "Study Streak", desc: "Log 2 hours of studying daily", participants: "1,247", color: "text-blue-400" },
            { icon: "Activity", name: "Move Daily", desc: "Exercise or walk 30+ minutes", participants: "892", color: "text-green-400" },
            { icon: "Target", name: "Goal Getter", desc: "Complete 3 tasks from your to-do list", participants: "2,103", color: "text-amber-400" },
            { icon: "MessageSquare", name: "Connect Week", desc: "Have a meaningful conversation each day", participants: "456", color: "text-purple-400" },
          ].map((ritual) => (
            <div
              key={ritual.name}
              className="flex items-center gap-4 p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl"
            >
              <div className={`w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center ${ritual.color}`}>
                {ritual.icon === "BookOpen" && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                {ritual.icon === "Activity" && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>}
                {ritual.icon === "Target" && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth={1.5} /><circle cx="12" cy="12" r="6" strokeWidth={1.5} /><circle cx="12" cy="12" r="2" strokeWidth={1.5} /></svg>}
                {ritual.icon === "MessageSquare" && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-white">{ritual.name}</h3>
                <p className="text-sm text-white/50">{ritual.desc}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-white/40">{ritual.participants}</div>
                <div className="text-xs text-white/30">would join</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
