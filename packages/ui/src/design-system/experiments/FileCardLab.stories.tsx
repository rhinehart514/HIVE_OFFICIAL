'use client';

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Image, Film, Music, Archive, File, Download, Eye } from 'lucide-react';

// Import locked primitives
import { Card } from '../primitives/Card';
import { Text } from '../primitives/Text';
import { Badge } from '../primitives/Badge';
import { Icon } from '../primitives/Icon';

// ============================================
// FILE TYPE CONFIG
// ============================================

const fileTypes = {
  pdf: { icon: FileText, color: '#ef4444', label: 'PDF' },
  image: { icon: Image, color: '#22c55e', label: 'Image' },
  video: { icon: Film, color: '#8b5cf6', label: 'Video' },
  audio: { icon: Music, color: '#f59e0b', label: 'Audio' },
  archive: { icon: Archive, color: '#6366f1', label: 'Archive' },
  other: { icon: File, color: '#A3A19E', label: 'File' },
};

const mockFile = {
  name: 'Project_Proposal_v2.pdf',
  type: 'pdf' as keyof typeof fileTypes,
  size: '2.4 MB',
  date: 'Jan 10, 2026',
  uploadedBy: 'Sarah Chen',
};

// ============================================
// META
// ============================================

const meta: Meta = {
  title: 'Experiments/FileCard Lab',
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'hive-dark' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * COMPONENT: FileCard
 * STATUS: IN LAB — Awaiting Jacob's selection
 *
 * Uses primitives: Card, Text, Badge, Icon
 *
 * Variables to test:
 * 1. Icon Style — How file type is visualized
 * 2. Layout — Content arrangement
 * 3. Metadata Display — What info is shown
 * 4. Hover Behavior — Interaction feedback
 */

// ============================================
// VARIABLE 1: Icon Style
// ============================================

export const Variable1_IconStyle: Story = {
  render: () => {
    const FileType = fileTypes[mockFile.type];
    const IconComponent = FileType.icon;

    return (
      <div className="flex flex-col gap-8 p-6">
        <Text tone="muted" size="sm">How should the file type icon be displayed?</Text>

        <div className="grid grid-cols-3 gap-6">
          {/* A: Large Centered */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">A: Large Centered</Text>
            <Card size="default" className="w-[200px] flex flex-col items-center gap-3">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: `${FileType.color}15` }}
              >
                <IconComponent className="w-8 h-8" style={{ color: FileType.color }} />
              </div>
              <div className="text-center">
                <Text weight="medium" size="sm">{mockFile.name}</Text>
                <Text tone="secondary" size="xs" className="mt-1">{mockFile.size}</Text>
              </div>
            </Card>
          </div>

          {/* B: Small Left Icon */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">B: Small Left Icon</Text>
            <Card size="compact" className="w-[200px] flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${FileType.color}15` }}
              >
                <IconComponent className="w-5 h-5" style={{ color: FileType.color }} />
              </div>
              <div className="min-w-0">
                <Text weight="medium" size="sm" truncate>{mockFile.name}</Text>
                <Text tone="secondary" size="xs">{mockFile.size}</Text>
              </div>
            </Card>
          </div>

          {/* C: Colored Dot */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">C: Colored Dot</Text>
            <Card size="compact" className="w-[200px] flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: FileType.color }}
              />
              <div className="min-w-0">
                <Text weight="medium" size="sm" truncate>{mockFile.name}</Text>
                <Text tone="secondary" size="xs">{mockFile.size} · {FileType.label}</Text>
              </div>
            </Card>
          </div>

          {/* D: Corner Badge */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">D: Corner Badge</Text>
            <Card size="compact" className="w-[200px] relative">
              <div
                className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-md text-label-xs font-semibold text-white uppercase"
                style={{ backgroundColor: FileType.color }}
              >
                {FileType.label}
              </div>
              <Text weight="medium" size="sm">{mockFile.name}</Text>
              <Text tone="secondary" size="xs" className="mt-1">{mockFile.size}</Text>
            </Card>
          </div>

          {/* E: Inline Type Label */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">E: Inline Type Label</Text>
            <Card size="compact" className="w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="px-1.5 py-0.5 rounded text-label-xs font-semibold uppercase"
                  style={{ backgroundColor: `${FileType.color}20`, color: FileType.color }}
                >
                  {FileType.label}
                </span>
                <Text tone="secondary" size="xs">{mockFile.size}</Text>
              </div>
              <Text weight="medium" size="sm">{mockFile.name}</Text>
            </Card>
          </div>

          {/* RECOMMENDED */}
          <div className="flex flex-col gap-2">
            <Text size="xs" className="uppercase tracking-wider text-[#FFD700] font-semibold">★ Recommended</Text>
            <Card size="compact" warmth="low" className="w-[200px] flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${FileType.color}15` }}
              >
                <IconComponent className="w-5 h-5" style={{ color: FileType.color }} />
              </div>
              <div className="min-w-0">
                <Text weight="medium" size="sm" truncate>{mockFile.name}</Text>
                <Text tone="secondary" size="xs">{mockFile.size}</Text>
              </div>
            </Card>
            <Text size="xs" tone="muted" className="max-w-[200px]">
              B: Small Left — compact, scannable, type-aware
            </Text>
          </div>
        </div>
      </div>
    );
  },
};

// ============================================
// VARIABLE 2: Layout
// ============================================

export const Variable2_Layout: Story = {
  render: () => {
    const FileType = fileTypes[mockFile.type];
    const IconComponent = FileType.icon;

    return (
      <div className="flex flex-col gap-8 p-6">
        <Text tone="muted" size="sm">How should content be arranged?</Text>

        <div className="grid grid-cols-3 gap-6">
          {/* A: Horizontal Row */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">A: Horizontal Row</Text>
            <Card size="compact" noPadding className="w-[280px] px-4 py-3 flex items-center gap-3">
              <IconComponent className="w-[18px] h-[18px] shrink-0" style={{ color: FileType.color }} />
              <Text size="sm" className="flex-1 truncate">{mockFile.name}</Text>
              <Text tone="muted" size="xs" className="shrink-0">{mockFile.size}</Text>
            </Card>
          </div>

          {/* B: Vertical Stack */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">B: Vertical Stack</Text>
            <Card className="w-[160px] flex flex-col items-center gap-3 text-center">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${FileType.color}15` }}
              >
                <IconComponent className="w-6 h-6" style={{ color: FileType.color }} />
              </div>
              <div>
                <Text weight="medium" size="xs">{mockFile.name.slice(0, 20)}...</Text>
                <Text tone="secondary" size="xs" className="mt-1">{mockFile.size}</Text>
              </div>
            </Card>
          </div>

          {/* C: Compact Pill */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">C: Compact Pill</Text>
            <Card size="tooltip" noPadding className="inline-flex items-center gap-2 px-3 py-2 rounded-full">
              <IconComponent className="w-3.5 h-3.5" style={{ color: FileType.color }} />
              <Text size="xs">{mockFile.name.slice(0, 15)}...</Text>
            </Card>
          </div>

          {/* D: List Item */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">D: List Item</Text>
            <Card size="compact" noPadding className="w-[320px] px-4 py-3 flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${FileType.color}15` }}
              >
                <IconComponent className="w-[18px] h-[18px]" style={{ color: FileType.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <Text weight="medium" size="sm" truncate>{mockFile.name}</Text>
                <Text tone="muted" size="xs">{mockFile.uploadedBy} · {mockFile.date}</Text>
              </div>
              <Text tone="secondary" size="xs" className="shrink-0">{mockFile.size}</Text>
            </Card>
          </div>

          {/* E: Mini Thumbnail */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">E: Mini Thumbnail</Text>
            <Card noPadding className="w-[100px] overflow-hidden">
              <div
                className="h-[70px] flex items-center justify-center"
                style={{ backgroundColor: `${FileType.color}10` }}
              >
                <IconComponent className="w-7 h-7" style={{ color: FileType.color }} />
              </div>
              <div className="p-2.5">
                <Text weight="medium" size="xs" truncate>{mockFile.name.slice(0, 12)}...</Text>
              </div>
            </Card>
          </div>

          {/* RECOMMENDED */}
          <div className="flex flex-col gap-2">
            <Text size="xs" className="uppercase tracking-wider text-[#FFD700] font-semibold">★ Recommended</Text>
            <Card size="compact" warmth="low" noPadding className="w-[320px] px-4 py-3 flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${FileType.color}15` }}
              >
                <IconComponent className="w-[18px] h-[18px]" style={{ color: FileType.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <Text weight="medium" size="sm" truncate>{mockFile.name}</Text>
                <Text tone="muted" size="xs">{mockFile.uploadedBy} · {mockFile.date}</Text>
              </div>
              <Text tone="secondary" size="xs" className="shrink-0">{mockFile.size}</Text>
            </Card>
            <Text size="xs" tone="muted" className="max-w-[320px]">
              D: List Item — full context, uploader attribution, scannable
            </Text>
          </div>
        </div>
      </div>
    );
  },
};

// ============================================
// VARIABLE 3: Metadata Display
// ============================================

export const Variable3_MetadataDisplay: Story = {
  render: () => {
    const FileType = fileTypes[mockFile.type];
    const IconComponent = FileType.icon;

    return (
      <div className="flex flex-col gap-8 p-6">
        <Text tone="muted" size="sm">What metadata should be visible?</Text>

        <div className="grid grid-cols-3 gap-6">
          {/* A: Minimal */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">A: Minimal</Text>
            <Card size="compact" noPadding className="w-[240px] px-4 py-3.5 flex items-center gap-3">
              <IconComponent className="w-[18px] h-[18px]" style={{ color: FileType.color }} />
              <Text size="sm">{mockFile.name}</Text>
            </Card>
          </div>

          {/* B: Standard */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">B: Standard</Text>
            <Card size="compact" noPadding className="w-[240px] px-4 py-3 flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${FileType.color}15` }}
              >
                <IconComponent className="w-[18px] h-[18px]" style={{ color: FileType.color }} />
              </div>
              <div className="flex-1">
                <Text weight="medium" size="sm">{mockFile.name}</Text>
                <Text tone="secondary" size="xs">{mockFile.size}</Text>
              </div>
            </Card>
          </div>

          {/* C: Detailed */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">C: Detailed</Text>
            <Card size="compact" noPadding className="w-[280px] px-4 py-3.5 flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${FileType.color}15` }}
              >
                <IconComponent className="w-5 h-5" style={{ color: FileType.color }} />
              </div>
              <div className="flex-1">
                <Text weight="medium" size="sm">{mockFile.name}</Text>
                <Text tone="secondary" size="xs" className="mt-0.5">{mockFile.size} · {FileType.label}</Text>
                <Text tone="muted" size="xs" className="mt-1">Uploaded by {mockFile.uploadedBy} · {mockFile.date}</Text>
              </div>
            </Card>
          </div>

          {/* D: Progressive (reveals on hover) */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">D: Progressive (hover)</Text>
            <HoverRevealCard file={mockFile} fileType={FileType} />
          </div>

          {/* E: Badge Meta */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">E: Badge Meta</Text>
            <Card size="compact" noPadding className="w-[240px] px-4 py-3.5">
              <div className="flex gap-1.5 mb-2.5">
                <Badge variant="neutral" size="sm" style={{ backgroundColor: `${FileType.color}20`, color: FileType.color }}>
                  {FileType.label}
                </Badge>
                <Badge variant="neutral" size="sm">{mockFile.size}</Badge>
              </div>
              <Text weight="medium" size="sm">{mockFile.name}</Text>
            </Card>
          </div>

          {/* RECOMMENDED */}
          <div className="flex flex-col gap-2">
            <Text size="xs" className="uppercase tracking-wider text-[#FFD700] font-semibold">★ Recommended</Text>
            <Card size="compact" warmth="low" noPadding className="w-[280px] px-4 py-3 flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${FileType.color}15` }}
              >
                <IconComponent className="w-[18px] h-[18px]" style={{ color: FileType.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <Text weight="medium" size="sm" truncate>{mockFile.name}</Text>
                <Text tone="muted" size="xs">{mockFile.uploadedBy} · {mockFile.date}</Text>
              </div>
              <Text tone="secondary" size="xs" className="shrink-0">{mockFile.size}</Text>
            </Card>
            <Text size="xs" tone="muted" className="max-w-[280px]">
              C variant inline — uploader + date visible, size right-aligned
            </Text>
          </div>
        </div>
      </div>
    );
  },
};

// Helper: Progressive reveal on hover
const HoverRevealCard = ({ file, fileType }: { file: typeof mockFile; fileType: typeof fileTypes.pdf }) => {
  const [hovered, setHovered] = React.useState(false);
  const IconComponent = fileType.icon;

  return (
    <Card
      size="compact"
      interactive
      noPadding
      className="w-[240px] px-4 py-3 flex items-center gap-3"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${fileType.color}15` }}
      >
        <IconComponent className="w-[18px] h-[18px]" style={{ color: fileType.color }} />
      </div>
      <div className="flex-1">
        <Text weight="medium" size="sm">{file.name}</Text>
        <div
          className="transition-all duration-200"
          style={{
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateY(0)' : 'translateY(-4px)',
          }}
        >
          <Text tone="secondary" size="xs">{file.size} · {file.date}</Text>
        </div>
      </div>
    </Card>
  );
};

// ============================================
// VARIABLE 4: Hover Behavior
// ============================================

export const Variable4_HoverBehavior: Story = {
  render: () => {
    const FileType = fileTypes[mockFile.type];
    const IconComponent = FileType.icon;

    const BaseCardContent = () => (
      <>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${FileType.color}15` }}
        >
          <IconComponent className="w-[18px] h-[18px]" style={{ color: FileType.color }} />
        </div>
        <div className="flex-1">
          <Text weight="medium" size="sm">{mockFile.name}</Text>
          <Text tone="secondary" size="xs">{mockFile.size}</Text>
        </div>
      </>
    );

    return (
      <div className="flex flex-col gap-8 p-6">
        <Text tone="muted" size="sm">Hover each card to compare feedback styles.</Text>

        <div className="grid grid-cols-3 gap-6">
          {/* A: None */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">A: None</Text>
            <Card size="compact" noPadding className="w-[260px] px-4 py-3 flex items-center gap-3 cursor-pointer">
              <BaseCardContent />
            </Card>
          </div>

          {/* B: Lift + Shadow (using Card interactive) */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">B: Brightness (Card interactive)</Text>
            <Card size="compact" interactive noPadding className="w-[260px] px-4 py-3 flex items-center gap-3">
              <BaseCardContent />
            </Card>
          </div>

          {/* C: Lift + Shadow (motion) */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">C: Lift + Shadow</Text>
            <motion.div whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }} transition={{ duration: 0.2 }}>
              <Card size="compact" noPadding className="w-[260px] px-4 py-3 flex items-center gap-3 cursor-pointer">
                <BaseCardContent />
              </Card>
            </motion.div>
          </div>

          {/* D: Scale Subtle */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">D: Scale Subtle</Text>
            <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <Card size="compact" noPadding className="w-[260px] px-4 py-3 flex items-center gap-3 cursor-pointer">
                <BaseCardContent />
              </Card>
            </motion.div>
          </div>

          {/* E: Reveal Actions */}
          <div className="flex flex-col gap-2">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">E: Reveal Actions</Text>
            <HoverActionsCard file={mockFile} fileType={FileType} />
          </div>

          {/* RECOMMENDED */}
          <div className="flex flex-col gap-2">
            <Text size="xs" className="uppercase tracking-wider text-[#FFD700] font-semibold">★ Recommended</Text>
            <HoverRecommendedCard file={mockFile} fileType={FileType} />
            <Text size="xs" tone="muted" className="max-w-[260px]">
              B + E: Card interactive + reveal actions
            </Text>
          </div>
        </div>
      </div>
    );
  },
};

// Helper: Reveal actions on hover
const HoverActionsCard = ({ file, fileType }: { file: typeof mockFile; fileType: typeof fileTypes.pdf }) => {
  const [hovered, setHovered] = React.useState(false);
  const IconComponent = fileType.icon;

  return (
    <Card
      size="compact"
      noPadding
      className="w-[260px] px-4 py-3 flex items-center gap-3 cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${fileType.color}15` }}
      >
        <IconComponent className="w-[18px] h-[18px]" style={{ color: fileType.color }} />
      </div>
      <div className="flex-1">
        <Text weight="medium" size="sm">{file.name}</Text>
        <Text tone="secondary" size="xs">{file.size}</Text>
      </div>
      <div
        className="flex gap-1 transition-all duration-200"
        style={{
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateX(0)' : 'translateX(8px)',
        }}
      >
        <button className="p-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-[#A3A19E] transition-colors">
          <Eye className="w-3.5 h-3.5" />
        </button>
        <button className="p-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-[#A3A19E] transition-colors">
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>
    </Card>
  );
};

// Helper: Recommended combo
const HoverRecommendedCard = ({ file, fileType }: { file: typeof mockFile; fileType: typeof fileTypes.pdf }) => {
  const [hovered, setHovered] = React.useState(false);
  const IconComponent = fileType.icon;

  return (
    <Card
      size="compact"
      interactive
      warmth="low"
      noPadding
      className="w-[260px] px-4 py-3 flex items-center gap-3"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${fileType.color}15` }}
      >
        <IconComponent className="w-[18px] h-[18px]" style={{ color: fileType.color }} />
      </div>
      <div className="flex-1">
        <Text weight="medium" size="sm">{file.name}</Text>
        <Text tone="secondary" size="xs">{file.size}</Text>
      </div>
      <div
        className="flex gap-1 transition-all duration-200"
        style={{
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateX(0)' : 'translateX(8px)',
        }}
      >
        <button className="p-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-[#A3A19E] transition-colors">
          <Eye className="w-3.5 h-3.5" />
        </button>
        <button className="p-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-[#A3A19E] transition-colors">
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>
    </Card>
  );
};
