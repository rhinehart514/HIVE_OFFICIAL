'use client';

/**
 * /tools/templates — Tool Templates Gallery
 *
 * Archetype: Discovery
 * Purpose: Browse and start from tool templates
 * Shell: ON
 *
 * Per HIVE App Map v1:
 * - Browse tool templates organized by category
 * - Preview template capabilities
 * - Start new tool from template
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Zap, Calculator, FileText, Calendar, Users, Search } from 'lucide-react';
import { Text, Heading, Card, Button, Badge, Input } from '@hive/ui/design-system/primitives';
import { DiscoveryLayout, DiscoveryList, DiscoveryEmpty } from '@hive/ui';

interface ToolTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ElementType;
  popularity: number;
  complexity: 'simple' | 'medium' | 'advanced';
}

const TEMPLATES: ToolTemplate[] = [
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'Basic arithmetic and scientific calculations',
    category: 'utility',
    icon: Calculator,
    popularity: 342,
    complexity: 'simple',
  },
  {
    id: 'form-builder',
    name: 'Form Builder',
    description: 'Create surveys, signups, and data collection forms',
    category: 'productivity',
    icon: FileText,
    popularity: 256,
    complexity: 'medium',
  },
  {
    id: 'event-rsvp',
    name: 'Event RSVP',
    description: 'Manage event registrations and attendance',
    category: 'events',
    icon: Calendar,
    popularity: 189,
    complexity: 'medium',
  },
  {
    id: 'team-randomizer',
    name: 'Team Randomizer',
    description: 'Randomly assign people to teams or groups',
    category: 'utility',
    icon: Users,
    popularity: 145,
    complexity: 'simple',
  },
  {
    id: 'ai-assistant',
    name: 'AI Assistant',
    description: 'Custom AI-powered helper for your space',
    category: 'ai',
    icon: Sparkles,
    popularity: 423,
    complexity: 'advanced',
  },
  {
    id: 'quick-poll',
    name: 'Quick Poll',
    description: 'Create instant polls and gather feedback',
    category: 'engagement',
    icon: Zap,
    popularity: 312,
    complexity: 'simple',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'utility', label: 'Utility' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'events', label: 'Events' },
  { id: 'ai', label: 'AI' },
  { id: 'engagement', label: 'Engagement' },
];

export default function ToolTemplatesPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState('all');

  // Filter templates
  const filteredTemplates = TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(search.toLowerCase()) ||
      template.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || template.category === category;
    return matchesSearch && matchesCategory;
  });

  // Header
  const header = (
    <div className="flex items-center gap-3">
      <Link
        href="/tools"
        className="p-2 -ml-2 text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <div>
        <Heading level={1} className="text-xl">
          Templates
        </Heading>
        <Text size="sm" tone="muted">
          Start with a pre-built foundation
        </Text>
      </div>
    </div>
  );

  return (
    <DiscoveryLayout header={header}>
      <div className="space-y-6">
        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                  category === cat.id
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {filteredTemplates.length === 0 && (
          <DiscoveryEmpty
            message="No templates match your search"
            action={
              <Button variant="secondary" onClick={() => { setSearch(''); setCategory('all'); }}>
                Clear Filters
              </Button>
            }
          />
        )}

        {/* Templates grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <Card
              key={template.id}
              interactive
              className="p-4 cursor-pointer"
              onClick={() => router.push(`/tools/new?template=${template.id}`)}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg bg-white/[0.04]">
                  <template.icon className="h-5 w-5 text-white/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <Text weight="medium" className="truncate">{template.name}</Text>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge
                      variant={template.complexity === 'simple' ? 'neutral' : template.complexity === 'medium' ? 'neutral' : 'neutral'}
                      size="sm"
                    >
                      {template.complexity}
                    </Badge>
                    <Text size="xs" tone="muted">
                      {template.popularity} uses
                    </Text>
                  </div>
                </div>
              </div>
              <Text size="sm" tone="muted" className="line-clamp-2">
                {template.description}
              </Text>
            </Card>
          ))}
        </div>

        {/* Create from scratch CTA */}
        <Card className="p-4 bg-white/[0.02] border-dashed">
          <div className="flex items-center justify-between">
            <div>
              <Text weight="medium" size="sm">Want to start from scratch?</Text>
              <Text size="xs" tone="muted">Build a completely custom tool</Text>
            </div>
            <Button variant="secondary" size="sm" onClick={() => router.push('/tools/new')}>
              Blank Tool
            </Button>
          </div>
        </Card>
      </div>
    </DiscoveryLayout>
  );
}
