'use client';

/**
 * SpaceLeaderOnboardingModal - First-time leader setup wizard
 *
 * Shown to new leaders on their first visit to lead a space. Guides them through:
 * 1. Welcome + congratulations on becoming a leader
 * 2. Quick-deploy template tools (one-click deployment)
 * 3. Invite members CTA + what's next preview
 *
 * Features:
 * - Multi-step wizard with smooth transitions
 * - One-click template deployment
 * - Progress indicators
 * - Skip option for experienced leaders
 * - Gold celebration theme
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  X,
  Crown,
  Wrench,
  Users,
  Share2,
  ChevronRight,
  ChevronLeft,
  Star,
  Check,
  Loader2,
  BarChart2,
  Timer,
  Link2,
  FileText,
  MessageSquare,
  Wand2,
  ClipboardList,
  Target,
  TrendingUp,
  Wallet,
  Calendar,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../00-Global/atoms/button';
import { tinderSprings, easingArrays } from '@hive/tokens';
import type { QuickTemplate } from '../../../lib/hivelab/quick-templates';

// ============================================================
// Types
// ============================================================

export interface SpaceLeaderOnboardingData {
  /** Space name */
  spaceName: string;
  /** Space ID */
  spaceId: string;
  /** Member count */
  memberCount: number;
  /** Available quick templates */
  templates: QuickTemplate[];
}

export interface SpaceLeaderOnboardingModalProps {
  /** Whether modal is open */
  open: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Space data */
  data: SpaceLeaderOnboardingData;
  /** Callback when user completes onboarding */
  onComplete?: () => void;
  /** Callback to deploy a quick template */
  onDeployTemplate?: (template: QuickTemplate) => Promise<void>;
  /** Callback to open HiveLab for custom tool creation */
  onOpenHiveLab?: () => void;
  /** Callback to open invite modal */
  onOpenInvite?: () => void;
  /** Callback when user skips onboarding */
  onSkip?: () => void;
  /** Additional className */
  className?: string;
}

// ============================================================
// Template Icon Mapper
// ============================================================

function getTemplateIcon(icon: QuickTemplate['icon']) {
  const iconMap: Record<QuickTemplate['icon'], React.ComponentType<{ className?: string }>> = {
    'bar-chart-2': BarChart2,
    timer: Timer,
    'link-2': Link2,
    users: Users,
    calendar: Calendar,
    'message-square': MessageSquare,
    'file-text': FileText,
    sparkles: Star,
    'clipboard-list': ClipboardList,
    target: Target,
    'trending-up': TrendingUp,
    wallet: Wallet,
  };
  return iconMap[icon] || Star;
}

function getTemplateColor(category: QuickTemplate['category']) {
  const colors: Record<QuickTemplate['category'], string> = {
    engagement: 'text-amber-400 bg-amber-400/10',
    organization: 'text-blue-400 bg-blue-400/10',
    communication: 'text-green-400 bg-green-400/10',
  };
  return colors[category];
}

// ============================================================
// Step Components
// ============================================================

interface StepProps {
  data: SpaceLeaderOnboardingData;
  onNext: () => void;
  onBack?: () => void;
  onComplete?: () => void;
  onDeployTemplate?: (template: QuickTemplate) => Promise<void>;
  onOpenHiveLab?: () => void;
  onOpenInvite?: () => void;
}

// Step 1: Welcome & Congratulations
function WelcomeStep({ data, onNext }: StepProps) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-8">
      {/* Crown icon with celebration */}
      <div className="relative mb-6">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FFD700] to-[#FFD700]/70 flex items-center justify-center shadow-lg shadow-[#FFD700]/30"
        >
          <Crown className="w-10 h-10 text-black" />
        </motion.div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#FFD700] flex items-center justify-center shadow-lg"
        >
          <Star className="w-4 h-4 text-black" />
        </motion.div>
      </div>

      {/* Congratulations message */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold text-white mb-2"
      >
        You're now leading {data.spaceName}!
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-neutral-400 text-sm mb-6 max-w-xs"
      >
        Let's set up your space to engage your members. This only takes a minute.
      </motion.p>

      {/* What you can do */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full space-y-2 mb-8"
      >
        <p className="text-xs text-neutral-500 mb-3">As a leader, you can:</p>
        {[
          { icon: Wrench, text: 'Deploy interactive tools to your sidebar' },
          { icon: Users, text: 'Manage members and roles' },
          { icon: Share2, text: 'Customize your space experience' },
        ].map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="flex items-center gap-3 p-2 rounded-lg bg-neutral-800/30"
          >
            <item.icon className="w-4 h-4 text-[#FFD700]" />
            <span className="text-sm text-neutral-300">{item.text}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Continue button */}
      <Button onClick={onNext} className="w-full max-w-xs" variant="brand">
        Let's get started
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

// Step 2: Quick Deploy Templates
function TemplatesStep({ data, onNext, onBack, onDeployTemplate, onOpenHiveLab }: StepProps) {
  const [deployingId, setDeployingId] = React.useState<string | null>(null);
  const [deployedIds, setDeployedIds] = React.useState<Set<string>>(new Set());

  const handleDeploy = async (template: QuickTemplate) => {
    if (!onDeployTemplate || deployingId) return;

    setDeployingId(template.id);
    try {
      await onDeployTemplate(template);
      setDeployedIds((prev) => new Set([...prev, template.id]));
    } catch (error) {
      console.error('Failed to deploy template:', error);
    } finally {
      setDeployingId(null);
    }
  };

  // Show first 4 templates
  const visibleTemplates = data.templates.slice(0, 4);

  return (
    <div className="px-6 py-8">
      <h2 className="text-xl font-bold text-white text-center mb-2">Deploy your first tool</h2>
      <p className="text-neutral-400 text-sm text-center mb-6">
        One-click deploy to add engagement to your space
      </p>

      {/* Template grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {visibleTemplates.map((template, index) => {
          const Icon = getTemplateIcon(template.icon);
          const isDeploying = deployingId === template.id;
          const isDeployed = deployedIds.has(template.id);

          return (
            <motion.button
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleDeploy(template)}
              disabled={isDeploying || isDeployed}
              className={cn(
                'flex flex-col items-start gap-2 p-3 rounded-xl',
                'border transition-all text-left',
                isDeployed
                  ? 'bg-[#FFD700]/10 border-[#FFD700]/30'
                  : 'bg-neutral-800/50 border-white/5 hover:border-[#FFD700]/30 hover:bg-neutral-800',
                isDeploying && 'opacity-70 cursor-wait'
              )}
            >
              <div
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center',
                  isDeployed ? 'bg-[#FFD700]/20 text-[#FFD700]' : getTemplateColor(template.category)
                )}
              >
                {isDeploying ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isDeployed ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <div>
                <span className="font-medium text-white text-sm block">{template.name}</span>
                <span className="text-xs text-neutral-500 line-clamp-1">
                  {isDeployed ? 'Deployed!' : template.description}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Custom tool option */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={onOpenHiveLab}
        className={cn(
          'w-full flex items-center gap-3 p-3 rounded-xl',
          'bg-neutral-800/30 border border-dashed border-neutral-700',
          'hover:border-[#FFD700]/30 hover:bg-neutral-800/50 transition-all'
        )}
      >
        <div className="w-9 h-9 rounded-lg bg-neutral-700/50 flex items-center justify-center">
          <Wand2 className="w-5 h-5 text-neutral-400" />
        </div>
        <div className="text-left">
          <span className="font-medium text-neutral-300 text-sm block">Create custom tool</span>
          <span className="text-xs text-neutral-500">Build anything with AI in HiveLab</span>
        </div>
        <ChevronRight className="w-4 h-4 text-neutral-500 ml-auto" />
      </motion.button>

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        <Button onClick={onBack} variant="ghost" className="flex-1">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Button onClick={onNext} variant="brand" className="flex-1">
          {deployedIds.size > 0 ? 'Continue' : 'Skip for now'}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// Step 3: Invite Members & What's Next
function InviteStep({ data, onBack, onComplete, onOpenInvite }: StepProps) {
  return (
    <div className="px-6 py-8">
      {/* Success icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-16 h-16 rounded-full bg-[#FFD700]/10 flex items-center justify-center mx-auto mb-4"
      >
        <Users className="w-8 h-8 text-[#FFD700]" />
      </motion.div>

      <h2 className="text-xl font-bold text-white text-center mb-2">Invite your community</h2>
      <p className="text-neutral-400 text-sm text-center mb-6">
        {data.memberCount > 1
          ? `You have ${data.memberCount} members. Let's grow!`
          : "Share your space link to get your first members"}
      </p>

      {/* What's next checklist */}
      <div className="space-y-2 mb-6">
        <p className="text-xs text-neutral-500 mb-2">Your setup checklist:</p>
        {[
          { done: true, text: 'Create your space' },
          { done: false, text: 'Deploy first tool', hint: 'Makes your space engaging' },
          { done: false, text: 'Create first event', hint: 'Gives members a reason to return' },
          { done: false, text: 'Invite 5 members', hint: 'Start building your community' },
        ].map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              'flex items-center gap-3 p-2.5 rounded-lg',
              item.done ? 'bg-[#FFD700]/10' : 'bg-neutral-800/30'
            )}
          >
            <div
              className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center',
                item.done ? 'bg-[#FFD700]' : 'border border-neutral-600'
              )}
            >
              {item.done && <Check className="w-3 h-3 text-black" />}
            </div>
            <div className="flex-1">
              <span
                className={cn(
                  'text-sm',
                  item.done ? 'text-[#FFD700]/80 line-through' : 'text-neutral-300'
                )}
              >
                {item.text}
              </span>
              {item.hint && !item.done && (
                <span className="text-xs text-neutral-500 ml-2">{item.hint}</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <Button
          onClick={() => {
            onComplete?.();
            onOpenInvite?.();
          }}
          variant="brand"
          className="w-full h-12 text-base shadow-lg shadow-[#FFD700]/20"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Invite members
        </Button>

        <div className="flex gap-3">
          <Button onClick={onBack} variant="ghost" className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <Button onClick={onComplete} variant="outline" className="flex-1">
            I'll do this later
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function SpaceLeaderOnboardingModal({
  open,
  onClose,
  data,
  onComplete,
  onDeployTemplate,
  onOpenHiveLab,
  onOpenInvite,
  onSkip,
  className,
}: SpaceLeaderOnboardingModalProps) {
  const shouldReduceMotion = useReducedMotion();
  const [currentStep, setCurrentStep] = React.useState(0);
  const totalSteps = 3;

  // Handle step navigation
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    onComplete?.();
    onClose();
  };

  const handleSkip = () => {
    onSkip?.();
    onClose();
  };

  // Reset step when opening
  React.useEffect(() => {
    if (open) {
      setCurrentStep(0);
    }
  }, [open]);

  // Render current step
  const renderStep = () => {
    const stepProps: StepProps = {
      data,
      onNext: handleNext,
      onBack: handleBack,
      onComplete: handleComplete,
      onDeployTemplate,
      onOpenHiveLab: () => {
        handleComplete();
        onOpenHiveLab?.();
      },
      onOpenInvite,
    };

    switch (currentStep) {
      case 0:
        return <WelcomeStep {...stepProps} />;
      case 1:
        return <TemplatesStep {...stepProps} />;
      case 2:
        return <InviteStep {...stepProps} />;
      default:
        return <WelcomeStep {...stepProps} />;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={handleSkip}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={shouldReduceMotion ? { duration: 0.1 } : tinderSprings.settle}
            className={cn(
              'fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
              'w-full max-w-md',
              'bg-neutral-900 border border-white/10 rounded-2xl',
              'shadow-2xl shadow-black/50',
              'overflow-hidden',
              className
            )}
            role="dialog"
            aria-modal="true"
            aria-label={`Leader onboarding for ${data.spaceName}`}
          >
            {/* Skip/Close button */}
            <button
              onClick={handleSkip}
              className={cn(
                'absolute top-4 right-4 z-10',
                'w-8 h-8 rounded-full flex items-center justify-center',
                'text-neutral-400 hover:text-white hover:bg-white/10',
                'transition-colors'
              )}
              aria-label="Skip"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Step content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={
                  shouldReduceMotion ? { duration: 0.1 } : { duration: 0.2, ease: easingArrays.silk }
                }
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 pb-6">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all',
                    index === currentStep
                      ? 'bg-[#FFD700] scale-125'
                      : index < currentStep
                        ? 'bg-[#FFD700]/50'
                        : 'bg-neutral-700 hover:bg-neutral-600'
                  )}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default SpaceLeaderOnboardingModal;
