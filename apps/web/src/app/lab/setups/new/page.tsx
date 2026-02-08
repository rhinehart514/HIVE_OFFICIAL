'use client';

/**
 * /tools/setups/new — Create New Setup Template
 *
 * Wizard for creating a new orchestrated tool bundle.
 * Steps: Basic Info → Add Tools → Configure Orchestration → Review
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Calendar,
  Trophy,
  GitBranch,
  Vote,
  Users,
  Layers,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { BrandSpinner } from '@hive/ui';
import { MOTION } from '@hive/tokens';

const EASE = MOTION.ease.premium;

const COLORS = {
  gold: 'var(--life-gold, #D4AF37)',
  bg: 'var(--bg-ground, #0A0A09)',
  text: 'var(--hivelab-text-primary, #FAF9F7)',
  textSecondary: 'var(--hivelab-text-secondary, #8A8A8A)',
  textTertiary: 'var(--hivelab-text-tertiary, #5A5A5A)',
  surface: 'var(--hivelab-surface, #141414)',
  border: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
  error: '#EF4444',
};

const CATEGORIES = [
  { id: 'event', label: 'Event', icon: Calendar, color: '#10B981', description: 'Recurring events with RSVPs, reminders, and analytics' },
  { id: 'campaign', label: 'Campaign', icon: Trophy, color: '#F59E0B', description: 'Time-bound initiatives with goals and tracking' },
  { id: 'workflow', label: 'Workflow', icon: GitBranch, color: '#6366F1', description: 'Multi-step processes with automation' },
  { id: 'engagement', label: 'Engagement', icon: Vote, color: '#EC4899', description: 'Polls, voting, and interactive content' },
  { id: 'governance', label: 'Governance', icon: Users, color: '#8B5CF6', description: 'Elections, decisions, and member management' },
];

// Icon options using Lucide icon names for consistent rendering
const ICON_OPTIONS = [
  { name: 'Calendar', icon: Calendar },
  { name: 'Trophy', icon: Trophy },
  { name: 'Zap', icon: Sparkles },
  { name: 'Vote', icon: Vote },
  { name: 'Users', icon: Users },
  { name: 'Target', icon: GitBranch },
  { name: 'BarChart', icon: Layers },
  { name: 'Bell', icon: AlertCircle },
  { name: 'Layout', icon: Layers },
  { name: 'FileText', icon: ArrowRight },
] as const;

interface FormData {
  name: string;
  description: string;
  icon: string;
  category: string;
  tags: string[];
}

export default function NewSetupPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState<FormData>({
    name: '',
    description: '',
    icon: 'Calendar',
    category: '',
    tags: [],
  });

  const [tagInput, setTagInput] = React.useState('');

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      updateField('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    updateField('tags', formData.tags.filter(t => t !== tag));
  };

  const canProceed = () => {
    if (step === 1) {
      return formData.name.trim().length >= 2 && formData.description.trim().length >= 10;
    }
    if (step === 2) {
      return formData.category !== '';
    }
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/setups/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          icon: formData.icon,
          category: formData.category,
          tags: formData.tags,
          // Start with empty tools - user will add them in the builder
          tools: [{
            slotId: 'slot_1',
            name: 'First Tool',
            defaultConfig: {},
            placement: 'sidebar',
            initiallyVisible: true,
          }],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create setup');
      }

      const { template } = await response.json();
      router.push(`/lab/setups/${template.id}/builder`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create setup');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
        >
          <Link
            href="/lab/setups"
            className="inline-flex items-center gap-2 text-sm transition-colors mb-8"
            style={{ color: COLORS.textSecondary }}
            onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.textSecondary)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Setups
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-medium mb-2" style={{ color: COLORS.text }}>
            Create New Setup
          </h1>
          <p className="text-sm" style={{ color: COLORS.textSecondary }}>
            Bundle multiple tools with orchestration rules
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex items-center justify-center gap-3 mb-10"
        >
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all"
                style={{
                  backgroundColor: s <= step ? `${COLORS.gold}20` : 'transparent',
                  color: s <= step ? COLORS.gold : COLORS.textTertiary,
                  border: `1px solid ${s <= step ? `${COLORS.gold}40` : COLORS.border}`,
                }}
              >
                {s < step ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className="w-12 h-px transition-colors"
                  style={{ backgroundColor: s < step ? COLORS.gold : COLORS.border }}
                />
              )}
            </React.Fragment>
          ))}
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="p-6 rounded-xl border"
          style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-medium mb-6" style={{ color: COLORS.text }}>
                  Basic Information
                </h2>

                {/* Name */}
                <div className="mb-5">
                  <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="e.g., Weekly Meeting Series"
                    className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border text-sm outline-none transition-colors"
                    style={{ borderColor: COLORS.border, color: COLORS.text }}
                    maxLength={100}
                  />
                </div>

                {/* Description */}
                <div className="mb-5">
                  <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="What does this setup do?"
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border text-sm outline-none transition-colors resize-none"
                    style={{ borderColor: COLORS.border, color: COLORS.text }}
                    maxLength={500}
                  />
                </div>

                {/* Icon */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>
                    Icon
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ICON_OPTIONS.map((opt) => {
                      const IconComponent = opt.icon;
                      return (
                        <button
                          key={opt.name}
                          onClick={() => updateField('icon', opt.name)}
                          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
                          style={{
                            backgroundColor: formData.icon === opt.name ? `${COLORS.gold}20` : 'transparent',
                            border: `1px solid ${formData.icon === opt.name ? COLORS.gold : COLORS.border}`,
                          }}
                        >
                          <IconComponent className="h-5 w-5" style={{ color: formData.icon === opt.name ? COLORS.gold : COLORS.textSecondary }} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Category */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-medium mb-6" style={{ color: COLORS.text }}>
                  Choose Category
                </h2>

                <div className="grid grid-cols-1 gap-3">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => updateField('category', cat.id)}
                      className="flex items-center gap-4 p-4 rounded-lg text-left transition-all"
                      style={{
                        backgroundColor: formData.category === cat.id ? `${cat.color}10` : 'transparent',
                        border: `1px solid ${formData.category === cat.id ? cat.color : COLORS.border}`,
                      }}
                    >
                      <div
                        className="p-2.5 rounded-lg"
                        style={{ backgroundColor: `${cat.color}15` }}
                      >
                        <cat.icon className="h-5 w-5" style={{ color: cat.color }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm" style={{ color: COLORS.text }}>
                          {cat.label}
                        </p>
                        <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                          {cat.description}
                        </p>
                      </div>
                      {formData.category === cat.id && (
                        <Check className="h-5 w-5" style={{ color: cat.color }} />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Tags & Review */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-medium mb-6" style={{ color: COLORS.text }}>
                  Tags & Review
                </h2>

                {/* Tags */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>
                    Tags (optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add a tag..."
                      className="flex-1 px-4 py-2 rounded-lg bg-white/[0.03] border text-sm outline-none"
                      style={{ borderColor: COLORS.border, color: COLORS.text }}
                    />
                    <button
                      onClick={addTag}
                      disabled={!tagInput.trim()}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity"
                      style={{
                        backgroundColor: `${COLORS.gold}20`,
                        color: COLORS.gold,
                        opacity: tagInput.trim() ? 1 : 0.5,
                      }}
                    >
                      Add
                    </button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
                          style={{ backgroundColor: `${COLORS.gold}15`, color: COLORS.gold }}
                        >
                          {tag}
                          <button onClick={() => removeTag(tag)} className="hover:opacity-70">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Review Summary */}
                <div
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
                >
                  <h3 className="text-sm font-medium mb-3" style={{ color: COLORS.textSecondary }}>
                    Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const IconComp = ICON_OPTIONS.find(o => o.name === formData.icon)?.icon || Calendar;
                        return <IconComp className="h-6 w-6" style={{ color: COLORS.gold }} />;
                      })()}
                      <span className="font-medium" style={{ color: COLORS.text }}>{formData.name}</span>
                    </div>
                    <p style={{ color: COLORS.textSecondary }}>{formData.description}</p>
                    <div className="flex items-center gap-2 pt-2">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs"
                        style={{
                          backgroundColor: `${CATEGORIES.find(c => c.id === formData.category)?.color || COLORS.gold}20`,
                          color: CATEGORIES.find(c => c.id === formData.category)?.color || COLORS.gold,
                        }}
                      >
                        {CATEGORIES.find(c => c.id === formData.category)?.label}
                      </span>
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-full text-xs"
                          style={{ backgroundColor: `${COLORS.gold}15`, color: COLORS.gold }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mt-4 p-3 rounded-lg"
              style={{ backgroundColor: `${COLORS.error}15`, color: COLORS.error }}
            >
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderColor: COLORS.border }}>
            <button
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-opacity"
              style={{ color: COLORS.textSecondary, opacity: step === 1 ? 0.3 : 1 }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: canProceed() ? `${COLORS.gold}20` : 'transparent',
                  color: canProceed() ? COLORS.gold : COLORS.textTertiary,
                  border: `1px solid ${canProceed() ? COLORS.gold : COLORS.border}`,
                }}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: `${COLORS.gold}20`,
                  color: COLORS.gold,
                  border: `1px solid ${COLORS.gold}`,
                }}
              >
                {isSubmitting ? (
                  <>
                    <BrandSpinner size="sm" variant="gold" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Create & Open Builder
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>

        {/* Help text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xs text-center mt-6"
          style={{ color: COLORS.textTertiary }}
        >
          After creating, you&apos;ll be taken to the Setup Builder to add tools and configure orchestration rules.
        </motion.p>
      </div>
    </div>
  );
}
