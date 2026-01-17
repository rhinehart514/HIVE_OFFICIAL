import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ImageUploader, ImageUploaderCompact } from './ImageUploader';
import { Text, Card } from '../primitives';

const meta: Meta<typeof ImageUploader> = {
  title: 'Design System/Components/Forms/ImageUploader',
  component: ImageUploader,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Upload profile photos or images. Three variants: simple (video aspect), avatar (square), banner (wide).',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['simple', 'avatar', 'banner'],
    },
    loading: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    showRemove: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ImageUploader>;

/**
 * Default — Simple variant
 */
export const Default: Story = {
  render: () => {
    const [, setFile] = useState<File | null>(null);
    return (
      <div className="w-96">
        <ImageUploader
          onChange={(file) => {
            setFile(file);
            console.log('File selected:', file);
          }}
          label="Upload Image"
          helperText="JPG, PNG or WebP. Max 5MB."
        />
      </div>
    );
  },
};

/**
 * Avatar variant
 */
export const Avatar: Story = {
  render: () => {
    const [, setFile] = useState<File | null>(null);
    return (
      <ImageUploader
        variant="avatar"
        onChange={(file) => {
          setFile(file);
          console.log('Avatar selected:', file);
        }}
        label="Profile Photo"
      />
    );
  },
};

/**
 * Banner variant
 */
export const Banner: Story = {
  render: () => {
    const [, setFile] = useState<File | null>(null);
    return (
      <div className="w-[500px]">
        <ImageUploader
          variant="banner"
          onChange={(file) => {
            setFile(file);
            console.log('Banner selected:', file);
          }}
          label="Cover Photo"
          helperText="Recommended size: 1200x400 pixels"
        />
      </div>
    );
  },
};

/**
 * With existing image
 */
export const WithExistingImage: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>(
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop'
    );
    return (
      <div className="w-96">
        <ImageUploader
          value={value}
          onChange={(file, preview) => {
            setValue(preview || null);
            console.log('Changed:', file);
          }}
          label="Project Image"
        />
      </div>
    );
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  render: () => (
    <div className="flex gap-6">
      <ImageUploader
        variant="avatar"
        onChange={() => {}}
        loading
        label="Uploading..."
      />
      <div className="w-64">
        <ImageUploader
          value="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop"
          onChange={() => {}}
          loading
          label="Processing..."
        />
      </div>
    </div>
  ),
};

/**
 * With error
 */
export const WithError: Story = {
  render: () => {
    const [, setFile] = useState<File | null>(null);
    return (
      <div className="w-96">
        <ImageUploader
          onChange={(file) => setFile(file)}
          error="File upload failed. Please try again."
          label="Upload Image"
        />
      </div>
    );
  },
};

/**
 * Disabled
 */
export const Disabled: Story = {
  render: () => (
    <div className="flex gap-6">
      <ImageUploader
        variant="avatar"
        onChange={() => {}}
        disabled
        label="Disabled (empty)"
      />
      <ImageUploader
        variant="avatar"
        value="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop"
        onChange={() => {}}
        disabled
        label="Disabled (with image)"
      />
    </div>
  ),
};

/**
 * Compact variant
 */
export const Compact: Story = {
  render: () => {
    const [, setFile] = useState<File | null>(null);
    return (
      <div className="flex items-center gap-4">
        <ImageUploaderCompact onChange={(file) => setFile(file)} />
        <div>
          <Text weight="medium">Add photo</Text>
          <Text size="xs" tone="muted">
            Click to upload
          </Text>
        </div>
      </div>
    );
  },
};

/**
 * In context — Profile edit form
 */
export const ProfileEditContext: Story = {
  render: () => {
    const [avatar, setAvatar] = useState<string | null>(
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop'
    );
    const [banner, setBanner] = useState<string | null>(null);

    return (
      <Card className="w-[500px] p-6">
        <Text size="lg" weight="semibold" className="mb-6">
          Edit Profile
        </Text>

        <div className="space-y-6">
          {/* Banner */}
          <ImageUploader
            variant="banner"
            value={banner}
            onChange={(_, preview) => setBanner(preview || null)}
            label="Cover Photo"
            helperText="Recommended: 1200x400"
          />

          {/* Avatar positioned over banner */}
          <div className="flex items-end gap-4 -mt-12 ml-4 relative z-10">
            <ImageUploader
              variant="avatar"
              value={avatar}
              onChange={(_, preview) => setAvatar(preview || null)}
            />
            <div className="pb-2">
              <Text weight="medium">Jane Doe</Text>
              <Text size="sm" tone="muted">
                @janedoe
              </Text>
            </div>
          </div>
        </div>
      </Card>
    );
  },
};

/**
 * In context — Space creation
 */
export const SpaceCreationContext: Story = {
  render: () => {
    const [icon, setIcon] = useState<string | null>(null);
    const [banner, setBanner] = useState<string | null>(null);

    return (
      <Card className="w-[400px] p-6">
        <Text size="lg" weight="semibold" className="mb-6">
          Create Space
        </Text>

        <div className="space-y-4">
          {/* Icon and name row */}
          <div className="flex gap-4">
            <ImageUploader
              variant="avatar"
              value={icon}
              onChange={(_, preview) => setIcon(preview || null)}
              label="Icon"
            />
            <div className="flex-1 space-y-3">
              <div>
                <Text size="sm" weight="medium" className="mb-1 block">
                  Space Name
                </Text>
                <input
                  type="text"
                  placeholder="e.g., UB Coders"
                  className="w-full h-10 px-3 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-sm"
                />
              </div>
            </div>
          </div>

          {/* Banner */}
          <ImageUploader
            variant="banner"
            value={banner}
            onChange={(_, preview) => setBanner(preview || null)}
            label="Banner (optional)"
          />
        </div>
      </Card>
    );
  },
};

/**
 * All variants comparison
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <Text size="xs" tone="muted" className="mb-3">
          Avatar (square)
        </Text>
        <ImageUploader variant="avatar" onChange={() => {}} />
      </div>

      <div className="w-96">
        <Text size="xs" tone="muted" className="mb-3">
          Simple (video aspect)
        </Text>
        <ImageUploader variant="simple" onChange={() => {}} />
      </div>

      <div className="w-[500px]">
        <Text size="xs" tone="muted" className="mb-3">
          Banner (wide)
        </Text>
        <ImageUploader variant="banner" onChange={() => {}} />
      </div>

      <div>
        <Text size="xs" tone="muted" className="mb-3">
          Compact (inline)
        </Text>
        <ImageUploaderCompact onChange={() => {}} />
      </div>
    </div>
  ),
};
