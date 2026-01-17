'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { AspectRatio, AspectRatioImage, AspectRatioVideo, AspectRatioPlaceholder } from './AspectRatio';

const meta: Meta<typeof AspectRatio> = {
  title: 'Design System/Components/AspectRatio',
  component: AspectRatio,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="p-8 w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AspectRatio>;

/**
 * Default 16:9 aspect ratio.
 */
export const Default: Story = {
  render: () => (
    <AspectRatio ratio={16 / 9} className="bg-[var(--color-bg-elevated)] rounded-lg">
      <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)]">
        16:9 Content Area
      </div>
    </AspectRatio>
  ),
};

/**
 * Common aspect ratios.
 */
export const CommonRatios: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">1:1 (Square)</p>
        <div className="w-32">
          <AspectRatio ratio="1:1" className="bg-[var(--color-bg-elevated)] rounded-lg">
            <div className="w-full h-full flex items-center justify-center text-sm text-[var(--color-text-muted)]">
              1:1
            </div>
          </AspectRatio>
        </div>
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">4:3 (Standard)</p>
        <AspectRatio ratio="4:3" className="bg-[var(--color-bg-elevated)] rounded-lg">
          <div className="w-full h-full flex items-center justify-center text-sm text-[var(--color-text-muted)]">
            4:3
          </div>
        </AspectRatio>
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">16:9 (Widescreen)</p>
        <AspectRatio ratio="16:9" className="bg-[var(--color-bg-elevated)] rounded-lg">
          <div className="w-full h-full flex items-center justify-center text-sm text-[var(--color-text-muted)]">
            16:9
          </div>
        </AspectRatio>
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">21:9 (Ultrawide)</p>
        <AspectRatio ratio="21:9" className="bg-[var(--color-bg-elevated)] rounded-lg">
          <div className="w-full h-full flex items-center justify-center text-sm text-[var(--color-text-muted)]">
            21:9
          </div>
        </AspectRatio>
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">3:2 (Photo)</p>
        <AspectRatio ratio="3:2" className="bg-[var(--color-bg-elevated)] rounded-lg">
          <div className="w-full h-full flex items-center justify-center text-sm text-[var(--color-text-muted)]">
            3:2
          </div>
        </AspectRatio>
      </div>
    </div>
  ),
};

/**
 * Portrait ratios.
 */
export const Portrait: StoryObj = {
  render: () => (
    <div className="flex gap-8 items-start">
      <div className="w-24">
        <p className="text-xs text-[var(--color-text-muted)] mb-2 text-center">9:16 (Story)</p>
        <AspectRatio ratio="9:16" className="bg-[var(--color-bg-elevated)] rounded-lg">
          <div className="w-full h-full flex items-center justify-center text-xs text-[var(--color-text-muted)]">
            9:16
          </div>
        </AspectRatio>
      </div>
      <div className="w-32">
        <p className="text-xs text-[var(--color-text-muted)] mb-2 text-center">3:4 (Portrait)</p>
        <AspectRatio ratio={3 / 4} className="bg-[var(--color-bg-elevated)] rounded-lg">
          <div className="w-full h-full flex items-center justify-center text-xs text-[var(--color-text-muted)]">
            3:4
          </div>
        </AspectRatio>
      </div>
    </div>
  ),
};

/**
 * Custom numeric ratio.
 */
export const CustomRatio: Story = {
  args: {
    ratio: 2.35, // Cinemascope
  },
  render: (args) => (
    <AspectRatio {...args} className="bg-[var(--color-bg-elevated)] rounded-lg">
      <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)]">
        2.35:1 (Cinemascope)
      </div>
    </AspectRatio>
  ),
};

/**
 * With image content.
 */
export const WithImage: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">16:9 with cover fit</p>
        <AspectRatioImage
          src="https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800"
          alt="Abstract gradient"
          ratio="16:9"
          objectFit="cover"
        />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">1:1 with cover fit</p>
        <div className="w-48">
          <AspectRatioImage
            src="https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400"
            alt="Abstract gradient"
            ratio="1:1"
            objectFit="cover"
          />
        </div>
      </div>
    </div>
  ),
};

/**
 * Object fit modes.
 */
export const ObjectFitModes: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">object-fit: cover (fills, may crop)</p>
        <AspectRatioImage
          src="https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800"
          alt="Cover example"
          ratio="16:9"
          objectFit="cover"
        />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">object-fit: contain (fits inside)</p>
        <AspectRatioImage
          src="https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800"
          alt="Contain example"
          ratio="16:9"
          objectFit="contain"
          className="bg-black"
        />
      </div>
    </div>
  ),
};

/**
 * Object position.
 */
export const ObjectPosition: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">object-position: center (default)</p>
        <AspectRatioImage
          src="https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800"
          alt="Center position"
          ratio="16:9"
          objectFit="cover"
        />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">object-position: top</p>
        <AspectRatioImage
          src="https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800"
          alt="Top position"
          ratio="16:9"
          objectFit="cover"
          objectPosition="top"
        />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">object-position: bottom</p>
        <AspectRatioImage
          src="https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800"
          alt="Bottom position"
          ratio="16:9"
          objectFit="cover"
          objectPosition="bottom"
        />
      </div>
    </div>
  ),
};

/**
 * Image with fallback.
 */
export const WithFallback: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Valid image</p>
        <AspectRatioImage
          src="https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400"
          alt="Valid image"
          ratio="16:9"
          fallback={
            <div className="w-full h-full bg-[var(--color-bg-elevated)] flex items-center justify-center text-[var(--color-text-muted)]">
              Image failed to load
            </div>
          }
        />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Broken image (shows fallback)</p>
        <AspectRatioImage
          src="https://invalid-url-that-will-fail.com/image.jpg"
          alt="Broken image"
          ratio="16:9"
          fallback={
            <div className="w-full h-full bg-[var(--color-bg-elevated)] flex items-center justify-center text-[var(--color-text-muted)]">
              <span className="text-2xl mr-2">🖼️</span>
              Image failed to load
            </div>
          }
        />
      </div>
    </div>
  ),
};

/**
 * Video embed.
 */
export const VideoEmbed: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">YouTube embed (16:9)</p>
        <AspectRatioVideo
          src="https://www.youtube.com/embed/dQw4w9WgXcQ"
          title="Video example"
          ratio="16:9"
        />
      </div>
    </div>
  ),
};

/**
 * Placeholder skeleton.
 */
export const Placeholder: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">16:9 animated placeholder</p>
        <AspectRatioPlaceholder ratio="16:9" animate />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">1:1 static placeholder</p>
        <div className="w-48">
          <AspectRatioPlaceholder ratio="1:1" animate={false} />
        </div>
      </div>
    </div>
  ),
};

/**
 * Card use case.
 */
export const CardUseCase: StoryObj = {
  render: () => (
    <div className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
      <AspectRatioImage
        src="https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800"
        alt="Card image"
        ratio="16:9"
        className="rounded-lg"
      />
      <div className="mt-4">
        <h3 className="font-medium text-white">Card Title</h3>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Card description with aspect ratio image.
        </p>
      </div>
    </div>
  ),
};

/**
 * Profile avatar use case.
 */
export const AvatarUseCase: StoryObj = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16">
        <AspectRatio ratio="1:1" className="rounded-full overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200"
            alt="User avatar"
            className="w-full h-full object-cover"
          />
        </AspectRatio>
      </div>
      <div>
        <p className="font-medium text-white">John Doe</p>
        <p className="text-sm text-[var(--color-text-muted)]">@johndoe</p>
      </div>
    </div>
  ),
};

/**
 * Gallery grid.
 */
export const GalleryGrid: StoryObj = {
  render: () => (
    <div className="grid grid-cols-3 gap-2">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <AspectRatio key={i} ratio="1:1" className="bg-[var(--color-bg-elevated)] rounded-lg overflow-hidden">
          <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)]">
            {i}
          </div>
        </AspectRatio>
      ))}
    </div>
  ),
};

/**
 * Banner ratio (3:1).
 */
export const Banner: StoryObj = {
  render: () => (
    <AspectRatio ratio="3:1" className="bg-gradient-to-r from-[#FFD700]/20 to-[#FFD700]/5 rounded-lg">
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-lg font-medium text-white">Banner Content (3:1)</span>
      </div>
    </AspectRatio>
  ),
};
