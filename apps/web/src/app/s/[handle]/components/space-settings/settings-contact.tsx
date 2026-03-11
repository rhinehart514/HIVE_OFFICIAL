'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Save, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Text, Button } from '@hive/ui';
import type { SpaceData } from './types';

const inputClassName = cn(
  'w-full px-4 py-2.5',
  'rounded-lg text-sm',
  'bg-white/[0.05] border border-white/[0.05]',
  'text-white placeholder:text-white/50',
  'focus:outline-none focus:outline-2 focus:outline-[#FFD700]',
  'transition-colors duration-150'
);

interface SettingsContactProps {
  space: SpaceData;
  onUpdate?: (updates: Record<string, unknown>) => Promise<void>;
}

export function SettingsContact({ space, onUpdate }: SettingsContactProps) {
  const [email, setEmail] = React.useState(space.email || '');
  const [contactName, setContactName] = React.useState(space.contactName || '');
  const [websiteUrl, setWebsiteUrl] = React.useState(space.socialLinks?.website || '');
  const [instagramUrl, setInstagramUrl] = React.useState(space.socialLinks?.instagram || '');
  const [twitterUrl, setTwitterUrl] = React.useState(space.socialLinks?.twitter || '');
  const [facebookUrl, setFacebookUrl] = React.useState(space.socialLinks?.facebook || '');
  const [isSaving, setIsSaving] = React.useState(false);

  const hasChanges =
    email !== (space.email || '') ||
    contactName !== (space.contactName || '') ||
    websiteUrl !== (space.socialLinks?.website || '') ||
    instagramUrl !== (space.socialLinks?.instagram || '') ||
    twitterUrl !== (space.socialLinks?.twitter || '') ||
    facebookUrl !== (space.socialLinks?.facebook || '');

  const handleSave = async () => {
    if (!hasChanges || !onUpdate) return;
    setIsSaving(true);
    try {
      const updates: Record<string, unknown> = {};
      if (email !== (space.email || '')) updates.email = email || null;
      if (contactName !== (space.contactName || '')) updates.contactName = contactName || null;
      if (
        websiteUrl !== (space.socialLinks?.website || '') ||
        instagramUrl !== (space.socialLinks?.instagram || '') ||
        twitterUrl !== (space.socialLinks?.twitter || '') ||
        facebookUrl !== (space.socialLinks?.facebook || '')
      ) {
        updates.socialLinks = {
          website: websiteUrl || null,
          instagram: instagramUrl || null,
          twitter: twitterUrl || null,
          facebook: facebookUrl || null,
        };
      }
      await onUpdate(updates);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEmail(space.email || '');
    setContactName(space.contactName || '');
    setWebsiteUrl(space.socialLinks?.website || '');
    setInstagramUrl(space.socialLinks?.instagram || '');
    setTwitterUrl(space.socialLinks?.twitter || '');
    setFacebookUrl(space.socialLinks?.facebook || '');
  };

  return (
    <>
      <h2
        className="text-title-lg font-semibold text-white mb-2"
        style={{ fontFamily: 'var(--font-clash)' }}
      >
        Contact Information
      </h2>
      <Text size="sm" tone="muted" className="mb-8">
        Update contact details and social links for your space
      </Text>

      <div className="space-y-6">
        {/* Contact Email */}
        <div>
          <label className="block mb-2">
            <Text size="sm" weight="medium">Contact Email</Text>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@organization.edu"
            className={inputClassName}
          />
          <Text size="xs" tone="muted" className="mt-1">
            Displayed on browse cards and space info
          </Text>
        </div>

        {/* Contact Name */}
        <div>
          <label className="block mb-2">
            <Text size="sm" weight="medium">Contact Name</Text>
          </label>
          <input
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="e.g., Club President"
            className={inputClassName}
          />
        </div>

        {/* Social Links */}
        <div>
          <label className="block mb-3">
            <Text size="sm" weight="medium">Social Links</Text>
          </label>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <LinkIcon className="w-4 h-4 text-white/50 flex-shrink-0" />
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://your-website.com"
                className={cn(inputClassName, 'flex-1')}
              />
            </div>
            <div className="flex items-center gap-3">
              <Text size="xs" className="w-4 text-white/50 text-center flex-shrink-0">IG</Text>
              <input
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/yourhandle"
                className={cn(inputClassName, 'flex-1')}
              />
            </div>
            <div className="flex items-center gap-3">
              <Text size="xs" className="w-4 text-white/50 text-center flex-shrink-0">X</Text>
              <input
                type="url"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                placeholder="https://twitter.com/yourhandle"
                className={cn(inputClassName, 'flex-1')}
              />
            </div>
            <div className="flex items-center gap-3">
              <Text size="xs" className="w-4 text-white/50 text-center flex-shrink-0">FB</Text>
              <input
                type="url"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://facebook.com/yourpage"
                className={cn(inputClassName, 'flex-1')}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 pt-4 border-t border-white/[0.05]"
          >
            <Button
              variant="cta"
              size="default"
              onClick={handleSave}
              disabled={isSaving}
              loading={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="ghost"
              size="default"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </motion.div>
        )}
      </div>
    </>
  );
}
