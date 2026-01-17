import type { Meta, StoryObj } from '@storybook/react';
import { FileCard, FileCardSkeleton } from './FileCard';
import { Card, Text } from '../primitives';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FILECARD VISUAL REFERENCE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Displays a file attachment with preview and actions.
 *
 * STRUCTURE:
 *   [PREVIEW IMAGE - optional]
 *
 *   [ICON]  filename.pdf
 *           2.4 MB · PDF · 2h ago
 *
 *           [Actions: Download, View, Menu]
 *
 * FILE TYPE ICONS:
 * - PDF: Red
 * - Images: Blue
 * - Video: Purple
 * - Audio: Green
 * - Spreadsheets: Green
 * - Documents: Blue
 * - Code: Gray
 * - Archives: Gold
 *
 * VARIANTS:
 * - default: Full card with icon, name, metadata, actions
 * - compact: Smaller, no preview
 * - inline: Minimal single-line display
 *
 * STATES:
 * - Default: Ready for download/view
 * - Uploading: Progress bar + cancel button
 * - Error: Error message + retry button
 * - Processing: Spinner animation
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

const meta: Meta<typeof FileCard> = {
  title: 'Design System/Components/Content/FileCard',
  component: FileCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays a file attachment with preview and actions.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'compact', 'inline'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof FileCard>;

/**
 * Default — PDF file
 */
export const Default: Story = {
  args: {
    name: 'project-spec.pdf',
    size: 2457600, // 2.4 MB
    uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    onDownload: () => console.log('Download'),
    onDelete: () => console.log('Delete'),
  },
};

/**
 * Image file
 */
export const ImageFile: Story = {
  args: {
    name: 'screenshot.png',
    size: 524288, // 512 KB
    uploadedAt: new Date(Date.now() - 30 * 60 * 1000),
    onDownload: () => console.log('Download'),
    onView: () => console.log('View'),
    onDelete: () => console.log('Delete'),
  },
};

/**
 * With preview
 */
export const WithPreview: Story = {
  args: {
    name: 'hero-image.jpg',
    size: 1048576, // 1 MB
    previewUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400',
    showPreview: true,
    uploadedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    onDownload: () => console.log('Download'),
    onView: () => console.log('View'),
  },
};

/**
 * All file types
 */
export const AllFileTypes: Story = {
  render: () => (
    <div className="w-96 space-y-3">
      <FileCard name="document.pdf" size={2457600} onDownload={() => {}} />
      <FileCard name="photo.jpg" size={1048576} onDownload={() => {}} onView={() => {}} />
      <FileCard name="video.mp4" size={52428800} onDownload={() => {}} />
      <FileCard name="audio.mp3" size={5242880} onDownload={() => {}} />
      <FileCard name="spreadsheet.xlsx" size={102400} onDownload={() => {}} />
      <FileCard name="presentation.pptx" size={3145728} onDownload={() => {}} />
      <FileCard name="archive.zip" size={10485760} onDownload={() => {}} />
      <FileCard name="code.tsx" size={8192} onDownload={() => {}} />
      <FileCard name="config.json" size={1024} onDownload={() => {}} />
    </div>
  ),
};

/**
 * Compact variant
 */
export const Compact: Story = {
  args: {
    variant: 'compact',
    name: 'notes.pdf',
    size: 524288,
    uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    onDownload: () => console.log('Download'),
  },
};

/**
 * Inline variant
 */
export const Inline: Story = {
  args: {
    variant: 'inline',
    name: 'attachment.pdf',
    size: 102400,
    onDownload: () => console.log('Download'),
  },
};

/**
 * Uploading state
 */
export const Uploading: Story = {
  args: {
    name: 'large-video.mp4',
    size: 104857600, // 100 MB
    uploadProgress: 67,
    onCancel: () => console.log('Cancel'),
  },
};

/**
 * Upload progress states
 */
export const UploadProgress: Story = {
  render: () => (
    <div className="w-96 space-y-3">
      <FileCard
        name="file-starting.pdf"
        size={10485760}
        uploadProgress={5}
        onCancel={() => {}}
      />
      <FileCard
        name="file-midway.pdf"
        size={10485760}
        uploadProgress={50}
        onCancel={() => {}}
      />
      <FileCard
        name="file-almost-done.pdf"
        size={10485760}
        uploadProgress={95}
        onCancel={() => {}}
      />
    </div>
  ),
};

/**
 * Error state
 */
export const Error: Story = {
  args: {
    name: 'failed-upload.pdf',
    size: 5242880,
    error: 'Upload failed: Connection timeout',
    onRetry: () => console.log('Retry'),
    onCancel: () => console.log('Cancel'),
  },
};

/**
 * Processing state
 */
export const Processing: Story = {
  args: {
    name: 'video-transcoding.mp4',
    size: 52428800,
    isProcessing: true,
  },
};

/**
 * Loading skeleton
 */
export const Loading: Story = {
  render: () => (
    <div className="w-96 space-y-3">
      <FileCardSkeleton />
      <FileCardSkeleton variant="compact" />
    </div>
  ),
};

/**
 * In context — Chat message
 */
export const ChatMessageContext: Story = {
  render: () => (
    <Card className="w-[500px] p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-[var(--color-bg-elevated)]" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Text size="sm" weight="medium">Jane Doe</Text>
            <Text size="xs" tone="muted">2:34 PM</Text>
          </div>
          <Text size="sm" className="mb-2">Here's the project spec we discussed:</Text>
          <FileCard
            variant="compact"
            name="project-spec-v2.pdf"
            size={2457600}
            uploadedAt={new Date()}
            onDownload={() => {}}
          />
        </div>
      </div>
    </Card>
  ),
};

/**
 * In context — Resource list
 */
export const ResourceListContext: Story = {
  render: () => (
    <Card className="w-[600px]">
      <div className="p-4 border-b border-[var(--color-border)]">
        <Text size="lg" weight="semibold">Resources</Text>
        <Text size="sm" tone="muted">Shared files and documents</Text>
      </div>
      <div className="divide-y divide-[var(--color-border)]">
        <div className="p-3">
          <FileCard
            variant="compact"
            name="Syllabus-Fall-2025.pdf"
            size={524288}
            uploadedAt={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
            onDownload={() => {}}
          />
        </div>
        <div className="p-3">
          <FileCard
            variant="compact"
            name="Lecture-Notes-Week-1.pdf"
            size={1048576}
            uploadedAt={new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)}
            onDownload={() => {}}
          />
        </div>
        <div className="p-3">
          <FileCard
            variant="compact"
            name="Assignment-1-Template.docx"
            size={102400}
            uploadedAt={new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)}
            onDownload={() => {}}
          />
        </div>
        <div className="p-3">
          <FileCard
            variant="compact"
            name="Sample-Dataset.xlsx"
            size={2097152}
            uploadedAt={new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)}
            onDownload={() => {}}
          />
        </div>
      </div>
    </Card>
  ),
};

/**
 * In context — Upload zone
 */
export const UploadZoneContext: Story = {
  render: () => (
    <Card className="w-[500px] p-6">
      <div className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-8 text-center mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 mx-auto mb-3 text-[var(--color-text-muted)]">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <Text size="sm" weight="medium">Drop files here or click to upload</Text>
        <Text size="xs" tone="muted" className="mt-1">Max file size: 50MB</Text>
      </div>

      <Text size="sm" weight="medium" className="mb-2">Uploading</Text>
      <div className="space-y-2">
        <FileCard
          variant="compact"
          name="presentation.pptx"
          size={5242880}
          uploadProgress={78}
          onCancel={() => {}}
        />
        <FileCard
          variant="compact"
          name="demo-video.mp4"
          size={52428800}
          uploadProgress={23}
          onCancel={() => {}}
        />
      </div>
    </Card>
  ),
};
