'use client';

/**
 * ImageUploader Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * P1 Blocker - Upload profile photos or images.
 * Two variants: simple (preview), withCrop (modal cropping).
 */

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Text, Button } from '../primitives';
import { LoadingSpinner } from './LoadingOverlay';

export interface ImageUploaderProps {
  /** Current image URL */
  value?: string | null;
  /** Callback when image changes */
  onChange: (file: File | null, preview?: string) => void;
  /** Optional callback for cropped blob */
  onCropComplete?: (blob: Blob) => void;
  /** Variant type */
  variant?: 'simple' | 'avatar' | 'banner';
  /** Accepted file types */
  accept?: string;
  /** Max file size in bytes */
  maxSize?: number;
  /** Aspect ratio for preview */
  aspectRatio?: number;
  /** Show remove button */
  showRemove?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Label text */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Additional className */
  className?: string;
}

const variantStyles = {
  simple: {
    container: 'w-full',
    preview: 'w-full aspect-video rounded-xl',
    dropzone: 'w-full aspect-video rounded-xl',
  },
  avatar: {
    container: 'w-32',
    preview: 'w-32 h-32 rounded-xl',
    dropzone: 'w-32 h-32 rounded-xl',
  },
  banner: {
    container: 'w-full',
    preview: 'w-full aspect-[3/1] rounded-xl',
    dropzone: 'w-full aspect-[3/1] rounded-xl',
  },
};

/**
 * ImageUploader - Main component
 */
const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  variant = 'simple',
  accept = 'image/jpeg,image/png,image/webp',
  maxSize = 5 * 1024 * 1024, // 5MB default
  showRemove = true,
  loading = false,
  error,
  disabled = false,
  label,
  helperText,
  className,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(value || null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  const styles = variantStyles[variant];
  const displayError = error || localError;

  // Handle file selection
  const handleFileSelect = React.useCallback(
    (file: File) => {
      setLocalError(null);

      // Validate file type
      const validTypes = accept.split(',').map((t) => t.trim());
      if (!validTypes.some((type) => file.type.match(type.replace('*', '.*')))) {
        setLocalError('Invalid file type. Please select an image.');
        return;
      }

      // Validate file size
      if (file.size > maxSize) {
        const maxMB = Math.round(maxSize / 1024 / 1024);
        setLocalError(`File too large. Maximum size is ${maxMB}MB.`);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        onChange(file, result);
      };
      reader.readAsDataURL(file);
    },
    [accept, maxSize, onChange]
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle remove
  const handleRemove = () => {
    setPreview(null);
    setLocalError(null);
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  // Update preview when value changes externally
  React.useEffect(() => {
    if (value !== undefined) {
      setPreview(value);
    }
  }, [value]);

  return (
    <div className={cn(styles.container, className)}>
      {label && (
        <Text size="sm" weight="medium" className="mb-2 block">
          {label}
        </Text>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled || loading}
        className="sr-only"
        aria-label={label || 'Upload image'}
      />

      {preview ? (
        // Preview state
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className={cn(
              styles.preview,
              'object-cover',
              'border border-[var(--color-border)]',
              'transition-opacity duration-[var(--duration-default)]',
              loading && 'opacity-50'
            )}
          />

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* Hover overlay */}
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center gap-2',
              'bg-black/60 opacity-0 group-hover:opacity-100',
              'transition-opacity duration-[var(--duration-snap)]',
              styles.preview.includes('rounded-xl') && 'rounded-xl',
              (loading || disabled) && 'pointer-events-none'
            )}
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={loading || disabled}
            >
              Change
            </Button>
            {showRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={loading || disabled}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      ) : (
        // Dropzone state
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          disabled={disabled || loading}
          className={cn(
            styles.dropzone,
            'flex flex-col items-center justify-center gap-2',
            'border-2 border-dashed',
            'transition-all duration-[var(--duration-snap)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
            isDragging
              ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/10'
              : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] hover:border-[var(--color-text-muted)]',
            disabled && 'opacity-50 cursor-not-allowed',
            displayError && 'border-[var(--color-status-error)]'
          )}
        >
          {loading ? (
            <LoadingSpinner size="default" />
          ) : (
            <>
              <UploadIcon className="w-8 h-8 text-[var(--color-text-muted)]" />
              <Text size="sm" tone="muted" className="text-center">
                {isDragging ? 'Drop image here' : 'Click or drag to upload'}
              </Text>
              <Text size="xs" tone="muted">
                Max {Math.round(maxSize / 1024 / 1024)}MB
              </Text>
            </>
          )}
        </button>
      )}

      {/* Error message */}
      {displayError && (
        <Text size="xs" className="mt-2 text-[var(--color-status-error)]">
          {displayError}
        </Text>
      )}

      {/* Helper text */}
      {helperText && !displayError && (
        <Text size="xs" tone="muted" className="mt-2">
          {helperText}
        </Text>
      )}
    </div>
  );
};

ImageUploader.displayName = 'ImageUploader';

/**
 * Simple upload icon
 */
const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
    />
  </svg>
);

/**
 * ImageUploaderCompact - Inline variant for tight spaces
 */
export interface ImageUploaderCompactProps {
  value?: string | null;
  onChange: (file: File | null, preview?: string) => void;
  accept?: string;
  maxSize?: number;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

const ImageUploaderCompact: React.FC<ImageUploaderCompactProps> = ({
  value,
  onChange,
  accept = 'image/jpeg,image/png,image/webp',
  maxSize = 5 * 1024 * 1024,
  loading = false,
  disabled = false,
  className,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(value || null);

  const handleFileSelect = React.useCallback(
    (file: File) => {
      const validTypes = accept.split(',').map((t) => t.trim());
      if (!validTypes.some((type) => file.type.match(type.replace('*', '.*')))) {
        return;
      }
      if (file.size > maxSize) {
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        onChange(file, result);
      };
      reader.readAsDataURL(file);
    },
    [accept, maxSize, onChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  React.useEffect(() => {
    if (value !== undefined) setPreview(value);
  }, [value]);

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={disabled || loading}
      className={cn(
        'relative w-12 h-12 rounded-xl overflow-hidden',
        'border border-[var(--color-border)]',
        'transition-all duration-[var(--duration-snap)]',
        'hover:border-[var(--color-text-muted)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled || loading}
        className="sr-only"
      />

      {preview ? (
        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[var(--color-bg-elevated)]">
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <UploadIcon className="w-5 h-5 text-[var(--color-text-muted)]" />
          )}
        </div>
      )}
    </button>
  );
};

ImageUploaderCompact.displayName = 'ImageUploaderCompact';

export { ImageUploader, ImageUploaderCompact };
