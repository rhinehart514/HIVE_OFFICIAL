"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Check, ChevronsUpDown } from "lucide-react";
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@hive/ui";
import { staggerContainer, staggerItem, transition } from "../shared/animations";
import { UB_MAJORS, GRAD_YEARS } from "../shared/constants";
import type { OnboardingData } from "../shared/types";

interface ProfileStepProps {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export function ProfileStep({
  data,
  onUpdate,
  onNext,
  error,
  setError,
}: ProfileStepProps) {
  const { major, graduationYear, profilePhoto } = data;
  const [majorOpen, setMajorOpen] = useState(false);

  const handleSubmit = () => {
    if (!major) {
      setError("Select your major");
      return;
    }

    if (!graduationYear) {
      setError("Select your graduation year");
      return;
    }

    setError(null);
    onNext();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onUpdate({ profilePhoto: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-5"
    >
      {/* Profile photo upload - 3:4 aspect ratio */}
      <motion.div variants={staggerItem} transition={transition}>
        <div className="flex flex-col items-center gap-2 mb-2">
          <label className="relative cursor-pointer group">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="w-28 aspect-[3/4] rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center overflow-hidden group-hover:border-neutral-600 transition-all group-hover:scale-[1.02]">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-7 h-7 text-neutral-500 group-hover:text-neutral-400 transition-colors" />
              )}
            </div>
          </label>
          <button
            type="button"
            onClick={() =>
              document.querySelector<HTMLInputElement>('input[type="file"]')?.click()
            }
            className="text-xs text-neutral-500 hover:text-neutral-400 transition-colors"
          >
            {profilePhoto ? "Change photo" : "Add photo"}
          </button>
        </div>
      </motion.div>

      <motion.div variants={staggerItem} transition={transition}>
        {/* Major combobox - searchable */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-400">
            Your major
          </label>
          <Popover open={majorOpen} onOpenChange={setMajorOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                role="combobox"
                aria-expanded={majorOpen}
                className="w-full h-12 rounded-xl border border-neutral-800 bg-black px-4 text-base text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-neutral-700 focus:border-neutral-600 transition-colors"
              >
                <span className={major ? "text-white" : "text-neutral-500"}>
                  {major || "Search or select..."}
                </span>
                <ChevronsUpDown className="h-4 w-4 shrink-0 text-neutral-500" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="p-0 bg-neutral-900 border-neutral-800 rounded-xl shadow-2xl"
              style={{ width: "var(--radix-popover-trigger-width)" }}
              align="start"
              sideOffset={4}
            >
              <Command className="bg-transparent">
                <CommandInput
                  placeholder="Search majors..."
                  className="h-11 bg-transparent px-4 text-sm text-white placeholder:text-neutral-500"
                />
                <CommandList className="max-h-[240px] overflow-y-auto p-1">
                  <CommandEmpty className="py-6 text-center text-sm text-neutral-500">
                    No major found.
                  </CommandEmpty>
                  <CommandGroup>
                    {UB_MAJORS.map((m) => (
                      <CommandItem
                        key={m}
                        value={m}
                        onSelect={() => {
                          onUpdate({ major: m });
                          setMajorOpen(false);
                          setError(null);
                        }}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg cursor-pointer text-white hover:bg-neutral-800 data-[selected=true]:bg-neutral-800"
                      >
                        <Check
                          className={`h-4 w-4 shrink-0 ${
                            major === m ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        <span>{m}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </motion.div>

      <motion.div variants={staggerItem} transition={transition}>
        {/* Graduation year */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-neutral-400">
            Graduation year
          </label>
          <div className="grid grid-cols-5 gap-2">
            {GRAD_YEARS.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => {
                  onUpdate({ graduationYear: year });
                  setError(null);
                }}
                className={`relative rounded-xl px-2 py-3 text-sm font-semibold transition-all duration-200 ${
                  graduationYear === year
                    ? "bg-[#FFD700] text-black shadow-lg"
                    : "bg-black border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600"
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

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
          disabled={!major || !graduationYear}
          className="w-full h-12 bg-[#FFD700] text-black hover:brightness-110 font-semibold text-sm disabled:opacity-40 transition-all"
          style={{ boxShadow: "0 0 30px rgba(255, 215, 0, 0.15)" }}
        >
          Continue
        </Button>
      </motion.div>
    </motion.div>
  );
}
