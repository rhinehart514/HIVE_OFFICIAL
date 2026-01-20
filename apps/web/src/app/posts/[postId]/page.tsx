"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card } from "@hive/ui";
import { SimpleAvatar } from "@hive/ui/design-system/primitives";
import {
  HeartIcon,
  ChatBubbleOvalLeftIcon,
  ArrowPathRoundedSquareIcon,
  BookmarkIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolidIcon,
  BookmarkIcon as BookmarkSolidIcon,
} from "@heroicons/react/24/solid";
import { useAuth } from "@hive/auth-logic";
import { useToast } from "@/hooks/use-toast";

interface PostAuthor {
  id: string;
  name: string;
  handle?: string;
  avatar?: string;
}

interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  content: string;
  createdAt: string;
  likes: number;
  hasLiked: boolean;
}

interface Post {
  id: string;
  content: string;
  title?: string;
  authorId: string;
  authorName?: string;
  authorHandle?: string;
  authorAvatar?: string;
  createdAt: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  isLiked?: boolean;
  isBookmarked?: boolean;
  space?: {
    id: string;
    name: string;
  };
}

function formatRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = params.postId as string;
  const shouldFocusComment = searchParams.get("comment") === "true";

  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch post data
  useEffect(() => {
    async function fetchPost() {
      try {
        // For now, fetch from feed and find the post
        // In production, you'd have a dedicated endpoint
        const feedResponse = await fetch(`/api/posts?limit=50`, {
          credentials: "include",
        });
        if (feedResponse.ok) {
          const data = await feedResponse.json();
          const foundPost = data.posts?.find((p: Post) => p.id === postId);
          if (foundPost) {
            setPost(foundPost);
          }
        }
      } catch {
        // Failed to fetch post
      }
    }
    fetchPost();
  }, [postId]);

  // Fetch comments
  useEffect(() => {
    async function fetchComments() {
      try {
        const response = await fetch(`/api/posts/${postId}/comments`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setComments(data.comments || []);
        }
      } catch {
        // Failed to fetch comments
      } finally {
        setIsLoading(false);
      }
    }
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  // Focus comment input if ?comment=true
  useEffect(() => {
    if (shouldFocusComment && commentInputRef.current && !isLoading) {
      commentInputRef.current.focus();
    }
  }, [shouldFocusComment, isLoading]);

  // Handle like
  const handleLike = async () => {
    if (!post) return;

    setPost((prev) =>
      prev
        ? {
            ...prev,
            isLiked: !prev.isLiked,
            engagement: {
              ...prev.engagement,
              likes: prev.isLiked
                ? prev.engagement.likes - 1
                : prev.engagement.likes + 1,
            },
          }
        : null
    );

    try {
      await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Revert on error
      setPost((prev) =>
        prev
          ? {
              ...prev,
              isLiked: !prev.isLiked,
              engagement: {
                ...prev.engagement,
                likes: prev.isLiked
                  ? prev.engagement.likes - 1
                  : prev.engagement.likes + 1,
              },
            }
          : null
      );
      toast.error("Error", "Failed to like post");
    }
  };

  // Handle bookmark
  const handleBookmark = async () => {
    if (!post) return;

    setPost((prev) =>
      prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null
    );

    try {
      await fetch(`/api/posts/${postId}/bookmark`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      setPost((prev) =>
        prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null
      );
      toast.error("Error", "Failed to bookmark post");
    }
  };

  // Handle share
  const handleShare = async () => {
    const url = `${window.location.origin}/posts/${postId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied", "Post link copied to clipboard");
    } catch {
      toast.error("Error", "Failed to copy link");
    }
  };

  // Handle comment submission
  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to post comment");
      }

      const comment = await response.json();
      setComments((prev) => [...prev, comment]);
      setNewComment("");

      // Update comment count on post
      if (post) {
        setPost({
          ...post,
          engagement: {
            ...post.engagement,
            comments: post.engagement.comments + 1,
          },
        });
      }

      toast.success("Comment posted");
    } catch {
      toast.error("Error", "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-ground">
        <div className="max-w-2xl mx-auto px-6 py-10">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 animate-pulse">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/[0.06]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-white/[0.06] rounded" />
                <div className="h-3 w-24 bg-white/[0.06] rounded" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-white/[0.06] rounded" />
              <div className="h-4 w-4/5 bg-white/[0.06] rounded" />
              <div className="h-4 w-3/5 bg-white/[0.06] rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ground">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-white/[0.02] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 text-white/60" />
            </button>
            <h1 className="text-lg font-semibold text-white">Post</h1>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-6 py-6">
        {post ? (
          <article className="bg-white/[0.02] border border-white/[0.06] rounded-2xl">
            {/* Post content */}
            <div className="p-6">
              {/* Author */}
              <div className="flex items-start gap-3 mb-4">
                <SimpleAvatar
                  src={post.authorAvatar}
                  fallback={post.authorName?.slice(0, 2).toUpperCase() || "U"}
                  size="lg"
                  onClick={() => router.push(`/profile/${post.authorId}`)}
                  className="cursor-pointer flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/${post.authorId}`}
                      className="font-semibold text-white hover:underline"
                    >
                      {post.authorName || "HIVE User"}
                    </Link>
                    {post.authorHandle && (
                      <span className="text-white/40">@{post.authorHandle}</span>
                    )}
                  </div>
                  <p className="text-sm text-white/50">
                    {formatRelativeTime(post.createdAt)}
                    {post.space && (
                      <>
                        {" · "}
                        <Link
                          href={`/spaces/${post.space.id}`}
                          className="hover:text-white/70"
                        >
                          {post.space.name}
                        </Link>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Content */}
              {post.title && (
                <h2 className="text-xl font-semibold text-white mb-2">
                  {post.title}
                </h2>
              )}
              <p className="text-white/80 whitespace-pre-wrap leading-relaxed text-base">
                {post.content}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-6 pt-4 mt-4 border-t border-white/[0.06]">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 transition-colors ${
                    post.isLiked
                      ? "text-red-500"
                      : "text-white/40 hover:text-red-500"
                  }`}
                >
                  {post.isLiked ? (
                    <HeartSolidIcon className="h-5 w-5" />
                  ) : (
                    <HeartIcon className="h-5 w-5" />
                  )}
                  <span className="text-sm">{post.engagement.likes}</span>
                </button>

                <button className="flex items-center gap-2 text-white/40">
                  <ChatBubbleOvalLeftIcon className="h-5 w-5" />
                  <span className="text-sm">{post.engagement.comments}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 text-white/40 hover:text-green-400 transition-colors"
                >
                  <ArrowPathRoundedSquareIcon className="h-5 w-5" />
                  <span className="text-sm">{post.engagement.shares}</span>
                </button>

                <button
                  onClick={handleBookmark}
                  className={`ml-auto transition-colors ${
                    post.isBookmarked
                      ? "text-life-gold"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  {post.isBookmarked ? (
                    <BookmarkSolidIcon className="h-5 w-5" />
                  ) : (
                    <BookmarkIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Comment input */}
            <div className="border-t border-white/[0.06] p-4">
              <div className="flex gap-3">
                <SimpleAvatar
                  src={user?.photoURL || undefined}
                  fallback={user?.displayName?.slice(0, 2).toUpperCase() || "U"}
                  size="default"
                  className="flex-shrink-0"
                />
                <div className="flex-1 flex items-end gap-2">
                  <textarea
                    ref={commentInputRef}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleSubmitComment();
                      }
                    }}
                    placeholder="Write a comment..."
                    className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-white placeholder:text-white/40 resize-none focus:outline-none focus:ring-1 focus:ring-white/20 min-h-[48px] max-h-[200px]"
                    rows={1}
                  />
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || isSubmitting}
                    size="sm"
                    className="bg-life-gold text-ground hover:bg-life-gold/90 disabled:opacity-50"
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="border-t border-white/[0.06]">
              {comments.length > 0 ? (
                <div className="divide-y divide-white/[0.04]">
                  {comments.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4"
                    >
                      <div className="flex gap-3">
                        <SimpleAvatar
                          src={comment.author.avatarUrl}
                          fallback={comment.author.name
                            .slice(0, 2)
                            .toUpperCase()}
                          size="sm"
                          onClick={() =>
                            router.push(`/profile/${comment.author.id}`)
                          }
                          className="cursor-pointer flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/profile/${comment.author.id}`}
                              className="font-medium text-sm text-white hover:underline"
                            >
                              {comment.author.name}
                            </Link>
                            <span className="text-xs text-white/40">
                              {formatRelativeTime(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-white/80 mt-1 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <ChatBubbleOvalLeftIcon className="h-10 w-10 text-white/20 mx-auto mb-3" />
                  <p className="text-sm text-white/40">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                </div>
              )}
            </div>
          </article>
        ) : (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 text-center">
            <p className="text-white/50">Post not found</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/feed")}
              className="mt-4"
            >
              Back to Feed
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
