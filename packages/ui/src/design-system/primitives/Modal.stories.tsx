import type { Meta, StoryObj } from '@storybook/react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  ModalTrigger,
  ModalClose,
} from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Label } from './Label';
import { Text } from './Text';

/**
 * Modal — Dialog overlay
 *
 * 4 variants: default, alert, sheet, fullscreen.
 * Focus ring is WHITE, never gold.
 *
 * @see docs/design-system/PRIMITIVES.md (Modal)
 */
const meta: Meta<typeof Modal> = {
  title: 'Design System/Primitives/Feedback/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Dialog overlay with 4 variants: default, alert, sheet, fullscreen. WHITE focus ring.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

/**
 * Default — Centered modal
 */
export const Default: Story = {
  render: () => (
    <Modal>
      <ModalTrigger asChild>
        <Button>Open Modal</Button>
      </ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Modal Title</ModalTitle>
          <ModalDescription>
            This is a default centered modal with a close button.
          </ModalDescription>
        </ModalHeader>
        <div className="py-4">
          <Text>Modal content goes here.</Text>
        </div>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="ghost">Cancel</Button>
          </ModalClose>
          <Button>Save Changes</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ),
};

/**
 * Alert — Confirmation dialog
 */
export const Alert: Story = {
  render: () => (
    <Modal>
      <ModalTrigger asChild>
        <Button variant="destructive">Delete Space</Button>
      </ModalTrigger>
      <ModalContent variant="alert">
        <ModalHeader>
          <ModalTitle>Are you sure?</ModalTitle>
          <ModalDescription>
            This action cannot be undone. This will permanently delete the space
            and all its content.
          </ModalDescription>
        </ModalHeader>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="ghost">Cancel</Button>
          </ModalClose>
          <Button variant="destructive">Delete</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ),
};

/**
 * Sheet — Bottom slide-up
 */
export const Sheet: Story = {
  render: () => (
    <Modal>
      <ModalTrigger asChild>
        <Button variant="secondary">Open Sheet</Button>
      </ModalTrigger>
      <ModalContent variant="sheet">
        <ModalHeader>
          <ModalTitle>Filter Spaces</ModalTitle>
          <ModalDescription>
            Narrow down your search results.
          </ModalDescription>
        </ModalHeader>
        <div className="py-4 space-y-4">
          <div className="flex flex-col gap-2">
            <Label>Category</Label>
            <Input placeholder="Search categories..." />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Member count</Label>
            <Input type="number" placeholder="Minimum members" />
          </div>
        </div>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="ghost">Reset</Button>
          </ModalClose>
          <Button>Apply Filters</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ),
};

/**
 * Fullscreen — Takes entire viewport
 */
export const Fullscreen: Story = {
  render: () => (
    <Modal>
      <ModalTrigger asChild>
        <Button variant="secondary">Open Fullscreen</Button>
      </ModalTrigger>
      <ModalContent variant="fullscreen" showClose={false}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
            <Text weight="medium">Image Viewer</Text>
            <ModalClose asChild>
              <Button variant="ghost" size="icon">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </ModalClose>
          </div>
          <div className="flex-1 flex items-center justify-center bg-[var(--color-bg-page)]">
            <Text tone="muted">Full-screen content area</Text>
          </div>
        </div>
      </ModalContent>
    </Modal>
  ),
};

/**
 * Without close button
 */
export const NoCloseButton: Story = {
  render: () => (
    <Modal>
      <ModalTrigger asChild>
        <Button>Open Modal</Button>
      </ModalTrigger>
      <ModalContent showClose={false}>
        <ModalHeader>
          <ModalTitle>Complete Your Profile</ModalTitle>
          <ModalDescription>
            Please fill out all required fields to continue.
          </ModalDescription>
        </ModalHeader>
        <div className="py-4 space-y-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Your name" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="handle">Handle</Label>
            <Input id="handle" placeholder="@yourhandle" />
          </div>
        </div>
        <ModalFooter>
          <Button className="w-full">Complete Setup</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ),
};

/**
 * In context — Create space
 */
export const CreateSpaceContext: Story = {
  render: () => (
    <Modal>
      <ModalTrigger asChild>
        <Button variant="cta">Create Space</Button>
      </ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Create a New Space</ModalTitle>
          <ModalDescription>
            Set up your community space. You can change these settings later.
          </ModalDescription>
        </ModalHeader>
        <div className="py-4 space-y-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="space-name">Space name</Label>
            <Input id="space-name" placeholder="e.g., UB Coders" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="space-desc">Description</Label>
            <Input id="space-desc" placeholder="What is this space about?" />
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-elevated)]">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-card)] flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[var(--color-text-muted)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <Text size="sm" weight="medium">Upload cover image</Text>
              <Text size="xs" tone="muted">Recommended: 1200x400px</Text>
            </div>
            <Button variant="secondary" size="sm">Upload</Button>
          </div>
        </div>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="ghost">Cancel</Button>
          </ModalClose>
          <Button variant="cta">Create Space</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ),
};

/**
 * In context — Invite members
 */
export const InviteMembersContext: Story = {
  render: () => (
    <Modal>
      <ModalTrigger asChild>
        <Button variant="secondary">Invite Members</Button>
      </ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Invite to Space</ModalTitle>
          <ModalDescription>
            Share the link below or invite people by email.
          </ModalDescription>
        </ModalHeader>
        <div className="py-4 space-y-4">
          <div className="flex gap-2">
            <Input
              readOnly
              value="https://hive.college/s/ub-coders"
              className="font-mono text-sm"
            />
            <Button variant="secondary">Copy</Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[var(--color-border)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[var(--color-bg-card)] px-2 text-[var(--color-text-muted)]">
                or invite by email
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="emails">Email addresses</Label>
            <Input id="emails" placeholder="email@example.com, ..." />
            <Text size="xs" tone="muted">
              Separate multiple emails with commas
            </Text>
          </div>
        </div>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="ghost">Cancel</Button>
          </ModalClose>
          <Button>Send Invites</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ),
};
