'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Shell, PageHeader, Card, Button, Badge } from '@hive/ui';
import {
  Bell,
  Heart,
  MessageCircle,
  Users,
  Settings,
  CheckCheck,
  Trash2,
} from 'lucide-react';

export default function NotificationsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary">
      <Shell size="md" noVerticalPadding>
        <PageHeader
          title="Notifications"
          sticky
          bordered
          eyebrow={
            <Badge variant="secondary" className="bg-brand-primary text-black">
              3 new
            </Badge>
          }
          action={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark all read
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          }
        />

        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
          {['All', 'Mentions', 'Likes', 'Follows', 'Events'].map((tab, i) => (
            <button
              key={tab}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                i === 0
                  ? 'bg-brand-primary text-black'
                  : 'bg-background-secondary text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Notification list */}
        <div className="space-y-3 pb-8">
          {/* Unread notification */}
          <Card className="p-4 bg-background-secondary border-border-default border-l-4 border-l-brand-primary">
            <div className="flex items-start gap-4">
              <Heart className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-text-primary font-medium">
                  <span className="text-brand-primary">@sarah</span> liked your post
                </p>
                <p className="text-text-secondary text-sm mt-1 truncate">
                  "Just finished my first week at UB! The campus is amazing..."
                </p>
                <p className="text-text-tertiary text-xs mt-2">2 minutes ago</p>
              </div>
              <Button variant="ghost" size="sm" className="shrink-0">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          {/* Comment notification */}
          <Card className="p-4 bg-background-secondary border-border-default">
            <div className="flex items-start gap-4">
              <MessageCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-text-primary font-medium">
                  <span className="text-brand-primary">@mike</span> commented on your post
                </p>
                <p className="text-text-secondary text-sm mt-1 truncate">
                  "Welcome to UB! Let me know if you need help finding anything"
                </p>
                <p className="text-text-tertiary text-xs mt-2">5 minutes ago</p>
              </div>
              <Button variant="ghost" size="sm" className="shrink-0">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          {/* Follow notification */}
          <Card className="p-4 bg-background-secondary border-border-default">
            <div className="flex items-start gap-4">
              <Users className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-text-primary font-medium">
                  <span className="text-brand-primary">@alex</span> started following you
                </p>
                <p className="text-text-tertiary text-xs mt-2">1 hour ago</p>
              </div>
              <Button variant="ghost" size="sm" className="shrink-0">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          {/* Empty state */}
          <Card className="p-8 text-center bg-background-secondary border-border-default">
            <Bell className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
            <h3 className="text-base font-semibold text-text-primary mb-1">All caught up!</h3>
            <p className="text-sm text-text-secondary">
              You're up to date with your notifications
            </p>
          </Card>
        </div>
      </Shell>
    </div>
  );
}
