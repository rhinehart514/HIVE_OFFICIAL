'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, X } from 'lucide-react';
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

interface GreekChapter {
  id: string;
  name: string;
  council?: string;
}

interface StudentOrg {
  id: string;
  name: string;
  category?: string;
}

interface InterestPickerProps {
  onComplete: (data: {
    interests: string[];
    major?: string;
    residentialSpaceId?: string;
    residenceType?: string;
    greekLife?: { affiliated: boolean; chapterId?: string };
    studentOrgs?: string[];
  }) => void;
  isSubmitting: boolean;
  campusId?: string;
}

const MIN_INTERESTS = 2;
const MAX_INTERESTS = 6;

// Hardcoded fallback categories
const FALLBACK_INTEREST_CATEGORIES: InterestCategory[] = [
  { id: 'academic_identity', title: 'Academic identity', icon: '📚', items: [] },
  { id: 'study_style', title: 'How you do school', icon: '🧠', items: [] },
  { id: 'food_behaviors', title: 'Food behavior', icon: '🍴', items: [] },
  { id: 'campus_events', title: 'Events / culture', icon: '🎉', items: [] },
  { id: 'gaming_and_game_night', title: 'Gamers & game night', icon: '🎮', items: [] },
  { id: 'creative_scene', title: 'Artsy / creative', icon: '🧵', items: [] },
  { id: 'builders_and_hustle', title: 'Build / hustle', icon: '🛠️', items: [] },
  { id: 'social_energy', title: 'Social energy', icon: '🧍', items: [] },
  { id: 'health_wellness', title: 'Health & wellness', icon: '🧘', items: [] },
  { id: 'media_and_content', title: 'Media & content', icon: '💻', items: [] },
];

// Fallback Greek councils for UB
const FALLBACK_GREEK_CHAPTERS: GreekChapter[] = [
  { id: 'ifc', name: 'IFC chapter', council: 'IFC' },
  { id: 'panhellenic', name: 'Panhellenic chapter', council: 'Panhellenic' },
  { id: 'nphc', name: 'NPHC chapter', council: 'NPHC' },
  { id: 'mgc', name: 'MGC chapter', council: 'MGC' },
];

/**
 * SectionHeader — consistent label for each identity dimension
 */
function SectionHeader({ number, label }: { number: number; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/[0.06] text-white/30 text-[10px] font-mono font-medium">
        {number}
      </span>
      <span className="font-sans text-[13px] font-medium text-white/60">{label}</span>
    </div>
  );
}

export function InterestPicker({ onComplete, isSubmitting, campusId }: InterestPickerProps) {
  // Dimension 1: Vibes (interest categories)
  const [categories, setCategories] = React.useState<InterestCategory[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  // Dimension 2: Major
  const [undergradMajors, setUndergradMajors] = React.useState<string[]>([]);
  const [gradPrograms, setGradPrograms] = React.useState<string[]>([]);
  const [major, setMajor] = React.useState('');
  const [programType, setProgramType] = React.useState<'undergrad' | 'grad'>('undergrad');

  // Dimension 3: Greek life
  const [greekAffiliated, setGreekAffiliated] = React.useState<boolean | null>(null);
  const [greekChapters, setGreekChapters] = React.useState<GreekChapter[]>(FALLBACK_GREEK_CHAPTERS);
  const [greekChapterId, setGreekChapterId] = React.useState('');

  // Dimension 4: Housing
  const [onCampusSpaces, setOnCampusSpaces] = React.useState<ResidentialSpace[]>([]);
  const [offCampusSpaces, setOffCampusSpaces] = React.useState<ResidentialSpace[]>([]);
  const [residentialSpaceId, setResidentialSpaceId] = React.useState('');

  // Dimension 5: Student orgs
  const [studentOrgs, setStudentOrgs] = React.useState<StudentOrg[]>([]);
  const [selectedOrgs, setSelectedOrgs] = React.useState<Set<string>>(new Set());
  const [orgSearch, setOrgSearch] = React.useState('');

  const [loading, setLoading] = React.useState(true);

  const activeMajors = programType === 'grad' ? gradPrograms : undergradMajors;

  // Fetch campus catalogs
  React.useEffect(() => {
    async function fetchCatalogs() {
      try {
        const res = await fetch(`/api/campus/catalogs?campusId=${campusId || 'ub-buffalo'}`);
        if (res.ok) {
          const data = await res.json();
          const fetchedCategories = data.interests || [];
          setCategories(fetchedCategories.length > 0 ? fetchedCategories : FALLBACK_INTEREST_CATEGORIES);
          setUndergradMajors((data.majors || []).map((m: any) => m.name || m));
          setGradPrograms((data.graduatePrograms || []).map((m: any) => m.name || m));
          setOnCampusSpaces(data.residentialSpaces || []);
          setOffCampusSpaces(data.offCampusSpaces || []);
          if (data.greekChapters) setGreekChapters(data.greekChapters);
          if (data.studentOrgs) setStudentOrgs(data.studentOrgs);
        }
      } catch {
        setCategories(FALLBACK_INTEREST_CATEGORIES);
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

  const toggleOrg = React.useCallback((id: string) => {
    setSelectedOrgs(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
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
      greekLife: greekAffiliated !== null ? {
        affiliated: greekAffiliated,
        chapterId: greekChapterId || undefined,
      } : undefined,
      studentOrgs: selectedOrgs.size > 0 ? Array.from(selectedOrgs) : undefined,
    });
  }, [selected, major, residentialSpaceId, offCampusSpaces, greekAffiliated, greekChapterId, selectedOrgs, onComplete]);

  // Minimum: pick at least some vibes OR fill in major
  const canSubmit = (selected.size >= MIN_INTERESTS || !!major) && !isSubmitting;

  const filteredOrgs = React.useMemo(() => {
    if (!orgSearch.trim()) return studentOrgs.slice(0, 12);
    const q = orgSearch.toLowerCase();
    return studentOrgs.filter(o => o.name.toLowerCase().includes(q)).slice(0, 12);
  }, [studentOrgs, orgSearch]);

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
          Tell us about you
        </h2>
        <p className="font-sans text-[13px] text-white/40">
          This connects you to the right spaces, events, and people. Fill in what applies.
        </p>
      </div>

      {/* ── Dimension 1: Major ── */}
      <div>
        <SectionHeader number={1} label="What do you study?" />
        <div className="flex items-center gap-1 p-0.5 rounded-[8px] bg-[#080808] border border-white/[0.06] mb-2">
          <button
            type="button"
            onClick={() => { setProgramType('undergrad'); setMajor(''); }}
            className={[
              'flex-1 py-1.5 rounded-[6px] font-sans text-[12px] font-medium transition-all duration-150',
              programType === 'undergrad' ? 'bg-white/[0.1] text-white' : 'text-white/30 hover:text-white/50',
            ].join(' ')}
          >
            Undergrad
          </button>
          <button
            type="button"
            onClick={() => { setProgramType('grad'); setMajor(''); }}
            className={[
              'flex-1 py-1.5 rounded-[6px] font-sans text-[12px] font-medium transition-all duration-150',
              programType === 'grad' ? 'bg-white/[0.1] text-white' : 'text-white/30 hover:text-white/50',
            ].join(' ')}
          >
            Graduate
          </button>
        </div>
        <select
          value={major}
          onChange={(e) => setMajor(e.target.value)}
          className="w-full h-11 px-3 rounded-[10px] bg-[#080808] border border-white/[0.06] font-sans text-[14px] text-white outline-none focus:border-white/[0.15] transition-colors appearance-none"
        >
          <option value="">{programType === 'grad' ? 'Select your program' : 'Select your major'}</option>
          {activeMajors.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* ── Dimension 2: Greek Life ── */}
      <div>
        <SectionHeader number={2} label="Greek life?" />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setGreekAffiliated(true); }}
            className={[
              'flex-1 py-2.5 rounded-[10px] font-sans text-[13px] font-medium transition-all duration-150 border',
              greekAffiliated === true
                ? 'bg-white/[0.08] border-white/[0.2] text-white'
                : 'bg-[#080808] border-white/[0.06] text-white/50 hover:border-white/[0.08]',
            ].join(' ')}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => { setGreekAffiliated(false); setGreekChapterId(''); }}
            className={[
              'flex-1 py-2.5 rounded-[10px] font-sans text-[13px] font-medium transition-all duration-150 border',
              greekAffiliated === false
                ? 'bg-white/[0.08] border-white/[0.2] text-white'
                : 'bg-[#080808] border-white/[0.06] text-white/50 hover:border-white/[0.08]',
            ].join(' ')}
          >
            No
          </button>
        </div>

        <AnimatePresence>
          {greekAffiliated === true && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <select
                value={greekChapterId}
                onChange={(e) => setGreekChapterId(e.target.value)}
                className="w-full h-11 px-3 mt-2 rounded-[10px] bg-[#080808] border border-white/[0.06] font-sans text-[14px] text-white outline-none focus:border-white/[0.15] transition-colors appearance-none"
              >
                <option value="">Select your chapter</option>
                {greekChapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name}{ch.council ? ` (${ch.council})` : ''}
                  </option>
                ))}
              </select>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Dimension 3: Housing ── */}
      <div>
        <SectionHeader number={3} label="Where do you live?" />
        <select
          value={residentialSpaceId}
          onChange={(e) => setResidentialSpaceId(e.target.value)}
          className="w-full h-11 px-3 rounded-[10px] bg-[#080808] border border-white/[0.06] font-sans text-[14px] text-white outline-none focus:border-white/[0.15] transition-colors appearance-none"
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
      </div>

      {/* ── Dimension 4: Student Orgs ── */}
      {studentOrgs.length > 0 && (
        <div>
          <SectionHeader number={4} label="Student orgs" />
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
            <input
              type="text"
              value={orgSearch}
              onChange={(e) => setOrgSearch(e.target.value)}
              placeholder="Search clubs and organizations..."
              className="w-full h-10 pl-9 pr-8 rounded-[10px] bg-[#080808] border border-white/[0.06] font-sans text-[13px] text-white placeholder-white/20 outline-none focus:border-white/[0.15] transition-colors"
            />
            {orgSearch && (
              <button
                type="button"
                onClick={() => setOrgSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5 text-white/30 hover:text-white/50" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filteredOrgs.map((org) => {
              const isOrgSelected = selectedOrgs.has(org.id);
              return (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => toggleOrg(org.id)}
                  className={[
                    'px-3 py-1.5 rounded-full font-sans text-[12px] transition-all duration-150 border',
                    isOrgSelected
                      ? 'bg-white/[0.08] border-white/[0.2] text-white'
                      : 'bg-[#080808] border-white/[0.06] text-white/40 hover:text-white/60 hover:border-white/[0.08]',
                  ].join(' ')}
                >
                  {org.name}
                </button>
              );
            })}
            {filteredOrgs.length === 0 && orgSearch && (
              <p className="font-sans text-[12px] text-white/25 py-2">No orgs match &ldquo;{orgSearch}&rdquo;</p>
            )}
          </div>
        </div>
      )}

      {/* ── Dimension 5: Vibes ── */}
      <div>
        <SectionHeader number={studentOrgs.length > 0 ? 5 : 4} label="Your vibe" />
        <p className="font-sans text-[11px] text-white/25 mb-2">
          Pick {MIN_INTERESTS}–{MAX_INTERESTS} that describe your campus energy
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {categories.map((cat) => {
            const isSelected = selected.has(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggle(cat.id)}
                className={[
                  'flex items-center gap-2 px-2.5 py-2 rounded-[10px] text-left transition-all duration-150 border',
                  isSelected
                    ? 'bg-white/[0.08] border-white/[0.2] text-white'
                    : 'bg-[#080808] border-white/[0.06] text-white/50 hover:border-white/[0.08] hover:text-white/70',
                  selected.size >= MAX_INTERESTS && !isSelected ? 'opacity-30 cursor-not-allowed' : '',
                ].join(' ')}
              >
                <span className="text-[16px] flex-shrink-0">{cat.icon}</span>
                <span className="font-sans text-[11px] font-medium leading-tight truncate">
                  {cat.title.replace(/\s*\(.*?\)\s*/g, '')}
                </span>
              </button>
            );
          })}
        </div>
        <p className="font-sans text-[11px] text-white/20 mt-1.5">
          {selected.size}/{MAX_INTERESTS} selected
          {selected.size < MIN_INTERESTS && !major && (
            <span> · pick {MIN_INTERESTS - selected.size} more (or select a major above)</span>
          )}
        </p>
      </div>

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
