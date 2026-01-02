"use client";

/**
 * ClaimsQueue - Admin component for managing leader space claims
 *
 * Shows pending claims from leaders trying to claim pre-seeded spaces.
 * Admins can approve (verify claim + optionally go live) or reject.
 *
 * Uses /api/admin/claims endpoint
 */

import { useState, useEffect, useCallback } from "react";
import { Button, Badge, HiveCard as Card, CardContent, CardHeader, CardTitle } from "@hive/ui";
import { useAdminAuth } from "@/lib/auth";
import {
  Crown,
  Check,
  X,
  Clock,
  RefreshCw,
  ExternalLink,
  Mail,
  FileText,
  Users,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface ClaimRequest {
  id: string;
  type: 'claim';
  spaceId: string;
  spaceName: string;
  spaceCategory: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  proofType: 'email' | 'document' | 'social' | 'referral' | 'none';
  proofUrl?: string;
  provisionalAccessGranted: boolean;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  expiresAt?: string;
}

interface ClaimsSummary {
  pending: number;
  showing: number;
  avgVerificationTimeHours: number;
}

export function ClaimsQueue() {
  const { admin } = useAdminAuth();
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [summary, setSummary] = useState<ClaimsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [notes, setNotes] = useState<Record<string, string>>({});

  const fetchClaims = useCallback(async () => {
    if (!admin) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/claims?status=${statusFilter}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${admin.id}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch claims');
      }

      const data = await response.json();
      setClaims(data.data?.claims || data.claims || []);
      setSummary(data.data?.summary || data.summary || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load claims');
    } finally {
      setLoading(false);
    }
  }, [admin, statusFilter]);

  const handleClaim = async (claimId: string, action: 'approve' | 'reject', goLive: boolean = true) => {
    if (!admin) return;

    setProcessingId(claimId);
    setError(null);

    try {
      const response = await fetch('/api/admin/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${admin.id}`,
        },
        body: JSON.stringify({
          claimId,
          action,
          notes: notes[claimId] || undefined,
          goLive,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${action} claim`);
      }

      // Refresh claims after action
      await fetchClaims();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} claim`);
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    fetchClaims();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchClaims, 30000);
    return () => clearInterval(interval);
  }, [fetchClaims]);

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    }
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getProofIcon = (proofType: ClaimRequest['proofType']) => {
    switch (proofType) {
      case 'email': return <Mail className="w-3.5 h-3.5" />;
      case 'document': return <FileText className="w-3.5 h-3.5" />;
      case 'social': return <Users className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  if (loading && claims.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
        <span className="text-gray-400">Loading claims...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span>Error: {error}</span>
        </div>
        <Button onClick={fetchClaims} variant="outline" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FFD700]/10 flex items-center justify-center">
            <Crown className="w-5 h-5 text-[#FFD700]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Leader Claims</h2>
            <p className="text-sm text-gray-400">
              {summary?.pending || 0} pending · Avg verification: {summary?.avgVerificationTimeHours || 0}h
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center bg-white/5 rounded-lg p-1">
            {(['pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  statusFilter === status
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <Button
            onClick={fetchClaims}
            disabled={loading}
            variant="ghost"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Claims list */}
      {claims.length === 0 ? (
        <Card className="border-white/10 bg-[#141414]">
          <CardContent className="py-12 text-center">
            <Crown className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">
              No {statusFilter} claims
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => (
            <Card key={claim.id} className="border-white/10 bg-[#141414]">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Space info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-white truncate">
                        {claim.spaceName}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {claim.spaceCategory}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span>@{claim.userName}</span>
                      <span>·</span>
                      <span>{claim.role}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeAgo(claim.submittedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Proof indicator */}
                  {claim.proofType !== 'none' && (
                    <div className="flex items-center gap-2">
                      {getProofIcon(claim.proofType)}
                      {claim.proofUrl ? (
                        <a
                          href={claim.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          View proof
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-sm text-gray-500">
                          {claim.proofType} proof
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions for pending claims */}
                  {claim.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      {/* Notes input */}
                      <input
                        type="text"
                        placeholder="Notes (optional)"
                        value={notes[claim.id] || ''}
                        onChange={(e) => setNotes({ ...notes, [claim.id]: e.target.value })}
                        className="w-32 lg:w-40 px-2 py-1.5 text-sm bg-white/5 border border-white/10 rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20"
                      />

                      {/* Approve button */}
                      <Button
                        onClick={() => handleClaim(claim.id, 'approve', true)}
                        disabled={processingId === claim.id}
                        size="sm"
                        className="bg-green-600 hover:bg-green-500 text-white"
                      >
                        {processingId === claim.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </>
                        )}
                      </Button>

                      {/* Reject button */}
                      <Button
                        onClick={() => handleClaim(claim.id, 'reject')}
                        disabled={processingId === claim.id}
                        size="sm"
                        variant="outline"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {/* Status badge for processed claims */}
                  {claim.status !== 'pending' && (
                    <Badge
                      variant={claim.status === 'approved' ? 'default' : 'destructive'}
                      className={claim.status === 'approved' ? 'bg-green-600' : ''}
                    >
                      {claim.status === 'approved' ? (
                        <Check className="w-3 h-3 mr-1" />
                      ) : (
                        <X className="w-3 h-3 mr-1" />
                      )}
                      {claim.status}
                    </Badge>
                  )}
                </div>

                {/* Review notes if any */}
                {claim.reviewNotes && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-sm text-gray-500">
                      <span className="text-gray-400">Notes:</span> {claim.reviewNotes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ClaimsQueue;
