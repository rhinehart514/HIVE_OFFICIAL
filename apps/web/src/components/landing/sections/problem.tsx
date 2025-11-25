"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";
import { X, Check } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const before = [
  "15 different GroupMes",
  "Missed events you'd have loved",
  "Flyers no one sees",
  "No idea what's happening on campus",
];

const after = [
  "One feed for everything",
  "Never miss what matters",
  "Your clubs, always updated",
  "Real-time campus pulse",
];

export function ProblemSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const beforeCardRef = useRef<HTMLDivElement>(null);
  const afterCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Split title into words for dramatic reveal
      if (titleRef.current) {
        const splitTitle = new SplitType(titleRef.current, {
          types: "words",
          tagName: "span",
        });

        if (splitTitle.words) {
          gsap.from(splitTitle.words, {
            y: 80,
            opacity: 0,
            rotateX: -45,
            duration: 0.8,
            stagger: 0.06,
            ease: "power3.out",
            scrollTrigger: {
              trigger: headerRef.current,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          });
        }
      }

      // Subtitle with delayed fade
      gsap.from(subtitleRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.6,
        delay: 0.3,
        ease: "power2.out",
        scrollTrigger: {
          trigger: headerRef.current,
          start: "top 75%",
          toggleActions: "play none none none",
        },
      });

      // Before card - slide in from left
      gsap.from(beforeCardRef.current, {
        x: -60,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: beforeCardRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });

      // After card - slide in from right
      gsap.from(afterCardRef.current, {
        x: 60,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: afterCardRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });

      // Staggered list items - Before
      const beforeItems = beforeCardRef.current?.querySelectorAll("li");
      if (beforeItems) {
        gsap.from(beforeItems, {
          x: -30,
          opacity: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: beforeCardRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });

        // X icon scale animation
        beforeItems.forEach((item) => {
          const icon = item.querySelector("svg");
          gsap.from(icon, {
            scale: 0,
            rotation: -180,
            duration: 0.4,
            delay: 0.3,
            ease: "back.out(2)",
            scrollTrigger: {
              trigger: item,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });
        });
      }

      // Staggered list items - After
      const afterItems = afterCardRef.current?.querySelectorAll("li");
      if (afterItems) {
        gsap.from(afterItems, {
          x: 30,
          opacity: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: afterCardRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });

        // Check icon scale animation
        afterItems.forEach((item) => {
          const icon = item.querySelector("svg");
          gsap.from(icon, {
            scale: 0,
            rotation: 180,
            duration: 0.4,
            delay: 0.3,
            ease: "back.out(2)",
            scrollTrigger: {
              trigger: item,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-24 md:py-32 px-6 bg-black overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/0 via-neutral-950/50 to-neutral-950/0" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <div ref={headerRef} className="text-center mb-16">
          <h2
            ref={titleRef}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white"
            style={{ perspective: "1000px" }}
          >
            Campus life is fragmented
          </h2>
          <p ref={subtitleRef} className="mt-4 text-lg text-neutral-400">
            Until now.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Before */}
          <div
            ref={beforeCardRef}
            className="p-6 md:p-8 rounded-2xl bg-neutral-950 border border-neutral-800"
          >
            <div className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-6">
              Before HIVE
            </div>
            <ul className="space-y-4">
              {before.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <X className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                  <span className="text-neutral-400">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* After */}
          <div
            ref={afterCardRef}
            className="p-6 md:p-8 rounded-2xl bg-neutral-950 border border-[#F5C842]/20 shadow-[0_0_30px_rgba(245,200,66,0.05)]"
          >
            <div className="text-sm font-medium text-[#F5C842] uppercase tracking-wider mb-6">
              With HIVE
            </div>
            <ul className="space-y-4">
              {after.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#F5C842] mt-0.5 shrink-0" />
                  <span className="text-white">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
