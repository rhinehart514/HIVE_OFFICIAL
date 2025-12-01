"use client";

import { useEffect, createContext, useContext, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// Register all GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

// Custom easing functions for YC-style premium feel
export const EASINGS = {
  // Silk - smooth and elegant
  silk: "power2.out",
  silkInOut: "power2.inOut",

  // Snappy - quick and responsive
  snappy: "power3.out",
  snappyInOut: "power3.inOut",

  // Elastic - bouncy, playful
  elastic: "elastic.out(1, 0.5)",
  elasticSubtle: "elastic.out(1, 0.3)",

  // Expo - dramatic entrances
  expo: "expo.out",
  expoInOut: "expo.inOut",

  // Custom bezier for premium feel
  premium: "power4.out",
} as const;

// Animation presets for consistent feel
export const ANIMATION_PRESETS = {
  // Fade up - standard entrance
  fadeUp: {
    y: 40,
    opacity: 0,
    duration: 0.8,
    ease: EASINGS.silk,
  },

  // Fade up fast - for staggered items
  fadeUpFast: {
    y: 30,
    opacity: 0,
    duration: 0.6,
    ease: EASINGS.snappy,
  },

  // Scale up - for buttons/cards
  scaleUp: {
    scale: 0.95,
    opacity: 0,
    duration: 0.5,
    ease: EASINGS.snappy,
  },

  // Slide in - for horizontal reveals
  slideIn: {
    x: -30,
    opacity: 0,
    duration: 0.6,
    ease: EASINGS.silk,
  },

  // Character stagger - for text
  charStagger: {
    y: 100,
    opacity: 0,
    duration: 0.8,
    stagger: 0.02,
    ease: EASINGS.expo,
  },

  // Word stagger - for headlines
  wordStagger: {
    y: 60,
    opacity: 0,
    duration: 0.6,
    stagger: 0.08,
    ease: EASINGS.premium,
  },

  // Line stagger - for paragraphs
  lineStagger: {
    y: 40,
    opacity: 0,
    duration: 0.6,
    stagger: 0.1,
    ease: EASINGS.silk,
  },
} as const;

// Scroll trigger defaults
export const SCROLL_TRIGGER_DEFAULTS = {
  // Standard trigger - plays once
  standard: {
    start: "top 80%",
    toggleActions: "play none none none",
  },

  // Scrub trigger - linked to scroll
  scrub: {
    start: "top bottom",
    end: "bottom top",
    scrub: 1,
  },

  // Pin trigger - for section pins
  pin: {
    start: "top top",
    end: "+=500",
    pin: true,
    scrub: 1,
  },
} as const;

interface GSAPContextValue {
  isReady: boolean;
}

const GSAPContext = createContext<GSAPContextValue>({ isReady: false });

export function useGSAPContext() {
  return useContext(GSAPContext);
}

interface GSAPProviderProps {
  children: ReactNode;
}

export function GSAPProvider({ children }: GSAPProviderProps) {
  useEffect(() => {
    // Configure GSAP defaults
    gsap.defaults({
      ease: EASINGS.silk,
      duration: 0.8,
    });

    // Configure ScrollTrigger defaults
    ScrollTrigger.defaults({
      markers: false, // Set to true for debugging
    });

    // Refresh ScrollTrigger on load
    const handleLoad = () => {
      ScrollTrigger.refresh();
    };

    window.addEventListener("load", handleLoad);

    return () => {
      window.removeEventListener("load", handleLoad);
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <GSAPContext.Provider value={{ isReady: true }}>
      {children}
    </GSAPContext.Provider>
  );
}

// Utility function to create scroll-triggered animation
export function createScrollAnimation(
  element: gsap.TweenTarget,
  fromVars: gsap.TweenVars,
  trigger?: Element | string,
  scrollTriggerOptions?: ScrollTrigger.Vars
) {
  return gsap.from(element, {
    ...fromVars,
    scrollTrigger: {
      trigger: (trigger || element) as gsap.DOMTarget,
      ...SCROLL_TRIGGER_DEFAULTS.standard,
      ...scrollTriggerOptions,
    },
  });
}

// Utility function for staggered reveals
export function createStaggerReveal(
  elements: gsap.TweenTarget,
  container?: Element | string,
  options?: {
    preset?: keyof typeof ANIMATION_PRESETS;
    stagger?: number;
    delay?: number;
  }
) {
  const preset = options?.preset || "fadeUpFast";
  const animationVars: gsap.TweenVars = { ...ANIMATION_PRESETS[preset] };

  if (options?.stagger) {
    animationVars.stagger = options.stagger;
  }

  return gsap.from(elements, {
    ...animationVars,
    delay: options?.delay || 0,
    scrollTrigger: {
      trigger: (container || elements) as gsap.DOMTarget,
      ...SCROLL_TRIGGER_DEFAULTS.standard,
    },
  });
}
