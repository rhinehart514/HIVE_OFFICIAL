'use client';

/**
 * Space Settings Page
 *
 * Archetype: Focus Flow (Shell ON)
 * Pattern: Tab navigation (sidebar desktop, horizontal mobile)
 * Shell: ON
 *
 * Leader-only settings with category accent.
 *
 * @version 7.0.0 - Redesigned for Spaces Vertical Slice (Jan 2026)
 */

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Variants,
} from 'framer-motion';
import {
  ChevronLeftIcon,
  Cog6ToothIcon,
  UsersIcon,
  ShieldCheckIcon,
  WrenchIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  Squares2X2Icon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Button, cn, toast } from '@hive/ui';
import { springPresets, easingArrays } from '@hive/tokens';

// Category accent colors (domain-based)
const CATEGORY_COLORS: Record<string, string> = {
  university: '#3B82F6',
  student_org: '#F59E0B',
  residential: '#10B981',
  greek: '#8B5CF6',
};
import {
  SpaceContextProvider,
  useSpaceMetadata,
  useSpaceStructureContext,
  useSpaceLeader,
} from "@/contexts/space";
import { secureApiFetch } from "@/lib/secure-auth-utils";
import { useAuth } from "@hive/auth-logic";

import {
  GeneralTab,
  StructureTab,
  MembersTab,
  PermissionsTab,
  IntegrationsTab,
  DangerTab,
  type SpaceSettingsForm,
} from "./components";

// =============================================================================
// TYPES
// =============================================================================

type SettingsTab =
  | "general"
  | "structure"
  | "members"
  | "permissions"
  | "integrations"
  | "danger";

// =============================================================================
// MOTION VARIANTS
// =============================================================================

const pageVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: easingArrays.silk,
      staggerChildren: 0.05,
    },
  },
};

const sectionVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: springPresets.snappy,
  },
};

const tabContentVariants: Variants = {
  initial: { opacity: 0, x: 10 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: easingArrays.silk },
  },
  exit: {
    opacity: 0,
    x: -10,
    transition: { duration: 0.15 },
  },
};

const listItemVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: springPresets.snappy,
  },
};

// =============================================================================
// TAB CONFIG
// =============================================================================

const settingsTabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "general", label: "General", icon: <Cog6ToothIcon className="h-4 w-4" /> },
  { id: "structure", label: "Layout", icon: <Squares2X2Icon className="h-4 w-4" /> },
  { id: "members", label: "Members", icon: <UsersIcon className="h-4 w-4" /> },
  { id: "permissions", label: "Permissions", icon: <ShieldCheckIcon className="h-4 w-4" /> },
  { id: "integrations", label: "Integrations", icon: <WrenchIcon className="h-4 w-4" /> },
  { id: "danger", label: "Danger Zone", icon: <ExclamationTriangleIcon className="h-4 w-4" /> },
];

// =============================================================================
// SETTINGS CONTENT COMPONENT
// =============================================================================

function SpaceSettingsContent() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const { user } = useAuth();

  const { space, spaceId, membership, isLoading, error } = useSpaceMetadata();
  const { tabs, widgets } = useSpaceStructureContext();
  const { leaderActions } = useSpaceLeader();

  const [activeTab, setActiveTab] = React.useState<SettingsTab>("general");
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<SpaceSettingsForm>({
    name: "",
    description: "",
    category: "club",
    joinPolicy: "open",
    visibility: "public",
    allowRSS: false,
    requireApproval: false,
  });

  // Check provisional access
  const hasProvisionalAccess = React.useMemo(() => {
    if (!space || !user?.uid) return false;
    const leaderRequests = (space as { leaderRequests?: Array<{
      profileId: string;
      status: string;
      provisionalAccessGranted?: boolean;
      reviewedAt?: string | null;
    }> }).leaderRequests;
    if (!leaderRequests) return false;
    const userRequest = leaderRequests.find(
      (r) => r.profileId === user.uid && r.status === 'pending'
    );
    return userRequest?.provisionalAccessGranted && !userRequest.reviewedAt;
  }, [space, user?.uid]);

  // Initialize form
  React.useEffect(() => {
    if (space) {
      setForm({
        name: space.name,
        description: space.description || "",
        category: space.category || "club",
        joinPolicy: space.settings?.requireApproval ? "approval" : "open",
        visibility: space.visibility || "public",
        allowRSS: space.settings?.allowRSS || false,
        requireApproval: space.settings?.requireApproval || false,
      });
    }
  }, [space]);

  // Redirect non-leaders
  React.useEffect(() => {
    if (!isLoading && !membership.isLeader && spaceId) {
      toast.error("Access denied", "Only leaders can access settings.");
      router.push(`/spaces/${spaceId}`);
    }
  }, [isLoading, membership.isLeader, spaceId, router]);

  const handleSave = async () => {
    if (!spaceId) return;
    setSaving(true);
    try {
      const res = await secureApiFetch(`/api/spaces/${spaceId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          category: form.category,
          visibility: form.visibility,
          settings: {
            allowRSS: form.allowRSS,
            requireApproval: form.requireApproval,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Settings saved", "Your changes have been applied.");
    } catch {
      toast.error("Failed to save", "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-neutral-800/50 rounded" />
            <div className="h-4 w-64 bg-neutral-800/50 rounded" />
            <div className="h-64 bg-neutral-800/50 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!space) return null;

  // Get category color for accent
  const categoryColor = CATEGORY_COLORS[space.category || ''] || CATEGORY_COLORS.student_org;

  return (
    <motion.div
      variants={shouldReduceMotion ? undefined : pageVariants}
      initial="initial"
      animate="animate"
      className="min-h-screen bg-black relative"
    >
      {/* Category accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-1 z-40"
        style={{ backgroundColor: categoryColor }}
      />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-neutral-800/50 pt-1">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ opacity: 0.9 }}
                whileTap={{ opacity: 0.8 }}
                onClick={() => router.push(`/spaces/${spaceId}`)}
                className="p-2 -ml-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </motion.button>
              <div>
                <h1 className="text-xl font-bold text-white">Space Settings</h1>
                <p className="text-sm text-neutral-400">{space.name}</p>
              </div>
            </div>

            <motion.div whileHover={{ opacity: 0.9 }} whileTap={{ opacity: 0.8 }}>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-life-gold text-black hover:bg-life-gold/90 font-semibold"
              >
                {saving ? (
                  <ArrowPathIcon className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <CheckIcon className="h-4 w-4 mr-1.5" />
                )}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar tabs */}
          <motion.nav variants={sectionVariants} className="md:w-52 flex-shrink-0">
            {/* Desktop */}
            <div className="hidden md:block bg-neutral-900/60 backdrop-blur-sm border border-white/[0.06] rounded-xl p-2">
              <div className="flex flex-col gap-0.5">
                {settingsTabs.map((tab, index) => (
                  <motion.button
                    key={tab.id}
                    variants={listItemVariants}
                    custom={index}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      activeTab === tab.id
                        ? "text-white"
                        : "text-neutral-400 hover:text-white hover:bg-white/5",
                      tab.id === "danger" && "text-red-400 hover:text-red-300"
                    )}
                  >
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="settings-tab-indicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-life-gold rounded-full"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    <span className={cn(
                      activeTab === tab.id && tab.id !== "danger" && "text-life-gold"
                    )}>
                      {tab.icon}
                    </span>
                    {tab.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Mobile */}
            <div className="flex md:hidden gap-2 overflow-x-auto pb-2 -mx-4 px-4">
              {settingsTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors",
                    activeTab === tab.id
                      ? "text-white bg-neutral-800/50"
                      : "text-neutral-400 bg-neutral-900/50 border border-neutral-800/50",
                    tab.id === "danger" && activeTab !== tab.id && "text-red-400"
                  )}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="settings-tab-mobile-indicator"
                      className="absolute bottom-0 left-3 right-3 h-0.5 bg-life-gold rounded-full"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span className={cn(
                    activeTab === tab.id && tab.id !== "danger" && "text-life-gold"
                  )}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.nav>

          {/* Tab content */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeTab === "general" && (
                <GeneralTab
                  form={form}
                  setForm={setForm}
                  variants={tabContentVariants}
                />
              )}

              {activeTab === "structure" && (
                <StructureTab
                  tabs={tabs}
                  widgets={widgets}
                  leaderActions={leaderActions as Parameters<typeof StructureTab>[0]['leaderActions']}
                  variants={tabContentVariants}
                />
              )}

              {activeTab === "members" && (
                <MembersTab
                  spaceId={spaceId!}
                  variants={tabContentVariants}
                />
              )}

              {activeTab === "permissions" && (
                <PermissionsTab variants={tabContentVariants} />
              )}

              {activeTab === "integrations" && (
                <IntegrationsTab
                  spaceId={spaceId!}
                  form={form}
                  setForm={setForm}
                  variants={tabContentVariants}
                />
              )}

              {activeTab === "danger" && (
                <DangerTab
                  spaceId={spaceId!}
                  hasProvisionalAccess={hasProvisionalAccess ?? false}
                  variants={tabContentVariants}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 backdrop-blur-sm">
            {error}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function SpaceSettingsPage() {
  const params = useParams<{ spaceId: string }>();
  const spaceId = params?.spaceId;

  if (!spaceId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-neutral-400">Space not found</div>
      </div>
    );
  }

  return (
    <SpaceContextProvider spaceId={spaceId}>
      <SpaceSettingsContent />
    </SpaceContextProvider>
  );
}
