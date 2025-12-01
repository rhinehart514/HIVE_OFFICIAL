"use client";

/**
 * Space Detail Page - Complete Rebuild
 *
 * Premium space detail experience with:
 * - SpaceContext for unified state management
 * - T1 Premium SpaceDetailHeader with Ken Burns, parallax
 * - Tab-based navigation with SpaceDynamicContent
 * - 60/40 split layout with sticky sidebar
 * - Join celebration animations
 *
 * @author HIVE Frontend Team
 * @version 2.0.0
 */

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  SpaceDetailHeader,
  SpaceDynamicContent,
  SpaceSidebar,
  SpacePostComposer,
  FeedCardPost,
  MobileAboutSection,
  PostDetailModal,
  AddTabModal,
  AddWidgetModal,
  PostsEmptyState,
  type SpaceTabItem,
  type FeedCardPostData,
  type PostDetailData,
  type PostDetailComment,
  type AddTabInput,
  type AddWidgetInputUI,
} from "@hive/ui";
import { SpaceBoardSkeleton } from "@hive/ui";
import { SpaceContextProvider, useSpaceContext } from "@/contexts/SpaceContext";
import { useFeed, type Post } from "@/hooks/use-feed";
import { secureApiFetch } from "@/lib/secure-auth-utils";
import { springPresets } from "@hive/tokens";

// ============================================================
// Inner Content Component (uses SpaceContext)
// ============================================================

function SpaceDetailContent() {
  const router = useRouter();
  const {
    space,
    spaceId,
    membership,
    tabs,
    widgets,
    visibleTabs,
    activeTabId,
    setActiveTabId,
    activeTab,
    activeTabWidgets,
    isLoading,
    isStructureLoading,
    isMutating,
    error,
    joinSpace,
    leaveSpace,
    refresh,
    leaderActions,
    getWidgetsForTab,
  } = useSpaceContext();

  // Feed hook for feed tabs
  const {
    posts,
    isLoading: feedLoading,
    isLoadingMore,
    hasMore,
    error: feedError,
    loadMore,
    refresh: refreshFeed,
    likePost,
    bookmarkPost,
    sharePost,
    createPost,
  } = useFeed({ spaceId: spaceId ?? "", limit: 20, sortBy: "recent" });

  // Local state
  const [composerOpen, setComposerOpen] = React.useState(false);
  const [isWidgetEditMode, setIsWidgetEditMode] = React.useState(false);
  const [tools, setTools] = React.useState<Array<{
    id: string;
    toolId: string;
    deploymentId: string;
    name: string;
    type: string;
    isActive: boolean;
    responseCount: number;
  }>>([]);
  const [toolsHasMore, setToolsHasMore] = React.useState(false);
  const [leaders, setLeaders] = React.useState<Array<{
    id: string;
    name: string;
    avatarUrl?: string;
    role: string;
  }>>([]);

  // Post detail modal state
  const [selectedPost, setSelectedPost] = React.useState<Post | null>(null);
  const [postDetailOpen, setPostDetailOpen] = React.useState(false);
  const [postComments, setPostComments] = React.useState<PostDetailComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = React.useState(false);

  // Leader modals state
  const [addTabModalOpen, setAddTabModalOpen] = React.useState(false);
  const [addWidgetModalOpen, setAddWidgetModalOpen] = React.useState(false);

  // Load tools for sidebar (members only)
  React.useEffect(() => {
    const loadTools = async () => {
      if (!spaceId || !membership.isMember) return;
      try {
        const res = await secureApiFetch(`/api/spaces/${spaceId}/tools`);
        if (!res.ok) return;
        const data = await res.json();
        const toolList = Array.isArray(data.tools) ? data.tools : [];
        setTools(
          toolList.map((t: Record<string, unknown>) => ({
            id: (t.toolId as string) || (t.deploymentId as string),
            toolId: t.toolId as string,
            deploymentId: t.deploymentId as string,
            name: t.name as string,
            type: (t.category as string) || "tool",
            isActive: t.status === "active",
            responseCount: (t.usageCount as number) || 0,
          }))
        );
        setToolsHasMore(Boolean(data.hasMore));
      } catch {
        // Silently ignore fetch errors
      }
    };
    void loadTools();
  }, [spaceId, membership.isMember]);

  // Load leaders (owners/admins)
  React.useEffect(() => {
    const loadLeaders = async () => {
      if (!spaceId || !membership.isMember) return;
      try {
        const ownersRes = await secureApiFetch(
          `/api/spaces/${spaceId}/members?role=owner&limit=5`
        );
        const adminsRes = await secureApiFetch(
          `/api/spaces/${spaceId}/members?role=admin&limit=5`
        );
        const ownersData = ownersRes.ok ? await ownersRes.json() : { members: [] };
        const adminsData = adminsRes.ok ? await adminsRes.json() : { members: [] };
        const owners = Array.isArray(ownersData.members) ? ownersData.members : [];
        const admins = Array.isArray(adminsData.members) ? adminsData.members : [];
        const list = [...owners, ...admins].map((m: Record<string, unknown>) => ({
          id: m.id as string,
          name: m.name as string,
          avatarUrl: m.avatar as string | undefined,
          role: m.role as string,
        }));
        setLeaders(list);
      } catch {
        // Silently ignore fetch errors
      }
    };
    void loadLeaders();
  }, [spaceId, membership.isMember]);

  // Open post detail and load comments
  const handleOpenPost = React.useCallback(async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    setSelectedPost(post);
    setPostDetailOpen(true);
    setIsLoadingComments(true);
    setPostComments([]);

    try {
      const res = await secureApiFetch(`/api/spaces/${spaceId}/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        const comments = Array.isArray(data.comments) ? data.comments : [];
        setPostComments(
          comments.map((c: Record<string, unknown>) => ({
            id: c.id as string,
            author: {
              id: (c.authorId as string) || "",
              name: (c.authorName as string) || "Anonymous",
              avatarUrl: c.authorAvatar as string | undefined,
              role: c.authorRole as string | undefined,
            },
            content: c.content as string,
            createdAt: c.createdAt as string,
            likes: (c.likes as number) || 0,
            hasLiked: Boolean(c.hasLiked),
          }))
        );
      }
    } catch {
      // Silently ignore
    } finally {
      setIsLoadingComments(false);
    }
  }, [posts, spaceId]);

  // Submit comment
  const handleSubmitComment = React.useCallback(async (postId: string, content: string) => {
    try {
      const res = await secureApiFetch(`/api/spaces/${spaceId}/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const data = await res.json();
        const newComment: PostDetailComment = {
          id: data.commentId || data.id,
          author: {
            id: data.authorId || "",
            name: data.authorName || "You",
            avatarUrl: data.authorAvatar,
          },
          content,
          createdAt: new Date().toISOString(),
          likes: 0,
          hasLiked: false,
        };
        setPostComments((prev) => [...prev, newComment]);
      }
    } catch {
      // Silently ignore
    }
  }, [spaceId]);

  // Convert Post to PostDetailData
  const toPostDetailData = React.useCallback((post: Post): PostDetailData => {
    return {
      id: post.id,
      author: {
        id: post.author?.id || post.authorId || "",
        name: post.author?.name || "Anonymous",
        avatarUrl: post.author?.avatarUrl,
        role: post.author?.badges?.[0],
        verified: post.author?.isVerified,
      },
      space: {
        id: spaceId ?? "",
        name: space?.name || "",
        color: "var(--hive-brand-primary)",
      },
      content: {
        headline: post.type === "link" ? (post.content || "").split("\n")[0] : undefined,
        body: post.content,
        media: post.attachments?.map((a) => ({
          id: a.id,
          type: a.type as "image" | "video",
          url: a.url,
          thumbnailUrl: a.thumbnailUrl,
        })),
        tags: post.tags,
      },
      stats: {
        upvotes: post.engagement?.likes || 0,
        comments: post.engagement?.comments || 0,
        isUpvoted: Boolean(post.engagement?.hasLiked),
        isBookmarked: Boolean(post.engagement?.hasBookmarked),
      },
      createdAt: post.createdAt,
      isEdited: Boolean((post as Post & { isEdited?: boolean }).isEdited),
      isPinned: Boolean((post as Post & { isPinned?: boolean }).isPinned),
    };
  }, [spaceId, space?.name]);

  // Handle add tab
  const handleAddTab = React.useCallback(async (input: AddTabInput) => {
    if (!leaderActions) throw new Error("Not authorized");
    const result = await leaderActions.addTab({
      name: input.name,
      type: input.type,
    });
    if (!result) throw new Error("Failed to create tab");
  }, [leaderActions]);

  // Handle add widget
  const handleAddWidget = React.useCallback(async (input: AddWidgetInputUI) => {
    if (!leaderActions) throw new Error("Not authorized");
    const result = await leaderActions.addWidget({
      type: input.type,
      title: input.title,
      config: input.config,
    });
    if (!result) throw new Error("Failed to create widget");
  }, [leaderActions]);

  // Loading state
  if (isLoading || !space) {
    return (
      <div className="min-h-screen bg-black">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <SpaceBoardSkeleton />
        </div>
      </div>
    );
  }

  // Map membership state for header
  const membershipState = (() => {
    if (membership.role === "owner") return "owner" as const;
    if (membership.role === "admin") return "admin" as const;
    if (membership.isMember) return "joined" as const;
    return "not_joined" as const;
  })();

  // Convert tabs to SpaceTabItem format
  const tabItems: SpaceTabItem[] = visibleTabs.map((t) => ({
    id: t.id,
    name: t.name,
    type: t.type,
    isDefault: t.isDefault,
    hasActivity: false, // TODO: implement activity detection
  }));

  // Sidebar data - only include tools if there are any (don't show empty widget)
  const sidebarData = {
    spaceId: spaceId ?? "",
    about: {
      spaceId: spaceId ?? "",
      description: space.description || "Leaders have not added a description yet.",
      memberCount: space.memberCount,
      leaders,
      isPublic: space.visibility === "public",
      isMember: membership.isMember,
    },
    // Only show tools widget when there are actual tools
    ...(tools.length > 0 && {
      tools: {
        spaceId: spaceId ?? "",
        tools,
        hasMore: toolsHasMore,
      },
    }),
  };

  // Transform posts for FeedCardPost
  const toCardData = (post: Post): FeedCardPostData => {
    return {
      id: post.id,
      author: {
        id: post.author?.id || post.authorId || "",
        name: post.author?.name || "Anonymous",
        avatarUrl: post.author?.avatarUrl,
        role: post.author?.badges?.[0],
        verified: post.author?.isVerified,
      },
      space: {
        id: spaceId ?? "",
        name: space.name,
        color: "var(--hive-brand-primary)",
      },
      content: {
        headline: post.type === "link" ? (post.content || "").split("\n")[0] : undefined,
        body: post.content,
        media: post.attachments?.map((a) => ({
          id: a.id,
          type: a.type as "image" | "video",
          url: a.url,
          thumbnailUrl: a.thumbnailUrl,
        })),
        tags: post.tags,
      },
      stats: {
        upvotes: post.engagement?.likes || 0,
        comments: post.engagement?.comments || 0,
        isUpvoted: Boolean(post.engagement?.hasLiked),
        isBookmarked: Boolean(post.engagement?.hasBookmarked),
      },
      meta: {
        timeAgo: formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }),
        isPinned: Boolean((post as Post & { isPinned?: boolean }).isPinned),
        isEdited: Boolean((post as Post & { isEdited?: boolean }).isEdited),
      },
    };
  };

  // Feed content renderer
  const feedContent = (
    <div className="space-y-4">
      {/* Composer trigger (members only) - prominent with gold accent */}
      {membership.isMember && (
        <motion.button
          whileHover={{ scale: 1.005, borderColor: "rgba(255, 215, 0, 0.3)" }}
          whileTap={{ scale: 0.995 }}
          onClick={() => setComposerOpen(true)}
          className="w-full rounded-xl border border-neutral-800/50 bg-neutral-900/80 backdrop-blur-sm px-4 py-3.5 text-left text-neutral-400 hover:text-neutral-200 hover:border-[#FFD700]/20 hover:bg-neutral-900 transition-all duration-200 group"
        >
          <span className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center group-hover:bg-[#FFD700]/10 transition-colors">
              <svg className="w-4 h-4 text-neutral-500 group-hover:text-[#FFD700] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </span>
            <span>Share something with the space...</span>
          </span>
        </motion.button>
      )}

      {/* Post list */}
      <AnimatePresence mode="popLayout">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ ...springPresets.snappy, delay: index * 0.03 }}
          >
            <FeedCardPost
              post={toCardData(post)}
              onOpen={() => handleOpenPost(post.id)}
              onSpaceClick={() => router.push(`/spaces/${spaceId}`)}
              onUpvote={(id) => likePost(id)}
              onComment={() => handleOpenPost(post.id)}
              onBookmark={(id) => bookmarkPost(id)}
              onShare={(id) => sharePost(id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Load more */}
      {hasMore && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isLoadingMore}
          onClick={loadMore}
          className="w-full rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3 text-sm text-neutral-400 hover:text-neutral-200 disabled:opacity-50 transition-colors"
        >
          {isLoadingMore ? "Loading..." : "Load more posts"}
        </motion.button>
      )}

      {/* Feed error */}
      {feedError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {feedError}
          <button onClick={refreshFeed} className="ml-3 underline">
            Retry
          </button>
        </div>
      )}

      {/* Empty state - enhanced with gold CTA */}
      {!feedLoading && posts.length === 0 && (
        <PostsEmptyState
          primary={membership.isMember}
          action={membership.isMember ? {
            label: "Create Post",
            onClick: () => setComposerOpen(true),
          } : undefined}
        />
      )}
    </div>
  );

  // Mobile inline sections for sidebar content
  const mobileInlineSections = (
    <MobileAboutSection
      description={space.description || "Leaders have not added a description yet."}
      memberCount={space.memberCount}
      isPublic={space.visibility === "public"}
      className="mb-4"
    />
  );

  return (
    <div className="min-h-screen bg-black">
      {/* Premium Header with integrated tabs - NO breadcrumb needed, tabs provide context */}
      <SpaceDetailHeader
        space={{
          id: spaceId ?? "",
          name: space.name,
          description: space.description,
          iconUrl: space.iconUrl,
          bannerUrl: space.bannerUrl,
          category: space.category,
          isVerified: space.isVerified,
          memberCount: space.memberCount,
          onlineCount: space.onlineCount,
        }}
        membershipState={membershipState}
        isLeader={membership.isLeader}
        tabs={tabItems}
        activeTabId={activeTabId ?? tabItems[0]?.id}
        onTabChange={setActiveTabId}
        onJoin={async () => { await joinSpace(); }}
        onLeave={async () => { await leaveSpace(); }}
        onShare={() => {
          // TODO: implement share modal
          navigator.clipboard.writeText(window.location.href);
        }}
        onSettings={
          membership.isLeader
            ? () => router.push(`/spaces/${spaceId}/settings`)
            : undefined
        }
        onAddTab={
          leaderActions
            ? () => setAddTabModalOpen(true)
            : undefined
        }
        showTabs={tabItems.length > 0}
      />

      {/* Dynamic content based on active tab - tight spacing under header */}
      <div className="py-4">
        <SpaceDynamicContent
          tabType={activeTab?.type ?? "feed"}
          tabId={activeTab?.id ?? "feed"}
          tabName={activeTab?.name}
          widgets={activeTabWidgets}
          isLeader={membership.isLeader}
          isEditMode={isWidgetEditMode}
          onToggleEditMode={() => setIsWidgetEditMode((prev) => !prev)}
          onWidgetReorder={
            leaderActions
              ? async (orderedIds) => {
                  // TODO: implement widget reorder via leaderActions
                }
              : undefined
          }
          onAddWidget={
            leaderActions
              ? () => setAddWidgetModalOpen(true)
              : undefined
          }
          onEditWidget={
            leaderActions
              ? (widgetId) => {
                  // TODO: implement edit widget modal
                }
              : undefined
          }
          onRemoveWidget={
            leaderActions
              ? async (widgetId) => {
                  await leaderActions.removeWidget(widgetId);
                }
              : undefined
          }
          sidebar={
            <SpaceSidebar
              data={sidebarData}
              callbacks={{
                onJoin: () => joinSpace(),
                onLeave: () => leaveSpace(),
                onToolClick: (toolId) => {
                  // Find the tool to get the deploymentId for efficient loading
                  const tool = tools.find((t) => t.id === toolId || t.toolId === toolId);
                  const actualToolId = tool?.toolId || toolId;
                  const deploymentId = tool?.deploymentId;
                  const url = deploymentId
                    ? `/tools/${actualToolId}/run?spaceId=${spaceId}&deploymentId=${deploymentId}`
                    : `/tools/${actualToolId}/run?spaceId=${spaceId}`;
                  router.push(url);
                },
                onViewAll: () => router.push(`/spaces/${spaceId}/tools`),
                onLeaderClick: (leaderId) => router.push(`/profile/${leaderId}`),
              }}
            />
          }
          mobileInlineSections={mobileInlineSections}
          feedContent={feedContent}
          isLoading={isStructureLoading || feedLoading}
        />
      </div>

      {/* Composer Modal */}
      {membership.isMember && spaceId && (
        <SpacePostComposer
          spaceId={spaceId}
          spaceName={space.name}
          spaceIcon={space.iconUrl}
          open={composerOpen}
          onOpenChange={setComposerOpen}
          onSubmit={async ({ content, media }) => {
            try {
              await createPost({
                content,
                type: "text",
                visibility: "space",
                spaceId,
                attachments: media,
              });
              setComposerOpen(false);
            } catch {
              // Handle error silently
            }
          }}
        />
      )}

      {/* Post Detail Modal */}
      <PostDetailModal
        open={postDetailOpen}
        onOpenChange={setPostDetailOpen}
        post={selectedPost ? toPostDetailData(selectedPost) : null}
        comments={postComments}
        isLoadingComments={isLoadingComments}
        onUpvote={(id) => likePost(id)}
        onBookmark={(id) => bookmarkPost(id)}
        onShare={(id) => sharePost(id)}
        onComment={handleSubmitComment}
        onSpaceClick={() => router.push(`/spaces/${spaceId}`)}
        onAuthorClick={(authorId) => router.push(`/profile/${authorId}`)}
      />

      {/* Add Tab Modal */}
      {leaderActions && (
        <AddTabModal
          open={addTabModalOpen}
          onOpenChange={setAddTabModalOpen}
          onSubmit={handleAddTab}
          existingTabNames={tabs.map((t) => t.name)}
        />
      )}

      {/* Add Widget Modal */}
      {leaderActions && (
        <AddWidgetModal
          open={addWidgetModalOpen}
          onOpenChange={setAddWidgetModalOpen}
          onSubmit={handleAddWidget}
        />
      )}

      {/* Error state */}
      {error && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96">
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 backdrop-blur-sm">
            {error}
            <button onClick={refresh} className="ml-3 underline">
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Page Component with Provider
// ============================================================

export default function SpaceBoardPage() {
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
      <SpaceDetailContent />
    </SpaceContextProvider>
  );
}
