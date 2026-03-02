/* Time helpers used across feed sections */

export function isHappeningNow(startDate: string, endDate?: string): boolean {
  const now = Date.now();
  const start = new Date(startDate).getTime();
  const end = endDate ? new Date(endDate).getTime() : start + 2 * 3600 * 1000;
  return now >= start && now <= end;
}

export function startsWithinHour(startDate: string): boolean {
  const diff = new Date(startDate).getTime() - Date.now();
  return diff > 0 && diff <= 3600 * 1000;
}

export function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function timeLabel(startDate: string): string {
  const start = new Date(startDate);
  const now = new Date();
  const diffMs = start.getTime() - now.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMs < 0 && Math.abs(diffMs) < 2 * 3600 * 1000) return 'Happening now';
  if (diffMin <= 15 && diffMin >= 0) return 'Starting soon';
  if (diffMin < 60 && diffMin >= 0) return `In ${diffMin}m`;
  return start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function dayLabel(startDate: string): string {
  const start = new Date(startDate);
  const now = new Date();
  const diffDays = Math.floor((start.getTime() - now.getTime()) / 86400000);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function fullTimeLabel(startDate: string, endDate?: string): string {
  const start = new Date(startDate);
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  };
  let label = start.toLocaleDateString('en-US', opts);
  if (endDate) {
    const end = new Date(endDate);
    label += ` – ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
  return label;
}

export function cleanDescription(raw?: string): string | undefined {
  if (!raw) return undefined;
  const stripped = raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped.length > 0 ? stripped : undefined;
}

export function eventGradient(category?: string, eventType?: string): string {
  const key = (category || eventType || '').toLowerCase();
  if (key.includes('social') || key.includes('party') || key.includes('networking'))
    return 'from-amber-950/80 to-stone-950/60';
  if (key.includes('academic') || key.includes('lecture') || key.includes('class') || key.includes('study'))
    return 'from-indigo-950/80 to-slate-950/60';
  if (key.includes('sport') || key.includes('game') || key.includes('athletic') || key.includes('fitness'))
    return 'from-emerald-950/80 to-teal-950/60';
  if (key.includes('art') || key.includes('music') || key.includes('perform') || key.includes('creat'))
    return 'from-violet-950/80 to-purple-950/60';
  if (key.includes('greek') || key.includes('fraternity') || key.includes('sorority'))
    return 'from-rose-950/80 to-red-950/60';
  if (key.includes('food') || key.includes('dining') || key.includes('cook'))
    return 'from-orange-950/80 to-amber-950/60';
  return 'from-zinc-900/80 to-zinc-950/60';
}
