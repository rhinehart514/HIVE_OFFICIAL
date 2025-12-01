"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Users, Compass, Wrench, Zap } from "lucide-react";

const features = [
  {
    id: "spaces",
    title: "Spaces",
    description: "Your clubs, your way. Create and manage community spaces for any group on campus.",
    icon: Users,
    size: "large",
  },
  {
    id: "feed",
    title: "Feed",
    description: "See what's happening across all your spaces in one stream.",
    icon: Compass,
    size: "standard",
  },
  {
    id: "hivelab",
    title: "HiveLab",
    description: "No-code builder for custom tools your club needs.",
    icon: Wrench,
    size: "standard",
    badge: "NEW",
  },
  {
    id: "rituals",
    title: "Rituals",
    description: "Campus-wide campaigns. Tournaments, challenges, and badges that unite your campus.",
    icon: Zap,
    size: "wide",
  },
] as const;

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  size: "large" | "standard" | "wide";
  badge?: string;
  index: number;
}

function FeatureCard({ title, description, icon: Icon, size, badge, index }: FeatureCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-50px" });

  const sizeClasses = {
    large: "md:row-span-2",
    standard: "",
    wide: "md:col-span-2",
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -4 }}
      className={`
        group relative p-6 md:p-8 rounded-2xl
        bg-neutral-950 border border-neutral-800
        transition-all duration-300
        hover:border-gold-500/30 hover:shadow-[0_0_30px_rgba(255,215,0,0.05)]
        cursor-pointer
        ${sizeClasses[size]}
      `}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute top-4 right-4 px-2 py-0.5 text-xs font-semibold bg-gold-500 text-black rounded-full">
          {badge}
        </div>
      )}

      {/* Icon */}
      <div className="mb-4">
        <Icon className="h-8 w-8 text-neutral-400 group-hover:text-gold-500 group-hover:scale-110 transition-all duration-300" />
      </div>

      {/* Content */}
      <h3 className="text-xl md:text-2xl font-semibold text-white mb-2">
        {title}
      </h3>
      <p className="text-neutral-400 leading-relaxed">
        {description}
      </p>

      {/* Hover indicator */}
      <div className="mt-4 text-sm text-neutral-600 group-hover:text-neutral-400 transition-colors duration-300">
        Learn more →
      </div>
    </motion.div>
  );
}

export function SolutionSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(headerRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="relative py-24 md:py-32 px-6 bg-black">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            Everything your campus needs
          </h2>
          <p className="mt-4 text-lg text-neutral-400 max-w-2xl mx-auto">
            One platform to coordinate, connect, and build community.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.id}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              size={feature.size}
              badge={'badge' in feature ? feature.badge : undefined}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
