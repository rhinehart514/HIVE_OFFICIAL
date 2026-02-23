'use client';

/**
 * SpaceLeaderOnboardingModal Component
 *
 * Multi-step onboarding modal for new space leaders.
 * Guides through setup tasks: overview, quick deploy, invite members.
 */

import * as React from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '../../primitives';
import { ModalBody } from '../../primitives';
import { Button } from '../../primitives';
import { Text } from '../../primitives';
import { cn } from '../../../lib/utils';

type OnboardingStep = 'welcome' | 'deploy' | 'invite';

export interface QuickDeployTemplate {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export interface SpaceLeaderOnboardingModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  spaceName?: string;
  spaceDescription?: string;
  templates?: QuickDeployTemplate[];
  onDeployTemplate?: (templateId: string) => Promise<void>;
  onInviteClick?: () => void;
  onComplete?: () => void;
  className?: string;
}

const STEPS: OnboardingStep[] = ['welcome', 'deploy', 'invite'];

const SpaceLeaderOnboardingModal: React.FC<SpaceLeaderOnboardingModalProps> = ({
  open = false,
  onOpenChange,
  spaceName = 'Your Space',
  spaceDescription,
  templates = [],
  onDeployTemplate,
  onInviteClick,
  onComplete,
  className,
}) => {
  const [currentStep, setCurrentStep] = React.useState<OnboardingStep>('welcome');
  const [deployedTemplates, setDeployedTemplates] = React.useState<string[]>([]);
  const [isDeploying, setIsDeploying] = React.useState<string | null>(null);

  const currentIndex = STEPS.indexOf(currentStep);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete?.();
      onOpenChange?.(false);
    } else {
      setCurrentStep(STEPS[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  };

  const handleSkip = () => {
    onComplete?.();
    onOpenChange?.(false);
  };

  const handleDeploy = async (templateId: string) => {
    if (isDeploying) return;

    setIsDeploying(templateId);
    try {
      await onDeployTemplate?.(templateId);
      setDeployedTemplates((prev) => [...prev, templateId]);
    } finally {
      setIsDeploying(null);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {STEPS.map((step, index) => (
        <React.Fragment key={step}>
          <div
            className={cn(
              'w-2.5 h-2.5 rounded-full transition-colors',
              index <= currentIndex
                ? 'bg-[var(--color-life-gold)]'
                : 'bg-[var(--color-bg-muted)]'
            )}
          />
          {index < STEPS.length - 1 && (
            <div
              className={cn(
                'w-8 h-0.5 transition-colors',
                index < currentIndex
                  ? 'bg-[var(--color-life-gold)]'
                  : 'bg-[var(--color-bg-muted)]'
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderWelcomeStep = () => (
    <div className="text-center space-y-6">
      {/* Space Icon */}
      <div className="mx-auto w-20 h-20 rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center">
        <svg
          className="w-10 h-10 text-[var(--color-life-gold)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      </div>

      <div className="space-y-2">
        <Text size="lg" weight="semibold" className="text-[var(--color-text-primary)] text-xl">
          Welcome to {spaceName}!
        </Text>
        {spaceDescription && (
          <Text size="sm" tone="secondary" className="max-w-sm mx-auto">
            {spaceDescription}
          </Text>
        )}
      </div>

      <div className="space-y-3 text-left bg-[var(--color-bg-muted)] rounded-xl p-4">
        <Text size="sm" weight="medium" className="text-[var(--color-text-primary)]">
          As the space leader, you can:
        </Text>
        <ul className="space-y-2">
          {[
            'Moderate discussions and pin important messages',
            'Deploy creations from HiveLab or templates',
            'Create events and manage members',
            'Customize your space appearance',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <svg
                className="w-4 h-4 text-[var(--color-life-gold)] mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <Text size="sm" tone="secondary">
                {item}
              </Text>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderDeployStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Text size="lg" weight="semibold" className="text-[var(--color-text-primary)]">
          Quick Deploy
        </Text>
        <Text size="sm" tone="secondary">
          Add ready-to-use creations to your space in one click
        </Text>
      </div>

      {templates.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {templates.slice(0, 6).map((template) => {
            const isDeployed = deployedTemplates.includes(template.id);
            const isCurrentlyDeploying = isDeploying === template.id;

            return (
              <button
                key={template.id}
                type="button"
                onClick={() => handleDeploy(template.id)}
                disabled={isDeployed || !!isDeploying}
                className={cn(
                  'p-4 rounded-xl border text-left transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-white/50',
                  isDeployed
                    ? 'bg-[var(--color-life-gold)]/10 border-[var(--color-life-gold)]/30'
                    : 'bg-[var(--color-bg-elevated)] border-[var(--color-border)] hover:border-[var(--color-life-gold)]/50',
                  (isCurrentlyDeploying || isDeployed) && 'cursor-not-allowed'
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{template.icon || '🔧'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Text size="sm" weight="medium" className="truncate">
                        {template.name}
                      </Text>
                      {isDeployed && (
                        <svg
                          className="w-4 h-4 text-[var(--color-life-gold)] flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <Text size="xs" tone="muted" className="line-clamp-2 mt-0.5">
                      {template.description}
                    </Text>
                  </div>
                </div>
                {isCurrentlyDeploying && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-[var(--color-life-gold)] border-t-transparent rounded-full animate-spin" />
                    <Text size="xs" tone="muted">
                      Deploying...
                    </Text>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 bg-[var(--color-bg-muted)] rounded-xl">
          <Text size="sm" tone="muted">
            No templates available yet
          </Text>
        </div>
      )}

      {deployedTemplates.length > 0 && (
        <div className="text-center">
          <Text size="sm" className="text-[var(--color-life-gold)]">
            {deployedTemplates.length} deployed
          </Text>
        </div>
      )}
    </div>
  );

  const renderInviteStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Text size="lg" weight="semibold" className="text-[var(--color-text-primary)]">
          Invite Your First Members
        </Text>
        <Text size="sm" tone="secondary">
          A space comes alive with people. Start building your community.
        </Text>
      </div>

      <div className="bg-[var(--color-bg-elevated)] rounded-xl p-6 border border-[var(--color-border)]">
        <div className="text-center space-y-4">
          {/* People illustration */}
          <div className="flex justify-center -space-x-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-12 h-12 rounded-lg border-2 border-[var(--color-bg-elevated)]',
                  'bg-[var(--color-bg-muted)] flex items-center justify-center'
                )}
              >
                <svg
                  className="w-6 h-6 text-[var(--color-text-muted)]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            ))}
          </div>

          <Button variant="cta" onClick={onInviteClick} className="w-full">
            Invite Members
          </Button>

          <Text size="xs" tone="muted">
            You can always invite more people later from the Members tab
          </Text>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcomeStep();
      case 'deploy':
        return renderDeployStep();
      case 'invite':
        return renderInviteStep();
      default:
        return null;
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className={cn('max-w-lg', className)}>
        <ModalHeader>
          <ModalTitle className="sr-only">Space Leader Onboarding</ModalTitle>
          <button
            type="button"
            onClick={handleSkip}
            className={cn(
              'absolute top-4 right-4 p-2 rounded-lg',
              'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]',
              'hover:bg-[var(--color-bg-muted)] transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-white/50'
            )}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </ModalHeader>

        <ModalBody className="pt-2">
          {renderStepIndicator()}
          {renderCurrentStep()}
        </ModalBody>

        <ModalFooter>
          <div className="flex items-center justify-between w-full">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-[var(--color-text-muted)]"
            >
              Skip
            </Button>
            <div className="flex items-center gap-3">
              {!isFirstStep && (
                <Button variant="secondary" onClick={handleBack}>
                  Back
                </Button>
              )}
              <Button variant="cta" onClick={handleNext}>
                {isLastStep ? 'Get Started' : 'Continue'}
              </Button>
            </div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

SpaceLeaderOnboardingModal.displayName = 'SpaceLeaderOnboardingModal';

export { SpaceLeaderOnboardingModal };
