'use client';

/**
 * GSAP Scroll Hook
 *
 * Provides snap scrolling and parallax effects using GSAP ScrollTrigger.
 * Use this for full-page section snapping with smooth parallax.
 */

import { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface GSAPScrollConfig {
  /** Enable snap scrolling between sections */
  snap?: boolean;
  /** Snap duration in seconds */
  snapDuration?: number;
  /** Snap easing */
  snapEase?: string;
  /** Delay before snap activates after scroll stops */
  snapDelay?: number;
  /** Enable parallax effects on elements with data-parallax attribute */
  parallax?: boolean;
  /** Parallax intensity multiplier */
  parallaxIntensity?: number;
  /** Section selector for snap points */
  sectionSelector?: string;
  /** Callback when section changes */
  onSectionChange?: (index: number) => void;
}

const defaultConfig: Required<GSAPScrollConfig> = {
  snap: true,
  snapDuration: 0.8,
  snapEase: 'power2.inOut',
  snapDelay: 0.1,
  parallax: true,
  parallaxIntensity: 1,
  sectionSelector: '[data-scroll-section]',
  onSectionChange: () => {},
};

export function useGSAPScroll(config: GSAPScrollConfig = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentSection = useRef(0);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const parallaxAnimations = useRef<gsap.core.Tween[]>([]);

  const mergedConfig = { ...defaultConfig, ...config };

  // Initialize scroll effects
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const container = containerRef.current;
    if (!container) return;

    const sections = container.querySelectorAll(mergedConfig.sectionSelector);
    if (sections.length === 0) return;

    // Create snap scrolling
    if (mergedConfig.snap) {
      scrollTriggerRef.current = ScrollTrigger.create({
        snap: {
          snapTo: 1 / (sections.length - 1),
          duration: { min: mergedConfig.snapDuration * 0.5, max: mergedConfig.snapDuration },
          delay: mergedConfig.snapDelay,
          ease: mergedConfig.snapEase,
        },
        onUpdate: (self) => {
          const newSection = Math.round(self.progress * (sections.length - 1));
          if (newSection !== currentSection.current) {
            currentSection.current = newSection;
            mergedConfig.onSectionChange(newSection);
          }
        },
      });
    }

    // Create parallax effects
    if (mergedConfig.parallax) {
      const parallaxElements = container.querySelectorAll('[data-parallax]');

      parallaxElements.forEach((element) => {
        const speed = parseFloat(element.getAttribute('data-parallax') || '0.5');
        const direction = element.getAttribute('data-parallax-direction') || 'y';
        const intensity = speed * mergedConfig.parallaxIntensity * 100;

        const animProps: gsap.TweenVars = {};
        if (direction === 'y' || direction === 'both') {
          animProps.yPercent = -intensity;
        }
        if (direction === 'x' || direction === 'both') {
          animProps.xPercent = -intensity;
        }

        const tween = gsap.to(element, {
          ...animProps,
          ease: 'none',
          scrollTrigger: {
            trigger: element.closest(mergedConfig.sectionSelector) || element,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.5,
          },
        });

        parallaxAnimations.current.push(tween);
      });
    }

    // Section-specific scroll triggers
    sections.forEach((section, index) => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => {
          section.classList.add('is-active');
          mergedConfig.onSectionChange(index);
        },
        onEnterBack: () => {
          section.classList.add('is-active');
          mergedConfig.onSectionChange(index);
        },
        onLeave: () => {
          section.classList.remove('is-active');
        },
        onLeaveBack: () => {
          section.classList.remove('is-active');
        },
      });
    });

    // Cleanup
    return () => {
      scrollTriggerRef.current?.kill();
      parallaxAnimations.current.forEach(tween => tween.kill());
      parallaxAnimations.current = [];
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, [mergedConfig]);

  // Scroll to specific section
  const scrollToSection = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;

    const sections = container.querySelectorAll(mergedConfig.sectionSelector);
    const section = sections[index];

    if (section) {
      gsap.to(window, {
        scrollTo: { y: section, offsetY: 0 },
        duration: mergedConfig.snapDuration,
        ease: mergedConfig.snapEase,
      });
    }
  }, [mergedConfig.sectionSelector, mergedConfig.snapDuration, mergedConfig.snapEase]);

  // Refresh ScrollTrigger (call after dynamic content changes)
  const refresh = useCallback(() => {
    ScrollTrigger.refresh();
  }, []);

  return {
    containerRef,
    scrollToSection,
    refresh,
    currentSection: currentSection.current,
  };
}

/**
 * Simple parallax hook for individual elements
 */
export function useGSAPParallax(speed: number = 0.5) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const element = elementRef.current;
    if (!element) return;

    const tween = gsap.to(element, {
      yPercent: -speed * 100,
      ease: 'none',
      scrollTrigger: {
        trigger: element,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5,
      },
    });

    return () => {
      tween.kill();
    };
  }, [speed]);

  return elementRef;
}

export default useGSAPScroll;
