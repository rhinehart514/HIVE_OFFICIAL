"use client";

import { useEffect, useState, useRef } from "react";
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
  const onCompleteRef = useRef(onComplete);

  // Keep ref updated
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayedChars((prev) => {
          if (prev >= text.length) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, charDelay);

      return () => clearInterval(interval);
    }, startDelay);

    return () => clearTimeout(startTimeout);
  }, [text, charDelay, startDelay]);

  // Handle completion separately to avoid setState during render
  useEffect(() => {
    if (displayedChars >= text.length && !isComplete) {
      setIsComplete(true);
      onCompleteRef.current?.();
    }
  }, [displayedChars, text.length, isComplete]);

  return (
    <span className={className}>
      {text.slice(0, displayedChars)}
      {showCursor && !isComplete && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
          className="inline-block w-[3px] h-[0.85em] bg-gold-500 ml-1 align-middle"
        />
      )}
    </span>
  );
}
