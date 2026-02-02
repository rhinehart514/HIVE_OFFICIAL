"use client";

import { motion } from "framer-motion";
import { useModerationAppeals } from "@/hooks/use-moderation-appeals";
import {
  Button,
  HiveCard as Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from "@hive/ui";
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

export default function ModerationAppealsPage() {
  const {
    appeals,
    loading,
    error,
    actionLoading,
    refresh,
    decideAppeal,
    clearError,
  } = useModerationAppeals();

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-white/10 bg-[#141414]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5 text-blue-400" />
              Pending Appeals
              <span className="text-sm font-normal text-[#A1A1A6]">
                ({appeals.length})
              </span>
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={refresh}
              disabled={loading}
              className="text-[#A1A1A6] hover:text-white"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400"
        >
          <ExclamationTriangleIcon className="h-4 w-4" />
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearError}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <XCircleIcon className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-[#FFD700]" />
        </div>
      )}

      {/* Empty State */}
      {!loading && appeals.length === 0 && (
        <Card className="border-white/10 bg-[#141414]">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShieldCheckIcon className="h-12 w-12 text-blue-400 mb-4" />
            <p className="text-lg font-medium text-white">No Pending Appeals</p>
            <p className="text-sm text-[#A1A1A6]">All appeals have been reviewed</p>
          </CardContent>
        </Card>
      )}

      {/* Appeals List */}
      {!loading && appeals.map((appeal) => (
        <motion.div
          key={appeal.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-white/10 bg-[#141414]">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <ShieldCheckIcon className="h-5 w-5 text-blue-400" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      {appeal.type.replace("_", " ")}
                    </Badge>
                    <span className="text-sm text-[#A1A1A6]">by {appeal.userName || "User"}</span>
                    <span className="text-xs text-[#818187]">{timeAgo(appeal.createdAt)}</span>
                  </div>

                  <p className="text-white">{appeal.appealReason}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => decideAppeal(appeal.id, "approve", "Appeal approved by admin")}
                    disabled={actionLoading}
                    className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => decideAppeal(appeal.id, "deny", "Appeal denied by admin")}
                    disabled={actionLoading}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <XCircleIcon className="h-4 w-4 mr-1" />
                    Deny
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
