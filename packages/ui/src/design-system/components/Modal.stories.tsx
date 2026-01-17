'use client';

import type { Meta, StoryObj } from '@storybook/react';
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  ModalClose,
  useModal,
} from './Modal';
import { Button } from '../primitives';
import * as React from 'react';

const meta: Meta = {
  title: 'Design System/Components/Modal',
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="p-8 min-h-[600px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;

/**
 * Basic modal with trigger.
 */
export const Default: StoryObj = {
  render: () => (
    <Modal>
      <ModalTrigger asChild>
        <Button>Open Modal</Button>
      </ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Modal Title</ModalTitle>
          <ModalDescription>
            This is a description of the modal content.
          </ModalDescription>
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-white">
            Modal content goes here. You can add any content you want.
          </p>
        </ModalBody>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="ghost">Cancel</Button>
          </ModalClose>
          <Button variant="primary">Save Changes</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ),
};

/**
 * Small modal.
 */
export const Small: StoryObj = {
  render: () => (
    <Modal>
      <ModalTrigger asChild>
        <Button variant="secondary">Small Modal</Button>
      </ModalTrigger>
      <ModalContent size="sm">
        <ModalHeader>
          <ModalTitle>Confirm</ModalTitle>
          <ModalDescription>Are you sure you want to continue?</ModalDescription>
        </ModalHeader>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="ghost" size="sm">No</Button>
          </ModalClose>
          <Button variant="primary" size="sm">Yes</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ),
};

/**
 * Large modal.
 */
export const Large: StoryObj = {
  render: () => (
    <Modal>
      <ModalTrigger asChild>
        <Button variant="secondary">Large Modal</Button>
      </ModalTrigger>
      <ModalContent size="lg">
        <ModalHeader>
          <ModalTitle>Large Modal</ModalTitle>
          <ModalDescription>This modal has more space for content.</ModalDescription>
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-white mb-4">
            This modal is larger and can accommodate more complex content layouts.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[var(--color-bg-elevated)]">
              <p className="text-sm text-[var(--color-text-muted)]">Section 1</p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--color-bg-elevated)]">
              <p className="text-sm text-[var(--color-text-muted)]">Section 2</p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="ghost">Cancel</Button>
          </ModalClose>
          <Button variant="primary">Continue</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ),
};

/**
 * Extra large modal.
 */
export const ExtraLarge: StoryObj = {
  render: () => (
    <Modal>
      <ModalTrigger asChild>
        <Button variant="secondary">XL Modal</Button>
      </ModalTrigger>
      <ModalContent size="xl">
        <ModalHeader>
          <ModalTitle>Settings</ModalTitle>
          <ModalDescription>Configure your preferences.</ModalDescription>
        </ModalHeader>
        <ModalBody className="space-y-4">
          {['General', 'Notifications', 'Privacy', 'Security'].map((section) => (
            <div key={section} className="p-4 rounded-lg border border-[var(--color-border)]">
              <h4 className="text-sm font-medium text-white mb-2">{section}</h4>
              <p className="text-xs text-[var(--color-text-muted)]">
                Configure your {section.toLowerCase()} settings here.
              </p>
            </div>
          ))}
        </ModalBody>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="ghost">Cancel</Button>
          </ModalClose>
          <Button variant="primary">Save</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ),
};

/**
 * Modal without close button.
 */
export const NoCloseButton: StoryObj = {
  render: () => (
    <Modal>
      <ModalTrigger asChild>
        <Button variant="secondary">No Close Button</Button>
      </ModalTrigger>
      <ModalContent showClose={false}>
        <ModalHeader>
          <ModalTitle>Important Notice</ModalTitle>
          <ModalDescription>Please read carefully before proceeding.</ModalDescription>
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-white">
            This modal doesn&apos;t have a close button. You must use the action buttons.
          </p>
        </ModalBody>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="ghost">Dismiss</Button>
          </ModalClose>
          <Button variant="primary">I Understand</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ),
};

/**
 * Form modal.
 */
export const FormModal: StoryObj = {
  render: () => (
    <Modal>
      <ModalTrigger asChild>
        <Button>Create New</Button>
      </ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Create Space</ModalTitle>
          <ModalDescription>Fill in the details to create a new space.</ModalDescription>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Name</label>
            <input
              type="text"
              placeholder="Enter space name"
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-white text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Description</label>
            <textarea
              placeholder="Describe your space"
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-white text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Privacy</label>
            <select className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50">
              <option>Public</option>
              <option>Private</option>
              <option>Invite Only</option>
            </select>
          </div>
        </ModalBody>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="ghost">Cancel</Button>
          </ModalClose>
          <Button variant="primary">Create Space</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ),
};

/**
 * Destructive action modal.
 */
export const DestructiveModal: StoryObj = {
  render: () => (
    <Modal>
      <ModalTrigger asChild>
        <Button variant="destructive">Delete Account</Button>
      </ModalTrigger>
      <ModalContent size="sm">
        <ModalHeader>
          <ModalTitle>Delete Account</ModalTitle>
          <ModalDescription>
            This action cannot be undone. All your data will be permanently removed.
          </ModalDescription>
        </ModalHeader>
        <ModalBody>
          <div className="p-3 rounded-lg bg-[#FF6B6B]/10 border border-[#FF6B6B]/20">
            <p className="text-sm text-[#FF6B6B]">
              ⚠️ This will delete all your spaces, tools, and connections.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="ghost">Cancel</Button>
          </ModalClose>
          <Button variant="destructive">Delete Forever</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ),
};

/**
 * Controlled modal with hook.
 */
export const Controlled: StoryObj = {
  render: function ControlledModal() {
    const { open, setOpen, onOpen, onClose } = useModal();

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={onOpen}>Open</Button>
          <Button variant="secondary" onClick={() => setOpen(!open)}>Toggle</Button>
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">
          State: {open ? 'Open' : 'Closed'}
        </p>
        <Modal open={open} onOpenChange={setOpen}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Controlled Modal</ModalTitle>
              <ModalDescription>This modal is controlled via hook.</ModalDescription>
            </ModalHeader>
            <ModalBody>
              <p className="text-sm text-white">
                You can control this modal programmatically.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onClick={onClose}>Close</Button>
              <Button variant="primary">Action</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    );
  },
};

/**
 * Scrollable content modal.
 */
export const ScrollableContent: StoryObj = {
  render: () => (
    <Modal>
      <ModalTrigger asChild>
        <Button variant="secondary">Scrollable Modal</Button>
      </ModalTrigger>
      <ModalContent size="default">
        <ModalHeader>
          <ModalTitle>Terms of Service</ModalTitle>
          <ModalDescription>Please read and accept our terms.</ModalDescription>
        </ModalHeader>
        <ModalBody className="max-h-[300px] overflow-y-auto">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="mb-4">
              <h4 className="text-sm font-medium text-white mb-1">Section {i + 1}</h4>
              <p className="text-sm text-[var(--color-text-muted)]">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
                tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                veniam, quis nostrud exercitation ullamco laboris.
              </p>
            </div>
          ))}
        </ModalBody>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="ghost">Decline</Button>
          </ModalClose>
          <Button variant="primary">Accept</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ),
};
