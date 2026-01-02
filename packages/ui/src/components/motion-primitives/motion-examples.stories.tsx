/**
 * Motion Primitives - Comprehensive Storybook
 * HIVE animation system: Gold for dopamine, grayscale for everything else
 */

import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trophy, Zap, Heart, Users, TrendingUp, Award, Crown } from 'lucide-react';

import { InView } from './in-view';
import { AutoAnimated } from './auto-animated';
import { AnimatedNumber, numberSpringPresets } from './animated-number';
import { GoldSpinner, GoldSpinnerInline } from './gold-spinner';
import { GlowEffect, AnimatedGoldIcon } from './glow-effect';
import { GoldConfettiBurst, JoinCelebration, FirstPostCelebration, MilestoneBadge } from './space-celebrations';
import { Button } from '../../atomic/00-Global/atoms/button';
import { Card } from '../../atomic/00-Global/atoms/card';
import { Badge } from '../../atomic/00-Global/atoms/badge';

const meta: Meta = {
  title: 'Design System/Motion Primitives',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `HIVE Motion System - Production-ready animations using brand tokens.

**Core Principles:**
- **Gold for dopamine only** - Achievements, rep, primary CTAs
- **Grayscale for everything else** - Hover, focus, transitions
- **Feed-first minimalism** - Enhance, don't distract
- **Respect prefers-reduced-motion** - All components handle accessibility`,
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-[200px] p-8 bg-[#0a0b16]">
        <Story />
      </div>
    ),
  ],
};

export default meta;

// ============================================================================
// ANIMATED NUMBER STORIES
// ============================================================================

export const AnimatedNumber_Default: StoryObj = {
  render: () => (
    <div className="text-center">
      <AnimatedNumber
        value={1247}
        className="text-4xl font-bold text-white"
        springOptions={numberSpringPresets.standard}
      />
      <p className="text-white/50 mt-2">Rep Score</p>
    </div>
  ),
};

export const AnimatedNumber_AllPresets: StoryObj = {
  render: () => {
    const [key, setKey] = useState(0);
    return (
      <div className="space-y-6">
        <Button onClick={() => setKey(k => k + 1)} variant="outline" size="sm">
          Replay Animation
        </Button>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(numberSpringPresets).map(([name, preset]) => (
            <div key={`${name}-${key}`} className="p-4 bg-white/5 rounded-lg">
              <p className="text-white/50 text-xs mb-2">{name}</p>
              <AnimatedNumber
                value={9876}
                className="text-2xl font-bold text-white"
                springOptions={preset}
              />
            </div>
          ))}
        </div>
      </div>
    );
  },
};

export const AnimatedNumber_WithFormat: StoryObj = {
  render: () => (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="text-center p-4 bg-white/5 rounded-lg">
        <AnimatedNumber
          value={99.5}
          decimalPlaces={1}
          formatFn={(v) => `${v}%`}
          className="text-3xl font-bold text-emerald-400"
        />
        <p className="text-white/50 mt-1">Uptime</p>
      </div>
      <div className="text-center p-4 bg-white/5 rounded-lg">
        <AnimatedNumber
          value={12500}
          formatFn={(v) => `$${v.toLocaleString()}`}
          className="text-3xl font-bold text-[#FFD700]"
        />
        <p className="text-white/50 mt-1">Revenue</p>
      </div>
      <div className="text-center p-4 bg-white/5 rounded-lg">
        <AnimatedNumber
          value={42000}
          formatFn={(v) => `${(v / 1000).toFixed(1)}K`}
          className="text-3xl font-bold text-blue-400"
        />
        <p className="text-white/50 mt-1">Users</p>
      </div>
    </div>
  ),
};

export const AnimatedNumber_Counting: StoryObj = {
  render: () => {
    const [value, setValue] = useState(0);
    return (
      <div className="space-y-4 text-center">
        <AnimatedNumber
          value={value}
          className="text-5xl font-bold text-[#FFD700]"
          springOptions={{ bounce: 0.2, duration: 500 }}
        />
        <div className="flex gap-2 justify-center">
          <Button onClick={() => setValue(v => v + 10)} variant="outline" size="sm">+10</Button>
          <Button onClick={() => setValue(v => v + 100)} variant="outline" size="sm">+100</Button>
          <Button onClick={() => setValue(0)} variant="ghost" size="sm">Reset</Button>
        </div>
      </div>
    );
  },
};

// ============================================================================
// GOLD SPINNER STORIES
// ============================================================================

export const GoldSpinner_Sizes: StoryObj = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="text-center">
        <GoldSpinner size="sm" />
        <p className="text-white/50 text-xs mt-2">Small</p>
      </div>
      <div className="text-center">
        <GoldSpinner size="md" />
        <p className="text-white/50 text-xs mt-2">Medium</p>
      </div>
      <div className="text-center">
        <GoldSpinner size="lg" />
        <p className="text-white/50 text-xs mt-2">Large</p>
      </div>
    </div>
  ),
};

export const GoldSpinner_InButton: StoryObj = {
  render: () => (
    <div className="flex gap-4">
      <Button disabled className="bg-[#FFD700] text-black">
        <GoldSpinnerInline className="mr-0" />
        Loading...
      </Button>
      <Button disabled variant="outline">
        <GoldSpinnerInline className="mr-0" />
        Processing
      </Button>
    </div>
  ),
};

export const GoldSpinner_WithCard: StoryObj = {
  render: () => (
    <Card className="p-8 flex flex-col items-center gap-4 bg-neutral-900 border-neutral-800">
      <GoldSpinner size="lg" />
      <p className="text-white">Loading your dashboard...</p>
    </Card>
  ),
};

// ============================================================================
// GLOW EFFECT STORIES
// ============================================================================

export const GlowEffect_Modes: StoryObj = {
  render: () => (
    <div className="flex items-center gap-12">
      {(['static', 'pulse', 'breathe'] as const).map((mode) => (
        <div key={mode} className="text-center">
          <GlowEffect mode={mode} size="md">
            <Star className="h-8 w-8 text-[#FFD700]" fill="#FFD700" />
          </GlowEffect>
          <p className="text-white/50 text-xs mt-4">{mode}</p>
        </div>
      ))}
    </div>
  ),
};

export const GlowEffect_Sizes: StoryObj = {
  render: () => (
    <div className="flex items-center gap-12">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} className="text-center">
          <GlowEffect size={size} mode="breathe">
            <Trophy className="h-8 w-8 text-[#FFD700]" />
          </GlowEffect>
          <p className="text-white/50 text-xs mt-4">{size}</p>
        </div>
      ))}
    </div>
  ),
};

export const GlowEffect_Colors: StoryObj = {
  render: () => (
    <div className="flex items-center gap-12">
      {[
        { color: '#FFD700', label: 'Gold', icon: Trophy },
        { color: '#60A5FA', label: 'Blue', icon: Heart },
        { color: '#34D399', label: 'Green', icon: Award },
      ].map(({ color, label, icon: Icon }) => (
        <div key={color} className="text-center">
          <GlowEffect color={color} mode="pulse" size="md">
            <Icon className="h-8 w-8" style={{ color }} />
          </GlowEffect>
          <p className="text-white/50 text-xs mt-4">{label}</p>
        </div>
      ))}
    </div>
  ),
};

export const GlowEffect_Achievement: StoryObj = {
  render: () => (
    <div className="flex items-center gap-4 p-6 bg-white/5 rounded-xl">
      <AnimatedGoldIcon>
        <Crown className="h-10 w-10 text-[#FFD700]" />
      </AnimatedGoldIcon>
      <div>
        <p className="text-white font-semibold">Campus Legend</p>
        <p className="text-white/50 text-sm">1,000+ connections</p>
      </div>
    </div>
  ),
};

// ============================================================================
// SPACE CELEBRATIONS STORIES
// ============================================================================

export const Celebrations_Confetti: StoryObj = {
  render: () => {
    const [active, setActive] = useState(false);
    return (
      <div className="relative h-[300px] w-full flex items-center justify-center">
        <GoldConfettiBurst
          isActive={active}
          particleCount={40}
          onComplete={() => setActive(false)}
        />
        <Button onClick={() => setActive(true)} className="bg-[#FFD700] text-black">
          Celebrate!
        </Button>
      </div>
    );
  },
};

export const Celebrations_JoinSpace: StoryObj = {
  render: () => {
    const [show, setShow] = useState(false);
    return (
      <>
        <Button onClick={() => setShow(true)} className="bg-[#FFD700] text-black">
          Join Space
        </Button>
        <JoinCelebration
          isActive={show}
          spaceName="UB CS Club"
          onComplete={() => setShow(false)}
        />
      </>
    );
  },
};

export const Celebrations_FirstPost: StoryObj = {
  render: () => {
    const [show, setShow] = useState(false);
    return (
      <div className="space-y-4">
        <Button onClick={() => setShow(true)} variant="outline" size="sm">
          Trigger First Post
        </Button>
        <FirstPostCelebration
          isActive={show}
          onComplete={() => setShow(false)}
        />
      </div>
    );
  },
};

export const Celebrations_Milestones: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <MilestoneBadge type="posts" value={100} />
      <MilestoneBadge type="members" value={50} />
      <MilestoneBadge type="days" value={30} celebrate />
      <MilestoneBadge type="tools" value={5} />
    </div>
  ),
};

// ============================================================================
// IN-VIEW SCROLL ANIMATIONS
// ============================================================================

export const InView_FadeUp: StoryObj = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <p className="text-white/50 text-sm">Scroll to animate</p>
      {[1, 2, 3].map((i) => (
        <InView
          key={i}
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
        >
          <Card className="p-4 bg-neutral-900 border-neutral-800">
            <p className="text-white">Card {i} - Fade Up</p>
          </Card>
        </InView>
      ))}
    </div>
  ),
};

export const InView_ScaleUp: StoryObj = {
  render: () => (
    <InView
      variants={{
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1 },
      }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <Card className="p-8 max-w-md bg-neutral-900 border-neutral-800">
        <h3 className="text-white font-semibold mb-2">Scale Animation</h3>
        <p className="text-white/60 text-sm">
          This card scales up from 80% when visible.
        </p>
      </Card>
    </InView>
  ),
};

export const InView_SlideFromLeft: StoryObj = {
  render: () => (
    <InView
      variants={{
        hidden: { opacity: 0, x: -100 },
        visible: { opacity: 1, x: 0 },
      }}
      transition={{ duration: 0.4 }}
    >
      <Card className="p-6 bg-neutral-900 border-l-4 border-[#FFD700] max-w-md">
        <h3 className="text-white font-semibold mb-2">Slide From Left</h3>
        <p className="text-white/60 text-sm">Featured content with gold accent.</p>
      </Card>
    </InView>
  ),
};

// ============================================================================
// AUTO-ANIMATED LIST
// ============================================================================

export const AutoAnimated_List: StoryObj = {
  render: () => {
    const [items, setItems] = useState([
      { id: 1, text: 'Item 1', type: 'post' },
      { id: 2, text: 'Item 2', type: 'event' },
      { id: 3, text: 'Item 3', type: 'post' },
    ]);

    const addItem = () => {
      const newId = Math.max(...items.map(i => i.id), 0) + 1;
      setItems([...items, { id: newId, text: `Item ${newId}`, type: 'post' }]);
    };

    const removeItem = (id: number) => {
      setItems(items.filter(i => i.id !== id));
    };

    const shuffle = () => {
      setItems([...items].sort(() => Math.random() - 0.5));
    };

    return (
      <div className="space-y-4 max-w-md">
        <div className="flex gap-2">
          <Button onClick={addItem} variant="outline" size="sm">Add</Button>
          <Button onClick={shuffle} variant="ghost" size="sm">Shuffle</Button>
        </div>
        <AutoAnimated className="space-y-2">
          {items.map((item) => (
            <Card
              key={item.id}
              className="p-3 bg-neutral-900 border-neutral-800 flex justify-between items-center"
            >
              <span className="text-white">{item.text}</span>
              <Button
                onClick={() => removeItem(item.id)}
                variant="ghost"
                size="sm"
                className="text-red-400"
              >
                Remove
              </Button>
            </Card>
          ))}
        </AutoAnimated>
      </div>
    );
  },
};

// ============================================================================
// COMBINED EXAMPLES
// ============================================================================

export const Combined_AchievementCard: StoryObj = {
  render: () => (
    <Card className="p-6 max-w-sm border-neutral-800 bg-neutral-900">
      <div className="flex items-center gap-4">
        <Trophy className="h-10 w-10 text-neutral-400" />
        <div>
          <p className="text-lg font-semibold text-white">Builder Badge Earned!</p>
          <p className="text-white/50 text-sm">Created 5 tools for spaces</p>
        </div>
      </div>
    </Card>
  ),
};

export const Combined_StatsRow: StoryObj = {
  render: () => {
    const [key, setKey] = useState(0);
    return (
      <div className="space-y-4">
        <Button onClick={() => setKey(k => k + 1)} variant="outline" size="sm">
          Replay
        </Button>
        <div key={key} className="flex gap-6">
          {[
            { value: 1247, label: 'Rep', icon: TrendingUp, color: '#FFD700' },
            { value: 47, label: 'Connections', icon: Users, color: '#60A5FA' },
            { value: 12, label: 'Spaces', icon: Award, color: '#34D399' },
          ].map(({ value, label, icon: Icon, color }, i) => (
            <div key={label} className="text-center">
              <Icon className="h-5 w-5 mx-auto mb-2" style={{ color }} />
              <AnimatedNumber
                value={value}
                className="text-2xl font-bold text-white"
                springOptions={{ bounce: 0.1, duration: 1500 }}
              />
              <p className="text-white/50 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

export const Combined_LoadingToSuccess: StoryObj = {
  render: () => {
    const [state, setState] = useState<'idle' | 'loading' | 'success'>('idle');

    const simulate = () => {
      setState('loading');
      setTimeout(() => setState('success'), 2000);
      setTimeout(() => setState('idle'), 4000);
    };

    return (
      <div className="text-center space-y-6">
        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button onClick={simulate} className="bg-[#FFD700] text-black">
                Submit Action
              </Button>
            </motion.div>
          )}
          {state === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <GoldSpinner size="lg" />
              <p className="text-white">Processing...</p>
            </motion.div>
          )}
          {state === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <p className="text-2xl font-bold text-emerald-400">Success!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
};

// ============================================================================
// DOCUMENTATION STORY
// ============================================================================

export const Motion_SystemDocs: StoryObj = {
  render: () => (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-white text-xl font-bold mb-4">HIVE Motion System</h2>
        <p className="text-white/60 text-sm mb-6">
          All animations respect prefers-reduced-motion and use brand tokens.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 bg-white/5 rounded-lg">
          <h3 className="text-[#FFD700] font-semibold mb-2">Gold Effects</h3>
          <ul className="text-white/60 text-sm space-y-1">
            <li>• Achievements & badges</li>
            <li>• Rep scores & milestones</li>
            <li>• Primary CTAs</li>
            <li>• Celebration moments</li>
          </ul>
        </div>

        <div className="p-4 bg-white/5 rounded-lg">
          <h3 className="text-white font-semibold mb-2">Grayscale Effects</h3>
          <ul className="text-white/60 text-sm space-y-1">
            <li>• Hover states</li>
            <li>• Focus indicators</li>
            <li>• Page transitions</li>
            <li>• Loading skeletons</li>
          </ul>
        </div>
      </div>

      <div className="p-4 bg-white/5 rounded-lg">
        <h3 className="text-white font-semibold mb-3">Components</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            'AnimatedNumber',
            'GoldSpinner',
            'InView',
            'AutoAnimated',
            'GoldConfettiBurst',
            'JoinCelebration',
          ].map((name) => (
            <code key={name} className="text-[#FFD700] bg-black/20 px-2 py-1 rounded">
              {name}
            </code>
          ))}
        </div>
      </div>

      <div className="p-4 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg">
        <h3 className="text-[#FFD700] font-semibold mb-2">Usage Principle</h3>
        <p className="text-white/80 text-sm">
          "Gold is scarce, purposeful, never decorative."
          <br />
          <span className="text-white/50">
            Only use gold animations for genuine achievements, reputation, and primary actions.
          </span>
        </p>
      </div>
    </div>
  ),
};
