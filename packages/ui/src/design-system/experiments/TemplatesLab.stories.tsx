import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { Focus, FocusProgress, FocusStep } from '../templates/Focus';
import { Shell, HiveLogo } from '../templates/Shell';
import { Grid, CategoryRow } from '../templates/Grid';
import { Stream } from '../templates/Stream';
import { Workspace } from '../templates/Workspace';
import { Button } from '../primitives/Button';
import { Input } from '../primitives/Input';
import { Avatar } from '../primitives/Avatar';
import { Badge } from '../primitives/Badge';
import { Card } from '../primitives/Card';
import {
  FormLayout,
  FormField,
  FormActions,
  FormSection,
  FormDivider,
} from '../patterns/FormLayout';
import {
  ListLayout,
  ListItem,
  ListGroup,
} from '../patterns/ListLayout';
import {
  GridLayout,
  GridItem,
  BentoGrid,
  BentoItem,
} from '../patterns/GridLayout';
import {
  SplitView,
  SplitPanel,
} from '../patterns/SplitView';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TEMPLATES LAB - Page Template Experiments
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Testing how the 5 core templates (Focus, Shell, Stream, Grid, Workspace)
 * compose together for different page types.
 */

const meta: Meta = {
  title: 'Experiments/Templates/TemplatesLab',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'hive-dark' },
  },
};

export default meta;
type Story = StoryObj;

// ============================================
// AUTH TEMPLATE LAB
// ============================================

/**
 * [EXPERIMENT]: Auth Page Template
 * [TEMPLATE]: Focus (Portal mode)
 * [USE CASE]: Login, signup, OTP verification
 */
export const AuthTemplateLab: Story = {
  render: () => (
    <div className="h-screen bg-[var(--bg-ground)]">
      <Focus
        mode="portal"
        logoPosition="center"
        showProgress={false}
        atmosphere="dormant"
      >
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Welcome back
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Sign in to your HIVE account
            </p>
          </div>

          <FormLayout onSubmit={(e) => e.preventDefault()}>
            <FormField label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                placeholder="you@university.edu"
                autoComplete="email"
              />
            </FormField>
            <FormField label="Password" htmlFor="password">
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </FormField>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-[var(--text-secondary)]">
                <input type="checkbox" className="rounded" />
                Remember me
              </label>
              <a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                Forgot password?
              </a>
            </div>

            <Button variant="primary" className="w-full">
              Sign in
            </Button>
          </FormLayout>

          <div className="text-center text-sm text-[var(--text-tertiary)]">
            Don't have an account?{' '}
            <a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              Create one
            </a>
          </div>
        </div>
      </Focus>
    </div>
  ),
};

// ============================================
// ONBOARDING TEMPLATE LAB
// ============================================

/**
 * [EXPERIMENT]: Onboarding Page Template
 * [TEMPLATE]: Focus (Reveal mode) with FocusProgress
 * [USE CASE]: Multi-step onboarding flows
 */
export const OnboardingTemplateLab: Story = {
  render: () => {
    const [step, setStep] = React.useState(1);

    return (
      <div className="h-screen bg-[var(--bg-ground)]">
        <Focus
          mode="reveal"
          logoPosition="top-left"
          maxWidth="md"
          atmosphere="awakening"
        >
          <div className="w-full space-y-8">
            <FocusProgress steps={4} current={step} variant="dots" />

            {step === 1 && (
              <FocusStep title="What should we call you?">
                <FormLayout onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
                  <FormField label="Display Name" htmlFor="name" required>
                    <Input id="name" placeholder="Your name" autoFocus />
                  </FormField>
                  <FormActions align="center">
                    <Button variant="primary" type="submit">
                      Continue
                    </Button>
                  </FormActions>
                </FormLayout>
              </FocusStep>
            )}

            {step === 2 && (
              <FocusStep title="Pick a handle">
                <FormLayout onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
                  <FormField label="Handle" htmlFor="handle" helperText="This is how others will find you">
                    <Input id="handle" placeholder="@yourhandle" autoFocus />
                  </FormField>
                  <FormActions align="between">
                    <Button variant="ghost" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button variant="primary" type="submit">
                      Continue
                    </Button>
                  </FormActions>
                </FormLayout>
              </FocusStep>
            )}

            {step === 3 && (
              <FocusStep title="What are you interested in?">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {['Technology', 'Design', 'Music', 'Sports', 'Gaming', 'Art', 'Science', 'Business'].map((interest) => (
                      <Badge key={interest} variant="secondary" className="cursor-pointer hover:bg-white/10">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                  <FormActions align="between">
                    <Button variant="ghost" onClick={() => setStep(2)}>
                      Back
                    </Button>
                    <Button variant="primary" onClick={() => setStep(4)}>
                      Continue
                    </Button>
                  </FormActions>
                </div>
              </FocusStep>
            )}

            {step === 4 && (
              <FocusStep title="You're all set!">
                <div className="text-center space-y-4">
                  <p className="text-[var(--text-secondary)]">
                    Welcome to HIVE. Let's find you some spaces to join.
                  </p>
                  <Button variant="primary">
                    Explore Spaces
                  </Button>
                </div>
              </FocusStep>
            )}
          </div>
        </Focus>
      </div>
    );
  },
};

// ============================================
// DASHBOARD TEMPLATE LAB
// ============================================

/**
 * [EXPERIMENT]: Dashboard Page Template
 * [TEMPLATE]: Shell + Grid patterns
 * [USE CASE]: User home, space home, analytics
 */
export const DashboardTemplateLab: Story = {
  render: () => (
    <div className="h-screen bg-[var(--bg-ground)]">
      <Shell
        atmosphere="active"
        commandBarProps={{
          showCommandButton: true,
          showTeaseLinks: true,
          campusName: 'UB',
          activeUsers: 47,
          onNotificationClick: () => {},
          onProfileClick: () => {},
        }}
        sidebarProps={{
          spaces: [
            { id: '1', name: 'Design Club', unreadCount: 3, isActive: false },
            { id: '2', name: 'CS Study Group', unreadCount: 0, isActive: true },
            { id: '3', name: 'Photography', unreadCount: 1, isActive: false },
          ],
          tools: [
            { id: '1', name: 'Grade Calculator', icon: '📊' },
            { id: '2', name: 'Study Timer', icon: '⏱️' },
          ],
          onSpaceClick: () => {},
          onDiscoverClick: () => {},
          onToolClick: () => {},
          onBuildToolClick: () => {},
          onSettingsClick: () => {},
        }}
      >
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Welcome back, Alex
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Here's what's happening in your spaces
            </p>
          </div>

          {/* Stats Grid */}
          <GridLayout variant="fixed" columns={4} gap="md">
            <GridItem>
              <Card className="p-4">
                <div className="text-sm text-[var(--text-tertiary)]">Active Spaces</div>
                <div className="text-2xl font-semibold text-[var(--text-primary)]">8</div>
              </Card>
            </GridItem>
            <GridItem>
              <Card className="p-4">
                <div className="text-sm text-[var(--text-tertiary)]">Connections</div>
                <div className="text-2xl font-semibold text-[var(--text-primary)]">42</div>
              </Card>
            </GridItem>
            <GridItem>
              <Card className="p-4">
                <div className="text-sm text-[var(--text-tertiary)]">Tools Created</div>
                <div className="text-2xl font-semibold text-[var(--text-primary)]">3</div>
              </Card>
            </GridItem>
            <GridItem>
              <Card className="p-4">
                <div className="text-sm text-[var(--text-tertiary)]">This Week</div>
                <div className="text-2xl font-semibold text-[var(--text-primary)]">+12%</div>
              </Card>
            </GridItem>
          </GridLayout>

          {/* Recent Activity */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-[var(--text-primary)]">
              Recent Activity
            </h2>
            <ListLayout variant="card">
              <ListItem
                leading={<Avatar fallback="D" size="sm" />}
                primary="New message in Design Club"
                secondary="Sarah posted about the upcoming hackathon"
                trailing={<span className="text-xs text-[var(--text-tertiary)]">2m ago</span>}
                interactive
              />
              <ListItem
                leading={<Avatar fallback="C" size="sm" />}
                primary="CS Study Group event"
                secondary="Midterm review session scheduled for Thursday"
                trailing={<span className="text-xs text-[var(--text-tertiary)]">1h ago</span>}
                interactive
              />
              <ListItem
                leading={<Avatar fallback="P" size="sm" />}
                primary="Photography meetup"
                secondary="Golden hour shoot this weekend"
                trailing={<span className="text-xs text-[var(--text-tertiary)]">3h ago</span>}
                interactive
              />
            </ListLayout>
          </div>
        </div>
      </Shell>
    </div>
  ),
};

// ============================================
// SETTINGS TEMPLATE LAB
// ============================================

/**
 * [EXPERIMENT]: Settings Page Template
 * [TEMPLATE]: Shell + SplitView + FormLayout
 * [USE CASE]: User settings, space settings, app settings
 */
export const SettingsTemplateLab: Story = {
  render: () => {
    const [activeSection, setActiveSection] = React.useState('profile');

    return (
      <div className="h-screen bg-[var(--bg-ground)]">
        <Shell
          atmosphere="ambient"
          commandBarProps={{
            showCommandButton: true,
            showTeaseLinks: false,
            campusName: 'UB',
            onNotificationClick: () => {},
            onProfileClick: () => {},
          }}
          sidebarProps={{
            spaces: [],
            tools: [],
            onSpaceClick: () => {},
            onDiscoverClick: () => {},
            onToolClick: () => {},
            onBuildToolClick: () => {},
            onSettingsClick: () => {},
          }}
        >
          <SplitView direction="horizontal" ratio="1/4" bordered={false}>
            <SplitPanel padding="md">
              <div className="space-y-1">
                <h2 className="text-sm font-medium text-[var(--text-secondary)] px-3 mb-3">
                  Settings
                </h2>
                <ListLayout variant="dense">
                  {[
                    { id: 'profile', label: 'Profile' },
                    { id: 'account', label: 'Account' },
                    { id: 'privacy', label: 'Privacy' },
                    { id: 'notifications', label: 'Notifications' },
                    { id: 'appearance', label: 'Appearance' },
                  ].map((item) => (
                    <ListItem
                      key={item.id}
                      primary={item.label}
                      interactive
                      selected={activeSection === item.id}
                      onClick={() => setActiveSection(item.id)}
                    />
                  ))}
                </ListLayout>
              </div>
            </SplitPanel>

            <SplitPanel padding="lg">
              <div className="max-w-xl space-y-6">
                <div>
                  <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                    Profile Settings
                  </h1>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    Manage your public profile information
                  </p>
                </div>

                <FormLayout onSubmit={(e) => e.preventDefault()}>
                  <FormSection title="Basic Information">
                    <FormField label="Display Name" htmlFor="displayName">
                      <Input id="displayName" defaultValue="Alex Chen" />
                    </FormField>
                    <FormField label="Handle" htmlFor="handle" helperText="Your unique identifier">
                      <Input id="handle" defaultValue="@alexchen" />
                    </FormField>
                    <FormField label="Bio" htmlFor="bio">
                      <Input id="bio" placeholder="Tell us about yourself" />
                    </FormField>
                  </FormSection>

                  <FormDivider />

                  <FormSection title="Campus Information">
                    <FormField label="University" htmlFor="university">
                      <Input id="university" defaultValue="University at Buffalo" disabled />
                    </FormField>
                    <FormField label="Major" htmlFor="major">
                      <Input id="major" placeholder="e.g., Computer Science" />
                    </FormField>
                    <FormField label="Year" htmlFor="year">
                      <Input id="year" placeholder="e.g., Junior" />
                    </FormField>
                  </FormSection>

                  <FormActions align="right">
                    <Button variant="ghost">Cancel</Button>
                    <Button variant="primary">Save Changes</Button>
                  </FormActions>
                </FormLayout>
              </div>
            </SplitPanel>
          </SplitView>
        </Shell>
      </div>
    );
  },
};

// ============================================
// PROFILE TEMPLATE LAB
// ============================================

/**
 * [EXPERIMENT]: Profile Page Template
 * [TEMPLATE]: Shell + BentoGrid
 * [USE CASE]: User profiles, space profiles
 */
export const ProfileTemplateLab: Story = {
  render: () => (
    <div className="h-screen bg-[var(--bg-ground)]">
      <Shell
        atmosphere="active"
        commandBarProps={{
          showCommandButton: true,
          showTeaseLinks: true,
          campusName: 'UB',
          activeUsers: 47,
          onNotificationClick: () => {},
          onProfileClick: () => {},
        }}
        sidebarProps={{
          spaces: [
            { id: '1', name: 'Design Club', unreadCount: 0, isActive: false },
            { id: '2', name: 'CS Study Group', unreadCount: 0, isActive: false },
          ],
          tools: [],
          onSpaceClick: () => {},
          onDiscoverClick: () => {},
          onToolClick: () => {},
          onBuildToolClick: () => {},
          onSettingsClick: () => {},
        }}
      >
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          {/* Profile Header */}
          <div className="flex items-start gap-6">
            <Avatar fallback="AC" size="xl" />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                  Alex Chen
                </h1>
                <Badge variant="gold">Pro</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">@alexchen</p>
              <p className="text-sm text-[var(--text-tertiary)] mt-2">
                CS Major at UB · Building cool things · Coffee enthusiast
              </p>
              <div className="flex gap-4 mt-3 text-sm text-[var(--text-secondary)]">
                <span><strong className="text-[var(--text-primary)]">128</strong> connections</span>
                <span><strong className="text-[var(--text-primary)]">8</strong> spaces</span>
                <span><strong className="text-[var(--text-primary)]">3</strong> tools</span>
              </div>
            </div>
            <Button variant="secondary">Edit Profile</Button>
          </div>

          {/* Bento Grid */}
          <BentoGrid gap="md">
            <BentoItem size="xl" className="p-6 flex flex-col justify-end bg-gradient-to-br from-white/5 to-transparent">
              <Badge variant="secondary" className="w-fit mb-2">Pinned</Badge>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Grade Calculator
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                My most popular tool - helps students track their GPA
              </p>
              <div className="mt-2 text-xs text-[var(--text-tertiary)]">
                1.2k uses this semester
              </div>
            </BentoItem>

            <BentoItem size="sm" className="p-4 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-[var(--text-primary)]">42</div>
              <div className="text-xs text-[var(--text-tertiary)]">Tools Used</div>
            </BentoItem>

            <BentoItem size="sm" className="p-4 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-[#FFD700]">Level 5</div>
              <div className="text-xs text-[var(--text-tertiary)]">Builder</div>
            </BentoItem>

            <BentoItem size="lg" className="p-4">
              <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                Recent Spaces
              </h4>
              <ListLayout variant="dense">
                <ListItem primary="Design Club" secondary="Admin" />
                <ListItem primary="CS Study Group" secondary="Member" />
                <ListItem primary="Photography" secondary="Member" />
              </ListLayout>
            </BentoItem>

            <BentoItem size="md" className="p-4">
              <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                Interests
              </h4>
              <div className="flex flex-wrap gap-2">
                {['Technology', 'Design', 'Photography', 'Music'].map((tag) => (
                  <Badge key={tag} variant="secondary" size="sm">{tag}</Badge>
                ))}
              </div>
            </BentoItem>
          </BentoGrid>
        </div>
      </Shell>
    </div>
  ),
};

// ============================================
// BROWSE TEMPLATE LAB
// ============================================

/**
 * [EXPERIMENT]: Browse/Discovery Page Template
 * [TEMPLATE]: Shell + Grid template
 * [USE CASE]: Space discovery, tool gallery
 */
export const BrowseTemplateLab: Story = {
  render: () => (
    <div className="h-screen bg-[var(--bg-ground)]">
      <Shell
        atmosphere="active"
        commandBarProps={{
          showCommandButton: true,
          showTeaseLinks: true,
          campusName: 'UB',
          activeUsers: 47,
          onNotificationClick: () => {},
          onProfileClick: () => {},
        }}
        sidebarProps={{
          spaces: [],
          tools: [],
          onSpaceClick: () => {},
          onDiscoverClick: () => {},
          onToolClick: () => {},
          onBuildToolClick: () => {},
          onSettingsClick: () => {},
        }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                Discover Spaces
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Find communities that match your interests
              </p>
            </div>
            <Input placeholder="Search spaces..." className="w-64" />
          </div>

          {/* Category Filters */}
          <div className="flex gap-2">
            {['All', 'Academic', 'Social', 'Creative', 'Sports', 'Tech'].map((cat) => (
              <Badge
                key={cat}
                variant={cat === 'All' ? 'default' : 'secondary'}
                className="cursor-pointer"
              >
                {cat}
              </Badge>
            ))}
          </div>

          {/* Space Grid */}
          <Grid mode="uniform" columns={3} gap="md" atmosphere="active">
            {[
              { name: 'Design Club', members: 234, category: 'Creative' },
              { name: 'CS Study Group', members: 567, category: 'Academic' },
              { name: 'Photography Club', members: 189, category: 'Creative' },
              { name: 'Intramural Soccer', members: 89, category: 'Sports' },
              { name: 'Hackathon Team', members: 45, category: 'Tech' },
              { name: 'Music Production', members: 156, category: 'Creative' },
            ].map((space) => (
              <Card key={space.name} className="p-4 hover:border-white/20 cursor-pointer transition-colors">
                <div className="flex items-start gap-3">
                  <Avatar fallback={space.name[0]} size="lg" shape="square" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[var(--text-primary)] truncate">
                      {space.name}
                    </h3>
                    <p className="text-sm text-[var(--text-tertiary)]">
                      {space.members} members
                    </p>
                    <Badge variant="secondary" size="sm" className="mt-2">
                      {space.category}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </Grid>
        </div>
      </Shell>
    </div>
  ),
};

// ============================================
// MASTER SHOWCASE
// ============================================

/**
 * All page templates at a glance
 */
export const MasterShowcase: Story = {
  render: () => (
    <div className="p-8 space-y-8 bg-[var(--bg-ground)] min-h-screen">
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">
        Page Template Matrix
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: 'Auth', template: 'Focus (Portal)', use: 'Login, Signup, OTP' },
          { name: 'Onboarding', template: 'Focus (Reveal)', use: 'Multi-step flows' },
          { name: 'Dashboard', template: 'Shell + Grid', use: 'Home, Overview' },
          { name: 'Settings', template: 'Shell + SplitView', use: 'User/Space config' },
          { name: 'Profile', template: 'Shell + BentoGrid', use: 'User/Space profiles' },
          { name: 'Browse', template: 'Shell + Grid', use: 'Discovery, Gallery' },
          { name: 'Chat', template: 'Shell + Stream', use: 'Space chat, DMs' },
          { name: 'IDE', template: 'Shell + Workspace', use: 'HiveLab, Editors' },
        ].map((item) => (
          <Card key={item.name} className="p-4">
            <h3 className="font-medium text-[var(--text-primary)]">{item.name}</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{item.template}</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-2">{item.use}</p>
          </Card>
        ))}
      </div>

      <div className="text-sm text-[var(--text-tertiary)]">
        <p>Templates provide the emotional architecture. Patterns fill in the content.</p>
        <p className="mt-2">
          <strong>Focus:</strong> Single-task immersion (auth, onboarding)<br />
          <strong>Shell:</strong> Navigation frame (most pages)<br />
          <strong>Stream:</strong> Temporal flow (chat, feed)<br />
          <strong>Grid:</strong> Discovery layout (browse, gallery)<br />
          <strong>Workspace:</strong> Creation studio (IDE, editors)
        </p>
      </div>
    </div>
  ),
};
