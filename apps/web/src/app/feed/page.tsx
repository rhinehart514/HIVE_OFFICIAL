"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ComingSoon } from "@hive/ui";

// Feed Icon
const FeedIcon = () => (
  <svg
    className="h-10 w-10 text-[var(--hive-brand-primary)]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z"
    />
  </svg>
);

export default function FeedPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--hive-background-primary)]">
      <ComingSoon
        title="Your Feed"
        description="A personalized stream of posts, events, and updates from your campus communities. We're putting the finishing touches on this experience."
        icon={<FeedIcon />}
        primaryActionLabel="Explore Spaces"
        onPrimaryAction={() => router.push("/spaces")}
        secondaryActionLabel="View Events"
        onSecondaryAction={() => router.push("/events")}
      />
    </div>
  );
}
