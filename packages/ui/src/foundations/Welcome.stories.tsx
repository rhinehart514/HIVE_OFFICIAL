import React from 'react';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: '00-Foundations/Welcome',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'hive-dark' },
  },
};

export default meta;

type Story = StoryObj;

const WelcomePage = () => (
  <div className="min-h-screen bg-black text-white font-sans antialiased">
    {/* Hero Section */}
    <div className="relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black opacity-90" />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-8 py-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
            <span className="text-2xl">🜃</span>
          </div>
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">HIVE Design System</h1>
            <p className="text-gray-400 mt-1">Campus Sleek Dark Mode</p>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-xl text-gray-300 max-w-2xl mb-12 leading-relaxed">
          Vercel's refined minimalism meets OpenAI's conversational warmth, infused with campus energy.
          A production-ready design system built for students, by students.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-16">
          {[
            { label: 'Components', value: '129', desc: 'Across 7 feature slices' },
            { label: 'Design Tokens', value: '221', desc: 'CSS custom properties' },
            { label: 'Coverage', value: '100%', desc: 'Storybook documentation' },
            { label: 'Performance', value: '<1s', desc: 'Page load target' },
          ].map((stat) => (
            <div key={stat.label} className="p-6 rounded-xl bg-gray-900/50 border border-gray-800">
              <div className="text-3xl font-semibold text-yellow-500 mb-1">{stat.value}</div>
              <div className="text-sm font-medium text-white mb-1">{stat.label}</div>
              <div className="text-xs text-gray-500">{stat.desc}</div>
            </div>
          ))}
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-2 gap-4">
          <NavCard
            title="🎨 Foundations"
            desc="Colors, Typography, Spacing, Motion"
            path="00-Foundations"
          />
          <NavCard
            title="⚛️ Atoms"
            desc="Button, Input, Card, Badge, Avatar"
            path="01-Atoms"
          />
          <NavCard
            title="🧬 Molecules"
            desc="SearchBar, FilterChips, NotificationCard"
            path="02-Molecules"
          />
          <NavCard
            title="🏗️ Organisms"
            desc="Feed, Spaces, Profile, HiveLab, Rituals"
            path="03-Organisms"
          />
        </div>
      </div>
    </div>

    {/* Design Principles */}
    <div className="bg-gradient-to-b from-black to-gray-950 py-24">
      <div className="max-w-6xl mx-auto px-8">
        <h2 className="text-2xl font-semibold mb-3">Design Principles</h2>
        <p className="text-gray-400 mb-12 max-w-2xl">
          Core principles that guide every decision in the HIVE design system.
        </p>

        <div className="grid grid-cols-3 gap-6">
          <PrincipleCard
            title="Monochrome + Gold"
            desc="Pure black backgrounds with gray elevations. Gold (#FFD700) reserved for CTAs, achievements, and live moments only."
            icon="🌑"
          />
          <PrincipleCard
            title="Mobile-First Reality"
            desc="80% of usage is mobile. Touch targets 44px min, 14px body text, 12px spacing. Performance budget: <1s load, 60fps scroll."
            icon="📱"
          />
          <PrincipleCard
            title="Smooth Confidence"
            desc="3 easing curves (default, snap, dramatic). 240ms standard transitions. Respect prefers-reduced-motion."
            icon="🎭"
          />
          <PrincipleCard
            title="Read-Only Discovery"
            desc="Feed aggregates posts from spaces you've joined. You post in spaces, consume in Feed. 100% campus content, 0% noise."
            icon="🔍"
          />
          <PrincipleCard
            title="Heavy Radius Design"
            desc="14px cards, 22px modals, full circle avatars. Distinctive, modern, approachable—not generic web defaults."
            icon="📐"
          />
          <PrincipleCard
            title="Subtle Borders"
            desc="8% white opacity default. Cards use borders OR shadows (not both). Glass overlays use backdrop-blur."
            icon="✨"
          />
        </div>
      </div>
    </div>

    {/* Color System Preview */}
    <div className="bg-black py-24">
      <div className="max-w-6xl mx-auto px-8">
        <h2 className="text-2xl font-semibold mb-3">Color System</h2>
        <p className="text-gray-400 mb-12">
          Monochrome foundation with single gold accent. Grayscale interactive states (white glow, not gold).
        </p>

        <div className="grid grid-cols-5 gap-4 mb-8">
          {[
            { name: 'Black', color: '#000000' },
            { name: 'Gray 900', color: '#171717' },
            { name: 'Gray 800', color: '#262626' },
            { name: 'Gray 400', color: '#A3A3A3' },
            { name: 'White', color: '#FFFFFF' },
          ].map((item) => (
            <div key={item.name} className="rounded-lg overflow-hidden border border-gray-800">
              <div className="h-24" style={{ backgroundColor: item.color }} />
              <div className="p-3 bg-gray-900/50">
                <div className="text-sm font-medium">{item.name}</div>
                <div className="text-xs text-gray-500 font-mono">{item.color}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-6 rounded-full bg-yellow-500" />
            <span className="text-lg font-semibold text-yellow-500">Gold #FFD700</span>
          </div>
          <p className="text-sm text-gray-400">
            Reserved for: CTAs, achievements, online presence, featured content. Never for default buttons or decorative elements.
          </p>
        </div>
      </div>
    </div>

    {/* Footer */}
    <div className="border-t border-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-8 text-center">
        <p className="text-gray-500 text-sm">
          HIVE Design System · Built with Storybook, React, Tailwind CSS, Framer Motion
        </p>
        <p className="text-gray-600 text-xs mt-2">
          Last Updated: November 16, 2025
        </p>
      </div>
    </div>
  </div>
);

// Helper Components
const NavCard = ({ title, desc, path }: { title: string; desc: string; path: string }) => (
  <button
    className="group p-6 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-gray-700
               transition-all duration-240 hover:-translate-y-1 text-left"
    onClick={() => {
      // Storybook navigation would go here
      console.log(`Navigate to ${path}`);
    }}
  >
    <div className="text-lg font-medium mb-2 group-hover:text-yellow-500 transition-colors">
      {title}
    </div>
    <div className="text-sm text-gray-500">{desc}</div>
  </button>
);

const PrincipleCard = ({ title, desc, icon }: { title: string; desc: string; icon: string }) => (
  <div className="p-6 rounded-xl bg-gray-900/30 border border-gray-800">
    <div className="text-3xl mb-3">{icon}</div>
    <h3 className="text-base font-semibold mb-2">{title}</h3>
    <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
  </div>
);

export const Welcome: Story = {
  render: () => <WelcomePage />,
  parameters: {
    docs: {
      description: {
        story: 'Welcome to the HIVE Design System. Navigate through the sidebar to explore components organized by atomic design principles.',
      },
    },
  },
};
