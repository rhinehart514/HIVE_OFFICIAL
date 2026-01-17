'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { Portal, PortalWithContainer, ModalPortal, TooltipPortal, ToastPortal } from './Portal';
import * as React from 'react';

const meta: Meta<typeof Portal> = {
  title: 'Design System/Components/Portal',
  component: Portal,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="p-8">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Portal>;

/**
 * Basic portal demonstration.
 */
export const Basic: StoryObj = {
  render: function BasicDemo() {
    const [showPortal, setShowPortal] = React.useState(false);

    return (
      <div className="space-y-4">
        <button
          onClick={() => setShowPortal(!showPortal)}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
        >
          {showPortal ? 'Hide Portal' : 'Show Portal'}
        </button>
        {showPortal && (
          <Portal>
            <div className="fixed bottom-4 right-4 p-4 rounded-lg bg-[#FFD700] text-black text-sm">
              I'm portaled to document.body!
            </div>
          </Portal>
        )}
        <p className="text-sm text-[var(--color-text-muted)]">
          The yellow box appears at the bottom-right of the viewport when toggled.
        </p>
      </div>
    );
  },
};

/**
 * Escaping overflow: hidden.
 */
export const EscapeOverflow: StoryObj = {
  render: function OverflowDemo() {
    const [showDropdown, setShowDropdown] = React.useState(false);
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const [position, setPosition] = React.useState({ top: 0, left: 0 });

    React.useEffect(() => {
      if (showDropdown && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({ top: rect.bottom + 4, left: rect.left });
      }
    }, [showDropdown]);

    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          The container has <code className="bg-white/10 px-1 rounded">overflow: hidden</code>, but the dropdown escapes:
        </p>
        <div className="p-4 h-24 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] overflow-hidden">
          <button
            ref={buttonRef}
            onClick={() => setShowDropdown(!showDropdown)}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
          >
            Open Dropdown ▼
          </button>
          {showDropdown && (
            <Portal>
              <div
                className="fixed z-50 w-48 p-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] shadow-lg"
                style={{ top: position.top, left: position.left }}
              >
                {['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5'].map((item) => (
                  <div
                    key={item}
                    className="px-3 py-2 text-sm text-white rounded hover:bg-white/10 cursor-pointer"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </Portal>
          )}
        </div>
      </div>
    );
  },
};

/**
 * ModalPortal demonstration.
 */
export const Modal: StoryObj = {
  render: function ModalDemo() {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
      <div className="space-y-4">
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 rounded-lg bg-[#FFD700] text-black font-medium text-sm transition-colors hover:bg-[#FFD700]/90"
        >
          Open Modal
        </button>
        {isOpen && (
          <ModalPortal>
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <div className="relative w-96 p-6 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] shadow-xl">
              <h2 className="text-lg font-semibold text-white mb-2">Modal Title</h2>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">
                This modal is rendered via ModalPortal, ensuring proper stacking context.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#FFD700] text-black font-medium text-sm transition-colors hover:bg-[#FFD700]/90"
                >
                  Confirm
                </button>
              </div>
            </div>
          </ModalPortal>
        )}
      </div>
    );
  },
};

/**
 * TooltipPortal demonstration.
 */
export const Tooltip: StoryObj = {
  render: function TooltipDemo() {
    const [tooltip, setTooltip] = React.useState<{ show: boolean; x: number; y: number }>({
      show: false,
      x: 0,
      y: 0,
    });

    const handleMouseEnter = (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltip({
        show: true,
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
    };

    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-text-muted)]">Hover over the button:</p>
        <button
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => setTooltip({ ...tooltip, show: false })}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
        >
          Hover me
        </button>
        {tooltip.show && (
          <TooltipPortal>
            <div
              className="fixed px-3 py-2 rounded-lg bg-white text-black text-xs font-medium -translate-x-1/2 -translate-y-full"
              style={{ left: tooltip.x, top: tooltip.y }}
            >
              Tooltip content via Portal
              <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-white rotate-45" />
            </div>
          </TooltipPortal>
        )}
      </div>
    );
  },
};

/**
 * ToastPortal positions.
 */
export const ToastPositions: StoryObj = {
  render: function ToastDemo() {
    const [toasts, setToasts] = React.useState<Array<{ id: number; position: string }>>([]);

    const addToast = (position: string) => {
      const id = Date.now();
      setToasts([...toasts, { id, position }]);
      setTimeout(() => {
        setToasts((t) => t.filter((toast) => toast.id !== id));
      }, 3000);
    };

    const positions = [
      'top-left',
      'top-center',
      'top-right',
      'bottom-left',
      'bottom-center',
      'bottom-right',
    ] as const;

    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-text-muted)]">Click to show toast at position:</p>
        <div className="grid grid-cols-3 gap-2">
          {positions.map((position) => (
            <button
              key={position}
              onClick={() => addToast(position)}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
            >
              {position}
            </button>
          ))}
        </div>
        {toasts.map((toast) => (
          <ToastPortal key={toast.id} position={toast.position as typeof positions[number]}>
            <div className="p-4 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] shadow-lg">
              <p className="text-sm text-white">Toast at {toast.position}</p>
            </div>
          </ToastPortal>
        ))}
      </div>
    );
  },
};

/**
 * PortalWithContainer - auto-creates container.
 */
export const CustomContainer: StoryObj = {
  render: function ContainerDemo() {
    const [showContent, setShowContent] = React.useState(false);

    return (
      <div className="space-y-4">
        <button
          onClick={() => setShowContent(!showContent)}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
        >
          Toggle Portal Content
        </button>
        {showContent && (
          <PortalWithContainer
            containerId="custom-portal-root"
            containerClassName="fixed bottom-4 left-4 z-50"
          >
            <div className="p-4 rounded-lg bg-[#22C55E] text-white text-sm">
              Portaled to custom container!
            </div>
          </PortalWithContainer>
        )}
        <p className="text-sm text-[var(--color-text-muted)]">
          Creates a container div with id="custom-portal-root" if it doesn't exist.
        </p>
      </div>
    );
  },
};

/**
 * Z-index stacking demonstration.
 */
export const StackingOrder: StoryObj = {
  render: function StackingDemo() {
    const [layers, setLayers] = React.useState({
      dropdown: false,
      modal: false,
      toast: false,
    });

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setLayers({ ...layers, dropdown: !layers.dropdown })}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
          >
            Dropdown (z-50)
          </button>
          <button
            onClick={() => setLayers({ ...layers, modal: !layers.modal })}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
          >
            Modal (z-100)
          </button>
          <button
            onClick={() => setLayers({ ...layers, toast: !layers.toast })}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
          >
            Toast (z-150)
          </button>
        </div>

        {layers.dropdown && (
          <Portal>
            <div className="fixed top-1/2 left-1/4 z-50 p-4 rounded-lg bg-blue-600 text-white text-sm">
              Dropdown Layer (z-50)
            </div>
          </Portal>
        )}

        {layers.modal && (
          <Portal>
            <div className="fixed top-1/2 left-1/2 z-[100] p-4 rounded-lg bg-purple-600 text-white text-sm -translate-x-1/2">
              Modal Layer (z-100)
            </div>
          </Portal>
        )}

        {layers.toast && (
          <Portal>
            <div className="fixed top-4 right-4 z-[150] p-4 rounded-lg bg-green-600 text-white text-sm">
              Toast Layer (z-150)
            </div>
          </Portal>
        )}

        <p className="text-sm text-[var(--color-text-muted)]">
          Higher z-index layers appear on top. Click buttons to toggle each layer.
        </p>
      </div>
    );
  },
};

/**
 * Nested portals.
 */
export const NestedPortals: StoryObj = {
  render: function NestedDemo() {
    const [showOuter, setShowOuter] = React.useState(false);
    const [showInner, setShowInner] = React.useState(false);

    return (
      <div className="space-y-4">
        <button
          onClick={() => setShowOuter(true)}
          className="px-4 py-2 rounded-lg bg-[#FFD700] text-black font-medium text-sm"
        >
          Open Outer Modal
        </button>

        {showOuter && (
          <ModalPortal>
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => {
                setShowOuter(false);
                setShowInner(false);
              }}
            />
            <div className="relative w-96 p-6 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
              <h2 className="text-lg font-semibold text-white mb-4">Outer Modal</h2>
              <button
                onClick={() => setShowInner(true)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm"
              >
                Open Inner Modal
              </button>

              {showInner && (
                <Portal>
                  <div
                    className="fixed inset-0 bg-black/30"
                    onClick={() => setShowInner(false)}
                  />
                  <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 p-4 rounded-xl bg-blue-900 border border-blue-700 z-[200]">
                    <h3 className="text-white font-medium mb-2">Inner Modal</h3>
                    <p className="text-sm text-blue-200 mb-4">
                      This is a nested portal inside the outer modal.
                    </p>
                    <button
                      onClick={() => setShowInner(false)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm"
                    >
                      Close
                    </button>
                  </div>
                </Portal>
              )}

              <div className="mt-4">
                <button
                  onClick={() => {
                    setShowOuter(false);
                    setShowInner(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm"
                >
                  Close Outer
                </button>
              </div>
            </div>
          </ModalPortal>
        )}
      </div>
    );
  },
};
