"use client";

import { motion } from "framer-motion";
import { Check, X, Loader2, AtSign } from "lucide-react";
import { Button, Input } from "@hive/ui";
import { staggerContainer, staggerItem, transition } from "../shared/animations";
import type { OnboardingData, HandleStatus } from "../shared/types";

interface IdentityStepProps {
  data: OnboardingData;
  handleStatus: HandleStatus;
  handleSuggestions: string[];
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  error: string | null;
  setError: (error: string | null) => void;
  isSubmitting: boolean;
}

export function IdentityStep({
  data,
  handleStatus,
  handleSuggestions,
  onUpdate,
  onNext,
  error,
  setError,
}: IdentityStepProps) {
  const { handle, name } = data;

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("Enter your name");
      return;
    }

    if (!handle.trim()) {
      setError("Choose a handle");
      return;
    }

    if (handleStatus === "invalid") {
      setError("Handle must be 3-20 characters (letters, numbers, . _ -)");
      return;
    }

    if (handleStatus === "taken") {
      setError("That handle is taken");
      return;
    }

    if (handleStatus !== "available") {
      setError("Checking handle availability...");
      return;
    }

    setError(null);
    onNext();
  };

  const getHandleIcon = () => {
    switch (handleStatus) {
      case "checking":
        return <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />;
      case "available":
        return <Check className="h-4 w-4 text-green-500" />;
      case "taken":
      case "invalid":
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <AtSign className="h-4 w-4 text-neutral-500" />;
    }
  };

  const getHandleHint = () => {
    switch (handleStatus) {
      case "checking":
        return "Checking...";
      case "available":
        return "Available!";
      case "taken":
        return "Already taken";
      case "invalid":
        return "3-20 chars: letters, numbers, . _ -";
      default:
        return "hive.so/your-handle";
    }
  };

  const canContinue =
    name.trim().length > 0 &&
    handle.trim().length > 0 &&
    handleStatus === "available";

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-5"
    >
      {/* Full name input */}
      <motion.div variants={staggerItem} transition={transition}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-400">
            Your name
          </label>
          <Input
            type="text"
            autoComplete="name"
            autoFocus
            value={name}
            onChange={(e) => {
              onUpdate({ name: e.target.value });
              setError(null);
            }}
            placeholder="First Last"
            className="h-12 bg-black border-neutral-800 text-white placeholder:text-neutral-600 focus:border-neutral-600"
          />
        </div>
      </motion.div>

      {/* Handle input */}
      <motion.div variants={staggerItem} transition={transition}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-400">
            Choose your handle
          </label>
          <div className="relative">
            <Input
              type="text"
              autoComplete="username"
              value={handle}
              onChange={(e) => {
                onUpdate({ handle: e.target.value.toLowerCase() });
                setError(null);
              }}
              placeholder="yourhandle"
              className={`h-12 pr-10 bg-black border-neutral-800 text-white placeholder:text-neutral-600 focus:border-neutral-600 ${
                handleStatus === "taken" || handleStatus === "invalid"
                  ? "border-red-500/50 focus:border-red-500"
                  : handleStatus === "available"
                  ? "border-green-500/50 focus:border-green-500"
                  : ""
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {getHandleIcon()}
            </div>
          </div>
          <p
            className={`text-xs ${
              handleStatus === "available"
                ? "text-green-500"
                : handleStatus === "taken" || handleStatus === "invalid"
                ? "text-red-400"
                : "text-neutral-500"
            }`}
          >
            {getHandleHint()}
          </p>
        </div>
      </motion.div>

      {/* Handle suggestions when taken */}
      {handleStatus === "taken" && handleSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2 }}
          className="space-y-2"
        >
          <p className="text-xs text-neutral-500">Try one of these:</p>
          <div className="flex flex-wrap gap-2">
            {handleSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onUpdate({ handle: suggestion })}
                className="px-3 py-1.5 text-xs rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors"
              >
                @{suggestion}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-sm font-medium text-red-400"
        >
          {error}
        </motion.p>
      )}

      <motion.div variants={staggerItem} transition={transition}>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!canContinue}
          className="w-full h-12 bg-[#FFD700] text-black hover:brightness-110 font-semibold text-sm disabled:opacity-40 transition-all"
          style={{ boxShadow: "0 0 30px rgba(255, 215, 0, 0.15)" }}
        >
          Continue
        </Button>
      </motion.div>
    </motion.div>
  );
}
