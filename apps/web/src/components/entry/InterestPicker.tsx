'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@hive/ui/design-system/primitives';

interface InterestCategory {
  id: string;
  title: string;
  icon: string;
  items: string[];
}

interface ResidentialSpace {
  id: string;
  name: string;
}

interface InterestPickerProps {
  onComplete: (data: { interests: string[]; major?: string; residentialSpaceId?: string; residenceType?: string }) => void;
  isSubmitting: boolean;
  campusId?: string;
}

const MIN_INTERESTS = 3;
const MAX_INTERESTS = 6;

export function InterestPicker({ onComplete, isSubmitting, campusId }: InterestPickerProps) {
  const [categories, setCategories] = React.useState<InterestCategory[]>([]);
  const [undergradMajors, setUndergradMajors] = React.useState<string[]>([]);
  const [gradPrograms, setGradPrograms] = React.useState<string[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [major, setMajor] = React.useState('');
  const [programType, setProgramType] = React.useState<'undergrad' | 'grad'>('undergrad');
  const [onCampusSpaces, setOnCampusSpaces] = React.useState<ResidentialSpace[]>([]);
  const [offCampusSpaces, setOffCampusSpaces] = React.useState<ResidentialSpace[]>([]);
  const [residentialSpaceId, setResidentialSpaceId] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [showMajor, setShowMajor] = React.useState(false);
  const [showHousing, setShowHousing] = React.useState(false);

  const activeMajors = programType === 'grad' ? gradPrograms : undergradMajors;

  // Fetch campus catalogs
  React.useEffect(() => {
    async function fetchCatalogs() {
      try {
        const res = await fetch(`/api/campus/catalogs?campusId=${campusId || 'ub-buffalo'}`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data.interests || []);
          setUndergradMajors((data.majors || []).map((m: any) => m.name || m));
          setGradPrograms((data.graduatePrograms || []).map((m: any) => m.name || m));
          setOnCampusSpaces(data.residentialSpaces || []);
          setOffCampusSpaces(data.offCampusSpaces || []);
        }
      } catch {
        // Fallback: still let them through
      } finally {
        setLoading(false);
      }
    }
    fetchCatalogs();
  }, [campusId]);

  const toggle = React.useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_INTERESTS) {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSubmit = React.useCallback(() => {
    const isOffCampus = offCampusSpaces.some(s => s.id === residentialSpaceId);
    onComplete({
      interests: Array.from(selected),
      major: major || undefined,
      residentialSpaceId: residentialSpaceId || undefined,
      residenceType: residentialSpaceId ? (isOffCampus ? 'off-campus' : 'on-campus') : undefined,
    });
  }, [selected, major, residentialSpaceId, offCampusSpaces, onComplete]);

  const canSubmit = selected.size >= MIN_INTERESTS && !isSubmitting;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="space-y-5"
    >
      <div className="space-y-1">
        <h2 className="font-display text-[22px] font-semibold leading-tight text-white">
          What&apos;s your vibe?
        </h2>
        <p className="font-sans text-[13px] text-white/40">
          Pick {MIN_INTERESTS}–{MAX_INTERESTS}. We&apos;ll connect you to spaces and tools that match.
        </p>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-2 gap-2">
        {categories.map((cat) => {
          const isSelected = selected.has(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggle(cat.id)}
              className={[
                'flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-left transition-all duration-150',
                'border',
                isSelected
                  ? 'bg-white/[0.08] border-white/[0.2] text-white'
                  : 'bg-[#080808] border-white/[0.06] text-white/50 hover:border-white/[0.08] hover:text-white/70',
                selected.size >= MAX_INTERESTS && !isSelected ? 'opacity-30 cursor-not-allowed' : '',
              ].join(' ')}
            >
              <span className="text-[18px] flex-shrink-0">{cat.icon}</span>
              <span className="font-sans text-[12px] font-medium leading-tight truncate">
                {cat.title.replace(/\s*\(.*?\)\s*/g, '')}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selection count */}
      <div className="flex items-center justify-between">
        <p className="font-sans text-[12px] text-white/30">
          {selected.size}/{MAX_INTERESTS} selected
          {selected.size < MIN_INTERESTS && (
            <span className="text-white/20"> · pick {MIN_INTERESTS - selected.size} more</span>
          )}
        </p>

        <div className="flex items-center gap-3">
          {!showMajor && (
            <button
              type="button"
              onClick={() => setShowMajor(true)}
              className="font-sans text-[12px] text-white/30 hover:text-white/50 transition-colors"
            >
              + Add major
            </button>
          )}
          {!showHousing && (
            <button
              type="button"
              onClick={() => setShowHousing(true)}
              className="font-sans text-[12px] text-white/30 hover:text-white/50 transition-colors"
            >
              + Add housing
            </button>
          )}
        </div>
      </div>

      {/* Major picker (optional, collapsible) */}
      {showMajor && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.15 }}
          className="space-y-3"
        >
          {/* Undergrad / Grad toggle */}
          <div className="flex items-center gap-1 p-0.5 rounded-[8px] bg-[#080808] border border-white/[0.06]">
            <button
              type="button"
              onClick={() => { setProgramType('undergrad'); setMajor(''); }}
              className={[
                'flex-1 py-1.5 rounded-[6px] font-sans text-[12px] font-medium transition-all duration-150',
                programType === 'undergrad'
                  ? 'bg-white/[0.1] text-white'
                  : 'text-white/30 hover:text-white/50',
              ].join(' ')}
            >
              Undergrad
            </button>
            <button
              type="button"
              onClick={() => { setProgramType('grad'); setMajor(''); }}
              className={[
                'flex-1 py-1.5 rounded-[6px] font-sans text-[12px] font-medium transition-all duration-150',
                programType === 'grad'
                  ? 'bg-white/[0.1] text-white'
                  : 'text-white/30 hover:text-white/50',
              ].join(' ')}
            >
              Graduate
            </button>
          </div>

          <select
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            className={[
              'w-full h-11 px-3 rounded-[10px] bg-[#080808] border border-white/[0.06]',
              'font-sans text-[14px] text-white outline-none',
              'focus:border-white/[0.15] transition-colors',
              'appearance-none',
            ].join(' ')}
          >
            <option value="">
              {programType === 'grad' ? 'Select your program' : 'Select your major'}
            </option>
            {activeMajors.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </motion.div>
      )}

      {/* Housing picker (optional, collapsible) */}
      {showHousing && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.15 }}
          className="space-y-2"
        >
          <label className="font-sans text-[13px] text-white/50">Where do you live?</label>
          <select
            value={residentialSpaceId}
            onChange={(e) => setResidentialSpaceId(e.target.value)}
            className={[
              'w-full h-11 px-3 rounded-[10px] bg-[#080808] border border-white/[0.06]',
              'font-sans text-[14px] text-white outline-none',
              'focus:border-white/[0.15] transition-colors',
              'appearance-none',
            ].join(' ')}
          >
            <option value="">Select where you live</option>
            {onCampusSpaces.length > 0 && (
              <optgroup label="On Campus">
                {onCampusSpaces.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </optgroup>
            )}
            {offCampusSpaces.length > 0 && (
              <optgroup label="Commuter / Off Campus">
                {offCampusSpaces.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </optgroup>
            )}
          </select>
        </motion.div>
      )}

      {/* Submit */}
      <Button
        variant="primary"
        size="default"
        className="w-full"
        onClick={handleSubmit}
        loading={isSubmitting}
        disabled={!canSubmit}
      >
        {isSubmitting ? 'Setting up...' : 'Get in'}
      </Button>

      {/* Skip option */}
      <button
        type="button"
        onClick={() => onComplete({ interests: [] })}
        disabled={isSubmitting}
        className="w-full font-sans text-[12px] text-white/20 hover:text-white/30 transition-colors"
      >
        Skip for now
      </button>
    </motion.div>
  );
}
