// Onboarding Animation Variants

export const fadeSlideVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

export const transition = {
  duration: 0.4,
  ease: [0.22, 1, 0.36, 1], // Silk easing
};

export const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
};
