"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface StatProps {
  value: number;
  suffix: string;
  label: string;
  delay?: number;
}

function AnimatedStat({ value, suffix, label, delay = 0 }: StatProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const timeout = setTimeout(() => {
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;

      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(interval);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [isInView, value, delay]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] }}
      className="text-center px-6 py-4"
    >
      <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white font-mono tabular-nums">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="mt-2 text-sm text-neutral-500 uppercase tracking-wider">
        {label}
      </div>
    </motion.div>
  );
}

export function ProofSection() {
  return (
    <section className="relative py-16 md:py-20 px-6 bg-black border-y border-neutral-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-center divide-y sm:divide-y-0 sm:divide-x divide-neutral-800">
          <AnimatedStat value={2000} suffix="+" label="students at UB" delay={0} />
          <AnimatedStat value={89} suffix="+" label="spaces launched" delay={150} />
          <AnimatedStat value={1200} suffix="+" label="posts this week" delay={300} />
        </div>
      </div>
    </section>
  );
}
