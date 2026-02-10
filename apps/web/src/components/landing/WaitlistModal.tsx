'use client';

import { useState } from 'react';
import { motion, Button } from '@hive/ui/design-system/primitives';
import { X, Check } from 'lucide-react';

const clashDisplay = "font-[family-name:'Clash_Display',var(--hive-font-display)]";

interface School {
  id: string;
  name: string;
  domain: string;
  isActive?: boolean;
}

export function WaitlistModal({ school, onClose }: { school: School | null; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!school) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/waitlist/school-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), schoolName: school.name, schoolId: school.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to join waitlist');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div className="absolute inset-0 bg-black/90" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-sm rounded-lg border border-white/[0.06] bg-[var(--bg-ground)] p-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white/50 transition-colors">
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-4">
            <motion.div
              className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#FFD700]/30"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <Check className="w-5 h-5 text-[#FFD700]" />
            </motion.div>
            <p className={`text-lg font-medium text-white mb-2 ${clashDisplay}`}>You&apos;re on the list</p>
            <p className="text-sm text-white/50">We&apos;ll let you know when we expand.</p>
          </div>
        ) : (
          <>
            <p className={`text-lg font-medium text-white mb-1 ${clashDisplay}`}>Get notified</p>
            <p className="text-sm text-white/50 mb-6">We&apos;ll let you know when your campus is ready.</p>
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                className="mb-4 w-full rounded-lg border border-white/[0.06] bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/25 transition-colors focus:outline-none focus:border-[#FFD700]/30"
              />
              {error && <p className="text-sm text-red-400/80 mb-4">{error}</p>}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={!email.trim() || isSubmitting}
                className="w-full rounded-lg"
              >
                {isSubmitting ? 'Joining...' : 'Notify me'}
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
