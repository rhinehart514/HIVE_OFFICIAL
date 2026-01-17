'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ConfirmDialog, useConfirmDialog } from './ConfirmDialog';
import { Button } from '../primitives/Button';

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Design System/Components/ConfirmDialog',
  component: ConfirmDialog,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
};

export default meta;
type Story = StoryObj<typeof ConfirmDialog>;

/**
 * Danger confirmation (destructive action)
 */
export const Danger: Story = {
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Delete Space
        </Button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          variant="danger"
          title="Delete this space?"
          description="This action cannot be undone. All messages, files, and data will be permanently removed."
          confirmText="Delete Space"
          onConfirm={() => {
            console.log('Deleted!');
            setOpen(false);
          }}
        />
      </>
    );
  },
};

/**
 * Warning confirmation
 */
export const Warning: Story = {
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Leave Space
        </Button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          variant="warning"
          title="Leave this space?"
          description="You'll lose access to all conversations and files. You can rejoin anytime from the browse page."
          confirmText="Leave Space"
          onConfirm={() => setOpen(false)}
        />
      </>
    );
  },
};

/**
 * Info confirmation
 */
export const Info: Story = {
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Continue
        </Button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          variant="info"
          title="Enable notifications?"
          description="Stay updated with new messages, events, and activities in your spaces."
          confirmText="Enable"
          onConfirm={() => setOpen(false)}
        />
      </>
    );
  },
};

/**
 * Success confirmation
 */
export const Success: Story = {
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Confirm
        </Button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          variant="success"
          title="Publish this tool?"
          description="Your tool will be available to all members of this space."
          confirmText="Publish"
          onConfirm={() => setOpen(false)}
        />
      </>
    );
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    const [loading, setLoading] = useState(false);

    const handleConfirm = () => {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setOpen(false);
      }, 2000);
    };

    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Delete
        </Button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          variant="danger"
          title="Delete this space?"
          description="This action cannot be undone."
          confirmText="Delete"
          loading={loading}
          onConfirm={handleConfirm}
        />
      </>
    );
  },
};

/**
 * No icon
 */
export const NoIcon: Story = {
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Confirm
        </Button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          hideIcon
          title="Save changes?"
          description="You have unsaved changes. Would you like to save before leaving?"
          confirmText="Save"
          cancelText="Discard"
          onConfirm={() => setOpen(false)}
        />
      </>
    );
  },
};

/**
 * Using the hook
 */
export const WithHook: Story = {
  render: () => {
    const { confirm, Dialog } = useConfirmDialog();

    const handleDelete = async () => {
      const confirmed = await confirm({
        title: 'Delete this item?',
        description: 'This action cannot be undone.',
        variant: 'danger',
        confirmText: 'Delete',
      });

      if (confirmed) {
        console.log('Item deleted!');
      }
    };

    return (
      <>
        <Button variant="secondary" onClick={handleDelete}>
          Delete with Hook
        </Button>
        {Dialog}
      </>
    );
  },
};

/**
 * All variants
 */
export const AllVariants: Story = {
  render: () => {
    const [variant, setVariant] = useState<'danger' | 'warning' | 'info' | 'success' | null>(null);

    return (
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button variant="ghost" onClick={() => setVariant('danger')} className="text-[#FF6B6B]">
            Danger
          </Button>
          <Button variant="ghost" onClick={() => setVariant('warning')} className="text-[#FFA500]">
            Warning
          </Button>
          <Button variant="ghost" onClick={() => setVariant('info')} className="text-[#4A9EFF]">
            Info
          </Button>
          <Button variant="ghost" onClick={() => setVariant('success')} className="text-[#22C55E]">
            Success
          </Button>
        </div>

        {variant && (
          <ConfirmDialog
            open
            onOpenChange={() => setVariant(null)}
            variant={variant}
            title={`${variant.charAt(0).toUpperCase() + variant.slice(1)} Dialog`}
            description={`This is a ${variant} confirmation dialog. The button color matches the variant.`}
            confirmText="Confirm"
            onConfirm={() => setVariant(null)}
          />
        )}
      </div>
    );
  },
};
