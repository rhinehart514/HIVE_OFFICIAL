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

/**
 * Word Cloud Interests - 180+ flat tags for the interests cloud step
 * Organized by category but displayed as a flat scattered cloud
 */
export const CLOUD_INTERESTS = [
  // Sports & Athletics (25)
  "Basketball", "Soccer", "Football", "Tennis", "Volleyball",
  "Swimming", "Running", "Track & Field", "Hockey", "Lacrosse",
  "Baseball", "Softball", "Golf", "Rowing", "Fencing",
  "Ultimate Frisbee", "Intramurals", "Rock Climbing", "Martial Arts", "Boxing",
  "Yoga", "Cycling", "Skiing", "Snowboarding", "Hiking",

  // Gaming & Esports (15)
  "Gaming", "Esports", "Board Games", "D&D", "Minecraft",
  "Chess", "Poker", "Video Games", "Retro Gaming", "Game Dev",
  "VR Gaming", "Mobile Games", "Speedrunning", "Streaming", "Magic: The Gathering",

  // Music (20)
  "Hip Hop", "EDM", "Indie", "K-Pop", "Jazz",
  "Classical", "Rock", "R&B", "Country", "Pop",
  "Metal", "Punk", "Singing", "Guitar", "Piano",
  "Drums", "DJ", "Music Production", "A Cappella", "Concerts",

  // Arts & Creative (20)
  "Photography", "Film", "Theater", "Dance", "Painting",
  "Drawing", "Sculpture", "Ceramics", "Graphic Design", "Animation",
  "Digital Art", "Fashion Design", "Writing", "Poetry", "Creative Writing",
  "Filmmaking", "Video Editing", "Improv", "Stand-up Comedy", "Cosplay",

  // Tech & Building (20)
  "Coding", "AI", "Startups", "Design", "Robotics",
  "Web Dev", "App Dev", "Machine Learning", "Cybersecurity", "Data Science",
  "Blockchain", "3D Printing", "Hardware", "Open Source", "Hackathons",
  "Product Design", "UX Design", "Game Development", "Cloud Computing", "Tech Entrepreneurship",

  // Academic & Career (20)
  "Pre-Med", "Pre-Law", "Research", "Finance", "Consulting",
  "Investment Banking", "Engineering", "Architecture", "Psychology", "Neuroscience",
  "Biology", "Chemistry", "Physics", "Math", "Economics",
  "Political Science", "Philosophy", "History", "Literature", "Journalism",

  // Social & Causes (20)
  "Volunteering", "Activism", "Greek Life", "Mentoring", "Sustainability",
  "Climate Action", "Social Justice", "Community Service", "Tutoring", "Nonprofit",
  "Mental Health Advocacy", "LGBTQ+ Advocacy", "Women in STEM", "DEI", "Animal Welfare",
  "Food Security", "Homelessness", "Education Equity", "Healthcare Access", "Voting Rights",

  // Lifestyle (20)
  "Fitness", "Cooking", "Fashion", "Travel", "Coffee",
  "Wine", "Beer", "Foodie", "Wellness", "Meditation",
  "Self-Improvement", "Productivity", "Journaling", "Minimalism", "Sustainability",
  "Plant-Based", "Thrifting", "Skincare", "Sneakers", "Watches",

  // Culture & Identity (15)
  "African Culture", "Asian Culture", "Latino Culture", "South Asian", "Middle Eastern",
  "European", "Caribbean", "Native American", "International Students", "First-Gen",
  "LGBTQ+", "Women's Empowerment", "Cultural Exchange", "Language Learning", "Study Abroad",

  // Entertainment (15)
  "Anime", "K-Drama", "True Crime", "Reality TV", "Podcasts",
  "Documentaries", "Marvel", "Star Wars", "Harry Potter", "Lord of the Rings",
  "Sci-Fi", "Fantasy", "Horror", "Comedy", "Drama",

  // Hobbies (10)
  "Collecting", "Puzzles", "Trivia", "Escape Rooms", "Karaoke",
  "Bowling", "Camping", "Fishing", "Gardening", "Astronomy",
] as const;

export type CloudInterest = typeof CLOUD_INTERESTS[number];

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
