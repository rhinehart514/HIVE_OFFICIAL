"use client";

import { motion, AnimatePresence } from "framer-motion";
import { User, GraduationCap, Briefcase, Check, Shield } from "lucide-react";
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
        return { icon: Shield, label: "Alumni" };
      case "faculty":
        return { icon: Briefcase, label: "Faculty" };
      default:
        return null;
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-black">
      {/* Profile Card */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[280px] flex flex-col items-center"
      >
        {/* Avatar - portrait rectangle */}
        <motion.div
          layout
          className="relative w-[88px] h-[112px] rounded-2xl overflow-hidden bg-neutral-800 border-[3px] border-neutral-700 shadow-lg"
        >
          {profilePhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profilePhoto}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-10 h-10 text-neutral-500" strokeWidth={1.5} />
            </div>
          )}
        </motion.div>

        {/* Name */}
        <div className="mt-4 text-center">
          <AnimatePresence mode="wait">
            <motion.h2
              key={name || "placeholder"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`text-2xl font-bold tracking-tight ${
                name ? "text-white" : "text-neutral-600"
              }`}
            >
              {name || "Your Name"}
            </motion.h2>
          </AnimatePresence>

          {/* Handle */}
          <AnimatePresence mode="wait">
            <motion.div
              key={handle || "placeholder-handle"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-1.5 mt-1"
            >
              <span
                className={`text-sm ${
                  handle
                    ? handleStatus === "available"
                      ? "text-emerald-400"
                      : handleStatus === "taken" || handleStatus === "invalid"
                      ? "text-red-400"
                      : "text-neutral-400"
                    : "text-neutral-600"
                }`}
              >
                @{handle || "username"}
              </span>
              {handle && handleStatus === "available" && (
                <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2.5} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Badges row */}
        <AnimatePresence>
          {(roleBadge || major || graduationYear) && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap justify-center gap-2 mt-4"
            >
              {/* Role badge */}
              {roleBadge && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gold-500 border border-gold-500/40 rounded bg-transparent">
                  <roleBadge.icon className="w-3 h-3" />
                  {roleBadge.label}
                </span>
              )}

              {/* Class year badge */}
              {graduationYear && (
                <span className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 border border-neutral-600 rounded bg-transparent">
                  Class of {graduationYear}
                </span>
              )}

              {/* Major/School badge */}
              {major && (
                <span className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 border border-neutral-600 rounded bg-transparent">
                  {major}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Course code for faculty */}
        <AnimatePresence>
          {courseCode && userType === "faculty" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-3"
            >
              <span className="text-xs font-mono px-3 py-1.5 rounded text-neutral-300 border border-neutral-600 bg-transparent">
                {courseCode}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Interests - outline style */}
        <AnimatePresence>
          {interests.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap justify-center gap-1.5 mt-4"
            >
              {interests.slice(0, 4).map((interest, index) => (
                <motion.span
                  key={interest}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="px-2.5 py-1 text-xs font-medium text-gold-500 border border-gold-500/40 rounded-full bg-transparent"
                >
                  {interest}
                </motion.span>
              ))}
              {interests.length > 4 && (
                <span className="px-2.5 py-1 text-xs font-medium text-neutral-400 border border-neutral-600 rounded-full bg-transparent">
                  +{interests.length - 4}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Profile button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <div className="px-5 py-2 text-sm font-medium text-neutral-500 border border-neutral-700 rounded-lg bg-transparent">
            Edit Profile
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
