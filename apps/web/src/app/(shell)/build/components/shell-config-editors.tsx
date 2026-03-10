'use client';

import type { ShellFormat, ShellConfig, PollConfig, BracketConfig, RSVPConfig } from '@/lib/shells/types';

const INPUT = `w-full px-3 py-2 rounded-lg text-sm bg-white/[0.05] border border-white/[0.05]
  text-white placeholder:text-white/30 focus:outline-none focus:outline-2 focus:outline-[#FFD700]`;

function PollConfigEditor({ config, onChange }: { config: PollConfig; onChange: (c: PollConfig) => void }) {
  return (
    <div className="space-y-2">
      <div>
        <label className="text-[11px] text-white/30 mb-0.5 block">Question</label>
        <input type="text" value={config.question} onChange={(e) => onChange({ ...config, question: e.target.value })} className={INPUT} />
      </div>
      <div>
        <label className="text-[11px] text-white/30 mb-0.5 block">Options</label>
        <div className="space-y-2">
          {config.options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const next = [...config.options];
                  next[i] = e.target.value;
                  onChange({ ...config, options: next });
                }}
                placeholder={`Option ${i + 1}`}
                className={`flex-1 ${INPUT} placeholder:text-white/30`}
              />
              {config.options.length > 2 && (
                <button
                  onClick={() => onChange({ ...config, options: config.options.filter((_, j) => j !== i) })}
                  className="text-white/30 hover:text-white/30 text-[11px] px-2"
                >
                  x
                </button>
              )}
            </div>
          ))}
          {config.options.length < 6 && (
            <button onClick={() => onChange({ ...config, options: [...config.options, ''] })} className="text-[11px] text-white/30 hover:text-white/50 transition-colors">
              + Add option
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function BracketConfigEditor({ config, onChange }: { config: BracketConfig; onChange: (c: BracketConfig) => void }) {
  return (
    <div className="space-y-2">
      <div>
        <label className="text-[11px] text-white/30 mb-0.5 block">Topic</label>
        <input type="text" value={config.topic} onChange={(e) => onChange({ ...config, topic: e.target.value })} className={INPUT} />
      </div>
      <div>
        <label className="text-[11px] text-white/30 mb-0.5 block">Entries</label>
        <div className="space-y-2">
          {config.entries.map((entry, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={entry}
                onChange={(e) => {
                  const next = [...config.entries];
                  next[i] = e.target.value;
                  onChange({ ...config, entries: next });
                }}
                placeholder={`Entry ${i + 1}`}
                className={`flex-1 ${INPUT} placeholder:text-white/30`}
              />
              {config.entries.length > 4 && (
                <button
                  onClick={() => onChange({ ...config, entries: config.entries.filter((_, j) => j !== i) })}
                  className="text-white/30 hover:text-white/30 text-[11px] px-2"
                >
                  x
                </button>
              )}
            </div>
          ))}
          {config.entries.length < 16 && (
            <button onClick={() => onChange({ ...config, entries: [...config.entries, ''] })} className="text-[11px] text-white/30 hover:text-white/50 transition-colors">
              + Add entry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RSVPConfigEditor({ config, onChange }: { config: RSVPConfig; onChange: (c: RSVPConfig) => void }) {
  return (
    <div className="space-y-2">
      <div>
        <label className="text-[11px] text-white/30 mb-0.5 block">Title</label>
        <input type="text" value={config.title} onChange={(e) => onChange({ ...config, title: e.target.value })} className={INPUT} />
      </div>
      <div>
        <label className="text-[11px] text-white/30 mb-0.5 block">Location (optional)</label>
        <input
          type="text"
          value={config.location ?? ''}
          onChange={(e) => onChange({ ...config, location: e.target.value || undefined })}
          placeholder="e.g. Student Union Room 210"
          className={`${INPUT} placeholder:text-white/30`}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-white/30 mb-0.5 block">Date & time</label>
          <input
            type="datetime-local"
            value={config.dateTime ?? ''}
            onChange={(e) => onChange({ ...config, dateTime: e.target.value || undefined })}
            className="w-full px-2 py-2 rounded-lg text-sm bg-white/[0.05] border border-white/[0.05]
              text-white focus:outline-none focus:outline-2 focus:outline-[#FFD700] [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="text-[11px] text-white/30 mb-0.5 block">Capacity</label>
          <input
            type="number"
            min={1}
            max={10000}
            value={config.capacity ?? ''}
            onChange={(e) => onChange({ ...config, capacity: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="No limit"
            className="w-full px-2 py-2 rounded-lg text-sm bg-white/[0.05] border border-white/[0.05]
              text-white placeholder:text-white/30 focus:outline-none focus:outline-2 focus:outline-[#FFD700]"
          />
        </div>
      </div>
    </div>
  );
}

export function ShellConfigEditor({ format, config, onChange }: { format: ShellFormat; config: ShellConfig; onChange: (config: ShellConfig) => void }) {
  if (!config) return null;
  switch (format) {
    case 'poll': return <PollConfigEditor config={config as PollConfig} onChange={onChange} />;
    case 'bracket': return <BracketConfigEditor config={config as BracketConfig} onChange={onChange} />;
    case 'rsvp': return <RSVPConfigEditor config={config as RSVPConfig} onChange={onChange} />;
    default: return null;
  }
}
