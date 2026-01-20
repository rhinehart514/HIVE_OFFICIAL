'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, toast } from '@hive/ui';
import { ArrowTopRightOnSquareIcon, ArrowPathIcon, CameraIcon, UserIcon } from '@heroicons/react/24/outline';
import { ImageCropper } from '@/components/ui/image-cropper';
import { logger } from '@/lib/structured-logger';

interface ProfileSectionProps {
  formData: {
    fullName: string;
    handle: string;
    bio: string;
    avatarUrl: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    fullName: string;
    handle: string;
    bio: string;
    avatarUrl: string;
  }>>;
  userEmail: string;
  isSaving: boolean;
  hasChanges: boolean;
  onSave: () => void;
}

export function ProfileSection({
  formData,
  setFormData,
  userEmail,
  isSaving,
  hasChanges,
  onSave,
}: ProfileSectionProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, or WebP image');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    // Create preview URL for cropper
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsUploading(true);
    setSelectedImage(null);

    try {
      const formDataPayload = new FormData();
      formDataPayload.append('photo', croppedBlob, 'profile-photo.jpg');

      const response = await fetch('/api/profile/upload-photo', {
        method: 'POST',
        credentials: 'include',
        body: formDataPayload,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload photo');
      }

      setFormData((prev) => ({ ...prev, avatarUrl: data.avatarUrl }));
      toast.success('Photo uploaded successfully');
    } catch (error) {
      logger.error('Failed to upload photo', { component: 'ProfileSection' }, error instanceof Error ? error : undefined);
      toast.error(error instanceof Error ? error.message : 'Failed to upload photo');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCropCancel = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get initials for fallback
  const initials = formData.fullName
    ? formData.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <Card className="p-6 bg-white/5 border-white/[0.08]">
      <h3 className="text-lg font-semibold text-white mb-6">Profile Information</h3>
      <div className="space-y-4">
        {/* Photo Upload Section */}
        <div className="flex items-center gap-4 pb-4 border-b border-white/[0.06]">
          <div className="relative">
            {/* Avatar Preview */}
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center">
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-semibold text-white/50">{initials}</span>
              )}
            </div>
            {/* Upload indicator */}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
                <ArrowPathIcon className="h-6 w-6 text-white animate-spin" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm text-white mb-1">Profile Photo</p>
            <p className="text-xs text-white/40 mb-3">JPEG, PNG, or WebP. Max 5MB.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <CameraIcon className="h-4 w-4 mr-2" />
              {formData.avatarUrl ? 'Change Photo' : 'Upload Photo'}
            </Button>
          </div>
        </div>

        {/* Image Cropper Modal */}
        {selectedImage && (
          <ImageCropper
            imageSrc={selectedImage}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
            aspectRatio={1} // Square for profile photos
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Full Name</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-[var(--hive-brand-primary)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Handle</label>
            <input
              type="text"
              value={formData.handle}
              onChange={(e) => setFormData((prev) => ({ ...prev, handle: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-[var(--hive-brand-primary)] focus:outline-none"
            />
            <p className="text-xs text-white/40 mt-1">Handle changes are rate-limited</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-2">Email</label>
          <input
            type="email"
            defaultValue={userEmail}
            disabled
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white/50 cursor-not-allowed"
          />
          <p className="text-xs text-white/40 mt-1">Email cannot be changed</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-2">Bio</label>
          <textarea
            rows={3}
            value={formData.bio}
            onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-[var(--hive-brand-primary)] focus:outline-none resize-none"
            placeholder="Tell others about yourself..."
          />
        </div>
      </div>
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.06]">
        <Button
          variant="secondary"
          onClick={() => router.push('/profile/edit')}
          aria-label="Open profile layout editor"
          className="border-white/20 text-white hover:bg-white/10"
        >
          <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2" aria-hidden="true" />
          Customize Layout
        </Button>
        <Button
          onClick={onSave}
          disabled={isSaving || !hasChanges}
          aria-label={isSaving ? 'Saving profile changes' : 'Save profile changes'}
          className="bg-[var(--hive-brand-primary)] text-black hover:bg-[var(--hive-brand-primary)]/90 disabled:opacity-50"
        >
          {isSaving ? <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" /> : 'Save Changes'}
        </Button>
      </div>
    </Card>
  );
}
