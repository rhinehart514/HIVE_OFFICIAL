'use client';

/**
 * /spaces/new/access - Privacy settings
 *
 * "Who can join?"
 *
 * Three options:
 * - Open: Anyone can join
 * - Request to Join: Members need approval
 * - Invite Only: Only invited members can join
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BuilderShell,
  BuilderHeading,
  BuilderAction,
  AccessOption,
  ACCESS_OPTIONS,
  type AccessOptionData,
  type PrivacyLevel,
} from '@/components/spaces/builder';
import { MOTION } from '@hive/ui/design-system/primitives';

export default function AccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get data from previous steps
  const templateId = searchParams.get('template') || 'blank';
  const name = searchParams.get('name') || '';
  const handle = searchParams.get('handle') || '';
  const description = searchParams.get('description') || '';

  // Find default privacy based on template
  const getDefaultPrivacy = (): PrivacyLevel => {
    // Template defaults from SPACE_TEMPLATES
    const templateDefaults: Record<string, PrivacyLevel> = {
      org: 'open',
      study: 'approval',
      project: 'invite',
      club: 'open',
      blank: 'approval',
    };
    return templateDefaults[templateId] || 'approval';
  };

  const [selectedOption, setSelectedOption] = useState<AccessOptionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Set default option based on template
  useEffect(() => {
    const defaultPrivacy = getDefaultPrivacy();
    const defaultOption = ACCESS_OPTIONS.find((opt) => opt.id === defaultPrivacy);
    if (defaultOption) {
      setSelectedOption(defaultOption);
    }
  }, [templateId]);

  const handleContinue = async () => {
    if (!selectedOption) return;

    setIsLoading(true);

    try {
      // Pass all data to launch page
      const params = new URLSearchParams({
        template: templateId,
        name,
        handle,
        ...(description && { description }),
        privacy: selectedOption.id,
      });

      router.push(`/spaces/new/launch?${params.toString()}`);
    } catch (error) {
      console.error('Failed to continue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BuilderShell currentStep={2} stepTitle="Access">
      <div className="space-y-8">
        {/* Heading */}
        <BuilderHeading
          title="Who can join?"
          subtitle="Set how members can access your space"
        />

        {/* Access Options */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: MOTION.duration.base, delay: 0.2, ease: MOTION.ease.premium }}
        >
          {ACCESS_OPTIONS.map((option, i) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: MOTION.duration.fast,
                delay: 0.1 + i * 0.05,
                ease: MOTION.ease.premium,
              }}
            >
              <AccessOption
                option={option}
                selected={selectedOption?.id === option.id}
                onSelect={setSelectedOption}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Helper text */}
        <motion.p
          className="text-[12px] text-white/30 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: MOTION.duration.base, delay: 0.4, ease: MOTION.ease.premium }}
        >
          You can change this anytime in settings
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration.base, delay: 0.5, ease: MOTION.ease.premium }}
        >
          <BuilderAction
            onClick={handleContinue}
            disabled={!selectedOption}
            loading={isLoading}
          >
            Create Space
          </BuilderAction>
        </motion.div>
      </div>
    </BuilderShell>
  );
}
