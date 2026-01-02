'use client';

import Image from 'next/image';

const SCHOOLS = [
  { name: 'University at Buffalo', logo: '/assets/schools/ub-logo.svg' },
  { name: 'Canisius University', logo: '/assets/schools/canisius-logo.svg' },
  { name: 'St. Bonaventure University', logo: '/assets/schools/st-bonaventure-logo.svg' },
  { name: 'Daemen University', logo: '/assets/schools/daemen-logo.svg' },
  { name: "D'Youville University", logo: '/assets/schools/dyouville-logo.svg' },
] as const;

export function SchoolLogoMarquee() {
  return (
    <div className="relative w-full overflow-hidden">
      {/* Gradient masks for smooth fade effect */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-[#0A0A0A] to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-[#0A0A0A] to-transparent" />

      {/* Marquee container */}
      <div
        className="flex animate-marquee items-center gap-12 motion-reduce:animate-none motion-reduce:justify-center motion-reduce:flex-wrap"
        aria-label="Launch schools"
      >
        {/* First set of logos */}
        {SCHOOLS.map((school) => (
          <div
            key={school.name}
            className="flex h-8 w-32 shrink-0 items-center justify-center opacity-50 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
            title={school.name}
          >
            <Image
              src={school.logo}
              alt={school.name}
              width={128}
              height={32}
              className="h-full w-auto max-w-full object-contain brightness-0 invert"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
        ))}

        {/* Duplicate set for seamless loop */}
        {SCHOOLS.map((school) => (
          <div
            key={`${school.name}-dup`}
            className="flex h-8 w-32 shrink-0 items-center justify-center opacity-50 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
            aria-hidden="true"
            title={school.name}
          >
            <Image
              src={school.logo}
              alt=""
              width={128}
              height={32}
              className="h-full w-auto max-w-full object-contain brightness-0 invert"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
        ))}
      </div>

      {/* CSS for marquee animation */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-marquee {
          animation: marquee 25s linear infinite;
        }

        .animate-marquee:hover {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-marquee {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

export default SchoolLogoMarquee;
