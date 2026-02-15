"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { fetchWithAuth } from "@/hooks/use-admin-api";
import { Button, Badge, HiveCard as Card, CardContent, CardHeader, CardTitle } from "@hive/ui";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  FlagIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftIcon,
  UserIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

// Aliases
const ArrowLeft = ArrowLeftIcon;
const RefreshCw = ArrowPathIcon;
const Shield = ShieldCheckIcon;
const Flag = FlagIcon;
const AlertTriangle = ExclamationTriangleIcon;
const CheckCircle = CheckCircleIcon;
const XCircle = XCircleIcon;
const MessageSquare = ChatBubbleLeftIcon;
const User = UserIcon;
const Clock = ClockIcon;

interface ModerationReport {
  id: string;
  type: 'message' | 'user' | 'content';
  targetId: string;
  targetPreview: string;
  reportedById: string;
  reportedByName: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
}

interface SpaceInfo {
  id: string;
  name: string;
}

export default function SpaceModerationPage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = use(params);
  const [space, setSpace] = useState<SpaceInfo | null>(null);
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch space info
      const spaceResponse = await fetchWithAuth(`/api/admin/spaces/${spaceId}`, {
      });

      if (spaceResponse.ok) {
        const data = await spaceResponse.json();
        const spaceData = data.data?.space || data.space;
        setSpace({ id: spaceData.id, name: spaceData.name });
      }

      // Fetch moderation reports
      const reportsResponse = await fetchWithAuth(`/api/admin/spaces/${spaceId}/moderation?status=${statusFilter}`, {
      });

      if (reportsResponse.ok) {
        const data = await reportsResponse.json();
        setReports(data.data?.reports || data.reports || []);
      } else {
        // Use empty array if endpoint doesn't exist
        setReports([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [spaceId, statusFilter]);

  const handleResolve = async (reportId: string, action: 'resolve' | 'dismiss', resolution?: string) => {
    setActionLoading(reportId);
    try {
      const response = await fetchWithAuth(`/api/admin/moderation/reports/${reportId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, resolution }),
      });

      if (!response.ok) {
        throw new Error('Failed to process report');
      }

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process report');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="h-4 w-4" />;
      case 'user': return <User className="h-4 w-4" />;
      default: return <Flag className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400">Pending</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500/20 text-green-400">Resolved</Badge>;
      case 'dismissed':
        return <Badge className="bg-white/[0.08] text-white/50">Dismissed</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/spaces" className="text-white/50 hover:text-white">
          Spaces
        </Link>
        <span className="text-white/30">/</span>
        <Link href={`/spaces/${spaceId}`} className="text-white/50 hover:text-white">
          {space?.name || 'Space'}
        </Link>
        <span className="text-white/30">/</span>
        <span className="text-white">Moderation</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-amber-400" />
          <div>
            <h2 className="text-xl font-semibold text-white">Moderation Queue</h2>
            <p className="text-white/50 text-sm">{space?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center bg-white/5 rounded-lg p-1">
            {(['pending', 'resolved', 'all'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors capitalize ${
                  statusFilter === status
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <Button
            onClick={fetchData}
            disabled={loading}
            variant="outline"
            className="border-white/[0.12] text-white/70"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Reports List */}
      <Card className="border-white/[0.08] bg-[#141414]">
        <CardHeader>
          <CardTitle className="text-white">
            Reports ({reports.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-400/30 mx-auto mb-3" />
              <p className="text-white/50">
                {statusFilter === 'pending' ? 'No pending reports' : 'No reports found'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map(report => (
                <div
                  key={report.id}
                  className={`p-4 rounded-lg border ${
                    report.status === 'pending'
                      ? 'bg-yellow-500/5 border-yellow-500/20'
                      : 'bg-white/[0.02] border-white/[0.08]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-1.5 rounded ${report.status === 'pending' ? 'bg-yellow-500/20' : 'bg-white/[0.08]'}`}>
                          {getTypeIcon(report.type)}
                        </div>
                        <span className="text-white font-medium capitalize">{report.type} Report</span>
                        {getStatusBadge(report.status)}
                      </div>

                      <div className="bg-white/[0.02] p-3 rounded-lg mb-3">
                        <p className="text-white/70 text-sm">{report.targetPreview}</p>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-white/40">
                        <span>Reported by: {report.reportedByName}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-white/50 mt-2">
                        <span className="text-white/30">Reason:</span> {report.reason}
                      </p>

                      {report.resolution && (
                        <p className="text-white/50 mt-2">
                          <span className="text-white/30">Resolution:</span> {report.resolution}
                        </p>
                      )}
                    </div>

                    {report.status === 'pending' && (
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => handleResolve(report.id, 'resolve', 'Content removed')}
                          disabled={actionLoading === report.id}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {actionLoading === report.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolve
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleResolve(report.id, 'dismiss', 'No action needed')}
                          disabled={actionLoading === report.id}
                          size="sm"
                          variant="outline"
                          className="border-white/[0.12] text-white/70"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back Link */}
      <Link
        href={`/spaces/${spaceId}`}
        className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Space Detail
      </Link>
    </div>
  );
}
