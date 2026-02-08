'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Eye, EyeOff, Loader2, User } from 'lucide-react';
import { useAdminToolbar } from '../AdminToolbarProvider';

interface UserResult {
  id: string;
  displayName: string | null;
  email: string | null;
  handle: string | null;
  avatarUrl: string | null;
}

export function ViewAsPanel() {
  const { impersonation, startImpersonation, endImpersonation } = useAdminToolbar();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isStarting, setIsStarting] = useState<string | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/admin/toolbar/impersonate/search?q=${encodeURIComponent(query.trim())}`, {
          credentials: 'include',
        });
        const data = await res.json();
        if (data.success) {
          setResults(data.data.users);
        }
      } catch {
        // silently fail search
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleStartViewAs = async (userId: string) => {
    setIsStarting(userId);
    try {
      const res = await fetch('/api/admin/toolbar/impersonate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId }),
      });
      const data = await res.json();
      if (data.success) {
        startImpersonation(data.data.sessionId, data.data.profile);
        setQuery('');
        setResults([]);
      }
    } catch {
      // silently fail
    } finally {
      setIsStarting(null);
    }
  };

  const handleEndViewAs = async () => {
    if (!impersonation) return;
    setIsEnding(true);
    try {
      await fetch('/api/admin/toolbar/impersonate', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: impersonation.sessionId }),
      });
      endImpersonation();
    } catch {
      // silently fail
    } finally {
      setIsEnding(false);
    }
  };

  // Active impersonation view
  if (impersonation) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-red-400 text-[11px] font-medium uppercase tracking-wider">
          <Eye size={12} />
          Viewing As
        </div>

        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              {impersonation.profile.avatarUrl ? (
                <img src={impersonation.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={18} className="text-white/40" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white font-medium truncate">
                {impersonation.profile.displayName || 'Unknown'}
              </p>
              <p className="text-[11px] text-white/50">
                @{impersonation.profile.handle || 'no-handle'} · {impersonation.profile.email}
              </p>
            </div>
          </div>

          {/* Profile snapshot */}
          <div className="space-y-1 text-[11px] text-white/40 pt-1 border-t border-red-500/10">
            {impersonation.profile.major && (
              <p>Major: <span className="text-white/60">{impersonation.profile.major}</span></p>
            )}
            {impersonation.profile.graduationYear && (
              <p>Grad Year: <span className="text-white/60">{impersonation.profile.graduationYear}</span></p>
            )}
            {impersonation.profile.bio && (
              <p>Bio: <span className="text-white/60">{impersonation.profile.bio}</span></p>
            )}
            <p>Builder: <span className="text-white/60">{impersonation.profile.isBuilder ? 'Yes' : 'No'}</span></p>
            <p>Onboarded: <span className="text-white/60">{impersonation.profile.onboardingCompleted ? 'Yes' : 'No'}</span></p>
          </div>
        </div>

        <motion.button
          onClick={handleEndViewAs}
          disabled={isEnding}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-sm text-red-400 font-medium transition-colors"
          whileTap={{ scale: 0.98 }}
        >
          {isEnding ? <Loader2 size={14} className="animate-spin" /> : <EyeOff size={14} />}
          {isEnding ? 'Ending...' : 'End View As'}
        </motion.button>

        <p className="text-[10px] text-white/30 text-center">
          Read-only view — no session mutation
        </p>
      </div>
    );
  }

  // Search view
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-white/50 text-[11px] font-medium uppercase tracking-wider">
        <Eye size={12} />
        View As User
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by email or handle..."
          className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
        />
        {isSearching && (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 animate-spin" />
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {results.map(user => (
            <div
              key={user.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={14} className="text-white/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 truncate">{user.displayName || 'No name'}</p>
                <p className="text-[11px] text-white/40 truncate">{user.email}</p>
              </div>
              <motion.button
                onClick={() => handleStartViewAs(user.id)}
                disabled={isStarting === user.id}
                className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded text-[11px] text-blue-400 font-medium transition-all"
                whileTap={{ scale: 0.95 }}
              >
                {isStarting === user.id ? <Loader2 size={12} className="animate-spin" /> : 'View'}
              </motion.button>
            </div>
          ))}
        </div>
      )}

      {query.length >= 2 && !isSearching && results.length === 0 && (
        <p className="text-[11px] text-white/30 text-center py-4">No users found</p>
      )}
    </div>
  );
}
