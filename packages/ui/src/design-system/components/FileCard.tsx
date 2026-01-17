'use client';

/**
 * FileCard Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * Displays a file attachment with preview and actions.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * DEFAULT FILE CARD (With preview):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ┌─────────────────────────────────────────────────────────────────┐   │
 * │  │                                                                 │   │
 * │  │                     [IMAGE PREVIEW]                            │   │
 * │  │                     aspect-video                                │   │
 * │  │                                                                 │   │
 * │  └─────────────────────────────────────────────────────────────────┘   │
 * │                                                                         │
 * │  📄 project-spec.pdf                                                   │
 * │  2.4 MB · PDF · Uploaded 2h ago                                        │
 * │                                                                         │
 * │  [Download]  [View]  [···]                                             │
 * │                                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * COMPACT FILE CARD (No preview):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ┌────┐  project-spec.pdf                         [↓]  [···]           │
 * │  │ PDF│  2.4 MB · Uploaded 2h ago                                      │
 * │  └────┘                                                                │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * INLINE FILE CARD (Minimal):
 * ┌──────────────────────────────────────────────────────────────┐
 * │  📄 project-spec.pdf (2.4 MB)                          [↓]   │
 * └──────────────────────────────────────────────────────────────┘
 *
 * FILE TYPE ICONS:
 * - PDF: Red icon with "PDF" text
 * - Image (jpg, png, gif): Blue image icon
 * - Video (mp4, mov): Purple play icon
 * - Audio (mp3, wav): Green wave icon
 * - Document (doc, docx): Blue document icon
 * - Spreadsheet (xls, xlsx): Green table icon
 * - Code (js, ts, py): Gray code icon
 * - Archive (zip, rar): Yellow folder icon
 * - Unknown: Gray file icon
 *
 * ICON CONTAINER:
 * - Size: 40x40 (compact), 48x48 (default)
 * - Rounded: rounded-xl
 * - Background: File type color at 10% opacity
 * - Icon: File type color at full opacity
 *
 * UPLOAD PROGRESS:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ┌────┐  uploading-file.pdf                        67%    [✕]          │
 * │  │ PDF│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░                           │
 * │  └────┘  2.4 MB · Uploading...                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * ERROR STATE:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ┌────┐  failed-file.pdf                          [⟳]   [✕]            │
 * │  │ ⚠️ │  Upload failed: Connection timeout                              │
 * │  └────┘                                                                │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * STATES:
 * - Default: Ready to download/view
 * - Uploading: Progress bar, cancel button
 * - Error: Error message, retry button
 * - Processing: Spinner, "Processing..." text
 *
 * ACTIONS:
 * - Download: Primary action
 * - View/Preview: Secondary action (images, PDFs)
 * - Delete: Danger action in menu
 * - Copy link: Utility action in menu
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Text } from '../primitives';

const fileCardVariants = cva(
  'bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl overflow-hidden transition-colors',
  {
    variants: {
      variant: {
        default: 'p-4',
        compact: 'p-3',
        inline: 'p-2 flex items-center gap-3',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// File type configurations
const fileTypes = {
  pdf: { color: '#FF6B6B', label: 'PDF', icon: 'document' },
  doc: { color: '#4A9EFF', label: 'DOC', icon: 'document' },
  docx: { color: '#4A9EFF', label: 'DOCX', icon: 'document' },
  xls: { color: '#22C55E', label: 'XLS', icon: 'table' },
  xlsx: { color: '#22C55E', label: 'XLSX', icon: 'table' },
  ppt: { color: '#FF8C00', label: 'PPT', icon: 'presentation' },
  pptx: { color: '#FF8C00', label: 'PPTX', icon: 'presentation' },
  jpg: { color: '#4A9EFF', label: 'JPG', icon: 'image' },
  jpeg: { color: '#4A9EFF', label: 'JPEG', icon: 'image' },
  png: { color: '#4A9EFF', label: 'PNG', icon: 'image' },
  gif: { color: '#4A9EFF', label: 'GIF', icon: 'image' },
  webp: { color: '#4A9EFF', label: 'WEBP', icon: 'image' },
  svg: { color: '#4A9EFF', label: 'SVG', icon: 'image' },
  mp4: { color: '#A855F7', label: 'MP4', icon: 'video' },
  mov: { color: '#A855F7', label: 'MOV', icon: 'video' },
  webm: { color: '#A855F7', label: 'WEBM', icon: 'video' },
  mp3: { color: '#22C55E', label: 'MP3', icon: 'audio' },
  wav: { color: '#22C55E', label: 'WAV', icon: 'audio' },
  zip: { color: 'var(--life-gold)', label: 'ZIP', icon: 'archive' },
  rar: { color: 'var(--life-gold)', label: 'RAR', icon: 'archive' },
  '7z': { color: 'var(--life-gold)', label: '7Z', icon: 'archive' },
  js: { color: '#F7DF1E', label: 'JS', icon: 'code' },
  ts: { color: '#3178C6', label: 'TS', icon: 'code' },
  py: { color: '#3776AB', label: 'PY', icon: 'code' },
  json: { color: '#888888', label: 'JSON', icon: 'code' },
  default: { color: '#888888', label: 'FILE', icon: 'file' },
};

type FileType = keyof typeof fileTypes;

export interface FileCardProps extends VariantProps<typeof fileCardVariants> {
  /** File name */
  name: string;
  /** File size in bytes */
  size: number;
  /** File MIME type or extension */
  type?: string;
  /** File URL for download/preview */
  url?: string;
  /** Preview image URL */
  previewUrl?: string;
  /** Upload timestamp */
  uploadedAt?: Date | string;
  /** Upload progress (0-100) */
  uploadProgress?: number;
  /** Error message */
  error?: string;
  /** Is processing */
  isProcessing?: boolean;
  /** Show preview image */
  showPreview?: boolean;
  /** On download */
  onDownload?: () => void;
  /** On view/preview */
  onView?: () => void;
  /** On delete */
  onDelete?: () => void;
  /** On retry (after error) */
  onRetry?: () => void;
  /** On cancel (during upload) */
  onCancel?: () => void;
  /** Additional className */
  className?: string;
}

/**
 * Format file size
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Format relative time
 */
function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Get file extension
 */
function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

/**
 * Get file type config
 */
function getFileTypeConfig(filename: string, mimeType?: string): typeof fileTypes[FileType] {
  const ext = getFileExtension(filename) as FileType;
  return fileTypes[ext] || fileTypes.default;
}

/**
 * FileIcon - File type icon
 */
const FileIcon: React.FC<{ type: string; size?: 'sm' | 'default' | 'lg' }> = ({
  type,
  size = 'default',
}) => {
  const config = fileTypes[type as FileType] || fileTypes.default;
  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

  const icons: Record<string, React.ReactNode> = {
    document: (
      <svg viewBox="0 0 24 24" fill="none" stroke={config.color} strokeWidth={1.5} className={iconSize}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    image: (
      <svg viewBox="0 0 24 24" fill="none" stroke={config.color} strokeWidth={1.5} className={iconSize}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
    video: (
      <svg viewBox="0 0 24 24" fill="none" stroke={config.color} strokeWidth={1.5} className={iconSize}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
      </svg>
    ),
    audio: (
      <svg viewBox="0 0 24 24" fill="none" stroke={config.color} strokeWidth={1.5} className={iconSize}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
      </svg>
    ),
    archive: (
      <svg viewBox="0 0 24 24" fill="none" stroke={config.color} strokeWidth={1.5} className={iconSize}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
    code: (
      <svg viewBox="0 0 24 24" fill="none" stroke={config.color} strokeWidth={1.5} className={iconSize}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
    file: (
      <svg viewBox="0 0 24 24" fill="none" stroke={config.color} strokeWidth={1.5} className={iconSize}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  };

  return <>{icons[config.icon] || icons.file}</>;
};

/**
 * FileCard - File attachment display
 */
const FileCard: React.FC<FileCardProps> = ({
  variant = 'default',
  name,
  size,
  type,
  url,
  previewUrl,
  uploadedAt,
  uploadProgress,
  error,
  isProcessing = false,
  showPreview = false,
  onDownload,
  onView,
  onDelete,
  onRetry,
  onCancel,
  className,
}) => {
  const ext = getFileExtension(name);
  const fileConfig = getFileTypeConfig(name, type);
  const isUploading = uploadProgress !== undefined && uploadProgress < 100;
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);

  // Inline variant
  if (variant === 'inline') {
    return (
      <div className={cn(fileCardVariants({ variant }), className)}>
        <FileIcon type={ext} size="sm" />
        <div className="flex-1 min-w-0">
          <Text size="sm" className="truncate">
            {name}
          </Text>
        </div>
        <Text size="xs" tone="muted">
          ({formatFileSize(size)})
        </Text>
        {onDownload && (
          <button
            onClick={onDownload}
            className="p-1 rounded-md hover:bg-white/10 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn(fileCardVariants({ variant }), 'border-red-500/30', className)}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(255, 107, 107, 0.1)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <Text size="sm" className="truncate">
              {name}
            </Text>
            <Text size="xs" className="text-red-500">
              {error}
            </Text>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          )}
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-[var(--color-text-muted)]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(fileCardVariants({ variant }), className)}>
      {/* Preview image */}
      {showPreview && previewUrl && (
        <div className="mb-3 -m-4 mb-4">
          <img
            src={previewUrl}
            alt={name}
            className="w-full aspect-video object-cover"
          />
        </div>
      )}

      {/* File info */}
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className={cn(
            'rounded-xl flex items-center justify-center flex-shrink-0',
            variant === 'compact' ? 'w-10 h-10' : 'w-12 h-12'
          )}
          style={{ backgroundColor: `${fileConfig.color}15` }}
        >
          {isProcessing ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke={fileConfig.color} strokeWidth={2} strokeOpacity={0.25} />
              <path d="M12 2a10 10 0 0 1 10 10" stroke={fileConfig.color} strokeWidth={2} strokeLinecap="round" />
            </svg>
          ) : (
            <FileIcon type={ext} />
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <Text size="sm" weight="medium" className="truncate">
            {name}
          </Text>
          <div className="flex items-center gap-2 mt-0.5">
            <Text size="xs" tone="muted">
              {formatFileSize(size)}
            </Text>
            <Text size="xs" tone="muted">·</Text>
            <Text size="xs" tone="muted">
              {fileConfig.label}
            </Text>
            {uploadedAt && (
              <>
                <Text size="xs" tone="muted">·</Text>
                <Text size="xs" tone="muted">
                  {formatRelativeTime(uploadedAt)}
                </Text>
              </>
            )}
          </div>

          {/* Upload progress */}
          {isUploading && (
            <div className="mt-2">
              <div className="h-1 w-full bg-[var(--color-bg-hover)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-life-gold transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {isUploading ? (
            <>
              <Text size="xs" tone="muted">
                {uploadProgress}%
              </Text>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-[var(--color-text-muted)]"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </>
          ) : isProcessing ? (
            <Text size="xs" tone="muted">Processing...</Text>
          ) : (
            <>
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                </button>
              )}
              {onView && isImage && (
                <button
                  onClick={onView}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-[var(--color-text-muted)]"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <circle cx="12" cy="6" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="12" cy="18" r="1.5" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

FileCard.displayName = 'FileCard';

/**
 * FileCardSkeleton - Loading state
 */
const FileCardSkeleton: React.FC<{ variant?: 'default' | 'compact' | 'inline'; className?: string }> = ({
  variant = 'default',
  className,
}) => (
  <div className={cn(fileCardVariants({ variant }), 'animate-pulse', className)}>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-hover)]" />
      <div className="flex-1">
        <div className="h-4 w-32 bg-[var(--color-bg-hover)] rounded mb-1" />
        <div className="h-3 w-24 bg-[var(--color-bg-hover)] rounded" />
      </div>
      <div className="w-8 h-8 bg-[var(--color-bg-hover)] rounded-lg" />
    </div>
  </div>
);

FileCardSkeleton.displayName = 'FileCardSkeleton';

export { FileCard, FileCardSkeleton, FileIcon };
