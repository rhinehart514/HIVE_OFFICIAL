"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ScrollAnimationOptions {
  trigger?: RefObject<HTMLElement | null>;
  start?: string;
  end?: string;
  scrub?: boolean | number;
  pin?: boolean;
  markers?: boolean;
  toggleActions?: string;
  once?: boolean;
}

interface AnimationConfig {
  y?: number;
  x?: number;
  opacity?: number;
  scale?: number;
  rotation?: number;
  rotateX?: number;
  rotateY?: number;
  duration?: number;
  delay?: number;
  stagger?: number;
  ease?: string;
}

export function useScrollAnimation(
  targetRef: RefObject<HTMLElement | null>,
  animationConfig: AnimationConfig = {},
  scrollOptions: ScrollAnimationOptions = {}
) {
  useEffect(() => {
    if (!targetRef.current) return;

    const {
      y = 40,
      x = 0,
      opacity = 0,
      scale = 1,
      rotation = 0,
      rotateX = 0,
      rotateY = 0,
      duration = 0.8,
      delay = 0,
      stagger = 0,
      ease = "power2.out",
    } = animationConfig;

    const {
      trigger,
      start = "top 80%",
      end,
      scrub = false,
      pin = false,
      markers = false,
      toggleActions = "play none none none",
      once = true,
    } = scrollOptions;

    const ctx = gsap.context(() => {
      gsap.from(targetRef.current, {
        y,
        x,
        opacity,
        scale,
        rotation,
        rotateX,
        rotateY,
        duration,
        delay,
        stagger,
        ease,
        scrollTrigger: {
          trigger: trigger?.current || targetRef.current,
          start,
          end,
          scrub,
          pin,
          markers,
          toggleActions,
          once,
        },
      });
    });

    return () => ctx.revert();
  }, [targetRef, animationConfig, scrollOptions]);
}

// Preset animations
export const SCROLL_PRESETS = {
  fadeUp: {
    y: 40,
    opacity: 0,
    duration: 0.8,
    ease: "power2.out",
  },
  fadeUpFast: {
    y: 30,
    opacity: 0,
    duration: 0.5,
    ease: "power3.out",
  },
  scaleIn: {
    scale: 0.9,
    opacity: 0,
    duration: 0.6,
    ease: "power2.out",
  },
  slideLeft: {
    x: -50,
    opacity: 0,
    duration: 0.6,
    ease: "power2.out",
  },
  slideRight: {
    x: 50,
    opacity: 0,
    duration: 0.6,
    ease: "power2.out",
  },
  rotate3D: {
    rotateX: -45,
    y: 60,
    opacity: 0,
    duration: 0.8,
    ease: "power3.out",
  },
} as const;

// Hook for staggered children animations
export function useStaggerAnimation(
  containerRef: RefObject<HTMLElement | null>,
  childSelector: string,
  animationConfig: AnimationConfig = {},
  scrollOptions: ScrollAnimationOptions = {}
) {
  useEffect(() => {
    if (!containerRef.current) return;

    const children = containerRef.current.querySelectorAll(childSelector);
    if (!children.length) return;

    const {
      y = 40,
      x = 0,
      opacity = 0,
      scale = 1,
      duration = 0.6,
      stagger = 0.1,
      ease = "power2.out",
    } = animationConfig;

    const {
      trigger,
      start = "top 80%",
      toggleActions = "play none none none",
    } = scrollOptions;

    const ctx = gsap.context(() => {
      gsap.from(children, {
        y,
        x,
        opacity,
        scale,
        duration,
        stagger,
        ease,
        scrollTrigger: {
          trigger: trigger?.current || containerRef.current,
          start,
          toggleActions,
        },
      });
    });

    return () => ctx.revert();
  }, [containerRef, childSelector, animationConfig, scrollOptions]);
}

// Hook for parallax effects
export function useParallax(
  targetRef: RefObject<HTMLElement | null>,
  speed: number = 0.5,
  direction: "vertical" | "horizontal" = "vertical"
) {
  useEffect(() => {
    if (!targetRef.current) return;

    const ctx = gsap.context(() => {
      const property = direction === "vertical" ? "yPercent" : "xPercent";
      const value = speed * 100;

      gsap.to(targetRef.current, {
        [property]: value,
        ease: "none",
        scrollTrigger: {
          trigger: targetRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    });

    return () => ctx.revert();
  }, [targetRef, speed, direction]);
}
