'use client';

import type { Meta, StoryObj } from '@storybook/react';
import {
  Toast,
  ToastAction,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastWithIcon,
} from './Toast';
import { Button } from '../primitives';
import * as React from 'react';

const meta: Meta = {
  title: 'Design System/Components/Toast',
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <ToastProvider>
        <div className="p-8 min-h-[400px]">
          <Story />
        </div>
        <ToastViewport />
      </ToastProvider>
    ),
  ],
};

export default meta;

/**
 * Basic toast demonstration using controlled state.
 */
export const Default: StoryObj = {
  render: function ToastDemo() {
    const [open, setOpen] = React.useState(false);

    return (
      <>
        <Button onClick={() => setOpen(true)}>Show Toast</Button>
        <Toast open={open} onOpenChange={setOpen}>
          <ToastTitle>Toast Title</ToastTitle>
          <ToastDescription>This is a toast notification message.</ToastDescription>
        </Toast>
      </>
    );
  },
};

/**
 * All toast variants.
 */
export const Variants: StoryObj = {
  render: function VariantsDemo() {
    const [toasts, setToasts] = React.useState<{id: number; variant: 'default' | 'success' | 'error' | 'warning' | 'gold'}[]>([]);
    let counter = 0;

    const showToast = (variant: 'default' | 'success' | 'error' | 'warning' | 'gold') => {
      const id = counter++;
      setToasts(prev => [...prev, { id, variant }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
    };

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => showToast('default')}>Default</Button>
          <Button variant="secondary" onClick={() => showToast('success')}>Success</Button>
          <Button variant="secondary" onClick={() => showToast('error')}>Error</Button>
          <Button variant="secondary" onClick={() => showToast('warning')}>Warning</Button>
          <Button variant="primary" onClick={() => showToast('gold')}>Gold</Button>
        </div>
        {toasts.map(({ id, variant }) => (
          <Toast key={id} variant={variant} open onOpenChange={() => setToasts(prev => prev.filter(t => t.id !== id))}>
            <ToastTitle className="capitalize">{variant} Toast</ToastTitle>
            <ToastDescription>This is a {variant} notification.</ToastDescription>
          </Toast>
        ))}
      </div>
    );
  },
};

/**
 * Toast with action button.
 */
export const WithAction: StoryObj = {
  render: function WithActionDemo() {
    const [open, setOpen] = React.useState(false);

    return (
      <>
        <Button onClick={() => setOpen(true)}>Show Action Toast</Button>
        <Toast open={open} onOpenChange={setOpen}>
          <div className="grid gap-1">
            <ToastTitle>Event Created</ToastTitle>
            <ToastDescription>Your event has been scheduled.</ToastDescription>
          </div>
          <ToastAction altText="View event">View</ToastAction>
        </Toast>
      </>
    );
  },
};

/**
 * Toast with icon.
 */
export const WithIcon: StoryObj = {
  render: function WithIconDemo() {
    const [toasts, setToasts] = React.useState<{id: number; variant: 'success' | 'error' | 'warning' | 'gold'}[]>([]);
    let counter = 0;

    const showToast = (variant: 'success' | 'error' | 'warning' | 'gold') => {
      const id = counter++;
      setToasts(prev => [...prev, { id, variant }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
    };

    const messages = {
      success: { title: 'Success!', desc: 'Your changes have been saved.' },
      error: { title: 'Error', desc: 'Something went wrong.' },
      warning: { title: 'Warning', desc: 'Please review your input.' },
      gold: { title: 'Achievement!', desc: 'You earned a new badge!' },
    };

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => showToast('success')}>Success</Button>
          <Button variant="secondary" onClick={() => showToast('error')}>Error</Button>
          <Button variant="secondary" onClick={() => showToast('warning')}>Warning</Button>
          <Button variant="primary" onClick={() => showToast('gold')}>Gold</Button>
        </div>
        {toasts.map(({ id, variant }) => (
          <ToastWithIcon
            key={id}
            variant={variant}
            title={messages[variant].title}
            description={messages[variant].desc}
            open
            onOpenChange={() => setToasts(prev => prev.filter(t => t.id !== id))}
          />
        ))}
      </div>
    );
  },
};

/**
 * Undo action toast.
 */
export const UndoAction: StoryObj = {
  render: function UndoDemo() {
    const [open, setOpen] = React.useState(false);

    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>Delete Item</Button>
        <Toast open={open} onOpenChange={setOpen}>
          <div className="grid gap-1">
            <ToastTitle>Item Deleted</ToastTitle>
            <ToastDescription>The item has been moved to trash.</ToastDescription>
          </div>
          <ToastAction altText="Undo deletion">Undo</ToastAction>
        </Toast>
      </>
    );
  },
};

/**
 * Multiple toasts stacked.
 */
export const StackedToasts: StoryObj = {
  render: function StackedDemo() {
    const [toasts, setToasts] = React.useState<{id: number; title: string; desc: string; variant: 'default' | 'success' | 'error'}[]>([]);
    let counter = 0;

    const addToast = () => {
      const variants: ('default' | 'success' | 'error')[] = ['default', 'success', 'error'];
      const variant = variants[Math.floor(Math.random() * variants.length)];
      const id = counter++;
      setToasts(prev => [...prev, {
        id,
        title: `Toast ${id + 1}`,
        desc: `This is notification #${id + 1}`,
        variant
      }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
    };

    return (
      <div className="space-y-4">
        <Button onClick={addToast}>Add Toast</Button>
        <p className="text-sm text-[var(--color-text-muted)]">
          Click multiple times to stack toasts
        </p>
        {toasts.map(({ id, title, desc, variant }) => (
          <Toast key={id} variant={variant} open onOpenChange={() => setToasts(prev => prev.filter(t => t.id !== id))}>
            <ToastTitle>{title}</ToastTitle>
            <ToastDescription>{desc}</ToastDescription>
          </Toast>
        ))}
      </div>
    );
  },
};

/**
 * Long content toast.
 */
export const LongContent: StoryObj = {
  render: function LongContentDemo() {
    const [open, setOpen] = React.useState(false);

    return (
      <>
        <Button onClick={() => setOpen(true)}>Show Long Toast</Button>
        <Toast open={open} onOpenChange={setOpen} className="max-w-md">
          <div className="grid gap-1">
            <ToastTitle>System Update Available</ToastTitle>
            <ToastDescription>
              A new version of the application is available. Please save your work
              and refresh the page to get the latest features and bug fixes.
            </ToastDescription>
          </div>
          <ToastAction altText="Refresh now">Refresh</ToastAction>
        </Toast>
      </>
    );
  },
};

/**
 * Promise toast pattern (loading → success/error).
 */
export const PromiseToast: StoryObj = {
  render: function PromiseDemo() {
    const [state, setState] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const simulateAsync = async () => {
      setState('loading');
      await new Promise(resolve => setTimeout(resolve, 2000));
      setState(Math.random() > 0.5 ? 'success' : 'error');
      setTimeout(() => setState('idle'), 3000);
    };

    return (
      <div className="space-y-4">
        <Button onClick={simulateAsync} disabled={state === 'loading'}>
          {state === 'loading' ? 'Loading...' : 'Trigger Async'}
        </Button>

        {state === 'loading' && (
          <Toast open variant="default">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <ToastTitle>Processing...</ToastTitle>
            </div>
          </Toast>
        )}

        {state === 'success' && (
          <ToastWithIcon open variant="success" title="Success!" description="Operation completed successfully." />
        )}

        {state === 'error' && (
          <ToastWithIcon open variant="error" title="Error" description="Something went wrong. Please try again." />
        )}
      </div>
    );
  },
};
