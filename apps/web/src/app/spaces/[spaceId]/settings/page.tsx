"use client";

/**
 * Space Settings Page - Complete Rebuild
 *
 * Leader-only settings with:
 * - SpaceContext integration
 * - Tab and Widget management
 * - T2 Motion tier animations
 * - Glass morphism styling
 *
 * @author HIVE Frontend Team
 * @version 2.0.0
 */

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  ChevronLeft,
  Settings,
  Users,
  Shield,
  Wrench,
  Trash2,
  Save,
  AlertTriangle,
  Plus,
  LayoutGrid,
  Loader2,
  GripVertical,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button, Input, Card, Switch, toast, cn } from "@hive/ui";
import { springPresets, easingArrays } from "@hive/tokens";
import { SpaceContextProvider, useSpaceContext } from "@/contexts/SpaceContext";
import { secureApiFetch } from "@/lib/secure-auth-utils";

// =============================================================================
// TYPES
// =============================================================================

interface SpaceSettingsForm {
  name: string;
  description: string;
  category: string;
  joinPolicy: "open" | "approval" | "invite_only";
  visibility: "public" | "private";
  allowRSS: boolean;
  requireApproval: boolean;
}

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
    transition: {
      duration: 0.2,
      ease: easingArrays.silk,
    },
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
// SETTINGS CONTENT COMPONENT
// =============================================================================

function SpaceSettingsContent() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const {
    space,
    spaceId,
    membership,
    tabs,
    widgets,
    visibleTabs,
    isLoading,
    error,
    leaderActions,
  } = useSpaceContext();

  // Local state
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

  // Initialize form when space loads
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

  // Handle form save
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
    } catch (e) {
      toast.error("Failed to save", "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Handle tab visibility toggle
  const handleToggleTab = async (tabId: string, isVisible: boolean) => {
    if (!leaderActions) return;
    await leaderActions.updateTab(tabId, { isVisible });
  };

  // Handle delete space
  const handleDeleteSpace = async () => {
    if (!spaceId) return;

    if (
      !confirm(
        "Are you sure you want to delete this space? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const res = await secureApiFetch(`/api/spaces/${spaceId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Space deleted", "The space has been permanently deleted.");
      router.push("/spaces");
    } catch (e) {
      toast.error("Failed to delete", "Please try again.");
    }
  };

  // Tab configuration
  const settingsTabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: "general", label: "General", icon: <Settings className="h-4 w-4" /> },
    { id: "structure", label: "Layout", icon: <LayoutGrid className="h-4 w-4" /> },
    { id: "members", label: "Members", icon: <Users className="h-4 w-4" /> },
    { id: "permissions", label: "Permissions", icon: <Shield className="h-4 w-4" /> },
    { id: "integrations", label: "Integrations", icon: <Wrench className="h-4 w-4" /> },
    { id: "danger", label: "Danger Zone", icon: <AlertTriangle className="h-4 w-4" /> },
  ];

  // Loading state
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

  return (
    <motion.div
      variants={shouldReduceMotion ? undefined : pageVariants}
      initial="initial"
      animate="animate"
      className="min-h-screen bg-black"
    >
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-neutral-800/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(`/spaces/${spaceId}`)}
                className="p-2 -ml-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </motion.button>
              <div>
                <h1 className="text-xl font-bold text-white">Space Settings</h1>
                <p className="text-sm text-neutral-400">{space.name}</p>
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-semibold"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1.5" />
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
          {/* Sidebar tabs - glass morphism container with gold accents */}
          <motion.nav
            variants={sectionVariants}
            className="md:w-52 flex-shrink-0"
          >
            {/* Desktop: vertical list in glass container */}
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
                    {/* Gold left border indicator for active */}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="settings-tab-indicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#FFD700] rounded-full"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    <span className={cn(
                      activeTab === tab.id && tab.id !== "danger" && "text-[#FFD700]"
                    )}>
                      {tab.icon}
                    </span>
                    {tab.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Mobile: horizontal scrollable */}
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
                  {/* Gold underline for active */}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="settings-tab-mobile-indicator"
                      className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#FFD700] rounded-full"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span className={cn(
                    activeTab === tab.id && tab.id !== "danger" && "text-[#FFD700]"
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
                <motion.div
                  key="general"
                  variants={tabContentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Card className="p-6 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
                    <h2 className="text-lg font-semibold text-white mb-6">
                      General Settings
                    </h2>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                          Space Name
                        </label>
                        <Input
                          value={form.name}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, name: e.target.value }))
                          }
                          className="bg-neutral-800/50 border-neutral-700"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                          Description
                        </label>
                        <textarea
                          value={form.description}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          rows={4}
                          className="w-full bg-neutral-800/50 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm resize-none focus:border-[#FFD700]/50 focus:ring-[#FFD700]/20"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                          Category
                        </label>
                        <select
                          value={form.category}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              category: e.target.value,
                            }))
                          }
                          className="w-full bg-neutral-800/50 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm"
                        >
                          <option value="club">Club</option>
                          <option value="academic">Academic</option>
                          <option value="student_org">Student Org</option>
                          <option value="residential">Residential</option>
                          <option value="university_org">University Org</option>
                          <option value="greek_life">Greek Life</option>
                          <option value="sports">Sports</option>
                          <option value="arts">Arts</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                          Visibility
                        </label>
                        <select
                          value={form.visibility}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              visibility: e.target.value as "public" | "private",
                            }))
                          }
                          className="w-full bg-neutral-800/50 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm"
                        >
                          <option value="public">Public - Anyone can discover</option>
                          <option value="private">Private - Invite only</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <p className="text-sm font-medium text-white">
                            Require Approval
                          </p>
                          <p className="text-xs text-neutral-500">
                            New members must be approved
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              requireApproval: !prev.requireApproval,
                            }))
                          }
                          className={cn(
                            "relative w-11 h-6 rounded-full transition-colors",
                            form.requireApproval
                              ? "bg-[#FFD700]"
                              : "bg-neutral-700"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                              form.requireApproval ? "left-6" : "left-1"
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {activeTab === "structure" && (
                <motion.div
                  key="structure"
                  variants={tabContentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-4"
                >
                  {/* Tabs Management */}
                  <Card className="p-6 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white">Tabs</h2>
                      {leaderActions && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // TODO: Open add tab modal
                          }}
                          className="border-neutral-700 text-neutral-300 hover:bg-white/5"
                        >
                          <Plus className="h-4 w-4 mr-1.5" />
                          Add Tab
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {tabs.map((tab, index) => (
                        <motion.div
                          key={tab.id}
                          variants={listItemVariants}
                          custom={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/30 border border-neutral-700/50"
                        >
                          <div className="flex items-center gap-3">
                            <GripVertical className="h-4 w-4 text-neutral-600 cursor-grab" />
                            <div>
                              <p className="text-sm font-medium text-white">
                                {tab.name}
                              </p>
                              <p className="text-xs text-neutral-500 capitalize">
                                {tab.type}
                                {tab.isDefault && " • Default"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleTab(tab.id, !tab.isVisible)}
                              className={cn(
                                "p-1.5 rounded transition-colors",
                                tab.isVisible
                                  ? "text-[#FFD700] hover:bg-[#FFD700]/10"
                                  : "text-neutral-500 hover:bg-white/5"
                              )}
                            >
                              {tab.isVisible ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </Card>

                  {/* Widgets Management */}
                  <Card className="p-6 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white">Widgets</h2>
                      {leaderActions && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // TODO: Open add widget modal
                          }}
                          className="border-neutral-700 text-neutral-300 hover:bg-white/5"
                        >
                          <Plus className="h-4 w-4 mr-1.5" />
                          Add Widget
                        </Button>
                      )}
                    </div>

                    {widgets.length === 0 ? (
                      <div className="py-8 text-center text-neutral-500">
                        <LayoutGrid className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No widgets configured</p>
                        <p className="text-xs mt-1">
                          Add widgets to customize your space
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {widgets.map((widget, index) => (
                          <motion.div
                            key={widget.id}
                            variants={listItemVariants}
                            custom={index}
                            className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/30 border border-neutral-700/50"
                          >
                            <div>
                              <p className="text-sm font-medium text-white">
                                {widget.title}
                              </p>
                              <p className="text-xs text-neutral-500 capitalize">
                                {widget.type}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded text-xs",
                                  widget.isEnabled
                                    ? "bg-green-500/10 text-green-400"
                                    : "bg-neutral-700/50 text-neutral-400"
                                )}
                              >
                                {widget.isEnabled ? "Enabled" : "Disabled"}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </Card>
                </motion.div>
              )}

              {activeTab === "members" && (
                <motion.div
                  key="members"
                  variants={tabContentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Card className="p-6 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
                    <h2 className="text-lg font-semibold text-white mb-4">
                      Member Management
                    </h2>
                    <p className="text-neutral-400 mb-4">
                      View and manage space members, promote to admin, or remove
                      members.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/spaces/${spaceId}/members`)}
                      className="border-neutral-700 text-neutral-300 hover:bg-white/5"
                    >
                      <Users className="h-4 w-4 mr-1.5" />
                      Manage Members
                    </Button>
                  </Card>
                </motion.div>
              )}

              {activeTab === "permissions" && (
                <motion.div
                  key="permissions"
                  variants={tabContentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Card className="p-6 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
                    <h2 className="text-lg font-semibold text-white mb-4">
                      Permissions
                    </h2>
                    <p className="text-neutral-400 mb-4">
                      Configure what different roles can do in your space.
                    </p>
                    <div className="p-4 bg-neutral-800/30 rounded-lg border border-neutral-700/50">
                      <p className="text-sm text-neutral-500">
                        Advanced permissions coming soon.
                      </p>
                    </div>
                  </Card>
                </motion.div>
              )}

              {activeTab === "integrations" && (
                <motion.div
                  key="integrations"
                  variants={tabContentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Card className="p-6 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
                    <h2 className="text-lg font-semibold text-white mb-4">
                      Integrations
                    </h2>
                    <p className="text-neutral-400 mb-4">
                      Enable tools like calendar, polls, and custom HiveLab tools.
                    </p>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/30 border border-neutral-700/50 mb-3">
                      <div>
                        <p className="text-sm font-medium text-white">RSS Feed</p>
                        <p className="text-xs text-neutral-500">
                          Allow members to subscribe to updates
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            allowRSS: !prev.allowRSS,
                          }))
                        }
                        className={cn(
                          "relative w-11 h-6 rounded-full transition-colors",
                          form.allowRSS ? "bg-[#FFD700]" : "bg-neutral-700"
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                            form.allowRSS ? "left-6" : "left-1"
                          )}
                        />
                      </button>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => router.push(`/spaces/${spaceId}/tools`)}
                      className="border-neutral-700 text-neutral-300 hover:bg-white/5"
                    >
                      <Wrench className="h-4 w-4 mr-1.5" />
                      Manage Tools
                    </Button>
                  </Card>
                </motion.div>
              )}

              {activeTab === "danger" && (
                <motion.div
                  key="danger"
                  variants={tabContentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Card className="p-6 bg-neutral-900/60 backdrop-blur-sm border-red-500/20">
                    <h2 className="text-lg font-semibold text-red-400 mb-4">
                      Danger Zone
                    </h2>
                    <p className="text-neutral-400 mb-4">
                      These actions are irreversible. Please be certain.
                    </p>

                    <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                      <h3 className="font-medium text-white mb-2">Delete Space</h3>
                      <p className="text-sm text-neutral-400 mb-3">
                        Permanently delete this space and all its content. This
                        cannot be undone.
                      </p>
                      <Button
                        variant="outline"
                        onClick={handleDeleteSpace}
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        Delete Space
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Error state */}
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
// PAGE COMPONENT WITH PROVIDER
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
