'use client';

/**
 * PersonalityQuizCard — Typeform-style personality quiz.
 *
 * One question at a time, result card at end with personality description.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CARD } from '@hive/tokens';
import type { ShellComponentProps, PersonalityQuizConfig, PersonalityQuizState } from '@/lib/shells/types';

function PersonalityQuizCard({
  config,
  state,
  currentUserId,
  onAction,
  compact = true,
}: ShellComponentProps<PersonalityQuizConfig, PersonalityQuizState>) {
  const { title, questions, results: resultDefs } = config;
  const responses = state?.responses ?? {};
  const resultCounts = state?.resultCounts ?? {};
  const participantCount = state?.participantCount ?? 0;

  const myResponse = responses[currentUserId];
  const myResult = myResponse?.result;
  const myResultDef = myResult ? resultDefs[myResult] : null;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [localAnswers, setLocalAnswers] = useState<string[]>([]);

  const question = questions[currentIdx];
  const isComplete = !!myResult;

  const handleAnswer = (optionText: string, resultKey: string) => {
    const newAnswers = [...localAnswers, optionText];
    setLocalAnswers(newAnswers);
    onAction({ type: 'quiz_answer', questionIdx: currentIdx, optionText });

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      onAction({ type: 'quiz_complete' });
    }
  };

  // Result card
  if (isComplete && myResultDef) {
    const topResults = Object.entries(resultCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    return (
      <div className={`${CARD.default} p-4 ${compact ? 'max-w-sm' : 'max-w-md'}`}>
        <p className="text-white text-sm font-medium mb-4">{title}</p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/[0.03] p-4 text-center mb-4"
        >
          <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1">You are</p>
          <p className="text-[20px] font-semibold text-[#FFD700] mb-2">{myResultDef.label}</p>
          <p className="text-[13px] text-white/50 leading-snug">{myResultDef.description}</p>
        </motion.div>

        {topResults.length > 0 && (
          <div className="space-y-1">
            <p className="font-mono text-[11px] uppercase tracking-wider text-white/30 mb-1">Results</p>
            {topResults.map(([key, count]) => {
              const def = resultDefs[key];
              if (!def) return null;
              const pct = participantCount > 0 ? Math.round((count / participantCount) * 100) : 0;
              return (
                <div key={key} className="flex items-center justify-between text-[13px]">
                  <span className={key === myResult ? 'text-[#FFD700]' : 'text-white/50'}>
                    {def.label}
                  </span>
                  <span className="font-mono text-[11px] text-white/30">{pct}%</span>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[11px] text-white/30 mt-3">{participantCount} took this quiz</p>
      </div>
    );
  }

  // Question card
  if (!question) return null;

  return (
    <div className={`${CARD.default} p-4 ${compact ? 'max-w-sm' : 'max-w-md'}`}>
      <p className="text-white text-sm font-medium mb-1">{title}</p>

      {/* Progress bar */}
      <div className="flex gap-1 mb-4">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-100 ${
              i === currentIdx ? 'bg-[#FFD700]' : i < currentIdx ? 'bg-white/20' : 'bg-white/[0.05]'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.15 }}
        >
          <p className="text-white/70 text-[15px] mb-4 leading-snug">
            {question.question}
          </p>

          <div className="flex flex-col gap-2">
            {question.options.map((opt) => (
              <button
                key={opt.text}
                onClick={() => handleAnswer(opt.text, opt.resultKey)}
                className="px-4 py-3 rounded-xl border border-white/[0.10] bg-white/[0.03] text-left
                  text-sm text-white/70 hover:bg-white/[0.05] hover:text-white
                  transition-colors duration-100"
              >
                {opt.text}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <p className="text-[11px] text-white/30 mt-3">
        {currentIdx + 1} of {questions.length}
      </p>
    </div>
  );
}

export default PersonalityQuizCard;
