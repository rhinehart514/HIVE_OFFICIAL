'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { Slot, Slottable, composeRefs } from './Slot';
import * as React from 'react';

const meta: Meta<typeof Slot> = {
  title: 'Design System/Components/Slot',
  component: Slot,
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
type Story = StoryObj<typeof Slot>;

// Demo Button component with asChild support
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: 'default' | 'primary' | 'ghost';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild, variant = 'default', className, children, ...props }, ref) => {
    const baseClasses = 'px-4 py-2 rounded-lg font-medium text-sm transition-colors';
    const variantClasses = {
      default: 'bg-white/10 hover:bg-white/20 text-white',
      primary: 'bg-[#FFD700] hover:bg-[#FFD700]/90 text-black',
      ghost: 'hover:bg-white/10 text-white',
    };
    const allClasses = `${baseClasses} ${variantClasses[variant]} ${className || ''}`;

    if (asChild) {
      return (
        <Slot ref={ref as React.Ref<HTMLElement>} className={allClasses} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button ref={ref} className={allClasses} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

/**
 * Basic asChild pattern - rendering as a link.
 */
export const AsLink: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-text-muted)]">Regular button:</p>
      <Button>Click me</Button>

      <p className="text-sm text-[var(--color-text-muted)] mt-4">Button rendered as link:</p>
      <Button asChild>
        <a href="https://example.com">Visit Site</a>
      </Button>

      <p className="text-xs text-[var(--color-text-muted)] mt-2">
        Inspect the DOM - the second button is actually an {"<a>"} tag!
      </p>
    </div>
  ),
};

/**
 * Prop merging demonstration.
 */
export const PropMerging: StoryObj = {
  render: function PropMergeDemo() {
    const [clicks, setClicks] = React.useState({ parent: 0, child: 0 });

    return (
      <div className="space-y-4">
        <Slot
          onClick={() => setClicks((c) => ({ ...c, parent: c.parent + 1 }))}
          className="font-bold"
        >
          <button
            onClick={() => setClicks((c) => ({ ...c, child: c.child + 1 }))}
            className="px-4 py-2 rounded-lg bg-white/10 text-white"
          >
            Click me
          </button>
        </Slot>
        <div className="text-sm text-[var(--color-text-muted)]">
          <p>Parent onClick called: {clicks.parent} times</p>
          <p>Child onClick called: {clicks.child} times</p>
          <p className="mt-2 text-xs">
            Both handlers fire! Classes also merge.
          </p>
        </div>
      </div>
    );
  },
};

/**
 * Style merging.
 */
export const StyleMerging: Story = {
  render: () => (
    <div className="space-y-4">
      <Slot
        style={{ backgroundColor: 'rgba(255,215,0,0.2)', padding: '16px' }}
        className="rounded-lg"
      >
        <div style={{ border: '2px solid white' }} className="text-white text-sm">
          Styles and classes merge from both Slot and child
        </div>
      </Slot>
      <p className="text-xs text-[var(--color-text-muted)]">
        Parent: background, padding, rounded | Child: border
      </p>
    </div>
  ),
};

/**
 * Polymorphic component with variants.
 */
export const PolymorphicVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="default">Default</Button>
        <Button variant="primary">Primary</Button>
        <Button variant="ghost">Ghost</Button>
      </div>

      <div className="flex gap-2">
        <Button variant="default" asChild>
          <a href="#">Link Default</a>
        </Button>
        <Button variant="primary" asChild>
          <a href="#">Link Primary</a>
        </Button>
        <Button variant="ghost" asChild>
          <a href="#">Link Ghost</a>
        </Button>
      </div>

      <p className="text-xs text-[var(--color-text-muted)]">
        Same styles, different elements (button vs anchor)
      </p>
    </div>
  ),
};

/**
 * Ref forwarding.
 */
export const RefForwarding: StoryObj = {
  render: function RefDemo() {
    const buttonRef = React.useRef<HTMLAnchorElement>(null);
    const [focused, setFocused] = React.useState(false);

    return (
      <div className="space-y-4">
        <Button asChild>
          <a
            ref={buttonRef}
            href="#"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          >
            Focusable Link
          </a>
        </Button>

        <button
          onClick={() => buttonRef.current?.focus()}
          className="px-3 py-1.5 rounded bg-white/10 text-white text-sm"
        >
          Focus the link programmatically
        </button>

        <p className="text-sm text-[var(--color-text-muted)]">
          Link is {focused ? 'focused' : 'not focused'}
        </p>
      </div>
    );
  },
};

/**
 * Composed refs.
 */
export const ComposedRefs: StoryObj = {
  render: function ComposedDemo() {
    const ref1 = React.useRef<HTMLButtonElement>(null);
    const ref2 = React.useRef<HTMLButtonElement>(null);
    const [text, setText] = React.useState('');

    const composedRef = composeRefs(ref1, ref2);

    return (
      <div className="space-y-4">
        <button
          ref={composedRef}
          className="px-4 py-2 rounded-lg bg-white/10 text-white"
        >
          Button with composed refs
        </button>

        <button
          onClick={() => {
            setText(`ref1: ${ref1.current?.tagName}, ref2: ${ref2.current?.tagName}`);
          }}
          className="px-3 py-1.5 rounded bg-[#FFD700] text-black text-sm"
        >
          Check refs
        </button>

        {text && <p className="text-sm text-white">{text}</p>}

        <p className="text-xs text-[var(--color-text-muted)]">
          Both refs point to the same element
        </p>
      </div>
    );
  },
};

/**
 * With Next.js Link.
 */
export const NextLinkPattern: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-text-muted)]">
        Pattern for Next.js Link (simulated):
      </p>
      <pre className="p-4 rounded-lg bg-[var(--color-bg-elevated)] text-xs text-white font-sans overflow-x-auto">
{`<Button asChild>
  <Link href="/dashboard">
    Go to Dashboard
  </Link>
</Button>`}
      </pre>

      <p className="text-xs text-[var(--color-text-muted)]">
        Button styles apply directly to Link, no extra wrapper div.
      </p>

      <Button asChild>
        <a href="#dashboard">Go to Dashboard (simulated)</a>
      </Button>
    </div>
  ),
};

/**
 * Slottable pattern for complex children.
 */
export const SlottablePattern: Story = {
  render: () => {
    // Component that supports both direct children and slotted content
    interface CardProps {
      asChild?: boolean;
      children: React.ReactNode;
      footer?: React.ReactNode;
    }

    const Card: React.FC<CardProps> = ({ asChild, children, footer }) => {
      const Comp = asChild ? Slot : 'div';
      return (
        <Comp className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
          <Slottable>{children}</Slottable>
          {footer && <div className="mt-4 pt-4 border-t border-[var(--color-border)]">{footer}</div>}
        </Comp>
      );
    };

    return (
      <div className="space-y-4">
        <Card footer={<button className="text-sm text-[#FFD700]">Read more</button>}>
          <h3 className="font-medium text-white">Card Title</h3>
          <p className="text-sm text-[var(--color-text-muted)]">Card content</p>
        </Card>

        <Card asChild footer={<span className="text-xs text-[var(--color-text-muted)]">Published today</span>}>
          <article>
            <h3 className="font-medium text-white">Article Card</h3>
            <p className="text-sm text-[var(--color-text-muted)]">Semantic article element</p>
          </article>
        </Card>
      </div>
    );
  },
};

/**
 * Dialog trigger pattern.
 */
export const DialogTriggerPattern: StoryObj = {
  render: function DialogDemo() {
    const [isOpen, setIsOpen] = React.useState(false);

    // Simulated DialogTrigger with asChild
    interface DialogTriggerProps {
      asChild?: boolean;
      children: React.ReactNode;
      onClick?: () => void;
    }

    const DialogTrigger: React.FC<DialogTriggerProps> = ({ asChild, children, onClick }) => {
      const handleClick = () => {
        onClick?.();
        setIsOpen(true);
      };

      if (asChild) {
        return (
          <Slot onClick={handleClick}>
            {children}
          </Slot>
        );
      }

      return <button onClick={handleClick}>{children}</button>;
    };

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <DialogTrigger asChild>
            <Button variant="primary">Open Dialog</Button>
          </DialogTrigger>

          <DialogTrigger asChild>
            <button className="w-10 h-10 rounded-lg bg-white/10 text-white flex items-center justify-center">
              +
            </button>
          </DialogTrigger>
        </div>

        {isOpen && (
          <div className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
            <p className="text-white mb-4">Dialog content</p>
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 rounded bg-white/10 text-white text-sm"
            >
              Close
            </button>
          </div>
        )}

        <p className="text-xs text-[var(--color-text-muted)]">
          DialogTrigger renders as whatever child you pass with asChild.
        </p>
      </div>
    );
  },
};

/**
 * Avoiding extra DOM elements.
 */
export const DOMComparison: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-white">Without asChild (extra wrapper):</p>
        <pre className="p-4 rounded-lg bg-[#1a1a1a] text-xs font-sans text-green-400 overflow-x-auto">
{`<div class="button-wrapper">
  <a href="/">Link</a>
</div>`}
        </pre>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-white">With asChild (no wrapper):</p>
        <pre className="p-4 rounded-lg bg-[#1a1a1a] text-xs font-sans text-green-400 overflow-x-auto">
{`<a class="button-styles" href="/">Link</a>`}
        </pre>
      </div>

      <p className="text-xs text-[var(--color-text-muted)]">
        Cleaner DOM = better performance, styling, and accessibility.
      </p>
    </div>
  ),
};
