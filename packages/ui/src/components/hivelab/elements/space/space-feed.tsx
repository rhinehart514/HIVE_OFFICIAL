'use client';

/**
 * SpaceFeed Element (Space Tier)
 *
 * Display recent posts from a specific space.
 * Requires: spaceId context (leaders only).
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { Card, CardContent } from '../../../../design-system/primitives';
import type { ElementProps } from '../../../../lib/hivelab/element-system';

interface Post {
  id: string;
  content: string;
  authorName: string;
  authorPhoto?: string;
  timeAgo: string;
  likes?: number;
  comments?: number;
}

export function SpaceFeedElement({ config, data, context, onChange, onAction }: ElementProps) {
  const [posts, setPosts] = useState<Post[]>(data?.posts || []);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const maxPosts = config.maxPosts || 5;

  useEffect(() => {
    if (!context?.spaceId) return;

    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/spaces/${context.spaceId}/posts?limit=${maxPosts}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const result = await response.json();
          const postData = (result.posts || []).map((p: Record<string, unknown>) => {
            const createdAt = p.createdAt ? new Date(p.createdAt as string) : new Date();
            const now = new Date();
            const diffMs = now.getTime() - createdAt.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHrs = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHrs / 24);
            let timeAgo = 'just now';
            if (diffDays > 0) timeAgo = `${diffDays}d ago`;
            else if (diffHrs > 0) timeAgo = `${diffHrs}h ago`;
            else if (diffMins > 0) timeAgo = `${diffMins}m ago`;

            const author = p.author as Record<string, unknown> | undefined;
            const reactions = p.reactions as Record<string, number> | undefined;

            return {
              id: p.id as string,
              content: (p.content || p.text || '') as string,
              authorName: (p.authorName || author?.name || 'Unknown') as string,
              authorPhoto: (p.authorPhoto || author?.avatarUrl) as string | undefined,
              timeAgo,
              likes: (reactions?.likes || p.likeCount || 0) as number,
              comments: (reactions?.comments || p.commentCount || 0) as number,
            };
          });
          setPosts(postData);
          onChange?.({ posts: postData, feed: postData });
        }
      } catch (err) {
        console.error('Failed to fetch posts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [context?.spaceId, maxPosts]);

  if (!context?.spaceId) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          <DocumentTextIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>Space Feed requires space context</p>
          <p className="text-xs mt-1">Deploy to a space to see posts</p>
        </CardContent>
      </Card>
    );
  }

  const handlePostClick = (post: Post) => {
    setSelectedPost(post.id);
    onChange?.({ selectedPost: post, posts, feed: posts });
    onAction?.('select', { selectedPost: post, posts, feed: posts });
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Recent Posts</span>
        </div>

        {isLoading ? (
          <div className="py-4 animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 rounded-full bg-muted" />
                  <div className="h-3 w-20 bg-muted rounded" />
                </div>
                <div className="h-4 bg-muted rounded w-full mb-1" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <DocumentTextIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No posts yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.slice(0, maxPosts).map((post, index) => (
              <div
                key={post.id || index}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedPost === post.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                }`}
                onClick={() => handlePostClick(post)}
              >
                <div className="flex items-center gap-2 mb-2">
                  {post.authorPhoto && (
                    <img src={post.authorPhoto} alt="" className="h-6 w-6 rounded-full" />
                  )}
                  <span className="text-xs font-medium">{post.authorName || 'Unknown'}</span>
                  <span className="text-xs text-muted-foreground">{post.timeAgo}</span>
                </div>
                <p className="text-sm line-clamp-2">{post.content}</p>
                {config.showEngagement && (
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{post.likes || 0} likes</span>
                    <span>{post.comments || 0} comments</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
