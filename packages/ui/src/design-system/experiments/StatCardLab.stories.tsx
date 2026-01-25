'use client';

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';

// Import locked primitives
import { Card } from '../primitives/Card';
import { Text } from '../primitives/Text';
import { Mono } from '../primitives/Mono';
import { Badge } from '../primitives/Badge';

// ============================================
// MOCK DATA
// ============================================

const mockStat = {
  label: 'Active Members',
  value: 1247,
  change: 12.5,
  trend: 'up' as const,
  icon: Users,
};

// ============================================
// META
// ============================================

const meta: Meta = {
  title: 'Experiments/StatCard Lab',
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'hive-dark' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * COMPONENT: StatCard
 * STATUS: IN LAB — Awaiting Jacob's selection
 *
 * Uses primitives: Card, Text, Mono, Badge
 *
 * Variables to test:
 * 1. Value Display — How the number is shown
 * 2. Trend Indicator — How change is visualized
 * 3. Layout — Arrangement of elements
 * 4. Density — Size and spacing
 */

// ============================================
// VARIABLE 1: Value Display
// ============================================

export const Variable1_ValueDisplay: Story = {
  render: () => {
    const IconComponent = mockStat.icon;

    return (
      <div className="flex flex-col gap-8 p-6">
        <Text tone="muted" size="sm">How should the main value be displayed?</Text>

        <div className="grid grid-cols-3 gap-6">
          {/* A: Large Number */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">A: Large Number</Text>
            <Card className="w-[180px]">
              <Text tone="secondary" size="xs" className="mb-2">{mockStat.label}</Text>
              <Mono className="text-4xl font-bold">{mockStat.value.toLocaleString()}</Mono>
            </Card>
          </div>

          {/* B: Compact with Suffix */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">B: Compact Suffix</Text>
            <Card className="w-[180px]">
              <Text tone="secondary" size="xs" className="mb-2">{mockStat.label}</Text>
              <div className="flex items-baseline gap-1">
                <Text className="text-heading font-bold">1.2</Text>
                <Text tone="secondary" size="lg">K</Text>
              </div>
            </Card>
          </div>

          {/* C: With Icon */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">C: With Icon</Text>
            <Card className="w-[180px] flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
                <IconComponent className="w-5 h-5 text-[#A3A19E]" />
              </div>
              <div>
                <Text tone="muted" size="xs" className="mb-1">{mockStat.label}</Text>
                <Text className="text-2xl font-bold">{mockStat.value.toLocaleString()}</Text>
              </div>
            </Card>
          </div>

          {/* D: Mono Display */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">D: Mono Display</Text>
            <Card className="w-[180px]">
              <Text tone="secondary" size="xs" className="mb-2">{mockStat.label}</Text>
              <Mono className="text-heading-sm font-medium tracking-tight">{mockStat.value.toLocaleString()}</Mono>
            </Card>
          </div>

          {/* E: Gradient Accent */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">E: Gradient Accent</Text>
            <Card className="w-[180px]">
              <Text tone="secondary" size="xs" className="mb-2">{mockStat.label}</Text>
              <span
                className="text-heading font-bold"
                style={{
                  background: 'linear-gradient(135deg, #FAF9F7 0%, #FFD700 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {mockStat.value.toLocaleString()}
              </span>
            </Card>
          </div>

          {/* RECOMMENDED */}
          <div className="flex flex-col gap-2">
            <Text size="xs" className="uppercase tracking-wider text-[#FFD700] font-semibold">★ Recommended</Text>
            <Card warmth="low" className="w-[180px]">
              <Text tone="secondary" size="xs" className="mb-2">{mockStat.label}</Text>
              <Mono className="text-heading-sm font-semibold tracking-tight">{mockStat.value.toLocaleString()}</Mono>
            </Card>
            <Text size="xs" tone="muted" className="max-w-[180px]">
              D: Mono Display — precise, data-forward, minimal
            </Text>
          </div>
        </div>
      </div>
    );
  },
};

// ============================================
// VARIABLE 2: Trend Indicator
// ============================================

export const Variable2_TrendIndicator: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-8 p-6">
        <Text tone="muted" size="sm">How should trend/change be visualized?</Text>

        <div className="grid grid-cols-3 gap-6">
          {/* A: Arrow + Percentage */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">A: Arrow + Percentage</Text>
            <Card className="w-[180px]">
              <Text tone="secondary" size="xs" className="mb-2">{mockStat.label}</Text>
              <Mono className="text-heading-sm font-semibold mb-2">{mockStat.value.toLocaleString()}</Mono>
              <div className="flex items-center gap-1 text-green-400">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <Text size="xs" weight="medium" className="text-green-400">+{mockStat.change}%</Text>
              </div>
            </Card>
          </div>

          {/* B: Chip Badge */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">B: Chip Badge</Text>
            <Card className="w-[180px]">
              <div className="flex items-center justify-between mb-2">
                <Text tone="secondary" size="xs">{mockStat.label}</Text>
                <Badge variant="success" size="sm">+{mockStat.change}%</Badge>
              </div>
              <Mono className="text-heading-sm font-semibold">{mockStat.value.toLocaleString()}</Mono>
            </Card>
          </div>

          {/* C: Inline Trend */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">C: Inline Trend</Text>
            <Card className="w-[180px]">
              <Text tone="secondary" size="xs" className="mb-2">{mockStat.label}</Text>
              <div className="flex items-baseline gap-2">
                <Mono className="text-heading-sm font-semibold">{mockStat.value.toLocaleString()}</Mono>
                <Text size="sm" className="text-green-400">↑{mockStat.change}%</Text>
              </div>
            </Card>
          </div>

          {/* D: Trend Line */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">D: Trend Line</Text>
            <Card className="w-[180px]">
              <Text tone="secondary" size="xs" className="mb-2">{mockStat.label}</Text>
              <Mono className="text-heading-sm font-semibold mb-3">{mockStat.value.toLocaleString()}</Mono>
              <svg width="140" height="24" viewBox="0 0 140 24">
                <path
                  d="M0 20 Q35 18, 70 12 T140 4"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </Card>
          </div>

          {/* E: Comparison Bar */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">E: Comparison Bar</Text>
            <Card className="w-[180px]">
              <Text tone="secondary" size="xs" className="mb-2">{mockStat.label}</Text>
              <Mono className="text-heading-sm font-semibold mb-3">{mockStat.value.toLocaleString()}</Mono>
              <div className="flex gap-2 items-center">
                <div className="flex-1 h-1 rounded-full bg-white/[0.06]">
                  <div className="w-[65%] h-full rounded-full bg-green-500" />
                </div>
                <Text size="xs" className="text-green-400 shrink-0">+{mockStat.change}%</Text>
              </div>
            </Card>
          </div>

          {/* RECOMMENDED */}
          <div className="flex flex-col gap-2">
            <Text size="xs" className="uppercase tracking-wider text-[#FFD700] font-semibold">★ Recommended</Text>
            <Card warmth="low" className="w-[180px]">
              <div className="flex items-center justify-between mb-2">
                <Text tone="secondary" size="xs">{mockStat.label}</Text>
                <Badge variant="success" size="sm">+{mockStat.change}%</Badge>
              </div>
              <Mono className="text-heading-sm font-semibold">{mockStat.value.toLocaleString()}</Mono>
            </Card>
            <Text size="xs" tone="muted" className="max-w-[180px]">
              B: Chip Badge — compact, scannable, color-coded
            </Text>
          </div>
        </div>
      </div>
    );
  },
};

// ============================================
// VARIABLE 3: Layout
// ============================================

export const Variable3_Layout: Story = {
  render: () => {
    const IconComponent = mockStat.icon;

    return (
      <div className="flex flex-col gap-8 p-6">
        <Text tone="muted" size="sm">How should elements be arranged?</Text>

        <div className="grid grid-cols-3 gap-6">
          {/* A: Vertical Stack */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">A: Vertical Stack</Text>
            <Card className="w-[160px] text-center">
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center mx-auto mb-3">
                <IconComponent className="w-5 h-5 text-[#A3A19E]" />
              </div>
              <Mono className="text-heading-sm font-semibold">{mockStat.value.toLocaleString()}</Mono>
              <Text tone="secondary" size="xs" className="mt-1">{mockStat.label}</Text>
            </Card>
          </div>

          {/* B: Horizontal Split */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">B: Horizontal Split</Text>
            <Card noPadding className="w-[220px] px-5 py-4 flex items-center justify-between">
              <div>
                <Text tone="secondary" size="xs" className="mb-1">{mockStat.label}</Text>
                <Mono className="text-2xl font-semibold">{mockStat.value.toLocaleString()}</Mono>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
                <IconComponent className="w-5 h-5 text-[#A3A19E]" />
              </div>
            </Card>
          </div>

          {/* C: Compact Row */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">C: Compact Row</Text>
            <Card size="compact" noPadding className="w-[200px] px-4 py-3 flex items-center gap-3">
              <IconComponent className="w-[18px] h-[18px] text-[#A3A19E]" />
              <Text tone="secondary" size="xs" className="flex-1">{mockStat.label}</Text>
              <Mono size="sm" className="font-semibold">{mockStat.value.toLocaleString()}</Mono>
            </Card>
          </div>

          {/* D: Mini Card */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">D: Mini Card</Text>
            <Card noPadding className="w-[120px] px-4 py-4">
              <Text tone="muted" size="xs" className="uppercase tracking-wider mb-2">
                {mockStat.label.split(' ')[0]}
              </Text>
              <Mono className="text-2xl font-bold">1.2K</Mono>
            </Card>
          </div>

          {/* E: Wide Banner */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">E: Wide Banner</Text>
            <Card noPadding className="w-[280px] px-5 py-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center">
                <IconComponent className="w-6 h-6 text-[#A3A19E]" />
              </div>
              <div className="flex-1">
                <Text tone="secondary" size="xs">{mockStat.label}</Text>
                <Mono className="text-2xl font-semibold">{mockStat.value.toLocaleString()}</Mono>
              </div>
              <div className="flex items-center gap-1 text-green-400">
                <ArrowUpRight className="w-4 h-4" />
                <Text size="sm" weight="medium" className="text-green-400">{mockStat.change}%</Text>
              </div>
            </Card>
          </div>

          {/* RECOMMENDED */}
          <div className="flex flex-col gap-2">
            <Text size="xs" className="uppercase tracking-wider text-[#FFD700] font-semibold">★ Recommended</Text>
            <Card warmth="low" className="w-[180px]">
              <div className="flex items-center justify-between mb-2">
                <Text tone="secondary" size="xs">{mockStat.label}</Text>
                <Badge variant="success" size="sm">+{mockStat.change}%</Badge>
              </div>
              <Mono className="text-heading-sm font-semibold">{mockStat.value.toLocaleString()}</Mono>
            </Card>
            <Text size="xs" tone="muted" className="max-w-[180px]">
              Simple vertical — label top, value prominent, badge trend
            </Text>
          </div>
        </div>
      </div>
    );
  },
};

// ============================================
// VARIABLE 4: Density
// ============================================

export const Variable4_Density: Story = {
  render: () => {
    const stats = [
      { label: 'Members', value: 1247, change: 12.5, trend: 'up' as const },
      { label: 'Messages', value: 8432, change: -3.2, trend: 'down' as const },
      { label: 'Active', value: 847, change: 8.1, trend: 'up' as const },
    ];

    return (
      <div className="flex flex-col gap-8 p-6">
        <Text tone="muted" size="sm">How dense should the stat cards be? (Shown in groups of 3)</Text>

        <div className="flex flex-col gap-8">
          {/* A: Spacious */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">A: Spacious</Text>
            <div className="flex gap-4">
              {stats.map((stat, i) => (
                <Card key={i} noPadding className="w-[180px] px-6 py-6">
                  <Text tone="secondary" size="xs" className="mb-3">{stat.label}</Text>
                  <Mono className="text-heading font-semibold">{stat.value.toLocaleString()}</Mono>
                </Card>
              ))}
            </div>
          </div>

          {/* B: Comfortable */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">B: Comfortable</Text>
            <div className="flex gap-3">
              {stats.map((stat, i) => (
                <Card key={i} className="w-[160px]">
                  <Text tone="secondary" size="xs" className="mb-2">{stat.label}</Text>
                  <Mono className="text-heading-sm font-semibold">{stat.value.toLocaleString()}</Mono>
                </Card>
              ))}
            </div>
          </div>

          {/* C: Compact */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">C: Compact</Text>
            <div className="flex gap-2">
              {stats.map((stat, i) => (
                <Card key={i} size="compact" noPadding className="w-[140px] px-4 py-4">
                  <Text tone="muted" size="xs" className="mb-1.5">{stat.label}</Text>
                  <Mono className="text-2xl font-semibold">{stat.value.toLocaleString()}</Mono>
                </Card>
              ))}
            </div>
          </div>

          {/* D: Dense */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">D: Dense</Text>
            <div className="flex gap-1.5">
              {stats.map((stat, i) => (
                <Card key={i} size="compact" noPadding className="w-[120px] px-3 py-3">
                  <Text tone="muted" size="xs" className="uppercase tracking-wider mb-1">{stat.label}</Text>
                  <Mono size="sm" className="text-xl font-semibold">{stat.value.toLocaleString()}</Mono>
                </Card>
              ))}
            </div>
          </div>

          {/* E: Inline */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">E: Inline</Text>
            <Card size="compact" noPadding className="inline-flex gap-6 px-5 py-3">
              {stats.map((stat, i) => (
                <div key={i} className="flex items-baseline gap-2">
                  <Mono className="text-xl font-semibold">{stat.value.toLocaleString()}</Mono>
                  <Text tone="muted" size="xs">{stat.label}</Text>
                </div>
              ))}
            </Card>
          </div>

          {/* RECOMMENDED */}
          <div className="flex flex-col gap-2">
            <Text size="xs" className="uppercase tracking-wider text-[#FFD700] font-semibold">★ Recommended</Text>
            <div className="flex gap-3">
              {stats.map((stat, i) => (
                <Card key={i} warmth="low" className="w-[160px]">
                  <div className="flex items-center justify-between mb-2">
                    <Text tone="secondary" size="xs">{stat.label}</Text>
                    <Badge variant={stat.trend === 'up' ? 'success' : 'error'} size="sm">
                      {stat.trend === 'up' ? '+' : ''}{stat.change}%
                    </Badge>
                  </div>
                  <Mono className="text-heading-sm font-semibold">{stat.value.toLocaleString()}</Mono>
                </Card>
              ))}
            </div>
            <Text size="xs" tone="muted">
              B: Comfortable — balanced readability, room to breathe, trend badges
            </Text>
          </div>
        </div>
      </div>
    );
  },
};
