"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Plus, ArrowRight, Users, Sparkles } from "lucide-react";
import { Button, Input } from "@hive/ui";
import { staggerContainer, staggerItem, transition } from "../shared/animations";
import type { UserType } from "../shared/types";

interface SpacesStepProps {
  userType: UserType;
}

// Sample existing spaces for search
const SAMPLE_SPACES = [
  { id: "1", name: "UB Robotics Club", members: 127, category: "Engineering" },
  { id: "2", name: "Entrepreneurship Club", members: 89, category: "Business" },
  { id: "3", name: "Photography Society", members: 64, category: "Arts" },
  { id: "4", name: "Gaming Club", members: 203, category: "Recreation" },
  { id: "5", name: "Women in Computing", members: 156, category: "Tech" },
  { id: "6", name: "Pre-Med Society", members: 312, category: "Health" },
];

export function SpacesStep({ userType }: SpacesStepProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);

  const filteredSpaces = SAMPLE_SPACES.filter((space) =>
    space.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClaimSpace = () => {
    // TODO: Implement space claiming logic
    router.push("/feed");
  };

  const handleCreateSpace = () => {
    // TODO: Implement space creation flow
    router.push("/spaces/create");
  };

  const handleSkip = () => {
    router.push("/feed");
  };

  const isFaculty = userType === "faculty";

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-5"
    >
      {/* Context message */}
      <motion.div variants={staggerItem} transition={transition}>
        <p className="text-sm text-neutral-400 text-center mb-2">
          {isFaculty
            ? "Create or claim your department's official space"
            : "Find your club or start a new space"}
        </p>
      </motion.div>

      {/* Search existing spaces */}
      <motion.div variants={staggerItem} transition={transition}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for your club..."
            className="h-12 pl-11 bg-black border-neutral-800 text-white placeholder:text-neutral-600 focus:border-neutral-600"
          />
        </div>
      </motion.div>

      {/* Spaces list */}
      <motion.div variants={staggerItem} transition={transition}>
        <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
          {filteredSpaces.length > 0 ? (
            filteredSpaces.map((space) => (
              <button
                key={space.id}
                type="button"
                onClick={() => setSelectedSpace(space.id)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  selectedSpace === space.id
                    ? "bg-[#FFD700]/10 border-[#FFD700] text-white"
                    : "bg-neutral-900/50 border-neutral-800 text-neutral-300 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="h-10 w-10 rounded-lg bg-neutral-800 flex items-center justify-center">
                    <Users className="h-5 w-5 text-neutral-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{space.name}</p>
                    <p className="text-xs text-neutral-500">
                      {space.members} members · {space.category}
                    </p>
                  </div>
                </div>
                {selectedSpace === space.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="h-5 w-5 rounded-full bg-[#FFD700] flex items-center justify-center"
                  >
                    <Sparkles className="h-3 w-3 text-black" />
                  </motion.div>
                )}
              </button>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-neutral-500">
                No spaces found matching "{searchQuery}"
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Claim selected space button */}
      {selectedSpace && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            type="button"
            onClick={handleClaimSpace}
            className="w-full h-12 bg-[#FFD700] text-black hover:brightness-110 font-semibold text-sm transition-all"
            style={{ boxShadow: "0 0 30px rgba(255, 215, 0, 0.15)" }}
          >
            <span className="flex items-center justify-center gap-2">
              Claim this space
              <ArrowRight className="h-4 w-4" />
            </span>
          </Button>
        </motion.div>
      )}

      {/* Divider */}
      <motion.div variants={staggerItem} transition={transition}>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-neutral-800" />
          <span className="text-xs text-neutral-600 uppercase tracking-wider">
            or
          </span>
          <div className="flex-1 h-px bg-neutral-800" />
        </div>
      </motion.div>

      {/* Create new space */}
      <motion.div variants={staggerItem} transition={transition}>
        <Button
          type="button"
          variant="secondary"
          onClick={handleCreateSpace}
          className="w-full h-12 text-sm font-medium bg-neutral-900 border-neutral-800 text-white hover:bg-neutral-800"
        >
          <span className="flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" />
            Create a new space
          </span>
        </Button>
      </motion.div>

      {/* Skip option */}
      <motion.div variants={staggerItem} transition={transition}>
        <button
          type="button"
          onClick={handleSkip}
          className="w-full text-sm text-neutral-500 hover:text-white py-3 transition-colors"
        >
          Skip for now
        </button>
      </motion.div>
    </motion.div>
  );
}
