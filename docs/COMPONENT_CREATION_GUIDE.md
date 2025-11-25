# Component Creation Guide

**Last Updated**: 2025-11-17
**Owner**: Design System Team
**Status**: Production

Complete guide for creating components in the HIVE design system following atomic design + feature slices architecture.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Atomic Design Hierarchy](#atomic-design-hierarchy)
3. [Step-by-Step: Creating an Atom](#step-by-step-creating-an-atom)
4. [Step-by-Step: Creating a Molecule](#step-by-step-creating-a-molecule)
5. [Step-by-Step: Creating an Organism](#step-by-step-creating-an-organism)
6. [Composition Patterns](#composition-patterns)
7. [Styling Guidelines](#styling-guidelines)
8. [TypeScript Best Practices](#typescript-best-practices)
9. [Testing Components](#testing-components)
10. [Storybook Stories](#storybook-stories)

---

## Quick Start

### Before You Create a Component

**Step 1**: Check if it already exists
```bash
# Search for similar components
grep -r "export function Button" packages/ui/src/atomic/
grep -r "StatusBadge" packages/ui/src/atomic/
```

**Step 2**: Determine the atomic level
- **Atom**: Standalone, reusable, single-purpose (Button, Input, Badge)
- **Molecule**: Combination of atoms (SearchBar = Input + Button)
- **Organism**: Complex feature component (ProfileCard, SpaceCard)
- **Template**: Page layouts (not stored in `@hive/ui`, created in apps)

**Step 3**: Choose the correct directory
```
packages/ui/src/atomic/
├── atoms/                    # Single-purpose primitives
├── molecules/                # Combinations of atoms
├── organisms/                # Complex components
└── [01-Global]/              # OR feature slices (Feed, Spaces, Profile, etc.)
    ├── atoms/
    ├── molecules/
    └── organisms/
```

---

## Atomic Design Hierarchy

### Component Composition Flow

```
Template (Page Layout)
    ↓ uses
Organism (ProfileCard)
    ↓ uses
Molecule (FormField = Label + Input + ErrorText)
    ↓ uses
Atom (Input, Label)
```

### Decision Matrix

| Component Type | Examples | Uses | Token Layer |
|---------------|----------|------|-------------|
| **Atom** | Button, Input, Badge, Avatar | Nothing (primitives) | Component Tokens |
| **Molecule** | SearchBar, FormField, Card | 2-3 Atoms | Semantic Tokens |
| **Organism** | ProfileCard, SpaceCard, FeedPost | Molecules + Atoms | Semantic Tokens |
| **Template** | PageLayout, GridLayout | Organisms + Structure | Semantic Tokens |

---

## Step-by-Step: Creating an Atom

### Example: Creating a `StatusIndicator` Atom

#### Step 1: Create the file

```bash
# Location: packages/ui/src/atomic/atoms/status-indicator.tsx
```

#### Step 2: Define TypeScript types

```tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusIndicatorVariants> {
  /**
   * Status type
   */
  status: 'online' | 'away' | 'offline';

  /**
   * Show pulse animation
   * @default false
   */
  pulse?: boolean;
}
```

#### Step 3: Define variants with CVA (Class Variance Authority)

```tsx
const statusIndicatorVariants = cva(
  // Base styles (always applied)
  "inline-block rounded-full",
  {
    // Variants
    variants: {
      status: {
        online: [
          "bg-status-success-default",      // Component/Semantic token
          "border-2 border-status-success-default/20"
        ],
        away: [
          "bg-status-warning-default",
          "border-2 border-status-warning-default/20"
        ],
        offline: [
          "bg-border-muted",
          "border-2 border-border-default/20"
        ],
      },
      size: {
        sm: "w-2 h-2",
        md: "w-3 h-3",
        lg: "w-4 h-4",
      },
      pulse: {
        true: "animate-pulse",
        false: "",
      }
    },
    // Default variants
    defaultVariants: {
      size: "md",
      pulse: false,
    },
  }
);
```

#### Step 4: Implement the component

```tsx
export const StatusIndicator = React.forwardRef<
  HTMLSpanElement,
  StatusIndicatorProps
>(({ status, pulse, size, className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(statusIndicatorVariants({ status, size, pulse }), className)}
      aria-label={`Status: ${status}`}
      {...props}
    />
  );
});

StatusIndicator.displayName = 'StatusIndicator';
```

#### Step 5: Export from index

```tsx
// packages/ui/src/atomic/atoms/index.ts
export { StatusIndicator } from './status-indicator';
export type { StatusIndicatorProps } from './status-indicator';
```

#### Step 6: Create Storybook story

```tsx
// packages/ui/src/stories/atoms/status-indicator.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { StatusIndicator } from '../../atomic/atoms/status-indicator';

const meta: Meta<typeof StatusIndicator> = {
  title: 'Atoms/StatusIndicator',
  component: StatusIndicator,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['online', 'away', 'offline'],
    },
    pulse: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusIndicator>;

export const Online: Story = {
  args: {
    status: 'online',
    size: 'md',
  },
};

export const WithPulse: Story = {
  args: {
    status: 'online',
    pulse: true,
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <StatusIndicator status="online" size="sm" />
      <StatusIndicator status="online" size="md" />
      <StatusIndicator status="online" size="lg" />
    </div>
  ),
};
```

#### Step 7: Write tests

```tsx
// packages/ui/src/atomic/atoms/__tests__/status-indicator.test.tsx
import { render, screen } from '@testing-library/react';
import { StatusIndicator } from '../status-indicator';

describe('StatusIndicator', () => {
  it('renders with online status', () => {
    render(<StatusIndicator status="online" />);
    const indicator = screen.getByLabelText('Status: online');
    expect(indicator).toBeInTheDocument();
  });

  it('applies pulse animation when pulse prop is true', () => {
    const { container } = render(<StatusIndicator status="online" pulse />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLSpanElement>();
    render(<StatusIndicator status="online" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});
```

---

## Step-by-Step: Creating a Molecule

### Example: Creating a `UserPresence` Molecule

Molecules combine multiple atoms. `UserPresence = Avatar + StatusIndicator + Text`

#### Step 1: Create the file

```bash
# Location: packages/ui/src/atomic/molecules/user-presence.tsx
```

#### Step 2: Define types and import atoms

```tsx
import * as React from 'react';
import { Avatar, type AvatarProps } from '../atoms/avatar';
import { StatusIndicator } from '../atoms/status-indicator';
import { cn } from '../../utils/cn';

export interface UserPresenceProps {
  /**
   * User data
   */
  user: {
    name: string;
    avatarUrl?: string;
    handle?: string;
  };

  /**
   * Online status
   */
  status: 'online' | 'away' | 'offline';

  /**
   * Show user handle
   * @default false
   */
  showHandle?: boolean;

  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Additional class names
   */
  className?: string;
}
```

#### Step 3: Implement composition with semantic tokens

```tsx
export function UserPresence({
  user,
  status,
  showHandle = false,
  size = 'md',
  className,
}: UserPresenceProps) {
  const sizeClasses = {
    sm: { avatar: 'w-8 h-8', text: 'text-sm', gap: 'gap-2' },
    md: { avatar: 'w-10 h-10', text: 'text-base', gap: 'gap-3' },
    lg: { avatar: 'w-12 h-12', text: 'text-lg', gap: 'gap-4' },
  };

  return (
    <div className={cn(
      "flex items-center",
      sizeClasses[size].gap,
      className
    )}>
      {/* Atom: Avatar with status indicator */}
      <div className="relative">
        <Avatar
          src={user.avatarUrl}
          alt={user.name}
          fallback={user.name.charAt(0)}
          className={sizeClasses[size].avatar}
        />
        <StatusIndicator
          status={status}
          size="sm"
          className="absolute bottom-0 right-0"
        />
      </div>

      {/* Text content with semantic tokens */}
      <div className="flex flex-col">
        <span className={cn(
          "font-medium",
          "text-text-primary",              // Semantic token
          sizeClasses[size].text
        )}>
          {user.name}
        </span>
        {showHandle && user.handle && (
          <span className={cn(
            "text-text-secondary",           // Semantic token
            "text-xs"
          )}>
            @{user.handle}
          </span>
        )}
      </div>
    </div>
  );
}
```

#### Step 4: Export and create story

```tsx
// Export
export { UserPresence } from './user-presence';
export type { UserPresenceProps } from './user-presence';

// Storybook story
const meta: Meta<typeof UserPresence> = {
  title: 'Molecules/UserPresence',
  component: UserPresence,
  tags: ['autodocs'],
};

export const Online: Story = {
  args: {
    user: {
      name: 'Sarah Chen',
      handle: 'sarahc',
      avatarUrl: '/avatars/sarah.jpg',
    },
    status: 'online',
    showHandle: true,
  },
};
```

---

## Step-by-Step: Creating an Organism

### Example: Creating a `SpaceCard` Organism

Organisms are complex components combining molecules and atoms.

#### Step 1: Define comprehensive types

```tsx
import * as React from 'react';
import { Card } from '../atoms/card';
import { Button } from '../atoms/button';
import { Badge } from '../atoms/badge';
import { UserPresence } from '../molecules/user-presence';
import { cn } from '../../utils/cn';

export interface SpaceCardProps {
  space: {
    id: string;
    name: string;
    description: string;
    category: 'student_org' | 'academic' | 'social' | 'housing';
    memberCount: number;
    activeNow: number;
    coverImage?: string;
    isJoined: boolean;
    isFeatured?: boolean;
  };

  onJoin?: (spaceId: string) => void;
  onLeave?: (spaceId: string) => void;
  onClick?: (spaceId: string) => void;

  className?: string;
}
```

#### Step 2: Implement complex composition

```tsx
export function SpaceCard({ space, onJoin, onLeave, onClick, className }: SpaceCardProps) {
  const handleAction = () => {
    if (space.isJoined && onLeave) {
      onLeave(space.id);
    } else if (!space.isJoined && onJoin) {
      onJoin(space.id);
    }
  };

  const categoryLabels = {
    student_org: 'Student Org',
    academic: 'Academic',
    social: 'Social',
    housing: 'Housing',
  };

  return (
    <Card
      variant={space.isFeatured ? 'elevated' : 'default'}
      className={cn(
        "overflow-hidden cursor-pointer",
        "hover:bg-background-interactive",  // Semantic token
        "transition-colors",
        space.isFeatured && "border-l-4 border-brand-primary", // Gold accent
        className
      )}
      onClick={() => onClick?.(space.id)}
    >
      {/* Cover Image */}
      {space.coverImage && (
        <div className="relative h-32 bg-background-muted"> {/* Semantic */}
          <img
            src={space.coverImage}
            alt={space.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Header with badges */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-text-primary font-semibold text-lg"> {/* Semantic */}
              {space.name}
            </h3>
            <p className="text-text-secondary text-sm mt-1"> {/* Semantic */}
              {space.description}
            </p>
          </div>

          <Badge variant="outline" size="sm">
            {categoryLabels[space.category]}
          </Badge>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-text-secondary"> {/* Semantic */}
            {space.memberCount} members
          </span>
          {space.activeNow > 0 && (
            <span className="flex items-center gap-1 text-status-success-default"> {/* Semantic */}
              <span className="w-2 h-2 rounded-full bg-status-success-default" />
              {space.activeNow} active
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant={space.isJoined ? 'ghost' : 'primary'}
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              handleAction();
            }}
          >
            {space.isJoined ? 'Joined' : 'Join Space'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
```

---

## Composition Patterns

### Pattern 1: Compound Components

```tsx
// Parent component with sub-components
export function Tabs({ children, defaultValue }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
}

Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;

// Usage:
<Tabs defaultValue="profile">
  <Tabs.List>
    <Tabs.Trigger value="profile">Profile</Tabs.Trigger>
    <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="profile">...</Tabs.Content>
</Tabs>
```

### Pattern 2: Render Props

```tsx
export function DataTable<T>({ data, renderRow }: DataTableProps<T>) {
  return (
    <div className="bg-background-secondary rounded-lg"> {/* Semantic */}
      {data.map((item, index) => (
        <div key={index} className="border-b border-border-default last:border-0">
          {renderRow(item, index)}
        </div>
      ))}
    </div>
  );
}

// Usage:
<DataTable
  data={users}
  renderRow={(user) => <UserPresence user={user} status="online" />}
/>
```

### Pattern 3: Polymorphic Components

```tsx
type AsProps<T extends React.ElementType> = {
  as?: T;
} & React.ComponentPropsWithoutRef<T>;

export function Text<T extends React.ElementType = 'span'>({
  as,
  className,
  ...props
}: AsProps<T>) {
  const Component = as || 'span';

  return (
    <Component
      className={cn("text-text-primary", className)} {/* Semantic */}
      {...props}
    />
  );
}

// Usage:
<Text as="h1">Heading</Text>
<Text as="p">Paragraph</Text>
```

---

## Styling Guidelines

### 1. Use Design Tokens (Never Hard-code)

```tsx
// ❌ WRONG
<div className="bg-[#000000] text-[#F7F7FF]">

// ✅ CORRECT
<div className="bg-background-primary text-text-primary">
```

### 2. Atoms Use Component Tokens

```tsx
// Atom (Button)
<button className="bg-button-primary-bg text-button-primary-text">
```

### 3. Everything Else Uses Semantic Tokens

```tsx
// Molecule/Organism/Template
<div className="bg-background-secondary text-text-primary border-border-default">
```

### 4. Use Tailwind Opacity Modifiers

```tsx
<div className="bg-background-secondary/90">  {/* 90% opacity */}
<div className="border-brand-primary/20">     {/* 20% gold */}
```

### 5. Follow Mobile-First Responsive Design

```tsx
<div className={cn(
  "grid gap-4",
  "grid-cols-1",        // Mobile: 1 column
  "sm:grid-cols-2",     // Small: 2 columns
  "lg:grid-cols-3"      // Large: 3 columns
)}>
```

---

## TypeScript Best Practices

### 1. Extend HTML Element Props

```tsx
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}
```

### 2. Use Generic Types for Reusable Components

```tsx
export interface SelectProps<T> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  getLabel: (option: T) => string;
  getValue: (option: T) => string;
}
```

### 3. Define Strict Prop Types

```tsx
// ✅ GOOD: Union types
type Status = 'online' | 'away' | 'offline';

// ❌ BAD: Any string
type Status = string;
```

### 4. Use TypeScript Utility Types

```tsx
// Pick specific props
type IconProps = Pick<SVGProps<SVGSVGElement>, 'className' | 'aria-label'>;

// Omit props
type CustomButtonProps = Omit<ButtonProps, 'variant'> & {
  variant: 'custom1' | 'custom2';
};

// Partial props
type PartialUser = Partial<User>;
```

---

## Testing Components

### Unit Tests (Vitest + Testing Library)

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click</Button>);
    expect(screen.getByText('Click')).toBeDisabled();
  });

  it('applies variant styles correctly', () => {
    const { container } = render(<Button variant="primary">Click</Button>);
    expect(container.firstChild).toHaveClass('bg-button-primary-bg');
  });
});
```

---

## Storybook Stories

### Basic Story Structure

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../atoms/button';

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'ghost', 'destructive'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Join Space',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button variant="default">Default</Button>
      <Button variant="primary">Primary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Delete</Button>
    </div>
  ),
};

export const Interactive: Story = {
  args: {
    variant: 'primary',
    children: 'Click me',
  },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button');
    await userEvent.click(button);
  },
};
```

---

## Checklist: Before Shipping a Component

- [ ] Component follows atomic design hierarchy
- [ ] Uses correct token layer (component for atoms, semantic for others)
- [ ] TypeScript types are complete and exported
- [ ] Props extend HTML element props where applicable
- [ ] Component is exported from appropriate index.ts
- [ ] Storybook story created with all variants
- [ ] Unit tests written with good coverage
- [ ] Accessibility attributes included (aria-label, role, etc.)
- [ ] Mobile responsive (tested at 320px, 768px, 1024px)
- [ ] Dark mode works (if applicable)
- [ ] No hard-coded colors (ESLint passes)
- [ ] Gold usage follows 5% rule
- [ ] Builds successfully (`pnpm build --filter @hive/ui`)

---

## Related Documentation

- [`DESIGN_TOKENS_GUIDE.md`](./DESIGN_TOKENS_GUIDE.md) - Token usage reference
- [`TOKEN_MIGRATION_GUIDE.md`](./TOKEN_MIGRATION_GUIDE.md) - Migration examples
- [`packages/ui/README.md`](../packages/ui/README.md) - UI package overview
- [`UX-UI-TOPOLOGY.md`](./UX-UI-TOPOLOGY.md) - UI patterns

---

**Questions?** Check existing components in `packages/ui/src/atomic/` for reference implementations.
