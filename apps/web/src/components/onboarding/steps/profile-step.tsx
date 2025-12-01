'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Check, ChevronsUpDown, Upload } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@hive/ui';
import { Button } from '@hive/ui';
import { ImageCropper } from '@/components/ui/image-cropper';
import {
  staggerContainer,
  staggerItem,
  transitionSilk,
  transitionSpring,
  GLOW_GOLD,
  GLOW_GOLD_SUBTLE,
} from '@/lib/motion-primitives';
import { UB_MAJORS, GRAD_YEARS } from '../shared/constants';
import type { OnboardingData } from '../shared/types';

interface ProfileStepProps {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export function ProfileStep({
  data,
  onUpdate,
  onNext,
  error,
  setError,
}: ProfileStepProps) {
  const { major, graduationYear, profilePhoto } = data;
  const [majorOpen, setMajorOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!major) {
      setError('Select your major');
      return;
    }

    if (!graduationYear) {
      setError('Select your graduation year');
      return;
    }

    setError(null);
    onNext();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      prepareForCrop(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const prepareForCrop = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Check file size (10MB limit for pre-crop)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    setError(null);

    // Read file as data URL for cropping
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
    };
    reader.onerror = () => {
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setImageToCrop(null);
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('photo', croppedBlob, 'profile.jpg');

      const response = await fetch('/api/profile/upload-photo', {
        method: 'POST',
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to upload photo');
      }

      // Store the URL, not base64
      // API response wraps data in { success: true, data: { avatarUrl: ... } }
      const avatarUrl = responseData.data?.avatarUrl || responseData.avatarUrl;
      onUpdate({ profilePhoto: avatarUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropCancel = () => {
    setImageToCrop(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) prepareForCrop(file);
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Profile photo upload */}
      <motion.div variants={staggerItem} transition={transitionSilk}>
        <div className="flex flex-col items-center gap-3">
          <motion.label
            className="relative cursor-pointer group"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <motion.div
              className={`w-28 aspect-[3/4] rounded-2xl bg-neutral-900 border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${
                isDragging
                  ? 'border-gold-500 bg-gold-500/5'
                  : profilePhoto
                  ? 'border-transparent'
                  : 'border-neutral-700 group-hover:border-neutral-500'
              }`}
              style={profilePhoto ? { boxShadow: GLOW_GOLD_SUBTLE } : {}}
            >
              <AnimatePresence mode="wait">
                {isUploading ? (
                  <motion.div
                    key="uploading"
                    className="flex flex-col items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="w-6 h-6 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
                    <span className="text-xs text-neutral-500">Uploading...</span>
                  </motion.div>
                ) : profilePhoto ? (
                  <motion.img
                    key="photo"
                    src={profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={transitionSilk}
                  />
                ) : (
                  <motion.div
                    key="placeholder"
                    className="flex flex-col items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Camera className="w-7 h-7 text-neutral-500 group-hover:text-neutral-400 transition-colors" />
                    <Upload className="w-4 h-4 text-neutral-600" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-neutral-500 hover:text-gold-500 transition-colors"
          >
            {profilePhoto ? 'Change photo' : 'Add photo (optional)'}
          </button>
        </div>
      </motion.div>

      {/* Major combobox */}
      <motion.div variants={staggerItem} transition={transitionSilk}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-400">Your major</label>
          <Popover open={majorOpen} onOpenChange={setMajorOpen}>
            <PopoverTrigger asChild>
              <motion.button
                type="button"
                role="combobox"
                aria-expanded={majorOpen}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`w-full h-12 rounded-xl border bg-black px-4 text-base text-left flex items-center justify-between transition-all ${
                  majorOpen
                    ? 'border-neutral-600 ring-2 ring-gold-500/20'
                    : major
                    ? 'border-neutral-700'
                    : 'border-neutral-800'
                }`}
                style={majorOpen ? { boxShadow: GLOW_GOLD } : {}}
              >
                <span className={major ? 'text-white' : 'text-neutral-500'}>
                  {major || 'Search or select...'}
                </span>
                <motion.div animate={{ rotate: majorOpen ? 180 : 0 }} transition={transitionSpring}>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 text-neutral-500" />
                </motion.div>
              </motion.button>
            </PopoverTrigger>
            <PopoverContent
              className="p-0 bg-neutral-900 border-neutral-800 rounded-xl shadow-2xl"
              style={{ width: 'var(--radix-popover-trigger-width)' }}
              align="start"
              sideOffset={4}
            >
              <Command className="bg-transparent">
                <CommandInput
                  placeholder="Search majors..."
                  className="h-11 bg-transparent px-4 text-sm text-white placeholder:text-neutral-500"
                />
                <CommandList className="max-h-[240px] overflow-y-auto p-1">
                  <CommandEmpty className="py-6 text-center text-sm text-neutral-500">
                    No major found.
                  </CommandEmpty>
                  <CommandGroup>
                    {UB_MAJORS.map((m) => (
                      <CommandItem
                        key={m}
                        value={m}
                        onSelect={() => {
                          onUpdate({ major: m });
                          setMajorOpen(false);
                          setError(null);
                        }}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg cursor-pointer text-white hover:bg-neutral-800 data-[selected=true]:bg-neutral-800"
                      >
                        <Check
                          className={`h-4 w-4 shrink-0 transition-opacity ${
                            major === m ? 'opacity-100 text-gold-500' : 'opacity-0'
                          }`}
                        />
                        <span>{m}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </motion.div>

      {/* Graduation year - pill selector */}
      <motion.div variants={staggerItem} transition={transitionSilk}>
        <div className="space-y-3">
          <label className="text-sm font-medium text-neutral-400">Graduation year</label>
          <div className="grid grid-cols-5 gap-2">
            {GRAD_YEARS.map((year, index) => (
              <motion.button
                key={year}
                type="button"
                onClick={() => {
                  onUpdate({ graduationYear: year });
                  setError(null);
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...transitionSpring, delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative rounded-xl px-2 py-3 text-sm font-semibold transition-all duration-200 border ${
                  graduationYear === year
                    ? 'border-gold-500 text-gold-500 bg-gold-500/10'
                    : 'border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 bg-black'
                }`}
              >
                {year}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="text-sm font-medium text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Continue button */}
      <motion.div variants={staggerItem} transition={transitionSilk}>
        <Button
          onClick={handleSubmit}
          disabled={!major || !graduationYear}
          showArrow
          fullWidth
          size="lg"
        >
          Continue
        </Button>
      </motion.div>

      {/* Image Cropper Modal */}
      <AnimatePresence>
        {imageToCrop && (
          <ImageCropper
            imageSrc={imageToCrop}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
            aspectRatio={3 / 4}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
