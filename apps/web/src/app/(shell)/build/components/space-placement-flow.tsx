'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, Check, MapPin } from 'lucide-react';

interface UserSpace {
  id: string;
  name: string;
  handle: string;
  iconURL?: string | null;
  membership: { role: string };
}

export function SpacePlacementFlow({
  toolId,
  toolName,
  originSpaceId,
  onSkip,
  onPlaced,
}: {
  toolId: string;
  toolName: string;
  originSpaceId: string | null;
  onSkip: () => void;
  onPlaced: (spaceHandle: string) => void;
}) {
  const [spaces, setSpaces] = useState<UserSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState<string | null>(null);
  const [deployed, setDeployed] = useState<string | null>(null);

  const handleDeploy = async (space: UserSpace) => {
    setDeploying(space.id);
    try {
      const res = await fetch(`/api/spaces/${space.id}/tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ toolId }),
      });

      if (res.ok) {
        setDeployed(space.id);
        toast.success(`${toolName} placed in ${space.name}`);
        setTimeout(() => onPlaced(space.handle), 800);
      } else {
        const err = await res.json().catch(() => ({}));
        const msg = err?.error?.message || err?.message || 'Deploy failed';
        // Already deployed is fine — treat as success
        if (res.status === 409) {
          setDeployed(space.id);
          toast.success(`Already in ${space.name}`);
          setTimeout(() => onPlaced(space.handle), 800);
        } else {
          toast.error(msg);
          setDeploying(null);
        }
      }
    } catch {
      toast.error('Failed to place app');
      setDeploying(null);
    }
  };

  useEffect(() => {
    fetch('/api/profile/my-spaces', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const all: UserSpace[] = (data.spaces || []).map((s: UserSpace) => ({
          id: s.id,
          name: s.name,
          handle: s.handle,
          iconURL: s.iconURL,
          membership: s.membership,
        }));
        setSpaces(all);
        setLoading(false);

        // Auto-deploy if originSpaceId matches
        if (originSpaceId) {
          const match = all.find(s => s.id === originSpaceId);
          if (match) {
            handleDeploy(match);
          }
        }
      })
      .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-white/40">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading your spaces...
      </div>
    );
  }

  if (spaces.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-white/40">
          Join or create a space to place your app where people can find it.
        </p>
        <button
          onClick={onSkip}
          className="text-xs text-white/30 hover:text-white/50 transition-colors"
        >
          Skip for now
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {spaces.map(space => (
        <button
          key={space.id}
          onClick={() => handleDeploy(space)}
          disabled={!!deploying}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
            bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]
            disabled:opacity-50 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0 overflow-hidden">
            {space.iconURL ? (
              <img src={space.iconURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[11px] text-white/40 font-medium">
                {space.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white/80 truncate">{space.name}</p>
            <p className="text-[11px] text-white/30">{space.membership.role}</p>
          </div>
          {deploying === space.id ? (
            <Loader2 className="w-4 h-4 animate-spin text-white/40 flex-shrink-0" />
          ) : deployed === space.id ? (
            <Check className="w-4 h-4 text-[#FFD700] flex-shrink-0" />
          ) : (
            <MapPin className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
          )}
        </button>
      ))}
    </div>
  );
}
