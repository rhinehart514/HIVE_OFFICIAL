// Onboarding Constants
// Import comprehensive data from @hive/core
import {
  UB_UNDERGRADUATE_MAJORS,
  UB_GRADUATE_PROGRAMS,
  UB_INTEREST_CATEGORIES as CORE_INTEREST_CATEGORIES,
  type InterestCategory,
} from '@hive/core';

// Export comprehensive majors from @hive/core
// 112 undergraduate + 368 graduate programs
export const UB_MAJORS = UB_UNDERGRADUATE_MAJORS;
export const UB_GRADUATE_MAJORS = UB_GRADUATE_PROGRAMS;

// Combined majors for graduate/alumni user types
export const ALL_MAJORS = [...UB_UNDERGRADUATE_MAJORS, ...UB_GRADUATE_PROGRAMS];

// Living situation options for residential status
export const LIVING_SITUATIONS = [
  { value: "on-campus", label: "On Campus" },
  { value: "off-campus", label: "Off Campus" },
  { value: "commuter", label: "Commuter" },
  { value: "not-sure", label: "Not Sure" },
] as const;

// Re-export interest categories from @hive/core
// 15 UB-specific categories with authentic campus lore
export const UB_INTEREST_CATEGORIES = CORE_INTEREST_CATEGORIES;
export type { InterestCategory };

// Flat list of all curated interests for easy rendering
export const CURATED_INTERESTS = CORE_INTEREST_CATEGORIES.flatMap(cat => cat.items);

// Legacy - kept for backwards compatibility
export const INTEREST_TAGS = [
  "Tech",
  "Sports",
  "Music",
  "Art",
  "Gaming",
  "Fitness",
  "Food",
  "Travel",
  "Movies",
  "Reading",
  "Photography",
  "Dance",
  "Entrepreneurship",
  "Volunteering",
  "Fashion",
  "Science",
];

// Max interests a user can select (curated + custom combined)
export const MAX_INTERESTS = 10;
export const MAX_INTEREST_LENGTH = 50;

// Student graduation years (current and future)
export const GRAD_YEARS = [2025, 2026, 2027, 2028, 2029];

// Alumni graduation years (past) - for early access users
// Show a range of recent years to keep UI manageable
const currentYear = new Date().getFullYear();
export const ALUMNI_GRAD_YEARS = [
  currentYear - 1, // 2024
  currentYear - 2, // 2023
  currentYear - 3, // 2022
  currentYear - 4, // 2021
  currentYear - 5, // 2020
];

// Faculty - can be any recent year or "N/A"
export const FACULTY_GRAD_YEARS = [
  currentYear - 5,
  currentYear - 10,
  currentYear - 15,
  currentYear - 20,
  1990, // "Earlier" option
];

// Handle validation regex - matches server-side validation
// Allows letters, numbers, underscores, periods, and hyphens
export const HANDLE_REGEX = /^[a-zA-Z0-9._-]{3,20}$/;
