/**
 * UB Campus Dining Data
 *
 * Comprehensive data for University at Buffalo dining locations.
 * This data is derived from publicly available UB Campus Dining information.
 *
 * Data sources:
 * - UB Campus Dining website
 * - UB Maps
 * - Public hours of operation
 *
 * Last updated: January 2026
 */

import type {
  DiningLocation,
  DayOfWeek,
  DailyHours,
  MealPeriod,
} from '../dining';

// Helper to create standard weekday hours
function weekdayHours(openTime: string, closeTime: string): DailyHours[] {
  const weekdays: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  return weekdays.map(day => ({
    day,
    isOpen: true,
    openTime,
    closeTime,
  }));
}

// Helper to create weekend hours
function weekendHours(openTime: string, closeTime: string): DailyHours[] {
  const weekend: DayOfWeek[] = ['saturday', 'sunday'];
  return weekend.map(day => ({
    day,
    isOpen: true,
    openTime,
    closeTime,
  }));
}

// Helper to create closed weekend
function closedWeekend(): DailyHours[] {
  return [
    { day: 'saturday', isOpen: false },
    { day: 'sunday', isOpen: false },
  ];
}

// Helper for standard meal periods
function standardMealPeriods(): MealPeriod[] {
  const weekdays: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const weekend: DayOfWeek[] = ['saturday', 'sunday'];

  return [
    {
      type: 'breakfast',
      startTime: '07:00',
      endTime: '10:30',
      days: weekdays,
      menuHighlights: ['Eggs', 'Pancakes', 'Oatmeal', 'Fresh Fruit'],
    },
    {
      type: 'lunch',
      startTime: '11:00',
      endTime: '14:00',
      days: weekdays,
      menuHighlights: ['Grill Items', 'Salad Bar', 'Hot Entrees'],
    },
    {
      type: 'dinner',
      startTime: '17:00',
      endTime: '20:00',
      days: [...weekdays, ...weekend],
      menuHighlights: ['Rotating Entrees', 'Pasta Station', 'Vegetarian Options'],
    },
    {
      type: 'brunch',
      startTime: '10:00',
      endTime: '14:00',
      days: weekend,
      menuHighlights: ['Brunch Favorites', 'Made-to-Order Omelets'],
    },
  ];
}

/**
 * UB North Campus Dining Locations
 */
export const UB_DINING_LOCATIONS: DiningLocation[] = [
  // ==========================================================================
  // NORTH CAMPUS - Main Dining Halls
  // ==========================================================================
  {
    id: 'ub-crossroads',
    campusId: 'ub-buffalo',
    name: 'Crossroads Culinary Center',
    description: 'All-you-care-to-eat dining hall featuring global cuisines and local favorites',
    type: 'dining-hall',
    building: 'Ellicott Complex',
    floor: '1',
    coordinates: {
      latitude: 43.0009,
      longitude: -78.7885,
    },
    hours: [
      ...weekdayHours('07:00', '21:00'),
      { day: 'saturday', isOpen: true, openTime: '10:00', closeTime: '20:00' },
      { day: 'sunday', isOpen: true, openTime: '10:00', closeTime: '20:00' },
    ],
    mealPeriods: standardMealPeriods(),
    dietaryOptions: ['vegetarian', 'vegan', 'gluten-free', 'halal', 'allergen-friendly'],
    paymentMethods: ['meal-plan', 'dining-dollars', 'credit-card', 'campus-cash'],
    priceRange: 2,
    popularItems: ['Build Your Own Stir Fry', 'Pizza Station', 'Salad Bar', 'Global Kitchen'],
    avgWaitTime: 10,
    seatingCapacity: 600,
    websiteUrl: 'https://www.buffalo.edu/campusdining',
    imageUrl: '/images/dining/crossroads.jpg',
    isActive: true,
    lastUpdated: new Date().toISOString(),
    dataSource: 'manual',
  },

  {
    id: 'ub-c3',
    campusId: 'ub-buffalo',
    name: 'C3 (Center for Tomorrow)',
    description: 'Contemporary dining experience with diverse food options and modern atmosphere',
    type: 'dining-hall',
    building: 'Center for Tomorrow',
    floor: '1',
    coordinates: {
      latitude: 43.0025,
      longitude: -78.7892,
    },
    hours: [
      ...weekdayHours('07:30', '20:00'),
      { day: 'saturday', isOpen: true, openTime: '11:00', closeTime: '19:00' },
      { day: 'sunday', isOpen: true, openTime: '11:00', closeTime: '19:00' },
    ],
    mealPeriods: [
      {
        type: 'breakfast',
        startTime: '07:30',
        endTime: '10:30',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        menuHighlights: ['Fresh Bakery', 'Hot Breakfast', 'Smoothies'],
      },
      {
        type: 'lunch',
        startTime: '11:00',
        endTime: '14:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        menuHighlights: ['Sushi', 'Poke Bowls', 'Mediterranean'],
      },
      {
        type: 'dinner',
        startTime: '17:00',
        endTime: '20:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        menuHighlights: ['Chef Specials', 'Grill', 'Comfort Food'],
      },
    ],
    dietaryOptions: ['vegetarian', 'vegan', 'gluten-free', 'halal'],
    paymentMethods: ['meal-plan', 'dining-dollars', 'credit-card', 'campus-cash'],
    priceRange: 2,
    popularItems: ['Sushi Bar', 'Poke Bowls', 'Ramen Station'],
    avgWaitTime: 8,
    seatingCapacity: 400,
    websiteUrl: 'https://www.buffalo.edu/campusdining',
    imageUrl: '/images/dining/c3.jpg',
    isActive: true,
    lastUpdated: new Date().toISOString(),
    dataSource: 'manual',
  },

  {
    id: 'ub-governors',
    campusId: 'ub-buffalo',
    name: "Governor's Dining Center",
    description: 'Classic university dining with home-style meals and comfort food',
    type: 'dining-hall',
    building: 'Governors Complex',
    floor: '1',
    coordinates: {
      latitude: 43.0045,
      longitude: -78.7910,
    },
    hours: [
      ...weekdayHours('07:00', '20:00'),
      { day: 'saturday', isOpen: true, openTime: '10:00', closeTime: '19:00' },
      { day: 'sunday', isOpen: true, openTime: '10:00', closeTime: '19:00' },
    ],
    mealPeriods: standardMealPeriods(),
    dietaryOptions: ['vegetarian', 'vegan', 'gluten-free'],
    paymentMethods: ['meal-plan', 'dining-dollars', 'credit-card', 'campus-cash'],
    priceRange: 2,
    popularItems: ['Comfort Food Station', 'Deli', 'Homestyle Entrees'],
    avgWaitTime: 5,
    seatingCapacity: 350,
    websiteUrl: 'https://www.buffalo.edu/campusdining',
    imageUrl: '/images/dining/governors.jpg',
    isActive: true,
    lastUpdated: new Date().toISOString(),
    dataSource: 'manual',
  },

  // ==========================================================================
  // NORTH CAMPUS - Food Courts & Quick Service
  // ==========================================================================
  {
    id: 'ub-sizzles',
    campusId: 'ub-buffalo',
    name: 'Sizzles',
    description: 'Quick-service grill featuring burgers, chicken, and American favorites',
    type: 'food-court',
    building: 'Student Union',
    floor: '1',
    coordinates: {
      latitude: 43.0012,
      longitude: -78.7867,
    },
    hours: [
      ...weekdayHours('10:30', '22:00'),
      { day: 'saturday', isOpen: true, openTime: '11:00', closeTime: '20:00' },
      { day: 'sunday', isOpen: true, openTime: '12:00', closeTime: '20:00' },
    ],
    mealPeriods: [
      {
        type: 'all-day',
        startTime: '10:30',
        endTime: '22:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        menuHighlights: ['Burgers', 'Chicken Sandwiches', 'Fries'],
      },
    ],
    dietaryOptions: ['vegetarian'],
    paymentMethods: ['meal-plan', 'dining-dollars', 'credit-card', 'cash', 'campus-cash'],
    priceRange: 2,
    popularItems: ['Double Burger', 'Buffalo Chicken Sandwich', 'Loaded Fries'],
    avgWaitTime: 12,
    seatingCapacity: 150,
    websiteUrl: 'https://www.buffalo.edu/campusdining',
    imageUrl: '/images/dining/sizzles.jpg',
    isActive: true,
    lastUpdated: new Date().toISOString(),
    dataSource: 'manual',
  },

  {
    id: 'ub-tikka-house',
    campusId: 'ub-buffalo',
    name: 'Tikka House',
    description: 'Authentic Indian cuisine with curry, biryani, and vegetarian options',
    type: 'restaurant',
    building: 'Student Union',
    floor: '1',
    coordinates: {
      latitude: 43.0012,
      longitude: -78.7867,
    },
    hours: [
      ...weekdayHours('11:00', '20:00'),
      { day: 'saturday', isOpen: true, openTime: '12:00', closeTime: '19:00' },
      { day: 'sunday', isOpen: false },
    ],
    mealPeriods: [
      {
        type: 'lunch',
        startTime: '11:00',
        endTime: '15:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        menuHighlights: ['Lunch Specials', 'Thali Plates'],
      },
      {
        type: 'dinner',
        startTime: '15:00',
        endTime: '20:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        menuHighlights: ['Full Menu', 'Biryani', 'Curry Dishes'],
      },
    ],
    dietaryOptions: ['vegetarian', 'vegan', 'halal', 'gluten-free'],
    paymentMethods: ['meal-plan', 'dining-dollars', 'credit-card', 'cash', 'campus-cash'],
    priceRange: 2,
    popularItems: ['Chicken Tikka Masala', 'Vegetable Biryani', 'Samosas', 'Naan'],
    avgWaitTime: 10,
    seatingCapacity: 80,
    websiteUrl: 'https://www.buffalo.edu/campusdining',
    imageUrl: '/images/dining/tikka-house.jpg',
    isActive: true,
    lastUpdated: new Date().toISOString(),
    dataSource: 'manual',
  },

  {
    id: 'ub-moes',
    campusId: 'ub-buffalo',
    name: "Moe's Southwest Grill",
    description: 'Fresh Tex-Mex favorites including burritos, tacos, and quesadillas',
    type: 'restaurant',
    building: 'Student Union',
    floor: '1',
    coordinates: {
      latitude: 43.0012,
      longitude: -78.7867,
    },
    hours: [
      ...weekdayHours('10:30', '21:00'),
      { day: 'saturday', isOpen: true, openTime: '11:00', closeTime: '19:00' },
      { day: 'sunday', isOpen: true, openTime: '12:00', closeTime: '18:00' },
    ],
    mealPeriods: [
      {
        type: 'all-day',
        startTime: '10:30',
        endTime: '21:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        menuHighlights: ['Burritos', 'Bowls', 'Tacos', 'Quesadillas'],
      },
    ],
    dietaryOptions: ['vegetarian', 'vegan', 'gluten-free'],
    paymentMethods: ['meal-plan', 'dining-dollars', 'credit-card', 'cash', 'campus-cash'],
    priceRange: 2,
    popularItems: ['Homewrecker Burrito', 'Joey Bag of Donuts', 'Queso Dip'],
    avgWaitTime: 8,
    seatingCapacity: 60,
    websiteUrl: 'https://www.buffalo.edu/campusdining',
    imageUrl: '/images/dining/moes.jpg',
    isActive: true,
    lastUpdated: new Date().toISOString(),
    dataSource: 'manual',
  },

  // ==========================================================================
  // NORTH CAMPUS - Cafes & Convenience
  // ==========================================================================
  {
    id: 'ub-starbucks-su',
    campusId: 'ub-buffalo',
    name: 'Starbucks (Student Union)',
    description: 'Full-service Starbucks with coffee, espresso, and light snacks',
    type: 'cafe',
    building: 'Student Union',
    floor: '1',
    coordinates: {
      latitude: 43.0012,
      longitude: -78.7867,
    },
    hours: [
      ...weekdayHours('07:00', '22:00'),
      { day: 'saturday', isOpen: true, openTime: '08:00', closeTime: '20:00' },
      { day: 'sunday', isOpen: true, openTime: '09:00', closeTime: '20:00' },
    ],
    mealPeriods: [
      {
        type: 'all-day',
        startTime: '07:00',
        endTime: '22:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        menuHighlights: ['Coffee', 'Espresso', 'Pastries', 'Sandwiches'],
      },
    ],
    dietaryOptions: ['vegetarian', 'vegan'],
    paymentMethods: ['dining-dollars', 'credit-card', 'cash', 'campus-cash'],
    priceRange: 3,
    popularItems: ['Pumpkin Spice Latte', 'Cold Brew', 'Bacon Gouda Sandwich'],
    avgWaitTime: 5,
    seatingCapacity: 40,
    websiteUrl: 'https://www.starbucks.com',
    imageUrl: '/images/dining/starbucks.jpg',
    isActive: true,
    lastUpdated: new Date().toISOString(),
    dataSource: 'manual',
  },

  {
    id: 'ub-starbucks-lockwood',
    campusId: 'ub-buffalo',
    name: 'Starbucks (Lockwood Library)',
    description: 'Convenient coffee stop in the main library',
    type: 'cafe',
    building: 'Lockwood Memorial Library',
    floor: '1',
    coordinates: {
      latitude: 43.0005,
      longitude: -78.7869,
    },
    hours: [
      ...weekdayHours('07:30', '20:00'),
      { day: 'saturday', isOpen: true, openTime: '10:00', closeTime: '18:00' },
      { day: 'sunday', isOpen: true, openTime: '12:00', closeTime: '18:00' },
    ],
    mealPeriods: [
      {
        type: 'all-day',
        startTime: '07:30',
        endTime: '20:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        menuHighlights: ['Coffee', 'Study Snacks', 'Grab and Go'],
      },
    ],
    dietaryOptions: ['vegetarian', 'vegan'],
    paymentMethods: ['dining-dollars', 'credit-card', 'cash', 'campus-cash'],
    priceRange: 3,
    popularItems: ['Iced Coffee', 'Cake Pops', 'Breakfast Sandwiches'],
    avgWaitTime: 8,
    seatingCapacity: 20,
    websiteUrl: 'https://www.starbucks.com',
    imageUrl: '/images/dining/starbucks-lockwood.jpg',
    isActive: true,
    lastUpdated: new Date().toISOString(),
    dataSource: 'manual',
  },

  {
    id: 'ub-tims',
    campusId: 'ub-buffalo',
    name: "Tim Hortons",
    description: 'Canadian coffee and donut shop with breakfast items',
    type: 'cafe',
    building: 'Capen Hall',
    floor: '1',
    coordinates: {
      latitude: 43.0002,
      longitude: -78.7872,
    },
    hours: [
      ...weekdayHours('07:00', '19:00'),
      { day: 'saturday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
      { day: 'sunday', isOpen: false },
    ],
    mealPeriods: [
      {
        type: 'breakfast',
        startTime: '07:00',
        endTime: '11:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        menuHighlights: ['Breakfast Sandwiches', 'Donuts', 'Timbits'],
      },
      {
        type: 'all-day',
        startTime: '07:00',
        endTime: '19:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        menuHighlights: ['Coffee', 'Iced Capp', 'Soups', 'Sandwiches'],
      },
    ],
    dietaryOptions: ['vegetarian'],
    paymentMethods: ['dining-dollars', 'credit-card', 'cash', 'campus-cash'],
    priceRange: 1,
    popularItems: ['Double-Double', 'Iced Capp', 'Boston Cream Donut', 'Timbits'],
    avgWaitTime: 5,
    seatingCapacity: 30,
    websiteUrl: 'https://www.timhortons.com',
    imageUrl: '/images/dining/tim-hortons.jpg',
    isActive: true,
    lastUpdated: new Date().toISOString(),
    dataSource: 'manual',
  },

  {
    id: 'ub-au-bon-pain',
    campusId: 'ub-buffalo',
    name: 'Au Bon Pain',
    description: 'Bakery cafe with soups, salads, sandwiches, and fresh-baked goods',
    type: 'cafe',
    building: 'Natural Sciences Complex',
    floor: '1',
    coordinates: {
      latitude: 42.9998,
      longitude: -78.7895,
    },
    hours: [
      ...weekdayHours('08:00', '17:00'),
      ...closedWeekend(),
    ],
    mealPeriods: [
      {
        type: 'breakfast',
        startTime: '08:00',
        endTime: '11:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        menuHighlights: ['Croissants', 'Bagels', 'Breakfast Sandwiches'],
      },
      {
        type: 'lunch',
        startTime: '11:00',
        endTime: '17:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        menuHighlights: ['Soups', 'Salads', 'Sandwiches', 'Wraps'],
      },
    ],
    dietaryOptions: ['vegetarian', 'vegan'],
    paymentMethods: ['dining-dollars', 'credit-card', 'cash', 'campus-cash'],
    priceRange: 3,
    popularItems: ['Chicken Caesar Salad', 'Turkey Avocado Sandwich', 'Broccoli Cheddar Soup'],
    avgWaitTime: 6,
    seatingCapacity: 50,
    websiteUrl: 'https://www.aubonpain.com',
    imageUrl: '/images/dining/au-bon-pain.jpg',
    isActive: true,
    lastUpdated: new Date().toISOString(),
    dataSource: 'manual',
  },

  // ==========================================================================
  // NORTH CAMPUS - Late Night
  // ==========================================================================
  {
    id: 'ub-hubies',
    campusId: 'ub-buffalo',
    name: "Hubie's",
    description: 'Late-night eatery perfect for study breaks and midnight cravings',
    type: 'convenience',
    building: 'Ellicott Complex',
    floor: '1',
    coordinates: {
      latitude: 43.0009,
      longitude: -78.7885,
    },
    hours: [
      { day: 'monday', isOpen: true, openTime: '20:00', closeTime: '02:00' },
      { day: 'tuesday', isOpen: true, openTime: '20:00', closeTime: '02:00' },
      { day: 'wednesday', isOpen: true, openTime: '20:00', closeTime: '02:00' },
      { day: 'thursday', isOpen: true, openTime: '20:00', closeTime: '02:00' },
      { day: 'friday', isOpen: true, openTime: '20:00', closeTime: '03:00' },
      { day: 'saturday', isOpen: true, openTime: '20:00', closeTime: '03:00' },
      { day: 'sunday', isOpen: true, openTime: '20:00', closeTime: '02:00' },
    ],
    mealPeriods: [
      {
        type: 'late-night',
        startTime: '20:00',
        endTime: '02:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        menuHighlights: ['Wings', 'Pizza', 'Mozz Sticks', 'Chicken Fingers'],
      },
    ],
    dietaryOptions: ['vegetarian'],
    paymentMethods: ['meal-plan', 'dining-dollars', 'credit-card', 'cash', 'campus-cash'],
    priceRange: 2,
    popularItems: ['Buffalo Wings', 'Mozzarella Sticks', 'Late Night Pizza'],
    avgWaitTime: 10,
    seatingCapacity: 100,
    websiteUrl: 'https://www.buffalo.edu/campusdining',
    imageUrl: '/images/dining/hubies.jpg',
    isActive: true,
    lastUpdated: new Date().toISOString(),
    dataSource: 'manual',
  },

  // ==========================================================================
  // SOUTH CAMPUS
  // ==========================================================================
  {
    id: 'ub-harriman-cafe',
    campusId: 'ub-buffalo',
    name: 'Harriman Cafe',
    description: 'Convenient cafe in the heart of South Campus',
    type: 'cafe',
    building: 'Harriman Hall',
    floor: '1',
    coordinates: {
      latitude: 42.9550,
      longitude: -78.8180,
    },
    hours: [
      ...weekdayHours('08:00', '16:00'),
      ...closedWeekend(),
    ],
    mealPeriods: [
      {
        type: 'breakfast',
        startTime: '08:00',
        endTime: '11:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        menuHighlights: ['Coffee', 'Pastries', 'Breakfast Items'],
      },
      {
        type: 'lunch',
        startTime: '11:00',
        endTime: '16:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        menuHighlights: ['Sandwiches', 'Salads', 'Grab and Go'],
      },
    ],
    dietaryOptions: ['vegetarian'],
    paymentMethods: ['dining-dollars', 'credit-card', 'cash', 'campus-cash'],
    priceRange: 2,
    popularItems: ['Fresh Coffee', 'Deli Sandwiches', 'Fresh Salads'],
    avgWaitTime: 5,
    seatingCapacity: 40,
    websiteUrl: 'https://www.buffalo.edu/campusdining',
    imageUrl: '/images/dining/harriman.jpg',
    isActive: true,
    lastUpdated: new Date().toISOString(),
    dataSource: 'manual',
  },

  {
    id: 'ub-downtown-perks',
    campusId: 'ub-buffalo',
    name: 'Perks Cafe (Downtown)',
    description: 'Coffee and quick bites at the Downtown Campus',
    type: 'cafe',
    building: 'UB Downtown Gateway',
    floor: '1',
    coordinates: {
      latitude: 42.8864,
      longitude: -78.8784,
    },
    hours: [
      ...weekdayHours('07:30', '17:00'),
      ...closedWeekend(),
    ],
    mealPeriods: [
      {
        type: 'all-day',
        startTime: '07:30',
        endTime: '17:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        menuHighlights: ['Espresso', 'Pastries', 'Light Lunch'],
      },
    ],
    dietaryOptions: ['vegetarian', 'vegan'],
    paymentMethods: ['dining-dollars', 'credit-card', 'cash', 'campus-cash'],
    priceRange: 2,
    popularItems: ['Lattes', 'Fresh Pastries', 'Quick Bites'],
    avgWaitTime: 3,
    seatingCapacity: 25,
    websiteUrl: 'https://www.buffalo.edu/campusdining',
    imageUrl: '/images/dining/perks-downtown.jpg',
    isActive: true,
    lastUpdated: new Date().toISOString(),
    dataSource: 'manual',
  },
];

// Export count for verification
export const TOTAL_LOCATIONS = UB_DINING_LOCATIONS.length;
