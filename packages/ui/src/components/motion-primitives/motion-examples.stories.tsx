/**
 * Motion Primitives - Storybook Examples
 * Demonstrates HIVE animation system in action
 */

import type { Meta, StoryObj } from '@storybook/react';
import { InView } from './in-view';
import { AutoAnimated } from './auto-animated';
import { LottieAnimation, LottieCelebration } from './lottie-animation';
import { useState } from 'react';
import { Button } from '../../atomic/00-Global/atoms/button';
import { Card } from '../../atomic/00-Global/atoms/card';
import { Badge } from '../../atomic/00-Global/atoms/badge';

const meta: Meta = {
  title: 'Design System/Motion Primitives',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Production-ready animation components using HIVE motion tokens. Built with Framer Motion, AutoAnimate, and Lottie.',
      },
    },
  },
};

export default meta;

/**
 * InView - Scroll-triggered animations
 */
export const ScrollTriggeredAnimation: StoryObj = {
  render: () => (
    <div className="space-y-8 max-w-2xl">
      <div className="text-text-primary text-sm mb-4">
        Scroll down to see animations trigger ↓
      </div>

      {/* Fade in from bottom */}
      <InView
        variants={{
          hidden: { opacity: 0, y: 50 },
          visible: { opacity: 1, y: 0 },
        }}
        transition={{ duration: 0.5 }}
        once={true}
      >
        <Card className="p-6 bg-background-secondary border border-border-default">
          <h3 className="text-text-primary font-semibold mb-2">Fade In From Bottom</h3>
          <p className="text-text-secondary text-sm">
            This card fades in and slides up when scrolled into view.
          </p>
        </Card>
      </InView>

      {/* Scale up */}
      <InView
        variants={{
          hidden: { opacity: 0, scale: 0.8 },
          visible: { opacity: 1, scale: 1 },
        }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <Card className="p-6 bg-background-secondary border border-border-default">
          <h3 className="text-text-primary font-semibold mb-2">Scale Up</h3>
          <p className="text-text-secondary text-sm">
            This card scales up from 80% to 100% when visible.
          </p>
        </Card>
      </InView>

      {/* Slide from left */}
      <InView
        variants={{
          hidden: { opacity: 0, x: -100 },
          visible: { opacity: 1, x: 0 },
        }}
        transition={{ duration: 0.4 }}
      >
        <Card className="p-6 bg-background-secondary border-l-4 border-brand-primary">
          <h3 className="text-text-primary font-semibold mb-2">Slide From Left</h3>
          <p className="text-text-secondary text-sm">
            Featured content with gold accent and horizontal slide animation.
          </p>
        </Card>
      </InView>
    </div>
  ),
};

/**
 * AutoAnimated - Zero-config list animations
 */
export const AutoAnimatedList: StoryObj = {
  render: () => {
    const [items, setItems] = useState([
      { id: 1, text: 'Feed Card 1', type: 'post' },
      { id: 2, text: 'Feed Card 2', type: 'event' },
      { id: 3, text: 'Feed Card 3', type: 'post' },
    ]);

    const addItem = () => {
      const newId = Math.max(...items.map((i) => i.id)) + 1;
      const types = ['post', 'event', 'poll'];
      setItems([
        ...items,
        {
          id: newId,
          text: `Feed Card ${newId}`,
          type: types[Math.floor(Math.random() * types.length)],
        },
      ]);
    };

    const removeItem = (id: number) => {
      setItems(items.filter((item) => item.id !== id));
    };

    const shuffleItems = () => {
      setItems([...items].sort(() => Math.random() - 0.5));
    };

    return (
      <div className="space-y-4 w-full max-w-md">
        <div className="flex gap-2">
          <Button onClick={addItem} variant="default" size="sm">
            Add Item
          </Button>
          <Button onClick={shuffleItems} variant="outline" size="sm">
            Shuffle
          </Button>
        </div>

        <AutoAnimated className="space-y-3">
          {items.map((item) => (
            <Card
              key={item.id}
              className="p-4 bg-background-secondary border border-border-default flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Badge variant={item.type === 'event' ? 'gold' : 'default'}>
                  {item.type}
                </Badge>
                <span className="text-text-primary">{item.text}</span>
              </div>
              <Button
                onClick={() => removeItem(item.id)}
                variant="ghost"
                size="sm"
                className="text-text-muted hover:text-text-primary"
              >
                Remove
              </Button>
            </Card>
          ))}
        </AutoAnimated>

        <div className="text-text-muted text-xs mt-4">
          Items automatically animate when added, removed, or reordered.
        </div>
      </div>
    );
  },
};

/**
 * Staggered List Animation (Feed Pattern)
 */
export const StaggeredFeedCards: StoryObj = {
  render: () => {
    const posts = [
      { id: 1, title: 'Campus Event: Tech Talk', author: '@cs-club' },
      { id: 2, title: 'Study Group for Midterms', author: '@study-hub' },
      { id: 3, title: 'Basketball Tournament', author: '@ub-athletics' },
      { id: 4, title: 'Career Fair Tomorrow', author: '@career-center' },
    ];

    return (
      <div className="space-y-4 max-w-2xl">
        <div className="text-text-primary font-semibold mb-4">Feed (Scroll to animate)</div>

        {posts.map((post, index) => (
          <InView
            key={post.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{
              duration: 0.4,
              delay: index * 0.1, // Stagger by 100ms
            }}
            viewOptions={{ once: true }}
          >
            <Card className="p-6 bg-background-secondary border border-border-default hover:bg-background-interactive transition-colors">
              <h3 className="text-text-primary font-semibold mb-1">{post.title}</h3>
              <p className="text-text-secondary text-sm">{post.author}</p>
            </Card>
          </InView>
        ))}
      </div>
    );
  },
};

/**
 * Rail Widget Reveal (Space Board Pattern)
 */
export const RailWidgetReveal: StoryObj = {
  render: () => {
    const widgets = [
      { id: 1, title: 'Now', count: 5 },
      { id: 2, title: 'Active Members', count: 42 },
      { id: 3, title: 'Upcoming Events', count: 3 },
    ];

    return (
      <div className="space-y-4 max-w-sm">
        <div className="text-text-primary font-semibold mb-4">Rail Widgets</div>

        {widgets.map((widget, index) => (
          <InView
            key={widget.id}
            variants={{
              hidden: { opacity: 0, x: 20 },
              visible: { opacity: 1, x: 0 },
            }}
            transition={{
              duration: 0.35,
              delay: index * 0.1,
            }}
            viewOptions={{ once: true }}
          >
            <Card className="p-4 bg-background-secondary border border-border-default">
              <div className="flex items-center justify-between">
                <span className="text-text-primary font-medium">{widget.title}</span>
                <Badge variant="gold">{widget.count}</Badge>
              </div>
            </Card>
          </InView>
        ))}
      </div>
    );
  },
};

/**
 * Button Hover Animations
 */
export const ButtonMotionStates: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-text-primary font-semibold">Primary CTA (Gold)</div>
        <Button variant="primary" size="lg" className="transition-transform hover:scale-105">
          Join Space
        </Button>
      </div>

      <div className="space-y-2">
        <div className="text-text-primary font-semibold">Secondary Action</div>
        <Button variant="outline" className="transition-all hover:bg-background-interactive">
          View Members
        </Button>
      </div>

      <div className="space-y-2">
        <div className="text-text-primary font-semibold">Ghost Button</div>
        <Button variant="ghost" className="transition-colors">
          Cancel
        </Button>
      </div>
    </div>
  ),
};

/**
 * Card Hover Elevation
 */
export const CardHoverElevation: StoryObj = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <Card className="p-6 bg-background-secondary border border-border-default transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer">
        <h3 className="text-text-primary font-semibold mb-2">Hover Me</h3>
        <p className="text-text-secondary text-sm">
          Card lifts up on hover with subtle shadow.
        </p>
      </Card>

      <Card className="p-6 bg-background-secondary border border-border-default transition-all hover:bg-background-interactive hover:border-border-strong cursor-pointer">
        <h3 className="text-text-primary font-semibold mb-2">Interactive</h3>
        <p className="text-text-secondary text-sm">
          Background and border change on hover.
        </p>
      </Card>
    </div>
  ),
};

/**
 * Gold Presence Pulse (Ritual Active Indicator)
 */
export const GoldPresencePulse: StoryObj = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-brand-primary opacity-20 animate-ping" />
        <div className="relative w-3 h-3 rounded-full bg-brand-primary" />
      </div>
      <span className="text-text-primary">Ritual Active</span>
    </div>
  ),
};

/**
 * Notes for developers
 */
export const MotionSystemNotes: StoryObj = {
  render: () => (
    <div className="max-w-2xl space-y-6 p-6 bg-background-secondary border border-border-default rounded-lg">
      <div>
        <h2 className="text-text-primary text-xl font-bold mb-4">HIVE Motion System</h2>
        <p className="text-text-secondary text-sm mb-6">
          All animations use tokens from <code className="px-2 py-1 bg-background-tertiary rounded text-brand-primary">@hive/tokens</code> for consistency.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-text-primary font-semibold mb-2">Core Principles</h3>
          <ul className="list-disc list-inside text-text-secondary text-sm space-y-1">
            <li>Use 3 core easing curves: default, snap, dramatic</li>
            <li>Feed-first minimalism: animations enhance, don't distract</li>
            <li>Gold for dopamine moments only (achievements, presence)</li>
            <li>Grayscale for all hover/focus states</li>
          </ul>
        </div>

        <div>
          <h3 className="text-text-primary font-semibold mb-2">Available Components</h3>
          <ul className="list-disc list-inside text-text-secondary text-sm space-y-1">
            <li><code className="text-brand-primary">InView</code> - Scroll-triggered animations</li>
            <li><code className="text-brand-primary">AutoAnimated</code> - Zero-config list animations</li>
            <li><code className="text-brand-primary">LottieAnimation</code> - After Effects imports</li>
          </ul>
        </div>

        <div>
          <h3 className="text-text-primary font-semibold mb-2">Usage Example</h3>
          <pre className="bg-background-tertiary p-4 rounded text-xs text-text-secondary overflow-x-auto">
{`import { InView, AutoAnimated } from '@hive/ui/motion-primitives';

// Scroll-triggered
<InView>
  <Card>Content</Card>
</InView>

// Auto-animated list
<AutoAnimated>
  {items.map(item => <div key={item.id}>{item.name}</div>)}
</AutoAnimated>`}
          </pre>
        </div>
      </div>
    </div>
  ),
};
