"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface TypewriterTextProps {
  text: string;
  className?: string;
  charDelay?: number;
  startDelay?: number;
  onComplete?: () => void;
  showCursor?: boolean;
}

export function TypewriterText({
  text,
  className = "",
  charDelay = 80,
  startDelay = 300,
  onComplete,
  showCursor = true,
}: TypewriterTextProps) {
  const [displayedChars, setDisplayedChars] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayedChars((prev) => {
          if (prev >= text.length) {
            clearInterval(interval);
            setIsComplete(true);
            onComplete?.();
            return prev;
          }
          return prev + 1;
        });
      }, charDelay);

      return () => clearInterval(interval);
    }, startDelay);

    return () => clearTimeout(startTimeout);
  }, [text, charDelay, startDelay, onComplete]);

  return (
    <span className={className}>
      {text.slice(0, displayedChars)}
      {showCursor && !isComplete && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
          className="inline-block w-[3px] h-[0.85em] bg-[#FFD700] ml-1 align-middle"
        />
      )}
    </span>
  );
}
