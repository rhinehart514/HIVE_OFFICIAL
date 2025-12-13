"use client";

const values = [
  "Student-owned",
  "Zero ads, forever",
  "Open roadmap",
];

export function WhySection() {
  return (
    <section className="relative py-24 md:py-32 px-6 bg-black overflow-hidden">
      {/* Subtle gold glow - static, always visible */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gold-500 opacity-[0.03] blur-[120px] rounded-full pointer-events-none"
      />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
          Student-run. Built for tonight.
        </h2>

        {/* Body text */}
        <p className="mt-6 text-lg md:text-xl text-neutral-400 leading-relaxed">
          Campus life should be owned by the students who live it.
          <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>
          We built HIVE because we needed it.
        </p>

        {/* Value pills */}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {values.map((value) => (
            <div
              key={value}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 border border-neutral-800 transition-transform duration-200 hover:scale-105"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-gold-500" />
              <span className="text-sm font-medium text-white">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
