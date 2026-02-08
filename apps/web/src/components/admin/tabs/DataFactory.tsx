'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, ExternalLink, Loader2, Beaker } from 'lucide-react';
import { useToast } from '@hive/ui';

interface CreatedSpace {
  id: string;
  handle: string;
  url: string;
  batchId: string;
}

export function DataFactory() {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [memberCount, setMemberCount] = useState(0);
  const [postCount, setPostCount] = useState(5);
  const [isCreating, setIsCreating] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [created, setCreated] = useState<CreatedSpace[]>([]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/admin/toolbar/data-factory', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'space',
          config: { name: name.trim(), memberCount, postCount },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreated(prev => [data.data, ...prev]);
        setName('');
        toast.success('Test space created', data.data.handle);
      } else {
        toast.error('Failed to create', data.error?.message || 'Unknown error');
      }
    } catch (err) {
      toast.error('Network error', String(err));
    } finally {
      setIsCreating(false);
    }
  };

  const handleCleanup = async () => {
    setIsCleaning(true);
    try {
      const res = await fetch('/api/admin/toolbar/data-factory', {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        const { spaces, posts } = data.data.deleted;
        toast.success('Cleaned up', `${spaces} spaces, ${posts} posts deleted`);
        setCreated([]);
      } else {
        toast.error('Cleanup failed', data.error?.message || 'Unknown error');
      }
    } catch (err) {
      toast.error('Network error', String(err));
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Create Form */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-white/50 text-[11px] font-medium uppercase tracking-wider">
          <Beaker size={12} />
          Create Test Space
        </div>

        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Space name..."
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-white/40 block mb-1">Members</label>
            <input
              type="number"
              value={memberCount}
              onChange={e => setMemberCount(Math.min(20, Math.max(0, parseInt(e.target.value) || 0)))}
              min={0}
              max={20}
              className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/20"
            />
          </div>
          <div>
            <label className="text-[11px] text-white/40 block mb-1">Posts</label>
            <input
              type="number"
              value={postCount}
              onChange={e => setPostCount(Math.min(50, Math.max(0, parseInt(e.target.value) || 0)))}
              min={0}
              max={50}
              className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/20"
            />
          </div>
        </div>

        <motion.button
          onClick={handleCreate}
          disabled={isCreating || !name.trim()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-sm text-blue-400 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          whileTap={{ scale: 0.98 }}
        >
          {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          {isCreating ? 'Creating...' : 'Create Test Space'}
        </motion.button>
      </div>

      {/* Created Spaces */}
      {created.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] text-white/40 font-medium uppercase tracking-wider">
            Created This Session
          </div>
          {created.map(space => (
            <div key={space.id} className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg">
              <div className="min-w-0">
                <p className="text-sm text-white/80 truncate">{space.handle}</p>
                <p className="text-[11px] text-white/30 font-mono">{space.id.slice(0, 12)}...</p>
              </div>
              <a
                href={space.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
              >
                <ExternalLink size={14} className="text-white/50" />
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Cleanup */}
      <div className="pt-2 border-t border-white/5">
        <motion.button
          onClick={handleCleanup}
          disabled={isCleaning}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-sm text-red-400 font-medium disabled:opacity-40 transition-colors"
          whileTap={{ scale: 0.98 }}
        >
          {isCleaning ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          {isCleaning ? 'Cleaning...' : 'Clean Up All My Test Data'}
        </motion.button>
      </div>
    </div>
  );
}
