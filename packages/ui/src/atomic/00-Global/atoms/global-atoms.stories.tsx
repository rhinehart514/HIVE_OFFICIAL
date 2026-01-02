'use client';

import * as React from 'react';
import { action } from '@storybook/addon-actions';
import {
  Bell,
  Check,
  ChevronDown,
  ExternalLink,
  Loader2,
  Plus,
  Settings,
  User,
  X,
} from 'lucide-react';

import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { Badge } from './badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './dialog';
import { Label } from './label';
import { Progress } from './progress';
import { Skeleton } from './skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './tooltip';
import { Popover, PopoverTrigger, PopoverContent } from './popover';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './sheet';
import { HiveLogo } from './hive-logo';
import { AnimatedCounter } from './animated-counter';
import { ConnectionStatus } from './connection-status';
import { HiveModal } from './hive-modal';
import { HiveConfirmModal } from './hive-confirm-modal';
import { Button } from './button';
import { Alert, AlertTitle, AlertDescription, AlertIcons } from './alert';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator } from './command';
import { HiveCard, HiveCardHeader, HiveCardTitle, HiveCardDescription, HiveCardContent, HiveCardFooter } from './hive-card';
import { DateTimePicker } from './date-time-picker';
import { FileUpload } from './file-upload';
import { ProgressiveImage } from './progressive-image';

import type { Meta, StoryObj } from '@storybook/react';

// ============================================================
// Meta Configuration
// ============================================================

const meta = {
  title: '00-Global/Atoms',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Collection of atomic components for the HIVE design system.',
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-[#0A0A0A] p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================
// AVATAR STORIES
// ============================================================

export const AvatarDefault: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar>
        <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" alt="User" />
        <AvatarFallback>SC</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>MJ</AvatarFallback>
      </Avatar>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Avatar with image and fallback initials.' } },
  },
};

export const AvatarSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar size="sm"><AvatarFallback>SM</AvatarFallback></Avatar>
      <Avatar size="default"><AvatarFallback>MD</AvatarFallback></Avatar>
      <Avatar size="lg"><AvatarFallback>LG</AvatarFallback></Avatar>
      <Avatar size="xl"><AvatarFallback>XL</AvatarFallback></Avatar>
      <Avatar size="2xl"><AvatarFallback>2X</AvatarFallback></Avatar>
    </div>
  ),
};

export const AvatarVariants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar variant="default"><AvatarFallback>DF</AvatarFallback></Avatar>
      <Avatar variant="brand"><AvatarFallback className="text-black">BR</AvatarFallback></Avatar>
      <Avatar variant="outline"><AvatarFallback>OL</AvatarFallback></Avatar>
    </div>
  ),
};

export const AvatarShapes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar shape="circle"><AvatarFallback>CI</AvatarFallback></Avatar>
      <Avatar shape="rounded"><AvatarFallback>RN</AvatarFallback></Avatar>
      <Avatar shape="portrait" size="lg"><AvatarFallback>PT</AvatarFallback></Avatar>
    </div>
  ),
};

// ============================================================
// BADGE STORIES
// ============================================================

export const BadgeDefault: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="primary">Primary</Badge>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Badge component with various variants.' } },
  },
};

export const BadgeAcademicYears: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="freshman">Freshman</Badge>
      <Badge variant="sophomore">Sophomore</Badge>
      <Badge variant="junior">Junior</Badge>
      <Badge variant="senior">Senior</Badge>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Academic year badges for student profiles.' } },
  },
};

export const BadgeSkillTags: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="skill-tag">React</Badge>
      <Badge variant="building-tools">Building Tools</Badge>
      <Badge variant="major-tag">Computer Science</Badge>
      <Badge variant="tool-tag">HiveLab</Badge>
      <Badge variant="leadership">President</Badge>
    </div>
  ),
};

export const BadgeSizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Badge size="xs">Extra Small</Badge>
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
    </div>
  ),
};

// ============================================================
// CARD STORIES
// ============================================================

export const CardDefault: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-white/60">This is the card content area.</p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const CardVariants: Story = {
  render: () => (
    <div className="grid gap-4 w-full max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Default Card</CardTitle>
        </CardHeader>
        <CardContent>Standard card styling</CardContent>
      </Card>
      <Card className="border-[#FFD700]/20 bg-[#FFD700]/5">
        <CardHeader>
          <CardTitle className="text-[#FFD700]">Highlighted Card</CardTitle>
        </CardHeader>
        <CardContent>Gold accent for emphasis</CardContent>
      </Card>
    </div>
  ),
};

// ============================================================
// DIALOG STORIES
// ============================================================

export const DialogDefault: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>
            This is a description of what the dialog is about.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-white/60">Dialog content goes here.</p>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// ============================================================
// LABEL STORIES
// ============================================================

export const LabelDefault: Story = {
  render: () => (
    <div className="space-y-4 w-64">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <input
          id="email"
          type="email"
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
          placeholder="you@buffalo.edu"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name" required>Full Name</Label>
        <input
          id="name"
          type="text"
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
        />
      </div>
    </div>
  ),
};

// ============================================================
// PROGRESS STORIES
// ============================================================

export const ProgressDefault: Story = {
  render: () => (
    <div className="space-y-4 w-64">
      <Progress value={25} />
      <Progress value={50} />
      <Progress value={75} />
      <Progress value={100} />
    </div>
  ),
};

export const ProgressAnimated: Story = {
  render: () => {
    const [value, setValue] = React.useState(0);
    React.useEffect(() => {
      const interval = setInterval(() => {
        setValue((v) => (v >= 100 ? 0 : v + 10));
      }, 500);
      return () => clearInterval(interval);
    }, []);
    return <Progress value={value} className="w-64" />;
  },
};

// ============================================================
// SKELETON STORIES
// ============================================================

export const SkeletonDefault: Story = {
  render: () => (
    <div className="space-y-4 w-64">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  ),
};

export const SkeletonCard: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  ),
};

// ============================================================
// TABS STORIES
// ============================================================

export const TabsDefault: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-96">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p className="text-white/60 p-4">Overview content here</p>
      </TabsContent>
      <TabsContent value="members">
        <p className="text-white/60 p-4">Members list here</p>
      </TabsContent>
      <TabsContent value="settings">
        <p className="text-white/60 p-4">Settings panel here</p>
      </TabsContent>
    </Tabs>
  ),
};

export const TabsUnderline: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-96">
      <TabsList variant="underline">
        <TabsTrigger value="tab1" variant="underline">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2" variant="underline">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3" variant="underline">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Content 1</TabsContent>
      <TabsContent value="tab2">Content 2</TabsContent>
      <TabsContent value="tab3">Content 3</TabsContent>
    </Tabs>
  ),
};

export const TabsPills: Story = {
  render: () => (
    <Tabs defaultValue="all" className="w-96">
      <TabsList variant="pills">
        <TabsTrigger value="all" variant="pills">All</TabsTrigger>
        <TabsTrigger value="active" variant="pills">Active</TabsTrigger>
        <TabsTrigger value="archived" variant="pills">Archived</TabsTrigger>
      </TabsList>
      <TabsContent value="all">All items</TabsContent>
      <TabsContent value="active">Active items</TabsContent>
      <TabsContent value="archived">Archived items</TabsContent>
    </Tabs>
  ),
};

// ============================================================
// TOOLTIP STORIES
// ============================================================

export const TooltipDefault: Story = {
  render: () => (
    <TooltipProvider>
      <div className="flex gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Settings</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Notifications</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon">
              <User className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Profile</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
};

// ============================================================
// POPOVER STORIES
// ============================================================

export const PopoverDefault: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <h4 className="font-medium text-white">Popover Title</h4>
          <p className="text-sm text-white/60">
            This is a popover with some content inside.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

// ============================================================
// SHEET STORIES
// ============================================================

export const SheetDefault: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open Sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Sheet Title</SheetTitle>
          <SheetDescription>
            Sheet description goes here.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <p className="text-white/60">Sheet content area.</p>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

export const SheetSides: Story = {
  render: () => (
    <div className="flex gap-2">
      <Sheet>
        <SheetTrigger asChild><Button variant="outline">Left</Button></SheetTrigger>
        <SheetContent side="left"><SheetHeader><SheetTitle>Left Sheet</SheetTitle></SheetHeader></SheetContent>
      </Sheet>
      <Sheet>
        <SheetTrigger asChild><Button variant="outline">Right</Button></SheetTrigger>
        <SheetContent side="right"><SheetHeader><SheetTitle>Right Sheet</SheetTitle></SheetHeader></SheetContent>
      </Sheet>
      <Sheet>
        <SheetTrigger asChild><Button variant="outline">Top</Button></SheetTrigger>
        <SheetContent side="top"><SheetHeader><SheetTitle>Top Sheet</SheetTitle></SheetHeader></SheetContent>
      </Sheet>
      <Sheet>
        <SheetTrigger asChild><Button variant="outline">Bottom</Button></SheetTrigger>
        <SheetContent side="bottom"><SheetHeader><SheetTitle>Bottom Sheet</SheetTitle></SheetHeader></SheetContent>
      </Sheet>
    </div>
  ),
};

// ============================================================
// HIVE LOGO STORIES
// ============================================================

export const HiveLogoDefault: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <HiveLogo size="sm" />
      <HiveLogo size="md" />
      <HiveLogo size="lg" />
    </div>
  ),
};

export const HiveLogoVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <HiveLogo variant="full" />
      <HiveLogo variant="icon" />
      <HiveLogo variant="wordmark" />
    </div>
  ),
};

// ============================================================
// ANIMATED COUNTER STORIES
// ============================================================

export const AnimatedCounterDefault: Story = {
  render: () => {
    const [count, setCount] = React.useState(0);
    return (
      <div className="flex flex-col items-center gap-4">
        <AnimatedCounter value={count} className="text-4xl font-bold text-white" />
        <div className="flex gap-2">
          <Button onClick={() => setCount(c => c + 1)}>+1</Button>
          <Button onClick={() => setCount(c => c + 10)}>+10</Button>
          <Button onClick={() => setCount(c => c + 100)}>+100</Button>
          <Button onClick={() => setCount(0)} variant="outline">Reset</Button>
        </div>
      </div>
    );
  },
};

// ============================================================
// CONNECTION STATUS STORIES
// ============================================================

export const ConnectionStatusDefault: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <ConnectionStatus status="connected" />
      <ConnectionStatus status="connecting" />
      <ConnectionStatus status="disconnected" />
      <ConnectionStatus status="error" />
    </div>
  ),
};

// ============================================================
// HIVE MODAL STORIES
// ============================================================

export const HiveModalDefault: Story = {
  render: () => {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
        <HiveModal
          open={open}
          onClose={() => setOpen(false)}
          title="Modal Title"
          description="This is a HIVE-styled modal component."
        >
          <p className="text-white/60">Modal content goes here.</p>
        </HiveModal>
      </>
    );
  },
};

// ============================================================
// HIVE CONFIRM MODAL STORIES
// ============================================================

export const HiveConfirmModalDefault: Story = {
  render: () => {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <Button variant="destructive" onClick={() => setOpen(true)}>Delete Item</Button>
        <HiveConfirmModal
          open={open}
          onClose={() => setOpen(false)}
          onConfirm={() => {
            action('onConfirm')();
            setOpen(false);
          }}
          title="Delete Item?"
          description="This action cannot be undone. The item will be permanently deleted."
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />
      </>
    );
  },
};

export const HiveConfirmModalVariants: Story = {
  render: () => {
    const [openDefault, setOpenDefault] = React.useState(false);
    const [openDestructive, setOpenDestructive] = React.useState(false);

    return (
      <div className="flex gap-4">
        <Button onClick={() => setOpenDefault(true)}>Confirm Action</Button>
        <Button variant="destructive" onClick={() => setOpenDestructive(true)}>Delete</Button>

        <HiveConfirmModal
          open={openDefault}
          onClose={() => setOpenDefault(false)}
          onConfirm={() => setOpenDefault(false)}
          title="Confirm Action"
          description="Are you sure you want to proceed?"
          confirmText="Yes, Continue"
        />

        <HiveConfirmModal
          open={openDestructive}
          onClose={() => setOpenDestructive(false)}
          onConfirm={() => setOpenDestructive(false)}
          title="Delete Forever?"
          description="This cannot be undone."
          confirmText="Delete"
          variant="destructive"
        />
      </div>
    );
  },
};

// ============================================================
// COMPOSITION STORIES
// ============================================================

export const AtomShowcase: Story = {
  render: () => (
    <div className="space-y-8 max-w-2xl">
      <section>
        <h3 className="text-lg font-semibold text-white mb-4">Avatars</h3>
        <div className="flex items-center gap-3">
          <Avatar size="sm"><AvatarFallback>A</AvatarFallback></Avatar>
          <Avatar><AvatarFallback>B</AvatarFallback></Avatar>
          <Avatar size="lg"><AvatarFallback>C</AvatarFallback></Avatar>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-4">Badges</h3>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="primary">Primary</Badge>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-4">Progress</h3>
        <div className="space-y-2">
          <Progress value={33} />
          <Progress value={66} />
          <Progress value={100} />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-4">Skeleton Loading</h3>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </section>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Showcase of atomic components used together.' } },
  },
};

// ============================================================
// ALERT STORIES
// ============================================================

export const AlertDefault: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Alert>
        <AlertIcons.info />
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>This is an informational alert message.</AlertDescription>
      </Alert>
    </div>
  ),
};

export const AlertVariants: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Alert variant="default">
        <AlertIcons.info />
        <AlertTitle>Default Alert</AlertTitle>
        <AlertDescription>This is a default alert for general information.</AlertDescription>
      </Alert>
      <Alert variant="success">
        <AlertIcons.success />
        <AlertTitle>Success!</AlertTitle>
        <AlertDescription>Your changes have been saved successfully.</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <AlertIcons.warning />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>Please review your changes before proceeding.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertIcons.destructive />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong. Please try again.</AlertDescription>
      </Alert>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Alert variants for different message types.' } },
  },
};

// ============================================================
// COMMAND STORIES
// ============================================================

export const CommandDefault: Story = {
  render: () => (
    <Command className="rounded-lg border border-[#2A2A2A] w-96">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
          <CommandItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </CommandItem>
          <CommandItem>
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem>
            <Plus className="mr-2 h-4 w-4" />
            <span>Create Space</span>
          </CommandItem>
          <CommandItem>
            <ExternalLink className="mr-2 h-4 w-4" />
            <span>Open HiveLab</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
  parameters: {
    docs: { description: { story: 'Command palette for keyboard-driven navigation.' } },
  },
};

// ============================================================
// HIVE CARD STORIES
// ============================================================

export const HiveCardDefault: Story = {
  render: () => (
    <HiveCard className="w-80">
      <HiveCardHeader>
        <HiveCardTitle>Card Title</HiveCardTitle>
        <HiveCardDescription>Card description with details</HiveCardDescription>
      </HiveCardHeader>
      <HiveCardContent>
        <p className="text-[#A1A1A6]">This is the HIVE card content area.</p>
      </HiveCardContent>
      <HiveCardFooter>
        <Button size="sm">Action</Button>
      </HiveCardFooter>
    </HiveCard>
  ),
};

export const HiveCardVariants: Story = {
  render: () => (
    <div className="grid gap-4 w-full max-w-2xl">
      <HiveCard variant="default">
        <HiveCardHeader>
          <HiveCardTitle>Default Card</HiveCardTitle>
        </HiveCardHeader>
        <HiveCardContent>Standard card styling</HiveCardContent>
      </HiveCard>
      <HiveCard variant="brand">
        <HiveCardHeader>
          <HiveCardTitle>Brand Card</HiveCardTitle>
        </HiveCardHeader>
        <HiveCardContent>Gold accent for premium content</HiveCardContent>
      </HiveCard>
      <HiveCard variant="interactive">
        <HiveCardHeader>
          <HiveCardTitle>Interactive Card</HiveCardTitle>
        </HiveCardHeader>
        <HiveCardContent>Hover me to see the effect</HiveCardContent>
      </HiveCard>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'HIVE-styled card variants.' } },
  },
};

// ============================================================
// DATE TIME PICKER STORIES
// ============================================================

export const DateTimePickerDefault: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | undefined>();
    return (
      <div className="w-80">
        <DateTimePicker
          value={date}
          onChange={setDate}
          placeholder="Select date and time"
        />
        {date && (
          <p className="mt-2 text-sm text-[#A1A1A6]">
            Selected: {date.toLocaleString()}
          </p>
        )}
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'Date and time picker with calendar dropdown.' } },
  },
};

export const DateTimePickerDateOnly: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | undefined>();
    return (
      <div className="w-80">
        <DateTimePicker
          value={date}
          onChange={setDate}
          showTime={false}
          placeholder="Select date"
        />
      </div>
    );
  },
};

// ============================================================
// FILE UPLOAD STORIES
// ============================================================

export const FileUploadDefault: Story = {
  render: () => {
    const [files, setFiles] = React.useState<File[]>([]);
    return (
      <div className="w-96">
        <FileUpload
          files={files}
          onChange={setFiles}
          maxFiles={4}
          maxSize={10 * 1024 * 1024}
          onError={(error) => console.log('Error:', error)}
        />
        {files.length > 0 && (
          <p className="mt-2 text-sm text-[#A1A1A6]">
            {files.length} file(s) selected
          </p>
        )}
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'Drag-and-drop file upload with preview.' } },
  },
};

// ============================================================
// PROGRESSIVE IMAGE STORIES
// ============================================================

export const ProgressiveImageDefault: Story = {
  render: () => (
    <div className="grid gap-4 grid-cols-2 w-96">
      <ProgressiveImage
        src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop"
        alt="Team working"
        aspectRatio="4/3"
        containerClassName="rounded-lg overflow-hidden"
      />
      <ProgressiveImage
        src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop"
        alt="Campus"
        aspectRatio="4/3"
        containerClassName="rounded-lg overflow-hidden"
      />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Progressive image loading with blur placeholder.' } },
  },
};

export const ProgressiveImageWithFallback: Story = {
  render: () => (
    <div className="w-64">
      <ProgressiveImage
        src="https://invalid-url-that-will-fail.example.com/image.jpg"
        alt="Failed image"
        aspectRatio="16/9"
        containerClassName="rounded-lg overflow-hidden"
      />
      <p className="mt-2 text-sm text-[#71717A]">Image with error fallback</p>
    </div>
  ),
};
