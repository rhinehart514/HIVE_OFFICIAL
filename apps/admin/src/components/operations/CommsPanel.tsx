"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  HiveCard as Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Switch,
} from "@hive/ui";
import { motion, AnimatePresence } from "framer-motion";
import {
  MegaphoneIcon,
  PaperAirplaneIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  UserGroupIcon,
  BuildingLibraryIcon,
  UsersIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

// ============================================================================
// Types
// ============================================================================

interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: 'all' | 'builders' | 'admins' | 'space_members';
  targetSpaceId?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  scheduledFor?: string;
  sentAt?: string;
  createdAt: string;
  createdBy: string;
  recipientCount?: number;
}

type AudienceType = 'all' | 'builders' | 'admins' | 'space_members';

// ============================================================================
// Component
// ============================================================================

export function CommsPanel() {
  // Announcements list
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);

  // Composer state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<AudienceType>("all");
  const [targetSpaceId, setTargetSpaceId] = useState("");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch announcements
  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/announcements", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.data?.announcements || data.announcements || []);
      }
    } catch {
      // Silent fail - announcements are not critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Send announcement
  const sendAnnouncement = async () => {
    if (!title.trim() || !body.trim()) {
      setError("Title and body are required");
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        body: body.trim(),
        audience,
      };

      if (audience === 'space_members' && targetSpaceId) {
        payload.targetSpaceId = targetSpaceId;
      }

      if (scheduleEnabled && scheduledDate && scheduledTime) {
        payload.scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      }

      const response = await fetch("/api/admin/announcements", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Failed to send announcement");
      }

      const result = await response.json();
      setSuccess(scheduleEnabled ? "Announcement scheduled!" : "Announcement sent!");

      // Clear form
      setTitle("");
      setBody("");
      setAudience("all");
      setTargetSpaceId("");
      setScheduleEnabled(false);
      setScheduledDate("");
      setScheduledTime("");

      // Refresh list
      await fetchAnnouncements();

      // Clear success after 3s
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  // Get audience icon
  const getAudienceIcon = (aud: AudienceType) => {
    switch (aud) {
      case 'all':
        return <UsersIcon className="h-4 w-4" />;
      case 'builders':
        return <BuildingLibraryIcon className="h-4 w-4" />;
      case 'admins':
        return <UserGroupIcon className="h-4 w-4" />;
      case 'space_members':
        return <UserGroupIcon className="h-4 w-4" />;
      default:
        return <UsersIcon className="h-4 w-4" />;
    }
  };

  // Get status badge
  const getStatusBadge = (status: Announcement['status']) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Sent</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Scheduled</Badge>;
      case 'draft':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Draft</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
      default:
        return null;
    }
  };

  // Format time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Composer */}
      <Card className="border-white/10 bg-[#141414]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MegaphoneIcon className="h-5 w-5 text-[#FFD700]" />
            New Announcement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#A1A1A6]">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
              className="bg-[#0A0A0A] border-white/10 text-white"
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#A1A1A6]">Message</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your announcement... (Markdown supported)"
              className="bg-[#0A0A0A] border-white/10 text-white min-h-[120px]"
            />
          </div>

          {/* Audience */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#A1A1A6]">Audience</label>
              <Select value={audience} onValueChange={(v) => setAudience(v as AudienceType)}>
                <SelectTrigger className="bg-[#0A0A0A] border-white/10 text-white">
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent className="bg-[#141414] border-white/10">
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="builders">Builders Only</SelectItem>
                  <SelectItem value="admins">Admins Only</SelectItem>
                  <SelectItem value="space_members">Space Members</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Space selector (shown when audience is space_members) */}
            {audience === 'space_members' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#A1A1A6]">Space ID</label>
                <Input
                  value={targetSpaceId}
                  onChange={(e) => setTargetSpaceId(e.target.value)}
                  placeholder="Enter space ID"
                  className="bg-[#0A0A0A] border-white/10 text-white"
                />
              </div>
            )}
          </div>

          {/* Schedule toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-[#A1A1A6]" />
              <span className="text-sm text-[#A1A1A6]">Schedule for later</span>
            </div>
            <Switch
              checked={scheduleEnabled}
              onCheckedChange={setScheduleEnabled}
            />
          </div>

          {/* Schedule inputs */}
          <AnimatePresence>
            {scheduleEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 gap-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#A1A1A6]">Date</label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="bg-[#0A0A0A] border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#A1A1A6]">Time</label>
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="bg-[#0A0A0A] border-white/10 text-white"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error/Success */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400"
              >
                <XMarkIcon className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400"
              >
                <CheckCircleIcon className="h-4 w-4" />
                <span className="text-sm">{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Send button */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={sendAnnouncement}
              disabled={sending || !title.trim() || !body.trim()}
              className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black gap-2"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-black/20 border-t-black" />
                  Sending...
                </>
              ) : scheduleEnabled ? (
                <>
                  <ClockIcon className="h-4 w-4" />
                  Schedule
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-4 w-4" />
                  Send Now
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Past Announcements */}
      <Card className="border-white/10 bg-[#141414]">
        <CardHeader>
          <CardTitle className="text-white text-sm font-medium">
            Past Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/20 border-t-[#FFD700]" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8 text-[#A1A1A6]">
              <MegaphoneIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No announcements yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="p-4 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-white truncate">{announcement.title}</h4>
                        {getStatusBadge(announcement.status)}
                      </div>
                      <p className="text-sm text-[#818187] line-clamp-2">{announcement.body}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-[#636366]">
                        <span className="flex items-center gap-1">
                          {getAudienceIcon(announcement.audience)}
                          {announcement.audience === 'all' ? 'All Users' :
                           announcement.audience === 'builders' ? 'Builders' :
                           announcement.audience === 'admins' ? 'Admins' : 'Space Members'}
                        </span>
                        {announcement.sentAt && (
                          <span className="flex items-center gap-1">
                            <CheckCircleIcon className="h-3 w-3" />
                            {formatTime(announcement.sentAt)}
                          </span>
                        )}
                        {announcement.scheduledFor && announcement.status === 'scheduled' && (
                          <span className="flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            {formatTime(announcement.scheduledFor)}
                          </span>
                        )}
                        {announcement.recipientCount !== undefined && (
                          <span>{announcement.recipientCount} recipients</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
