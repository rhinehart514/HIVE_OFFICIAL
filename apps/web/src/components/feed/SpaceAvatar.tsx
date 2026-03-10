'use client';

export function SpaceAvatar({
  name,
  url,
  size = 32,
}: {
  name?: string;
  url?: string;
  size?: number;
}) {
  if (url)
    return (
      <img
        src={url}
        alt={name || ''}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  const letter = (name || '?')[0].toUpperCase();
  return (
    <div
      className="rounded-full bg-white/[0.05] flex items-center justify-center shrink-0 text-white/50 font-medium"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {letter}
    </div>
  );
}
