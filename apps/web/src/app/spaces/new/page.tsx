'use client';

/**
 * /spaces/new - Template selection
 *
 * "What are you building?"
 *
 * First step of space creation.
 * User selects a template that sets sensible defaults.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BuilderShell,
  BuilderHeading,
  BuilderAction,
  TemplateCard,
  SPACE_TEMPLATES,
  type SpaceTemplate,
} from '@/components/spaces/builder';
import { MOTION } from '@hive/ui/design-system/primitives';

export default function SpaceNewPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<SpaceTemplate | null>(null);

  const handleContinue = () => {
    if (!selectedTemplate) return;

    // Store template in session/state for next steps
    // For now, pass via URL params
    const params = new URLSearchParams({
      template: selectedTemplate.id,
    });
    router.push(`/spaces/new/identity?${params.toString()}`);
  };

  return (
    <BuilderShell currentStep={0} stepTitle="New Space">
      <div className="space-y-8">
        {/* Heading */}
        <BuilderHeading
          title="What are you building?"
          subtitle="Choose a template to get started with the right defaults"
        />

        {/* Template Grid */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: MOTION.duration.base, delay: 0.2, ease: MOTION.ease.premium }}
        >
          {SPACE_TEMPLATES.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: MOTION.duration.fast,
                delay: 0.1 + i * 0.05,
                ease: MOTION.ease.premium,
              }}
            >
              <TemplateCard
                template={template}
                selected={selectedTemplate?.id === template.id}
                onSelect={setSelectedTemplate}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration.base, delay: 0.5, ease: MOTION.ease.premium }}
        >
          <BuilderAction onClick={handleContinue} disabled={!selectedTemplate}>
            Continue
          </BuilderAction>
        </motion.div>
      </div>
    </BuilderShell>
  );
}
