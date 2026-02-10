"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  UsersIcon,
  ArrowPathIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";

// Aliases for lucide compatibility
const Search = MagnifyingGlassIcon;
const MapPin = MapPinIcon;
const Users = UsersIcon;
const Loader2 = ArrowPathIcon;
const GraduationCap = AcademicCapIcon;
import { useEffect, useState, useRef } from "react";
import type { School } from "@hive/core";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type UISchool = School & {
  status?: "active" | "waitlist";
  waitlistCount?: number;
};

export function SchoolSearch() {
  const [query, setQuery] = useState("");
  const [schools, setSchools] = useState<UISchool[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<UISchool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const router = useRouter();
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSchools = async () => {
      if (schools.length > 0) return; // Fetch only once
      try {
        setLoading(true);
        const response = await fetch("/api/schools");
        if (!response.ok) {
          throw new Error("Failed to fetch schools");
        }
        const data: UISchool[] = await response.json();
        setSchools(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchSchools();
  }, [schools.length]);

  useEffect(() => {
    if (query.trim() === "") {
      setFilteredSchools([]);
      return;
    }

    const lowerCaseQuery = query.toLowerCase();
    const filtered = schools.filter((school) =>
      school.name.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredSchools(filtered);
    setActiveIndex(-1); // Reset active index on new results
  }, [query, schools]);

  const handleSchoolSelect = (school: UISchool) => {
    if (school.status === "active") {
      router.push(`/enter?schoolId=${school.id}&schoolName=${encodeURIComponent(school.name)}&domain=${encodeURIComponent(school.domain)}`);
    } else {
      router.push(`/waitlist/${school.id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prevIndex) =>
        prevIndex < filteredSchools.length - 1 ? prevIndex + 1 : prevIndex
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSchoolSelect(filteredSchools[activeIndex]);
    }
  };

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeItem = listRef.current.children[activeIndex] as HTMLLIElement;
      activeItem?.focus();
    }
  }, [activeIndex]);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50 z-10" />
        <motion.input
          ref={inputRef}
          type="search"
          placeholder="Search for your school..."
          className={cn(
            "w-full pl-12 pr-4 py-4 bg-black/40 rounded-lg text-white placeholder:text-white/50 transition-all duration-300",
            "focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50",
            "hover:bg-black/50 hover:border-white/25"
          )}
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={filteredSchools.length > 0 && query.length > 0}
          aria-controls="school-results"
          aria-activedescendant={activeIndex >= 0 ? `school-item-${activeIndex}` : undefined}
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        />
      </div>

      {/* Loading State */}
      {loading && query && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center py-4 text-white/50"
          aria-live="polite"
        >
          <Loader2 className="w-4 h-4  mr-2" />
          <span className="text-sm">Searching schools...</span>
        </motion.div>
      )}

      {/* Error State */}
      {error && query && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
          aria-live="assertive"
        >
          {error}
        </motion.div>
      )}
      
      {/* Results Dropdown */}
      <AnimatePresence>
        {query.trim() !== "" && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="bg-black/40 border border-white/[0.06] rounded-lg overflow-hidden max-h-80 overflow-y-auto"
          >
            {filteredSchools.length > 0 ? (
              <ul id="school-results" role="listbox" ref={listRef} className="p-2">
                {filteredSchools.map((school, index) => (
                  <motion.li
                    key={school.id}
                    id={`school-item-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    className={cn(
                      "p-4 rounded-lg cursor-pointer transition-all duration-200border-transparent",
                      index === activeIndex 
                        ? "bg-white/[0.06] border-white/[0.06]" 
                        : "hover:bg-white/[0.06] hover:border-white/[0.06]"
                    )}
                    onClick={() => handleSchoolSelect(school)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSchoolSelect(school);
                      }
                    }}
                    tabIndex={-1}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ opacity: 0.9 }}
                    whileTap={{ opacity: 0.8 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/[0.06] rounded-lg flex items-center justify-centerborder-white/[0.06]">
                        <GraduationCap className="w-5 h-5 text-white/50" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white text-sm">{school.name}</div>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center text-xs text-white/50">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span>{school.domain}</span>
                          </div>
                          {school.status === "waitlist" && (
                            <div className="flex items-center text-xs text-amber-400">
                              <Users className="w-3 h-3 mr-1" />
                              <span>{school.waitlistCount} waiting</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium",
                        school.status === "active" 
                          ? "bg-emerald-500/20 text-emerald-400border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-400border-amber-500/30"
                      )}>
                        {school.status === "active" ? "Active" : "Waitlist"}
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 text-center text-white/50"
              >
                <GraduationCap className="w-12 h-12 mx-auto mb-3 text-white/50" />
                <p className="text-sm">No schools found</p>
                <p className="text-xs text-white/50 mt-1">
                  Try a different search term
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 
