'use client';

/**
 * /tools/templates — Tool Templates Gallery
 *
 * Archetype: Discovery
 * Purpose: Browse and start from tool templates
 * Shell: ON
 *
 * GTM POLISH: Now uses real QUICK_TEMPLATES from @hive/ui
 * Shows all 25+ templates organized by category
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  BarChart2,
  Timer,
  Link2,
  Users,
  Calendar,
  MessageSquare,
  FileText,
  Sparkles,
  ClipboardList,
  Target,
  TrendingUp,
  Wallet,
  Camera,
  Trophy,
  Inbox,
  Grid,
} from 'lucide-react';
import { Text, Heading, Card, Button, Badge, Input } from '@hive/ui/design-system/primitives';
import { DiscoveryLayout, DiscoveryEmpty } from '@hive/ui';
import {
  QUICK_TEMPLATES,
  getAvailableTemplates,
  getCategoriesWithCounts,
  type QuickTemplate,
  type TemplateCategory,
} from '@hive/ui';

// Icon mapping from template icon names to Lucide components
const ICON_MAP: Record<string, React.ElementType> = {
  'bar-chart-2': BarChart2,
  'timer': Timer,
  'link-2': Link2,
  'users': Users,
  'calendar': Calendar,
  'message-square': MessageSquare,
  'file-text': FileText,
  'sparkles': Sparkles,
  'clipboard-list': ClipboardList,
  'target': Target,
  'trending-up': TrendingUp,
  'wallet': Wallet,
  'camera': Camera,
  'trophy': Trophy,
  'inbox': Inbox,
  'grid': Grid,
};

// Category display configuration
const CATEGORY_CONFIG: Record<TemplateCategory, { label: string; order: number }> = {
  apps: { label: 'Apps', order: 0 },
  events: { label: 'Events', order: 1 },
  engagement: { label: 'Engagement', order: 2 },
  resources: { label: 'Resources', order: 3 },
  feedback: { label: 'Feedback', order: 4 },
  teams: { label: 'Teams', order: 5 },
};

export default function ToolTemplatesPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState<TemplateCategory | 'all'>('all');

  // Get available templates (excludes hidden ones)
  const availableTemplates = React.useMemo(() => getAvailableTemplates(), []);

  // Get categories with counts for filter chips
  const categoriesWithCounts = React.useMemo(() => {
    const cats = getCategoriesWithCounts();
    return cats.sort((a, b) =>
      (CATEGORY_CONFIG[a.category]?.order ?? 99) - (CATEGORY_CONFIG[b.category]?.order ?? 99)
    );
  }, []);

  // Filter templates by search and category
  const filteredTemplates = React.useMemo(() => {
    return availableTemplates.filter(template => {
      const matchesSearch =
        template.name.toLowerCase().includes(search.toLowerCase()) ||
        template.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'all' || template.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [availableTemplates, search, category]);

  // Separate apps (featured) from simple templates
  const appTemplates = filteredTemplates.filter(t => t.complexity === 'app');
  const simpleTemplates = filteredTemplates.filter(t => t.complexity === 'simple');

  // Get icon component for a template
  const getIcon = (iconName: string) => {
    return ICON_MAP[iconName] || Sparkles;
  };

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
          {availableTemplates.length} templates to jumpstart your build
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
            <button
              onClick={() => setCategory('all')}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                category === 'all'
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              All ({availableTemplates.length})
            </button>
            {categoriesWithCounts.map(cat => (
              <button
                key={cat.category}
                onClick={() => setCategory(cat.category)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                  category === cat.category
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {CATEGORY_CONFIG[cat.category]?.label || cat.category} ({cat.count})
              </button>
            ))}
          </div>
        </div>

        {/* Empty state for search */}
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

        {/* Featured Apps Section */}
        {appTemplates.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Text size="sm" weight="medium" className="text-white/70">Featured Apps</Text>
              <Badge variant="gold" size="sm">Multi-element</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appTemplates.map(template => {
                const IconComponent = getIcon(template.icon);
                return (
                  <Card
                    key={template.id}
                    interactive
                    className="p-4 cursor-pointer border-[var(--hive-gold)]/10 hover:border-[var(--hive-gold)]/30 transition-colors"
                    onClick={() => router.push(`/tools?template=${template.id}`)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2.5 rounded-lg bg-[var(--hive-gold)]/10">
                        <IconComponent className="h-5 w-5 text-[var(--hive-gold)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Text weight="medium" className="truncate">{template.name}</Text>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="gold" size="sm">
                            {template.composition.elements.length} elements
                          </Badge>
                          <Text size="xs" tone="muted" className="capitalize">
                            {CATEGORY_CONFIG[template.category]?.label || template.category}
                          </Text>
                        </div>
                      </div>
                    </div>
                    <Text size="sm" tone="muted" className="line-clamp-2">
                      {template.description}
                    </Text>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Simple Templates Grid */}
        {simpleTemplates.length > 0 && (
          <div>
            {appTemplates.length > 0 && (
              <Text size="sm" weight="medium" className="text-white/70 mb-3">
                Quick Start Templates
              </Text>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {simpleTemplates.map(template => {
                const IconComponent = getIcon(template.icon);
                return (
                  <Card
                    key={template.id}
                    interactive
                    className="p-4 cursor-pointer"
                    onClick={() => router.push(`/tools?template=${template.id}`)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-white/[0.04]">
                        <IconComponent className="h-5 w-5 text-white/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Text weight="medium" className="truncate">{template.name}</Text>
                        <Text size="xs" tone="muted" className="capitalize mt-0.5">
                          {CATEGORY_CONFIG[template.category]?.label || template.category}
                        </Text>
                      </div>
                    </div>
                    <Text size="sm" tone="muted" className="line-clamp-2">
                      {template.description}
                    </Text>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Create from scratch CTA */}
        <Card className="p-4 bg-white/[0.02] border-dashed">
          <div className="flex items-center justify-between">
            <div>
              <Text weight="medium" size="sm">Want to start from scratch?</Text>
              <Text size="xs" tone="muted">Build a completely custom tool with AI assistance</Text>
            </div>
            <Button variant="secondary" size="sm" onClick={() => router.push('/tools')}>
              Blank Canvas
            </Button>
          </div>
        </Card>
      </div>
    </DiscoveryLayout>
  );
}
