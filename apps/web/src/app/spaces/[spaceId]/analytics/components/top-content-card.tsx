"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  FireIcon,
  HeartIcon,
  ChatBubbleOvalLeftIcon,
} from "@heroicons/react/24/outline";
import { Card, cn } from "@hive/ui";

export interface TopContentItem {
  id: string;
  content: string;
  authorId: string;
  authorName?: string;
  likes: number;
  comments: number;
  engagement: number;
  createdAt: string;
  type: string;
}

export interface TopContentCardProps {
  content?: TopContentItem[];
}

export function TopContentCard({ content }: TopContentCardProps) {
  if (!content || content.length === 0) {
    return (
      <Card className="p-5 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
        <div className="flex items-center gap-3 mb-4">
          <FireIcon className="h-5 w-5 text-orange-400" />
          <h3 className="text-sm font-semibold text-white">Top Content</h3>
        </div>
        <p className="text-sm text-neutral-500 text-center py-4">
          No engaging content yet this period
        </p>
      </Card>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Card className="p-5 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-orange-400/20 flex items-center justify-center">
          <FireIcon className="h-4 w-4 text-orange-400" />
        </div>
        <h3 className="text-sm font-semibold text-white">
          Most Engaged Content
        </h3>
      </div>
      <div className="space-y-3">
        {content.slice(0, 5).map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-3 rounded-lg bg-white/5 border border-white/5"
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                  index === 0
                    ? "bg-orange-400 text-black"
                    : index === 1
                      ? "bg-orange-400/70 text-black"
                      : "bg-neutral-700 text-neutral-300"
                )}
              >
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white line-clamp-2 mb-2">
                  {post.content || "(No text content)"}
                </p>
                <div className="flex items-center gap-4 text-xs text-neutral-400">
                  <span className="flex items-center gap-1">
                    <HeartIcon className="h-3 w-3 text-red-400" />
                    {post.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <ChatBubbleOvalLeftIcon className="h-3 w-3 text-blue-400" />
                    {post.comments}
                  </span>
                  <span>{formatDate(post.createdAt)}</span>
                  {post.authorName && (
                    <span className="text-neutral-500">by {post.authorName}</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
