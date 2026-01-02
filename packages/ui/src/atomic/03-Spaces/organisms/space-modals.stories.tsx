'use client';

import * as React from 'react';
import { action } from '@storybook/addon-actions';

import { EventCreateModal, type EventCreateInput, type BoardOption, type EventType } from './event-create-modal';
import { EventDetailsModal, type SpaceEventDetails, type RSVPStatus } from './event-details-modal';
import { MemberInviteModal, type MemberInviteInput, type InviteableUser, type MemberRole } from './member-invite-modal';
import { AddTabModal, type AddTabInput, type TabType } from './add-tab-modal';
import { AddWidgetModal, type AddWidgetInput, type WidgetType } from './add-widget-modal';
import { SpaceWelcomeModal, type SpaceWelcomeData } from './space-welcome-modal';
import { SpaceLeaderOnboardingModal, type SpaceLeaderOnboardingData } from './space-leader-onboarding-modal';
import type { QuickTemplate } from '../../../lib/hivelab/quick-templates';
import { Button } from '../../00-Global/atoms/button';

import type { Meta, StoryObj } from '@storybook/react';

// ============================================================
// Mock Data Generators
// ============================================================

const mockBoards: BoardOption[] = [
  { id: 'general', name: 'General' },
  { id: 'events', name: 'Events' },
  { id: 'study-group', name: 'Study Group' },
  { id: 'announcements', name: 'Announcements' },
];

const mockUsers: InviteableUser[] = [
  { id: 'user1', fullName: 'Sarah Chen', email: 'sarah@buffalo.edu', photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', handle: 'sarahchen' },
  { id: 'user2', fullName: 'Marcus Johnson', email: 'marcus@buffalo.edu', photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', handle: 'marcusj' },
  { id: 'user3', fullName: 'Emily Rodriguez', email: 'emily@buffalo.edu', handle: 'emilyrod' },
  { id: 'user4', fullName: 'Alex Kim', email: 'alex@buffalo.edu', photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
  { id: 'user5', fullName: 'Jordan Lee', email: 'jordan@buffalo.edu', handle: 'jordanlee' },
];

const mockEvent: SpaceEventDetails = {
  id: 'event-1',
  title: 'Weekly Design Review Session',
  description: 'Join us for our weekly design critique where members share their work and receive constructive feedback from peers. All skill levels welcome!',
  type: 'meeting',
  startDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
  endDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
  location: 'Student Union Room 301',
  currentAttendees: 12,
  maxAttendees: 20,
  userRSVP: null,
  organizer: {
    id: 'user1',
    fullName: 'Sarah Chen',
    handle: 'sarahchen',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  },
  linkedBoardId: 'events',
};

const mockWelcomeData: SpaceWelcomeData = {
  spaceName: 'Design Club',
  spaceIcon: 'https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=200&h=200&fit=crop',
  leaderInfo: {
    id: 'leader1',
    name: 'Sarah Chen',
    role: 'President',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    welcomeMessage: "Welcome to Design Club! We're excited to have you here. Feel free to introduce yourself in the general chat!",
  },
  features: [
    { title: 'Chat Rooms', description: 'Topic-specific boards for focused discussions', icon: 'message-square' },
    { title: 'Events', description: 'Workshops, meetups, and social activities', icon: 'calendar' },
    { title: 'Tools', description: 'Polls, forms, and interactive widgets', icon: 'wrench' },
  ],
  memberCount: 47,
};

const mockQuickTemplates: QuickTemplate[] = [
  { id: 'poll', name: 'Quick Poll', description: 'Get instant feedback from members', icon: 'bar-chart-2', category: 'engagement', elements: [] },
  { id: 'countdown', name: 'Event Countdown', description: 'Build excitement for upcoming events', icon: 'timer', category: 'engagement', elements: [] },
  { id: 'links', name: 'Important Links', description: 'Pin resources for easy access', icon: 'link-2', category: 'organization', elements: [] },
  { id: 'roster', name: 'Member Roster', description: 'Show active members and roles', icon: 'users', category: 'organization', elements: [] },
];

const mockLeaderOnboardingData: SpaceLeaderOnboardingData = {
  spaceName: 'Design Club',
  spaceId: 'space-123',
  memberCount: 47,
  templates: mockQuickTemplates,
};

// ============================================================
// Interactive Wrapper for Modals
// ============================================================

interface ModalWrapperProps<T> {
  ModalComponent: React.ComponentType<T>;
  modalProps: Omit<T, 'open' | 'onOpenChange' | 'onClose'>;
  buttonLabel: string;
  useOnClose?: boolean;
}

function ModalWrapper<T extends { open: boolean; onOpenChange?: (open: boolean) => void; onClose?: () => void }>({
  ModalComponent,
  modalProps,
  buttonLabel,
  useOnClose = false,
}: ModalWrapperProps<T>) {
  const [open, setOpen] = React.useState(true);

  const closeHandler = useOnClose
    ? { onClose: () => setOpen(false) }
    : { onOpenChange: setOpen };

  return (
    <div className="min-h-[600px] bg-black p-8 flex items-center justify-center">
      <Button onClick={() => setOpen(true)} variant="brand">
        {buttonLabel}
      </Button>
      <ModalComponent
        {...(modalProps as unknown as T)}
        {...closeHandler}
        open={open}
      />
    </div>
  );
}

// ============================================================
// Meta Configuration
// ============================================================

const meta = {
  title: '03-Spaces/Organisms/SpaceModals',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Collection of modal components for Space management: events, members, tabs, widgets, and onboarding.',
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-black">
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================
// EVENT CREATE MODAL STORIES
// ============================================================

export const EventCreateDefault: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={EventCreateModal}
      modalProps={{
        boards: mockBoards,
        onSubmit: async (data: EventCreateInput) => {
          action('onSubmit')(data);
          await new Promise((r) => setTimeout(r, 1000));
        },
      }}
      buttonLabel="Create Event"
    />
  ),
  parameters: {
    docs: {
      description: { story: 'Default event creation modal with board selection.' },
    },
  },
};

export const EventCreateWithDefaultBoard: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={EventCreateModal}
      modalProps={{
        boards: mockBoards,
        defaultBoardId: 'events',
        onSubmit: async (data: EventCreateInput) => {
          action('onSubmit')(data);
        },
      }}
      buttonLabel="Create Event (Events Board)"
    />
  ),
};

export const EventCreateSingleBoard: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={EventCreateModal}
      modalProps={{
        boards: [{ id: 'general', name: 'General' }],
        onSubmit: async (data: EventCreateInput) => {
          action('onSubmit')(data);
        },
      }}
      buttonLabel="Create Event (Single Board)"
    />
  ),
};

export const EventCreateManyBoards: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={EventCreateModal}
      modalProps={{
        boards: [
          ...mockBoards,
          { id: 'workshops', name: 'Workshops' },
          { id: 'projects', name: 'Projects' },
          { id: 'resources', name: 'Resources' },
          { id: 'feedback', name: 'Feedback' },
        ],
        onSubmit: async (data: EventCreateInput) => {
          action('onSubmit')(data);
        },
      }}
      buttonLabel="Create Event (Many Boards)"
    />
  ),
};

export const EventCreateAllTypes: Story = {
  render: () => {
    const [selectedType, setSelectedType] = React.useState<EventType | null>(null);
    const eventTypes: EventType[] = ['academic', 'social', 'recreational', 'cultural', 'meeting', 'virtual'];

    return (
      <div className="min-h-[600px] bg-black p-8">
        <div className="max-w-md mx-auto space-y-4">
          <h3 className="text-white text-lg font-medium">Event Type Preview</h3>
          <div className="grid grid-cols-2 gap-2">
            {eventTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white text-sm capitalize transition-colors"
              >
                {type}
              </button>
            ))}
          </div>
          {selectedType && (
            <p className="text-white/60 text-sm">Selected: <span className="text-[#FFD700] capitalize">{selectedType}</span></p>
          )}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: 'Preview of all 6 event types available in the modal.' },
    },
  },
};

// ============================================================
// EVENT DETAILS MODAL STORIES
// ============================================================

export const EventDetailsDefault: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={EventDetailsModal}
      modalProps={{
        event: mockEvent,
        spaceId: 'space-123',
        onRSVP: async (eventId: string, status: RSVPStatus) => {
          action('onRSVP')(eventId, status);
          await new Promise((r) => setTimeout(r, 500));
        },
        onViewBoard: action('onViewBoard'),
      }}
      buttonLabel="View Event Details"
    />
  ),
  parameters: {
    docs: {
      description: { story: 'Event details modal with RSVP functionality.' },
    },
  },
};

export const EventDetailsWithRSVPGoing: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={EventDetailsModal}
      modalProps={{
        event: { ...mockEvent, userRSVP: 'going' as RSVPStatus },
        spaceId: 'space-123',
        onRSVP: async (eventId: string, status: RSVPStatus) => {
          action('onRSVP')(eventId, status);
        },
      }}
      buttonLabel="Event (RSVP Going)"
    />
  ),
};

export const EventDetailsWithRSVPMaybe: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={EventDetailsModal}
      modalProps={{
        event: { ...mockEvent, userRSVP: 'maybe' as RSVPStatus },
        spaceId: 'space-123',
        onRSVP: async (eventId: string, status: RSVPStatus) => {
          action('onRSVP')(eventId, status);
        },
      }}
      buttonLabel="Event (RSVP Maybe)"
    />
  ),
};

export const EventDetailsAtCapacity: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={EventDetailsModal}
      modalProps={{
        event: { ...mockEvent, currentAttendees: 20, maxAttendees: 20 },
        spaceId: 'space-123',
        onRSVP: async () => {},
      }}
      buttonLabel="Event (At Capacity)"
    />
  ),
};

export const EventDetailsVirtual: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={EventDetailsModal}
      modalProps={{
        event: {
          ...mockEvent,
          type: 'virtual' as const,
          location: undefined,
          virtualLink: 'https://zoom.us/j/1234567890',
        },
        spaceId: 'space-123',
        onRSVP: async () => {},
      }}
      buttonLabel="Virtual Event"
    />
  ),
};

export const EventDetailsStartingSoon: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={EventDetailsModal}
      modalProps={{
        event: {
          ...mockEvent,
          startDate: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
        },
        spaceId: 'space-123',
        onRSVP: async () => {},
      }}
      buttonLabel="Event Starting Soon"
    />
  ),
};

export const EventDetailsPastEvent: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={EventDetailsModal}
      modalProps={{
        event: {
          ...mockEvent,
          startDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          endDate: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        },
        spaceId: 'space-123',
        onRSVP: async () => {},
      }}
      buttonLabel="Past Event"
    />
  ),
};

export const EventDetailsAsOrganizer: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={EventDetailsModal}
      modalProps={{
        event: mockEvent,
        spaceId: 'space-123',
        currentUserId: 'user1', // Same as organizer
        onRSVP: async () => {},
        onEdit: action('onEdit'),
        onDelete: action('onDelete'),
        onViewBoard: action('onViewBoard'),
      }}
      buttonLabel="Event (As Organizer)"
    />
  ),
  parameters: {
    docs: {
      description: { story: 'Event details with edit/delete actions for the organizer.' },
    },
  },
};

export const EventDetailsAllTypes: Story = {
  render: () => {
    const [eventType, setEventType] = React.useState<SpaceEventDetails['type']>('meeting');
    const types: SpaceEventDetails['type'][] = ['academic', 'social', 'recreational', 'cultural', 'meeting', 'virtual'];

    return (
      <div className="min-h-[800px] bg-black p-8">
        <div className="flex gap-2 mb-4 flex-wrap justify-center">
          {types.map((type) => (
            <button
              key={type}
              onClick={() => setEventType(type)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                eventType === type ? 'bg-[#FFD700] text-black' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        <ModalWrapper
          ModalComponent={EventDetailsModal}
          modalProps={{
            event: { ...mockEvent, type: eventType },
            spaceId: 'space-123',
            onRSVP: async () => {},
          }}
          buttonLabel="View Event"
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: 'Interactive demo to view all event type badges.' },
    },
  },
};

export const EventDetailsNoDescription: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={EventDetailsModal}
      modalProps={{
        event: { ...mockEvent, description: undefined },
        spaceId: 'space-123',
        onRSVP: async () => {},
      }}
      buttonLabel="Event (No Description)"
    />
  ),
};

export const EventDetailsUnlimitedCapacity: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={EventDetailsModal}
      modalProps={{
        event: { ...mockEvent, maxAttendees: undefined, currentAttendees: 156 },
        spaceId: 'space-123',
        onRSVP: async () => {},
      }}
      buttonLabel="Event (Unlimited Capacity)"
    />
  ),
};

// ============================================================
// MEMBER INVITE MODAL STORIES
// ============================================================

export const MemberInviteDefault: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={MemberInviteModal}
      modalProps={{
        onSubmit: async (data: MemberInviteInput) => {
          action('onSubmit')(data);
          await new Promise((r) => setTimeout(r, 1000));
        },
        onSearchUsers: async (query: string) => {
          action('onSearchUsers')(query);
          await new Promise((r) => setTimeout(r, 300));
          return mockUsers.filter(
            (u) =>
              u.fullName.toLowerCase().includes(query.toLowerCase()) ||
              u.email.toLowerCase().includes(query.toLowerCase())
          );
        },
        existingMemberIds: [],
      }}
      buttonLabel="Invite Members"
    />
  ),
  parameters: {
    docs: {
      description: { story: 'Member invite modal with user search functionality.' },
    },
  },
};

export const MemberInviteWithExistingMembers: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={MemberInviteModal}
      modalProps={{
        onSubmit: async (data: MemberInviteInput) => {
          action('onSubmit')(data);
        },
        onSearchUsers: async (query: string) => {
          await new Promise((r) => setTimeout(r, 300));
          return mockUsers.filter(
            (u) =>
              u.fullName.toLowerCase().includes(query.toLowerCase()) ||
              u.email.toLowerCase().includes(query.toLowerCase())
          );
        },
        existingMemberIds: ['user1', 'user2'],
      }}
      buttonLabel="Invite (2 Already Members)"
    />
  ),
};

export const MemberInviteNoResults: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={MemberInviteModal}
      modalProps={{
        onSubmit: async () => {},
        onSearchUsers: async () => {
          await new Promise((r) => setTimeout(r, 300));
          return [];
        },
        existingMemberIds: [],
      }}
      buttonLabel="Invite (No Results)"
    />
  ),
};

export const MemberInviteSlowSearch: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={MemberInviteModal}
      modalProps={{
        onSubmit: async () => {},
        onSearchUsers: async (query: string) => {
          await new Promise((r) => setTimeout(r, 2000));
          return mockUsers.filter((u) => u.fullName.toLowerCase().includes(query.toLowerCase()));
        },
        existingMemberIds: [],
      }}
      buttonLabel="Invite (Slow Search)"
    />
  ),
};

export const MemberInviteRoleSelection: Story = {
  render: () => {
    const roles: MemberRole[] = ['member', 'moderator', 'admin'];

    return (
      <div className="min-h-[400px] bg-black p-8">
        <div className="max-w-md mx-auto space-y-4">
          <h3 className="text-white text-lg font-medium">Available Roles</h3>
          <div className="space-y-2">
            {roles.map((role) => (
              <div key={role} className="p-3 bg-white/5 rounded-lg">
                <span className="text-white capitalize font-medium">{role}</span>
                <p className="text-white/60 text-sm mt-1">
                  {role === 'admin'
                    ? 'Full access to manage space settings and members'
                    : role === 'moderator'
                      ? 'Can manage content and moderate discussions'
                      : 'Standard member access to space features'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: 'Preview of all role options available in the invite modal.' },
    },
  },
};

// ============================================================
// ADD TAB MODAL STORIES
// ============================================================

export const AddTabDefault: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={AddTabModal}
      modalProps={{
        existingTabNames: ['General', 'Events'],
        onSubmit: async (data: AddTabInput) => {
          action('onSubmit')(data);
          await new Promise((r) => setTimeout(r, 500));
        },
      }}
      buttonLabel="Add Tab"
    />
  ),
  parameters: {
    docs: {
      description: { story: 'Add tab modal with type selection.' },
    },
  },
};

export const AddTabManyExisting: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={AddTabModal}
      modalProps={{
        existingTabNames: ['General', 'Events', 'Announcements', 'Resources', 'Study Group', 'Off-Topic'],
        onSubmit: async (data: AddTabInput) => {
          action('onSubmit')(data);
        },
      }}
      buttonLabel="Add Tab (Many Existing)"
    />
  ),
};

export const AddTabEmpty: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={AddTabModal}
      modalProps={{
        existingTabNames: [],
        onSubmit: async (data: AddTabInput) => {
          action('onSubmit')(data);
        },
      }}
      buttonLabel="Add Tab (No Existing)"
    />
  ),
};

export const AddTabAllTypes: Story = {
  render: () => {
    const tabTypes: TabType[] = ['board', 'event', 'resource', 'custom'];

    return (
      <div className="min-h-[400px] bg-black p-8">
        <div className="max-w-md mx-auto space-y-4">
          <h3 className="text-white text-lg font-medium">Tab Types</h3>
          <div className="grid grid-cols-2 gap-3">
            {tabTypes.map((type) => (
              <div key={type} className="p-4 bg-white/5 rounded-xl border border-white/10">
                <span className="text-white capitalize font-medium">{type}</span>
                <p className="text-white/60 text-xs mt-1">
                  {type === 'board'
                    ? 'Discussion board for topics'
                    : type === 'event'
                      ? 'Event-specific discussions'
                      : type === 'resource'
                        ? 'Share files and links'
                        : 'Custom tab type'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
};

// ============================================================
// ADD WIDGET MODAL STORIES
// ============================================================

export const AddWidgetDefault: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={AddWidgetModal}
      modalProps={{
        onSubmit: async (data: AddWidgetInput) => {
          action('onSubmit')(data);
          await new Promise((r) => setTimeout(r, 500));
        },
        onOpenHiveLab: action('onOpenHiveLab'),
        showQuickDeploy: true,
        onQuickDeploy: async (templateId: string) => {
          action('onQuickDeploy')(templateId);
          await new Promise((r) => setTimeout(r, 1000));
        },
      }}
      buttonLabel="Add Widget"
    />
  ),
  parameters: {
    docs: {
      description: { story: 'Add widget modal with quick deploy templates.' },
    },
  },
};

export const AddWidgetNoQuickDeploy: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={AddWidgetModal}
      modalProps={{
        onSubmit: async (data: AddWidgetInput) => {
          action('onSubmit')(data);
        },
        onOpenHiveLab: action('onOpenHiveLab'),
        showQuickDeploy: false,
      }}
      buttonLabel="Add Widget (No Quick Deploy)"
    />
  ),
};

export const AddWidgetAllTypes: Story = {
  render: () => {
    const widgetTypes: WidgetType[] = ['poll', 'countdown', 'links', 'announcements', 'roster', 'custom'];

    return (
      <div className="min-h-[500px] bg-black p-8">
        <div className="max-w-lg mx-auto space-y-4">
          <h3 className="text-white text-lg font-medium">Widget Types</h3>
          <div className="grid grid-cols-2 gap-3">
            {widgetTypes.map((type) => (
              <div key={type} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-[#FFD700]/30 transition-colors">
                <span className="text-white capitalize font-medium">{type}</span>
                <p className="text-white/60 text-xs mt-1">
                  {type === 'poll'
                    ? 'Quick polls for member feedback'
                    : type === 'countdown'
                      ? 'Event countdown timers'
                      : type === 'links'
                        ? 'Important links collection'
                        : type === 'announcements'
                          ? 'Pinned announcements'
                          : type === 'roster'
                            ? 'Member roster display'
                            : 'Build custom in HiveLab'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
};

// ============================================================
// SPACE WELCOME MODAL STORIES
// ============================================================

export const WelcomeModalDefault: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={SpaceWelcomeModal}
      modalProps={{
        data: mockWelcomeData,
        onComplete: action('onComplete'),
        onStartChatting: action('onStartChatting'),
        storageKey: 'storybook-welcome-demo',
      }}
      buttonLabel="Show Welcome"
      useOnClose
    />
  ),
  parameters: {
    docs: {
      description: { story: 'Welcome modal shown to new space members.' },
    },
  },
};

export const WelcomeModalNoLeaderPhoto: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={SpaceWelcomeModal}
      modalProps={{
        data: {
          ...mockWelcomeData,
          leaderInfo: {
            ...mockWelcomeData.leaderInfo!,
            photoURL: undefined,
          },
        },
        onComplete: action('onComplete'),
        onStartChatting: action('onStartChatting'),
      }}
      buttonLabel="Welcome (No Photo)"
      useOnClose
    />
  ),
};

export const WelcomeModalNoLeader: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={SpaceWelcomeModal}
      modalProps={{
        data: {
          ...mockWelcomeData,
          leaderInfo: undefined,
        },
        onComplete: action('onComplete'),
        onStartChatting: action('onStartChatting'),
      }}
      buttonLabel="Welcome (No Leader)"
      useOnClose
    />
  ),
};

export const WelcomeModalLongWelcomeMessage: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={SpaceWelcomeModal}
      modalProps={{
        data: {
          ...mockWelcomeData,
          leaderInfo: {
            ...mockWelcomeData.leaderInfo!,
            welcomeMessage:
              "Welcome to Design Club! We're thrilled to have you join our creative community. Here you'll find like-minded designers, weekly workshops, portfolio reviews, and plenty of opportunities to grow your skills. Don't be shy - introduce yourself in the general chat and let us know what you're working on!",
          },
        },
        onComplete: action('onComplete'),
        onStartChatting: action('onStartChatting'),
      }}
      buttonLabel="Welcome (Long Message)"
      useOnClose
    />
  ),
};

export const WelcomeModalManyFeatures: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={SpaceWelcomeModal}
      modalProps={{
        data: {
          ...mockWelcomeData,
          features: [
            { title: 'Chat Rooms', description: 'Topic-specific boards', icon: 'message-square' },
            { title: 'Events', description: 'Workshops and meetups', icon: 'calendar' },
            { title: 'Tools', description: 'Polls and widgets', icon: 'wrench' },
            { title: 'Resources', description: 'Shared files and links', icon: 'file' },
            { title: 'Projects', description: 'Collaborative work', icon: 'folder' },
          ],
        },
        onComplete: action('onComplete'),
        onStartChatting: action('onStartChatting'),
      }}
      buttonLabel="Welcome (Many Features)"
      useOnClose
    />
  ),
};

export const WelcomeModalSmallSpace: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={SpaceWelcomeModal}
      modalProps={{
        data: {
          ...mockWelcomeData,
          memberCount: 3,
          leaderInfo: {
            ...mockWelcomeData.leaderInfo!,
            welcomeMessage: "Welcome! We're just getting started - excited to grow together!",
          },
        },
        onComplete: action('onComplete'),
        onStartChatting: action('onStartChatting'),
      }}
      buttonLabel="Welcome (Small Space)"
      useOnClose
    />
  ),
};

export const WelcomeModalLargeSpace: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={SpaceWelcomeModal}
      modalProps={{
        data: {
          ...mockWelcomeData,
          memberCount: 1247,
        },
        onComplete: action('onComplete'),
        onStartChatting: action('onStartChatting'),
      }}
      buttonLabel="Welcome (Large Space)"
      useOnClose
    />
  ),
};

// ============================================================
// SPACE LEADER ONBOARDING MODAL STORIES
// ============================================================

export const LeaderOnboardingDefault: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={SpaceLeaderOnboardingModal}
      modalProps={{
        data: mockLeaderOnboardingData,
        onComplete: action('onComplete'),
        onDeployTemplate: async (template: QuickTemplate) => {
          action('onDeployTemplate')(template);
          await new Promise((r) => setTimeout(r, 1500));
        },
        onOpenHiveLab: action('onOpenHiveLab'),
        onOpenInvite: action('onOpenInvite'),
        onSkip: action('onSkip'),
      }}
      buttonLabel="Leader Onboarding"
      useOnClose
    />
  ),
  parameters: {
    docs: {
      description: { story: 'Leader onboarding wizard with template deployment.' },
    },
  },
};

export const LeaderOnboardingNewSpace: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={SpaceLeaderOnboardingModal}
      modalProps={{
        data: { ...mockLeaderOnboardingData, memberCount: 1 },
        onComplete: action('onComplete'),
        onDeployTemplate: async (template: QuickTemplate) => {
          action('onDeployTemplate')(template);
          await new Promise((r) => setTimeout(r, 1000));
        },
        onOpenHiveLab: action('onOpenHiveLab'),
        onOpenInvite: action('onOpenInvite'),
        onSkip: action('onSkip'),
      }}
      buttonLabel="Leader Onboarding (New Space)"
      useOnClose
    />
  ),
};

export const LeaderOnboardingNoTemplates: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={SpaceLeaderOnboardingModal}
      modalProps={{
        data: { ...mockLeaderOnboardingData, templates: [] },
        onComplete: action('onComplete'),
        onOpenHiveLab: action('onOpenHiveLab'),
        onOpenInvite: action('onOpenInvite'),
        onSkip: action('onSkip'),
      }}
      buttonLabel="Leader Onboarding (No Templates)"
      useOnClose
    />
  ),
};

export const LeaderOnboardingManyTemplates: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={SpaceLeaderOnboardingModal}
      modalProps={{
        data: {
          ...mockLeaderOnboardingData,
          templates: [
            ...mockQuickTemplates,
            { id: 'feedback', name: 'Feedback Form', description: 'Collect member feedback', icon: 'message-square', category: 'communication', elements: [] },
            { id: 'calendar', name: 'Event Calendar', description: 'Show upcoming events', icon: 'calendar', category: 'organization', elements: [] },
          ] as QuickTemplate[],
        },
        onComplete: action('onComplete'),
        onDeployTemplate: async (template: QuickTemplate) => {
          action('onDeployTemplate')(template);
          await new Promise((r) => setTimeout(r, 1000));
        },
        onOpenHiveLab: action('onOpenHiveLab'),
        onOpenInvite: action('onOpenInvite'),
        onSkip: action('onSkip'),
      }}
      buttonLabel="Leader Onboarding (Many Templates)"
      useOnClose
    />
  ),
};

export const LeaderOnboardingLongSpaceName: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={SpaceLeaderOnboardingModal}
      modalProps={{
        data: {
          ...mockLeaderOnboardingData,
          spaceName: 'University at Buffalo Computer Science Graduate Student Association',
        },
        onComplete: action('onComplete'),
        onDeployTemplate: async () => {},
        onOpenHiveLab: action('onOpenHiveLab'),
        onOpenInvite: action('onOpenInvite'),
        onSkip: action('onSkip'),
      }}
      buttonLabel="Leader Onboarding (Long Name)"
      useOnClose
    />
  ),
};

// ============================================================
// COMPARISON STORIES
// ============================================================

export const AllModalsOverview: Story = {
  render: () => {
    const [activeModal, setActiveModal] = React.useState<string | null>(null);

    const modals = [
      { id: 'event-create', label: 'Create Event', color: 'bg-blue-500' },
      { id: 'event-details', label: 'Event Details', color: 'bg-purple-500' },
      { id: 'member-invite', label: 'Invite Members', color: 'bg-green-500' },
      { id: 'add-tab', label: 'Add Tab', color: 'bg-amber-500' },
      { id: 'add-widget', label: 'Add Widget', color: 'bg-pink-500' },
      { id: 'welcome', label: 'Welcome', color: 'bg-cyan-500' },
      { id: 'leader-onboarding', label: 'Leader Onboarding', color: 'bg-[#FFD700]' },
    ];

    return (
      <div className="min-h-screen bg-black p-8">
        <h2 className="text-2xl font-bold text-white text-center mb-8">Space Modals Collection</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {modals.map((modal) => (
            <button
              key={modal.id}
              onClick={() => setActiveModal(modal.id)}
              className="flex flex-col items-center gap-3 p-6 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/20 transition-all"
            >
              <div className={`w-12 h-12 rounded-xl ${modal.color} opacity-80`} />
              <span className="text-white text-sm font-medium text-center">{modal.label}</span>
            </button>
          ))}
        </div>

        {/* Render active modal */}
        {activeModal === 'event-create' && (
          <EventCreateModal
            open={true}
            onOpenChange={() => setActiveModal(null)}
            boards={mockBoards}
            onSubmit={async () => {}}
          />
        )}
        {activeModal === 'event-details' && (
          <EventDetailsModal
            open={true}
            onOpenChange={() => setActiveModal(null)}
            event={mockEvent}
            spaceId="space-123"
            onRSVP={async () => {}}
          />
        )}
        {activeModal === 'member-invite' && (
          <MemberInviteModal
            open={true}
            onOpenChange={() => setActiveModal(null)}
            onSubmit={async () => {}}
            onSearchUsers={async () => mockUsers}
            existingMemberIds={[]}
          />
        )}
        {activeModal === 'add-tab' && (
          <AddTabModal
            open={true}
            onOpenChange={() => setActiveModal(null)}
            existingTabNames={['General']}
            onSubmit={async () => {}}
          />
        )}
        {activeModal === 'add-widget' && (
          <AddWidgetModal
            open={true}
            onOpenChange={() => setActiveModal(null)}
            onSubmit={async () => {}}
            onOpenHiveLab={() => {}}
            showQuickDeploy={true}
          />
        )}
        {activeModal === 'welcome' && (
          <SpaceWelcomeModal
            open={true}
            onClose={() => setActiveModal(null)}
            data={mockWelcomeData}
            onComplete={() => setActiveModal(null)}
            onStartChatting={() => setActiveModal(null)}
          />
        )}
        {activeModal === 'leader-onboarding' && (
          <SpaceLeaderOnboardingModal
            open={true}
            onClose={() => setActiveModal(null)}
            data={mockLeaderOnboardingData}
            onComplete={() => setActiveModal(null)}
          />
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: 'Overview of all 7 space modal components in one interactive demo.' },
    },
  },
};

// ============================================================
// REAL-WORLD SCENARIO STORIES
// ============================================================

export const NewLeaderJourney: Story = {
  render: () => {
    const [step, setStep] = React.useState<'onboarding' | 'widget' | 'invite' | 'done'>('onboarding');

    return (
      <div className="min-h-screen bg-black p-8">
        <div className="max-w-md mx-auto text-center mb-8">
          <h2 className="text-xl font-bold text-white mb-2">New Leader Journey</h2>
          <p className="text-white/60 text-sm">Follow the typical flow for a new space leader</p>
          <div className="flex justify-center gap-2 mt-4">
            {['onboarding', 'widget', 'invite', 'done'].map((s, i) => (
              <div
                key={s}
                className={`w-8 h-1 rounded-full ${
                  step === s ? 'bg-[#FFD700]' : s === 'done' && step === 'done' ? 'bg-green-500' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        {step === 'onboarding' && (
          <SpaceLeaderOnboardingModal
            open={true}
            onClose={() => setStep('widget')}
            data={mockLeaderOnboardingData}
            onComplete={() => setStep('widget')}
            onDeployTemplate={async () => {}}
            onOpenHiveLab={() => setStep('widget')}
            onOpenInvite={() => setStep('invite')}
          />
        )}
        {step === 'widget' && (
          <AddWidgetModal
            open={true}
            onOpenChange={(open) => !open && setStep('invite')}
            onSubmit={async () => setStep('invite')}
            onOpenHiveLab={() => {}}
            showQuickDeploy={true}
          />
        )}
        {step === 'invite' && (
          <MemberInviteModal
            open={true}
            onOpenChange={(open) => !open && setStep('done')}
            onSubmit={async () => setStep('done')}
            onSearchUsers={async () => mockUsers}
            existingMemberIds={[]}
          />
        )}
        {step === 'done' && (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Setup Complete!</h3>
            <p className="text-white/60 text-sm mb-4">Your space is ready for members</p>
            <Button onClick={() => setStep('onboarding')} variant="outline">
              Restart Journey
            </Button>
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: 'Simulates the complete new leader setup journey through multiple modals.' },
    },
  },
};

export const EventLifecycle: Story = {
  render: () => {
    const [phase, setPhase] = React.useState<'create' | 'view' | 'edit'>('create');
    const [createdEvent, setCreatedEvent] = React.useState<SpaceEventDetails | null>(null);

    return (
      <div className="min-h-screen bg-black p-8">
        <div className="max-w-md mx-auto text-center mb-8">
          <h2 className="text-xl font-bold text-white mb-2">Event Lifecycle</h2>
          <p className="text-white/60 text-sm">Create → View → Manage</p>
          <div className="flex justify-center gap-2 mt-4">
            {['create', 'view', 'edit'].map((s) => (
              <button
                key={s}
                onClick={() => setPhase(s as typeof phase)}
                className={`px-4 py-2 rounded-lg text-sm capitalize ${
                  phase === s ? 'bg-[#FFD700] text-black' : 'bg-white/10 text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {phase === 'create' && (
          <EventCreateModal
            open={true}
            onOpenChange={() => {}}
            boards={mockBoards}
            onSubmit={async (data) => {
              setCreatedEvent({
                id: 'new-event',
                title: data.title,
                description: data.description,
                type: data.type,
                startDate: data.startDate,
                endDate: data.endDate,
                location: data.location,
                virtualLink: data.virtualLink,
                currentAttendees: 0,
                maxAttendees: data.maxAttendees,
                userRSVP: 'going',
                organizer: { id: 'me', fullName: 'You' },
              });
              setPhase('view');
            }}
          />
        )}
        {phase === 'view' && (
          <EventDetailsModal
            open={true}
            onOpenChange={() => {}}
            event={createdEvent || mockEvent}
            spaceId="space-123"
            currentUserId="me"
            onRSVP={async () => {}}
            onEdit={() => setPhase('edit')}
            onDelete={() => setPhase('create')}
          />
        )}
        {phase === 'edit' && (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <p className="text-white/60 mb-4">Edit modal would open here</p>
            <Button onClick={() => setPhase('view')}>Back to Details</Button>
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: 'Demonstrates the event creation and management lifecycle.' },
    },
  },
};

// ============================================================
// ACCESSIBILITY STORIES
// ============================================================

export const KeyboardNavigation: Story = {
  render: () => (
    <div className="min-h-[600px] bg-black p-8">
      <div className="max-w-md mx-auto">
        <h2 className="text-xl font-bold text-white mb-4">Keyboard Navigation</h2>
        <ul className="space-y-2 text-white/60 text-sm mb-6">
          <li><kbd className="px-2 py-1 bg-white/10 rounded">Tab</kbd> - Navigate between elements</li>
          <li><kbd className="px-2 py-1 bg-white/10 rounded">Enter</kbd> - Activate buttons</li>
          <li><kbd className="px-2 py-1 bg-white/10 rounded">Escape</kbd> - Close modal</li>
          <li><kbd className="px-2 py-1 bg-white/10 rounded">Arrow keys</kbd> - Navigate options</li>
        </ul>
        <ModalWrapper
          ModalComponent={AddTabModal}
          modalProps={{
            existingTabNames: ['General'],
            onSubmit: async () => {},
          }}
          buttonLabel="Test Keyboard Navigation"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: { story: 'All modals support full keyboard navigation and screen reader accessibility.' },
    },
  },
};

export const ReducedMotion: Story = {
  render: () => (
    <div className="min-h-[600px] bg-black p-8">
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-xl font-bold text-white mb-4">Reduced Motion Support</h2>
        <p className="text-white/60 text-sm mb-6">
          Enable "Reduce Motion" in your OS accessibility settings to see simplified animations.
        </p>
        <ModalWrapper
          ModalComponent={SpaceLeaderOnboardingModal}
          modalProps={{
            data: mockLeaderOnboardingData,
            onComplete: () => {},
          }}
          buttonLabel="Test Reduced Motion"
          useOnClose
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: { story: 'Modals respect prefers-reduced-motion settings for accessibility.' },
    },
  },
};

// ============================================================
// EDGE CASES
// ============================================================

export const RapidOpenClose: Story = {
  render: () => {
    const [open, setOpen] = React.useState(false);
    const [count, setCount] = React.useState(0);

    const rapidToggle = () => {
      let toggleCount = 0;
      const interval = setInterval(() => {
        setOpen((prev) => !prev);
        toggleCount++;
        if (toggleCount >= 10) {
          clearInterval(interval);
          setOpen(false);
        }
      }, 200);
    };

    return (
      <div className="min-h-[600px] bg-black p-8 flex flex-col items-center justify-center gap-4">
        <p className="text-white/60 text-sm">Test rapid open/close stability</p>
        <Button onClick={rapidToggle}>Rapid Toggle (5x)</Button>
        <Button onClick={() => setOpen(true)} variant="outline">Open Normally</Button>
        <AddTabModal
          open={open}
          onOpenChange={setOpen}
          existingTabNames={['General']}
          onSubmit={async () => {}}
        />
      </div>
    );
  },
};

export const LongFormSubmission: Story = {
  render: () => {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    return (
      <div className="min-h-[600px] bg-black p-8">
        <ModalWrapper
          ModalComponent={EventCreateModal}
          modalProps={{
            boards: mockBoards,
            onSubmit: async (data: EventCreateInput) => {
              setIsSubmitting(true);
              await new Promise((r) => setTimeout(r, 5000)); // 5 second delay
              setIsSubmitting(false);
              action('onSubmit')(data);
            },
          }}
          buttonLabel="Create Event (Slow Submit)"
        />
        {isSubmitting && (
          <div className="fixed bottom-4 right-4 bg-white/10 px-4 py-2 rounded-lg text-white text-sm">
            Submitting... (5s delay)
          </div>
        )}
      </div>
    );
  },
};

export const NetworkError: Story = {
  render: () => (
    <ModalWrapper
      ModalComponent={MemberInviteModal}
      modalProps={{
        onSubmit: async () => {
          await new Promise((r) => setTimeout(r, 1000));
          throw new Error('Network error');
        },
        onSearchUsers: async () => {
          throw new Error('Search failed');
        },
        existingMemberIds: [],
      }}
      buttonLabel="Invite (Network Error)"
    />
  ),
  parameters: {
    docs: {
      description: { story: 'Tests error handling when network requests fail.' },
    },
  },
};
