"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@hive/ui";
import { staggerContainer, staggerItem, transition } from "../shared/animations";
import type { OnboardingData } from "../shared/types";

interface FacultyProfileStepProps {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "School of Management",
  "College of Arts and Sciences",
  "School of Nursing",
  "School of Pharmacy",
  "School of Law",
  "School of Medicine",
  "School of Architecture",
  "Graduate School of Education",
  "School of Social Work",
  "School of Public Health",
  "Athletics Department",
  "Student Affairs",
  "Other",
];

export function FacultyProfileStep({
  data,
  onUpdate,
  onNext,
  error,
  setError,
}: FacultyProfileStepProps) {
  const { name } = data;
  const [department, setDepartment] = useState("");
  const [departmentOpen, setDepartmentOpen] = useState(false);

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("Enter your name");
      return;
    }

    if (!department) {
      setError("Select your department");
      return;
    }

    setError(null);
    // Store department in courseCode field for now
    onUpdate({ courseCode: department });
    onNext();
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-5"
    >
      {/* Icon header */}
      <motion.div
        variants={staggerItem}
        transition={transition}
        className="flex justify-center mb-2"
      >
        <div className="h-16 w-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
          <Building2 className="h-8 w-8 text-gold-500" />
        </div>
      </motion.div>

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
            placeholder="Dr. Jane Smith"
            className="h-12 bg-black border-neutral-800 text-white placeholder:text-neutral-600 focus:border-neutral-600"
          />
        </div>
      </motion.div>

      {/* Department combobox */}
      <motion.div variants={staggerItem} transition={transition}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-400">
            Department
          </label>
          <Popover open={departmentOpen} onOpenChange={setDepartmentOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                role="combobox"
                aria-expanded={departmentOpen}
                className="w-full h-12 rounded-xl border border-neutral-800 bg-black px-4 text-base text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-neutral-700 focus:border-neutral-600 transition-colors"
              >
                <span className={department ? "text-white" : "text-neutral-500"}>
                  {department || "Select department..."}
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
                  placeholder="Search departments..."
                  className="h-11 bg-transparent px-4 text-sm text-white placeholder:text-neutral-500"
                />
                <CommandList className="max-h-[240px] overflow-y-auto p-1">
                  <CommandEmpty className="py-6 text-center text-sm text-neutral-500">
                    No department found.
                  </CommandEmpty>
                  <CommandGroup>
                    {DEPARTMENTS.map((d) => (
                      <CommandItem
                        key={d}
                        value={d}
                        onSelect={() => {
                          setDepartment(d);
                          setDepartmentOpen(false);
                          setError(null);
                        }}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg cursor-pointer text-white hover:bg-neutral-800 data-[selected=true]:bg-neutral-800"
                      >
                        <Check
                          className={`h-4 w-4 shrink-0 ${
                            department === d ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        <span>{d}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </motion.div>

      {/* Info box */}
      <motion.div variants={staggerItem} transition={transition}>
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
          <p className="text-xs text-neutral-500">
            Faculty accounts can create official department spaces, manage course
            pages, and connect with students in a moderated environment.
          </p>
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
          disabled={!name.trim() || !department}
          className="w-full h-12 bg-white text-black hover:bg-neutral-200 font-semibold text-sm disabled:opacity-40 transition-colors"
        >
          Continue
        </Button>
      </motion.div>
    </motion.div>
  );
}
