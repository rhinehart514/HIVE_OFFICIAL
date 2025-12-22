'use client';

/**
 * TemplateSuggestions - Suggest templates based on space category
 *
 * Shows relevant tool templates after space creation or in the
 * space settings to help leaders get started quickly.
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ChevronRight,
  Loader2,
  BarChart3,
  Calendar,
  Users,
  TrendingUp,
  Megaphone,
  GraduationCap,
  Gamepad2,
  ListTodo,
  Grid3X3,
} from 'lucide-react';
import { cn } from '../../lib/utils';

// ============================================================================
// Types
// ============================================================================

interface TemplateItem {
  id: string;
  name: string;
  description: string;
  category: string;
  elementCount: number;
  usageCount: number;
  isFeatured: boolean;
}

export interface TemplateSuggestionsProps {
  /** Space category to suggest templates for */
  spaceCategory?: string;
  /** Maximum number of suggestions to show */
  maxSuggestions?: number;
  /** Callback when a template is selected */
  onSelectTemplate?: (templateId: string) => void;
  /** Additional class names */
  className?: string;
  /** Show as a compact card */
  compact?: boolean;
}

// ============================================================================
// Category to Template Category Mapping
// ============================================================================

const SPACE_TO_TEMPLATE_CATEGORIES: Record<string, string[]> = {
  student_org: ['engagement', 'events', 'organization'],
  greek_life: ['events', 'engagement', 'social'],
  academic: ['academic', 'organization', 'productivity'],
  professional: ['communication', 'analytics', 'events'],
  sports: ['events', 'organization', 'analytics'],
  arts: ['events', 'engagement', 'social'],
  social: ['social', 'engagement', 'events'],
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  engagement: BarChart3,
  events: Calendar,
  organization: Users,
  analytics: TrendingUp,
  communication: Megaphone,
  academic: GraduationCap,
  social: Gamepad2,
  productivity: ListTodo,
};

// ============================================================================
// Component
// ============================================================================

export function TemplateSuggestions({
  spaceCategory = 'student_org',
  maxSuggestions = 3,
  onSelectTemplate,
  className,
  compact = false,
}: TemplateSuggestionsProps) {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingTemplate, setUsingTemplate] = useState<string | null>(null);

  // Fetch suggested templates
  useEffect(() => {
    async function fetchTemplates() {
      try {
        setLoading(true);
        const params = new URLSearchParams();

        // Get categories based on space type
        const suggestedCategories = SPACE_TO_TEMPLATE_CATEGORIES[spaceCategory] || ['engagement', 'events'];
        if (suggestedCategories.length > 0) {
          // Fetch templates from the primary category
          params.set('category', suggestedCategories[0] || 'engagement');
        }
        params.set('featured', 'true');
        params.set('limit', String(maxSuggestions + 2)); // Fetch extra to filter

        const response = await fetch(`/api/templates?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }

        const data = await response.json();
        const templates = (data.templates || []).slice(0, maxSuggestions);
        setTemplates(templates);
        setError(null);
      } catch (_err) {
        setError('Unable to load suggestions');
      } finally {
        setLoading(false);
      }
    }

    fetchTemplates();
  }, [spaceCategory, maxSuggestions]);

  const handleUseTemplate = async (templateId: string) => {
    if (onSelectTemplate) {
      setUsingTemplate(templateId);
      onSelectTemplate(templateId);
      // Let parent handle the actual template use
    }
  };

  if (loading) {
    return (
      <div className={cn('p-4 flex items-center justify-center', className)}>
        <Loader2 className="w-5 h-5 animate-spin text-white/40" />
      </div>
    );
  }

  if (error || templates.length === 0) {
    return null; // Silently hide if no suggestions
  }

  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center gap-2 text-sm text-white/60">
          <Sparkles className="w-4 h-4 text-[var(--hive-gold-cta)]" />
          <span>Suggested tools for your space:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {templates.map(template => (
            <button
              key={template.id}
              onClick={() => handleUseTemplate(template.id)}
              disabled={usingTemplate === template.id}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium',
                'bg-white/[0.06] border border-white/[0.08]',
                'text-white/70 hover:text-white hover:bg-white/[0.1]',
                'transition-colors',
                usingTemplate === template.id && 'opacity-50'
              )}
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl bg-white/[0.02] border border-white/[0.08] p-5', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[var(--hive-gold-cta)]/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-[var(--hive-gold-cta)]" />
        </div>
        <div>
          <h3 className="font-medium text-white">Recommended Tools</h3>
          <p className="text-xs text-white/50">Based on your space type</p>
        </div>
      </div>

      {/* Template List */}
      <div className="space-y-2">
        {templates.map((template, index) => {
          const Icon = CATEGORY_ICONS[template.category] || Grid3X3;

          return (
            <motion.button
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleUseTemplate(template.id)}
              disabled={usingTemplate === template.id}
              className={cn(
                'w-full p-3 rounded-lg text-left',
                'bg-white/[0.04] border border-white/[0.06]',
                'hover:bg-white/[0.06] hover:border-white/[0.1]',
                'transition-colors group',
                usingTemplate === template.id && 'opacity-50'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-white/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">
                    {template.name}
                  </p>
                  <p className="text-xs text-white/40 truncate">
                    {template.elementCount} element{template.elementCount !== 1 ? 's' : ''}
                    {template.usageCount > 0 && ` · ${template.usageCount} uses`}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/50 shrink-0" />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* View All Link */}
      <a
        href="/templates"
        className="block mt-4 text-center text-sm text-[var(--hive-gold-cta)] hover:underline"
      >
        Browse all templates
      </a>
    </div>
  );
}

export default TemplateSuggestions;
