'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  X,
  Clock,
  User,
  Building,
  FileText,
  Loader2,
  ChevronLeft,
  RefreshCw,
} from 'lucide-react';

interface BuilderRequest {
  id: string;
  spaceId: string;
  spaceName: string;
  spaceType: string;
  userId: string;
  userName: string;
  userEmail: string;
  motivation: string;
  experience: string;
  plans: string;
  timeCommitment: string;
  status: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewNotes: string | null;
}

export default function BuilderRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<BuilderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/builder-requests?status=pending&limit=50', {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch requests');
      }

      const data = await res.json();
      setRequests(data.requests || []);
      setPendingCount(data.summary?.pending || 0);
    } catch (_error) {
      // Load requests failed - UI will show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingId(requestId);
      const res = await fetch('/api/admin/builder-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          requestId,
          action,
          notes: reviewNotes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to process request');
      }

      // Remove from list
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setPendingCount((prev) => Math.max(0, prev - 1));
      setExpandedId(null);
      setReviewNotes('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to process request');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#0F0F0F] to-[#1A1A1A] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#0F0F0F] to-[#1A1A1A]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 -ml-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Builder Requests</h1>
                <p className="text-sm text-white/60">
                  {pendingCount} pending {pendingCount === 1 ? 'request' : 'requests'}
                </p>
              </div>
            </div>

            <button
              onClick={loadRequests}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {requests.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">No pending requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
              >
                {/* Summary row */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-white/60" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{request.userName}</span>
                        <span className="text-white/40">wants to lead</span>
                        <span className="font-medium text-white">{request.spaceName}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-white/40">
                        <span>{request.userEmail}</span>
                        <span>·</span>
                        <span>{request.timeCommitment}</span>
                        <span>·</span>
                        <span>{formatDate(request.submittedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                      className="px-3 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      {expandedId === request.id ? 'Hide Details' : 'View Details'}
                    </button>
                    <button
                      onClick={() => handleAction(request.id, 'reject')}
                      disabled={processingId === request.id}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                      {processingId === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleAction(request.id, 'approve')}
                      disabled={processingId === request.id}
                      className="p-2 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                    >
                      {processingId === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {expandedId === request.id && (
                  <div className="border-t border-white/10 p-4 space-y-4 bg-black/20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2">
                          <FileText className="h-4 w-4" />
                          Motivation
                        </div>
                        <p className="text-sm text-white/80 whitespace-pre-wrap">
                          {request.motivation}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2">
                          <User className="h-4 w-4" />
                          Experience
                        </div>
                        <p className="text-sm text-white/80 whitespace-pre-wrap">
                          {request.experience}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2">
                          <Building className="h-4 w-4" />
                          Plans
                        </div>
                        <p className="text-sm text-white/80 whitespace-pre-wrap">{request.plans}</p>
                      </div>
                    </div>

                    {/* Review notes */}
                    <div>
                      <label className="block text-sm font-medium text-white/60 mb-2">
                        Review Notes (optional)
                      </label>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Add notes about your decision..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 min-h-[80px] resize-none"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => handleAction(request.id, 'reject')}
                        disabled={processingId === request.id}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleAction(request.id, 'approve')}
                        disabled={processingId === request.id}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-black bg-white hover:bg-white/90 transition-colors disabled:opacity-50"
                      >
                        Approve as Admin
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
