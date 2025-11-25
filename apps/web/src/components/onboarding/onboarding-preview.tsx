"use client";

import { motion, AnimatePresence } from "framer-motion";
import { User, GraduationCap, Briefcase, Check } from "lucide-react";
import Image from "next/image";
import type { HandleStatus, UserType, OnboardingStep } from "./shared/types";

interface OnboardingPreviewProps {
  userType: UserType;
  name: string;
  handle: string;
  handleStatus: HandleStatus;
  major: string;
  graduationYear: number | null;
  interests: string[];
  profilePhoto: string | null;
  courseCode?: string;
  currentStep: OnboardingStep;
}

export function OnboardingPreview({
  userType,
  name,
  handle,
  handleStatus,
  major,
  graduationYear,
  interests,
  profilePhoto,
  courseCode,
}: OnboardingPreviewProps) {
  const getRoleBadge = () => {
    switch (userType) {
      case "student":
        return { icon: GraduationCap, label: "Student" };
      case "alumni":
        return { icon: User, label: "Alumni" };
      case "faculty":
        return { icon: Briefcase, label: "Faculty" };
      default:
        return null;
    }
  };

  const roleBadge = getRoleBadge();
  const hasContent = name || handle || userType;

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 relative">
      {/* Subtle dot grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Breathing gold ambient glow */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.03, 0.05, 0.03],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#FFD700] rounded-full blur-[100px] pointer-events-none"
      />

      {/* Profile Card Preview */}
      <motion.div
        layout
        className={`relative w-full max-w-sm bg-neutral-900 rounded-2xl border overflow-hidden shadow-2xl ${
          hasContent ? "border-neutral-800/50" : "border-neutral-800/30"
        }`}
      >
        {/* Header with photo */}
        <div className="relative h-24 bg-gradient-to-br from-neutral-800 to-neutral-900">
          {/* Gold accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#FFD700]/30 to-transparent" />

          {/* Profile photo */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
            <motion.div
              layout
              className={`w-20 h-20 rounded-2xl overflow-hidden border-4 border-neutral-900 ${
                profilePhoto ? "" : "bg-neutral-800"
              } flex items-center justify-center shadow-lg`}
            >
              {profilePhoto ? (
                <Image
                  src={profilePhoto}
                  alt="Profile"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-neutral-500" />
              )}
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-14 pb-6 px-6 space-y-4">
          {/* Name and handle */}
          <div className="text-center">
            <AnimatePresence mode="wait">
              {name ? (
                <motion.h3
                  key="name"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="font-semibold text-lg text-white"
                >
                  {name}
                </motion.h3>
              ) : (
                <motion.h3
                  key="placeholder-name"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-semibold text-lg text-neutral-600"
                >
                  Your name
                </motion.h3>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {handle ? (
                <motion.p
                  key="handle"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className={`text-sm font-medium ${
                    handleStatus === "available"
                      ? "text-green-400"
                      : handleStatus === "taken" || handleStatus === "invalid"
                      ? "text-red-400"
                      : "text-neutral-400"
                  }`}
                >
                  @{handle}
                  {handleStatus === "available" && (
                    <Check className="inline-block w-3.5 h-3.5 ml-1" />
                  )}
                </motion.p>
              ) : (
                <motion.p
                  key="placeholder-handle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-neutral-600"
                >
                  @handle
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Role badge */}
          <AnimatePresence>
            {roleBadge && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex justify-center"
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-800 text-neutral-300 rounded-full">
                  <roleBadge.icon className="w-3.5 h-3.5" />
                  {roleBadge.label}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Academic info */}
          <AnimatePresence>
            {(major || graduationYear) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="text-center text-sm text-neutral-400"
              >
                {major && <span>{major}</span>}
                {major && graduationYear && <span className="mx-1.5">•</span>}
                {graduationYear && <span>Class of {graduationYear}</span>}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Course code for faculty */}
          <AnimatePresence>
            {courseCode && userType === "faculty" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="text-center"
              >
                <span className="text-xs font-mono bg-neutral-800 px-3 py-1.5 rounded-lg text-neutral-300">
                  {courseCode}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interests */}
          <AnimatePresence>
            {interests.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex flex-wrap justify-center gap-1.5 pt-2"
              >
                {interests.map((interest) => (
                  <motion.span
                    key={interest}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="px-2.5 py-1 text-xs bg-[#FFD700] text-black rounded-full font-medium"
                  >
                    {interest}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
