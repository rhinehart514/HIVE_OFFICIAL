"use client";

import { useRef, useState, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

/**
 * Product Showcase
 *
 * MONOCHROME DISCIPLINE:
 * - Pure grayscale throughout
 * - NO gold, blue, green, amber
 * - All accents use white opacity
 * - Status badges in white/gray
 */

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const messageVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 0.3 + i * 0.2,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const newMessageVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
};

const typingDotVariants = {
  animate: (i: number) => ({
    y: [0, -4, 0],
    transition: {
      delay: i * 0.15,
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  }),
};

interface Message {
  id: number;
  user: string;
  message: string;
  time: string;
  isYou?: boolean;
}

const initialMessages: Message[] = [
  { id: 1, user: "Sarah K.", message: "Who's going to the hackathon this weekend?", time: "2m" },
  { id: 2, user: "Mike T.", message: "I'm in! Need a team?", time: "1m" },
  { id: 3, user: "You", message: "Let's do it. Meeting at the library at 6?", time: "now", isYou: true },
];

const mockElements = [
  { id: 1, label: "Poll", icon: "◯" },
  { id: 2, label: "Timer", icon: "◷" },
  { id: 3, label: "Form", icon: "☐" },
];

const celebrationVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: [0, 1.3, 1],
    opacity: [0, 1, 0],
    transition: {
      duration: 0.8,
      times: [0, 0.4, 1],
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

/**
 * Interactive HiveLab Demo - MONOCHROME
 */
function InteractiveHiveLabDemo({ isInView }: { isInView: boolean }) {
  const [droppedElement, setDroppedElement] = useState<typeof mockElements[0] | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isHoveringDropZone, setIsHoveringDropZone] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (id: number) => {
    setDraggedId(id);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: { point: { x: number; y: number } }) => {
    setDraggedId(null);

    if (dropZoneRef.current && draggedId !== null) {
      const rect = dropZoneRef.current.getBoundingClientRect();
      const { x, y } = info.point;

      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        const element = mockElements.find((el) => el.id === draggedId);
        if (element && !droppedElement) {
          setDroppedElement(element);
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 800);
        }
      }
    }
    setIsHoveringDropZone(false);
  };

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: { point: { x: number; y: number } }) => {
    if (dropZoneRef.current) {
      const rect = dropZoneRef.current.getBoundingClientRect();
      const { x, y } = info.point;
      const isOver = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      setIsHoveringDropZone(isOver);
    }
  };

  return (
    <div className="relative" ref={constraintsRef}>
      <div className="relative rounded-xl border border-white/[0.08] bg-[#0a0a0a] overflow-hidden">
        {/* Toolbar - MONOCHROME */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-medium text-white">Event Dashboard</span>
            <motion.span
              animate={{ opacity: droppedElement ? [1, 0.5, 1] : 1 }}
              transition={{ duration: 1, repeat: droppedElement ? 0 : Infinity, repeatDelay: 2 }}
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wide ${
                droppedElement
                  ? "bg-white/[0.12] text-white/70 border border-white/[0.12]"
                  : "bg-white/[0.06] text-white/40 border border-white/[0.08]"
              }`}
            >
              {droppedElement ? "SAVED" : "DRAFT"}
            </motion.span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/30 font-mono">⌘S</span>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-3 py-1.5 text-[11px] font-medium rounded text-black bg-white hover:bg-white/90 transition-all"
            >
              Deploy
            </motion.button>
          </div>
        </div>

        {/* Canvas */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 sm:p-4 min-h-[220px]">
          {/* Element palette */}
          <div className="sm:col-span-1 flex sm:flex-col gap-2 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0">
            <div className="hidden sm:block text-[9px] font-mono text-white/30 uppercase tracking-widest mb-3">
              Elements
            </div>
            {mockElements.map((el) => {
              const isDropped = droppedElement?.id === el.id;
              return (
                <motion.div
                  key={el.id}
                  drag={!isDropped}
                  dragConstraints={constraintsRef}
                  dragElastic={0.1}
                  onDragStart={() => handleDragStart(el.id)}
                  onDragEnd={handleDragEnd}
                  onDrag={handleDrag}
                  whileDrag={{ scale: 1.1, zIndex: 50, boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}
                  animate={{
                    opacity: isDropped ? 0.4 : 1,
                    scale: draggedId === el.id ? 1.05 : 1,
                  }}
                  className={`p-2 rounded bg-white/[0.02] border text-[11px] font-mono transition-colors ${
                    isDropped
                      ? "border-white/[0.04] text-white/30 cursor-not-allowed"
                      : "border-white/[0.06] text-white/50 cursor-grab hover:border-white/[0.12] hover:text-white/70 active:cursor-grabbing"
                  }`}
                >
                  <span className="mr-1.5 text-white/40">{el.icon}</span>
                  {el.label}
                </motion.div>
              );
            })}
            {!droppedElement && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: isInView ? 0.5 : 0 }}
                transition={{ delay: 1.5 }}
                className="hidden sm:block text-[9px] text-white/30 mt-3 leading-relaxed"
              >
                Drag an element →
              </motion.p>
            )}
          </div>

          {/* Canvas area - MONOCHROME */}
          <motion.div
            ref={dropZoneRef}
            animate={{
              borderColor: isHoveringDropZone
                ? "rgba(255, 255, 255, 0.24)"
                : droppedElement
                ? "rgba(255, 255, 255, 0.12)"
                : "rgba(255, 255, 255, 0.08)",
              backgroundColor: isHoveringDropZone
                ? "rgba(255, 255, 255, 0.03)"
                : "rgba(255, 255, 255, 0.01)",
            }}
            transition={{ duration: 0.2 }}
            className="sm:col-span-3 rounded border border-dashed p-3 relative overflow-hidden min-h-[160px] sm:min-h-0"
          >
            <AnimatePresence>
              {showCelebration && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={celebrationVariants}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="w-32 h-32 rounded-full bg-white/20 blur-xl" />
                </motion.div>
              )}
            </AnimatePresence>

            {!droppedElement && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isHoveringDropZone ? 1 : 0.3 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className={`text-[12px] font-mono ${isHoveringDropZone ? "text-white/70" : "text-white/30"}`}>
                  {isHoveringDropZone ? "Release to drop" : "Drop elements here"}
                </span>
              </motion.div>
            )}

            <AnimatePresence>
              {droppedElement && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="w-full p-4 rounded bg-white/[0.02] border border-white/[0.08]"
                >
                  <div className="text-[11px] font-mono text-white/40 mb-3">
                    {droppedElement.label.toLowerCase()}_001
                  </div>

                  {droppedElement.id === 1 && (
                    <>
                      <div className="text-[13px] font-medium text-white mb-3">Where should we meet?</div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full border border-white/30" />
                          <span className="text-[11px] text-white/40 flex-1">Library</span>
                          <div className="w-16 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: "45%" }}
                              transition={{ delay: 0.3, duration: 0.5 }}
                              className="h-full bg-white/30"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full border border-white/60 bg-white/20" />
                          <span className="text-[11px] text-white/70 flex-1">Student Union</span>
                          <div className="w-16 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: "55%" }}
                              transition={{ delay: 0.4, duration: 0.5 }}
                              className="h-full bg-white/50"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {droppedElement.id === 2 && (
                    <>
                      <div className="text-[13px] font-medium text-white mb-3">Study Session Timer</div>
                      <div className="text-center">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-[32px] font-mono text-white tabular-nums"
                        >
                          25:00
                        </motion.div>
                        <div className="text-[10px] text-white/40 mt-1">Pomodoro Mode</div>
                      </div>
                    </>
                  )}

                  {droppedElement.id === 3 && (
                    <>
                      <div className="text-[13px] font-medium text-white mb-3">Event RSVP</div>
                      <div className="space-y-2">
                        <div className="h-6 rounded bg-white/[0.03] border border-white/[0.06]" />
                        <div className="h-6 rounded bg-white/[0.03] border border-white/[0.06]" />
                        <div className="h-5 w-20 rounded bg-white/[0.08] border border-white/[0.12] flex items-center justify-center">
                          <span className="text-[9px] text-white/60 font-medium">Submit</span>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/**
 * Interactive Spaces Chat Demo - MONOCHROME
 */
function InteractiveSpacesDemo({ isInView }: { isInView: boolean }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      user: "You",
      message: inputValue.trim(),
      time: "now",
      isYou: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");

    setShowTypingIndicator(true);
    setTimeout(() => {
      setShowTypingIndicator(false);
      const responseMessage: Message = {
        id: Date.now() + 1,
        user: "Sarah K.",
        message: "Sounds good! See you there",
        time: "now",
      };
      setMessages((prev) => [...prev, responseMessage]);
    }, 1500);
  }, [inputValue]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative">
      <div className="relative rounded-xl border border-white/[0.08] bg-[#0a0a0a] overflow-hidden">
        {/* Header - MONOCHROME */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center text-[10px] font-bold text-white/70 tracking-tight">
            CS
          </div>
          <div>
            <div className="text-[13px] font-medium text-white">CS Club</div>
            <div className="text-[11px] text-white/40 font-mono flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
              <span className="text-[#FFD700]/70">127 online</span>
            </div>
          </div>
        </div>

        {/* Chat - MONOCHROME */}
        <div className="p-4 space-y-4 min-h-[200px] max-h-[280px] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                custom={i}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                variants={i < 3 ? messageVariants : newMessageVariants}
                layout
                className={`flex gap-3 ${msg.isYou ? "justify-end" : ""}`}
              >
                {!msg.isYou && (
                  <div className="w-6 h-6 rounded-full bg-white/[0.06] flex-shrink-0 flex items-center justify-center text-[8px] text-white/50">
                    {msg.user.charAt(0)}
                  </div>
                )}
                <div className={`max-w-[75%] ${msg.isYou ? "text-right" : ""}`}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-[11px] font-medium ${msg.isYou ? "text-white/70" : "text-white/40"}`}>
                      {msg.user}
                    </span>
                    <span className="text-[10px] text-white/30 font-mono">{msg.time}</span>
                  </div>
                  <div className={`text-[13px] px-3 py-2 rounded-lg transition-all duration-200 ${
                    msg.isYou
                      ? "bg-white/[0.08] text-white/80 border border-white/[0.08]"
                      : "bg-white/[0.03] text-white/60 border border-white/[0.04]"
                  }`}>
                    {msg.message}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {showTypingIndicator && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-white/[0.06] flex-shrink-0 flex items-center justify-center text-[8px] text-white/50">
                  S
                </div>
                <div className="px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        custom={i}
                        animate="animate"
                        variants={typingDotVariants}
                        className="w-1.5 h-1.5 rounded-full bg-white/40"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input - MONOCHROME */}
        <div className="px-4 py-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] focus-within:border-white/[0.16] transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Try typing a message..."
              className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/30 outline-none"
            />
            <motion.button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`text-[10px] font-mono transition-colors ${
                inputValue.trim() ? "text-white/70 hover:text-white" : "text-white/20"
              }`}
            >
              ↵
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductShowcase() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      id="product"
      className="relative py-24 md:py-32 overflow-hidden"
      style={{ background: "#050505" }}
    >
      {/* Section divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-6xl mx-auto px-6 md:px-12">

        {/* Product 1: Spaces - MONOCHROME */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid md:grid-cols-2 gap-12 md:gap-20 items-start mb-32 md:mb-40"
        >
          {/* Text */}
          <motion.div variants={fadeInUp} className="order-2 md:order-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-[11px] tracking-widest text-white/40 uppercase">[SPACES]</span>
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#FFD700]/70">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FFD700] animate-pulse" />
                LIVE
              </span>
            </div>

            <h3 className="text-[24px] md:text-[28px] font-semibold text-white mb-4 tracking-[-0.01em]">
              Spaces are the unit of campus life.
            </h3>

            <p className="text-[15px] text-white/50 leading-relaxed mb-6">
              Posts + Events are foundational. Everything else builds from there.
              Real-time chat. Your community, your rules.
            </p>

            <div className="space-y-2.5 font-mono text-[13px]">
              <div className="flex items-center gap-3 text-white/60">
                <span className="text-white/30">→</span>
                400+ orgs pre-loaded
              </div>
              <div className="flex items-center gap-3 text-white/60">
                <span className="text-white/30">→</span>
                Claim instantly, no approval
              </div>
              <div className="flex items-center gap-3 text-white/60">
                <span className="text-white/30">→</span>
                Your data, your rules
              </div>
            </div>
          </motion.div>

          {/* Demo */}
          <motion.div variants={fadeInUp} className="order-1 md:order-2">
            <InteractiveSpacesDemo isInView={isInView} />
          </motion.div>
        </motion.div>

        {/* Product 2: HiveLab - MONOCHROME */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid md:grid-cols-2 gap-12 md:gap-20 items-start"
        >
          {/* Demo */}
          <motion.div variants={fadeInUp}>
            <InteractiveHiveLabDemo isInView={isInView} />
          </motion.div>

          {/* Text */}
          <motion.div variants={fadeInUp}>
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-[11px] tracking-widest text-white/40 uppercase">[HIVELAB]</span>
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#FFD700]/70">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
                FOR LEADERS
              </span>
            </div>

            <h3 className="text-[24px] md:text-[28px] font-semibold text-white mb-4 tracking-[-0.01em]">
              HiveLab is where campus software gets built.
            </h3>

            <p className="text-[15px] text-white/50 leading-relaxed mb-6">
              Build from Elements. Deploy into Spaces. Measure usage. Evolve weekly.
              <span className="text-white/60"> Space leaders get access to build tools for their community.</span>
            </p>

            <div className="space-y-2.5 font-mono text-[13px]">
              <div className="flex items-center gap-3 text-white/60">
                <span className="text-white/30">→</span>
                27 elements ready
              </div>
              <div className="flex items-center gap-3 text-white/60">
                <span className="text-white/30">→</span>
                AI-assisted generation
              </div>
              <div className="flex items-center gap-3 text-white/60">
                <span className="text-white/30">→</span>
                Deploy to any Space
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
