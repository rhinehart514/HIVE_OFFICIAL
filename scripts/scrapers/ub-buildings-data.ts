/**
 * UB Campus Buildings Data
 *
 * Comprehensive data for University at Buffalo buildings with study spaces.
 * Focuses on locations popular for studying.
 *
 * Data sources:
 * - UB Maps
 * - UB Libraries website
 * - Public building information
 *
 * Last updated: January 2026
 */

import type {
  Building,
  StudySpace,
  DailyHours,
  NoiseLevel,
} from '../../packages/core/src/domain/campus/buildings';

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// Helper functions
function weekdayHours(openTime: string, closeTime: string): DailyHours[] {
  const weekdays: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  return weekdays.map(day => ({
    day,
    isOpen: true,
    openTime,
    closeTime,
  }));
}

function weekendHours(satOpen: string, satClose: string, sunOpen: string, sunClose: string): DailyHours[] {
  return [
    { day: 'saturday' as DayOfWeek, isOpen: true, openTime: satOpen, closeTime: satClose },
    { day: 'sunday' as DayOfWeek, isOpen: true, openTime: sunOpen, closeTime: sunClose },
  ];
}

// Popular times template (hour -> busyness 0-100)
function libraryPopularTimes(): Record<number, number> {
  return {
    6: 5, 7: 10, 8: 20, 9: 35, 10: 50, 11: 65, 12: 55, 13: 60,
    14: 70, 15: 75, 16: 80, 17: 75, 18: 70, 19: 65, 20: 60,
    21: 50, 22: 40, 23: 25, 0: 15, 1: 10, 2: 5,
  };
}

function cafePopularTimes(): Record<number, number> {
  return {
    7: 15, 8: 35, 9: 50, 10: 60, 11: 70, 12: 80, 13: 75, 14: 65,
    15: 55, 16: 50, 17: 45, 18: 35, 19: 25, 20: 15, 21: 10,
  };
}

/**
 * UB Buildings with Study Spaces
 */
export const UB_BUILDINGS: Building[] = [
  // ==========================================================================
  // LIBRARIES - Primary Study Locations
  // ==========================================================================
  {
    id: 'ub-lockwood',
    campusId: 'ub-buffalo',
    name: 'Lockwood Memorial Library',
    abbreviation: 'Lockwood',
    description: 'Main library on North Campus with extensive study spaces across 6 floors',
    type: 'library',
    address: 'Lockwood Memorial Library, Buffalo, NY 14260',
    coordinates: {
      latitude: 43.0005,
      longitude: -78.7869,
    },
    hours: [
      ...weekdayHours('07:00', '02:00'),
      { day: 'saturday', isOpen: true, openTime: '09:00', closeTime: '22:00' },
      { day: 'sunday', isOpen: true, openTime: '10:00', closeTime: '02:00' },
    ],
    amenities: ['power-outlets', 'wifi', 'printing', 'computers', 'cafe', 'restrooms', 'accessible'],
    floors: 6,
    goodForStudying: true,
    typicalNoiseLevel: 'quiet',
    imageUrl: '/images/buildings/lockwood.jpg',
    isActive: true,
    lastUpdated: new Date().toISOString(),
    dataSource: 'manual',
    studySpaces: [
      {
        id: 'lockwood-1st-floor',
        buildingId: 'ub-lockwood',
        name: 'First Floor Commons',
        floor: '1',
        type: 'cafe-seating',
        noiseLevel: 'moderate',
        seatingCapacity: 150,
        reservable: false,
        amenities: ['power-outlets', 'wifi', 'cafe'],
        hasPowerOutlets: true,
        description: 'Open seating near Starbucks, good for casual study and group work',
        popularTimes: cafePopularTimes(),
        isActive: true,
      },
      {
        id: 'lockwood-2nd-quiet',
        buildingId: 'ub-lockwood',
        name: 'Second Floor Quiet Zone',
        floor: '2',
        type: 'quiet-zone',
        noiseLevel: 'quiet',
        seatingCapacity: 200,
        reservable: false,
        amenities: ['power-outlets', 'wifi', 'natural-light'],
        hasPowerOutlets: true,
        description: 'Large quiet study area with individual desks and natural light',
        popularTimes: libraryPopularTimes(),
        isActive: true,
      },
      {
        id: 'lockwood-3rd-silent',
        buildingId: 'ub-lockwood',
        name: 'Third Floor Silent Study',
        floor: '3',
        type: 'reading-room',
        noiseLevel: 'silent',
        seatingCapacity: 100,
        reservable: false,
        amenities: ['power-outlets', 'wifi'],
        hasPowerOutlets: true,
        description: 'Designated silent study area - no talking or phone calls',
        popularTimes: libraryPopularTimes(),
        isActive: true,
      },
      {
        id: 'lockwood-group-rooms',
        buildingId: 'ub-lockwood',
        name: 'Group Study Rooms',
        floor: '2-4',
        type: 'group-room',
        noiseLevel: 'social',
        seatingCapacity: 80,
        reservable: true,
        amenities: ['power-outlets', 'wifi', 'whiteboards', 'reservable-rooms'],
        hasPowerOutlets: true,
        description: 'Reservable rooms for group projects and study sessions (4-8 people)',
        isActive: true,
      },
      {
        id: 'lockwood-computer-lab',
        buildingId: 'ub-lockwood',
        name: 'Computer Lab',
        floor: '1',
        type: 'computer-lab',
        noiseLevel: 'quiet',
        seatingCapacity: 60,
        reservable: false,
        amenities: ['computers', 'printing', 'wifi'],
        hasPowerOutlets: true,
        description: 'Full computer workstations with printing access',
        popularTimes: libraryPopularTimes(),
        isActive: true,
      },
    ],
  },

  {
    id: 'ub-silverman',
    campusId: 'ub-buffalo',
    name: 'Oscar A. Silverman Library',
    abbreviation: 'Silverman',
    description: 'Undergraduate library in the Student Union with 24/7 study space during finals',
    type: 'library',
    address: 'Student Union, Buffalo, NY 14260',
    coordinates: {
      latitude: 43.0012,
      longitude: -78.7867,
    },
    hours: [
      ...weekdayHours('08:00', '23:00'),
      { day: 'saturday', isOpen: true, openTime: '10:00', closeTime: '20:00' },
      { day: 'sunday', isOpen: true, openTime: '12:00', closeTime: '23:00' },
    ],
    amenities: ['power-outlets', 'wifi', 'printing', 'computers', 'restrooms', 'accessible'],
    floors: 2,
    goodForStudying: true,
    typicalNoiseLevel: 'moderate',
    imageUrl: '/images/buildings/silverman.jpg',
    isActive: true,
    lastUpdated: new Date().toISOString(),
    dataSource: 'manual',
    studySpaces: [
      {
        id: 'silverman-main',
        buildingId: 'ub-silverman',
        name: 'Main Reading Room',
        floor: '1',
        type: 'open-seating',
        noiseLevel: 'moderate',
        seatingCapacity: 120,
        reservable: false,
        amenities: ['power-outlets', 'wifi', 'natural-light'],
        hasPowerOutlets: true,
        description: 'Large open area with tables and comfortable seating',
        popularTimes: libraryPopularTimes(),
        isActive: true,
      },
      {
        id: 'silverman-quiet',
        buildingId: 'ub-silverman',
        name: 'Quiet Study Area',
        floor: '2',
        type: 'quiet-zone',
        noiseLevel: 'quiet',
        seatingCapacity: 60,
        reservable: false,
        amenities: ['power-outlets', 'wifi'],
        hasPowerOutlets: true,
        description: 'Upper level quiet zone for focused study',
        popularTimes: libraryPopularTimes(),
        isActive: true,
      },
    ],
  },

  // ==========================================================================
  // ACADEMIC BUILDINGS - Study Spaces
  // ==========================================================================
  {
    id: 'ub-capen',
    campusId: 'ub-buffalo',
    name: 'Capen Hall',
    abbreviation: 'Capen',
    description: 'Central academic building with lounges and study areas throughout',
    type: 'academic',
    address: 'Capen Hall, Buffalo, NY 14260',
    coordinates: {
      latitude: 43.0002,
      longitude: -78.7872,
    },
    hours: [
      ...weekdayHours('07:00', '22:00'),
      { day: 'saturday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { day: 'sunday', isOpen: false },
    ],
    amenities: ['power-outlets', 'wifi', 'cafe', 'restrooms', 'accessible'],
    floors: 3,
    goodForStudying: true,
    typicalNoiseLevel: 'moderate',
    imageUrl: '/images/buildings/capen.jpg',
    isActive: true,
    lastUpdated: new Date().toISOString(),
    dataSource: 'manual',
    studySpaces: [
      {
        id: 'capen-atrium',
        buildingId: 'ub-capen',
        name: 'Capen Atrium',
        floor: '1',
        type: 'cafe-seating',
        noiseLevel: 'social',
        seatingCapacity: 80,
        reservable: false,
        amenities: ['power-outlets', 'wifi', 'cafe', 'natural-light'],
        hasPowerOutlets: true,
        description: 'Open atrium near Tim Hortons, great for casual meetups',
        popularTimes: cafePopularTimes(),
        isActive: true,
      },
      {
        id: 'capen-lounges',
        buildingId: 'ub-capen',
        name: 'Student Lounges',
        floor: '2-3',
        type: 'open-seating',
        noiseLevel: 'moderate',
        seatingCapacity: 100,
        reservable: false,
        amenities: ['power-outlets', 'wifi'],
        hasPowerOutlets: true,
        description: 'Comfortable lounge seating throughout upper floors',
        isActive: true,
      },
    ],
  },

  {
    id: 'ub-nsc',
    campusId: 'ub-buffalo',
    name: 'Natural Sciences Complex',
    abbreviation: 'NSC',
    description: 'Science building with quiet study spaces and computer labs',
    type: 'academic',
    address: 'Natural Sciences Complex, Buffalo, NY 14260',
    coordinates: {
      latitude: 42.9998,
      longitude: -78.7895,
    },
    hours: [
      ...weekdayHours('07:00', '22:00'),
      { day: 'saturday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { day: 'sunday', isOpen: true, openTime: '10:00', closeTime: '18:00' },
    ],
    amenities: ['power-outlets', 'wifi', 'computers', 'cafe', 'restrooms', 'accessible'],
    floors: 4,
    goodForStudying: true,
    typicalNoiseLevel: 'quiet',
    imageUrl: '/images/buildings/nsc.jpg',
    isActive: true,
    lastUpdated: new Date().toISOString(),
    dataSource: 'manual',
    studySpaces: [
      {
        id: 'nsc-atrium',
        buildingId: 'ub-nsc',
        name: 'NSC Atrium',
        floor: '1',
        type: 'open-seating',
        noiseLevel: 'moderate',
        seatingCapacity: 60,
        reservable: false,
        amenities: ['power-outlets', 'wifi', 'natural-light', 'cafe'],
        hasPowerOutlets: true,
        description: 'Bright atrium with Au Bon Pain nearby',
        popularTimes: cafePopularTimes(),
        isActive: true,
      },
      {
        id: 'nsc-study-alcoves',
        buildingId: 'ub-nsc',
        name: 'Study Alcoves',
        floor: '2-4',
        type: 'quiet-zone',
        noiseLevel: 'quiet',
        seatingCapacity: 80,
        reservable: false,
        amenities: ['power-outlets', 'wifi'],
        hasPowerOutlets: true,
        description: 'Quiet alcoves between lecture halls, great for focused study',
        popularTimes: libraryPopularTimes(),
        isActive: true,
      },
    ],
  },

  // ==========================================================================
  // STUDENT CENTER
  // ==========================================================================
  {
    id: 'ub-su',
    campusId: 'ub-buffalo',
    name: 'Student Union',
    abbreviation: 'SU',
    description: 'Central student hub with diverse study and social spaces',
    type: 'student-center',
    address: 'Student Union, Buffalo, NY 14260',
    coordinates: {
      latitude: 43.0012,
      longitude: -78.7867,
    },
    hours: [
      ...weekdayHours('07:00', '00:00'),
      { day: 'saturday', isOpen: true, openTime: '08:00', closeTime: '22:00' },
      { day: 'sunday', isOpen: true, openTime: '10:00', closeTime: '22:00' },
    ],
    amenities: ['power-outlets', 'wifi', 'cafe', 'vending', 'restrooms', 'accessible'],
    floors: 3,
    goodForStudying: true,
    typicalNoiseLevel: 'social',
    imageUrl: '/images/buildings/su.jpg',
    isActive: true,
    lastUpdated: new Date().toISOString(),
    dataSource: 'manual',
    studySpaces: [
      {
        id: 'su-starbucks-area',
        buildingId: 'ub-su',
        name: 'Starbucks Seating',
        floor: '1',
        type: 'cafe-seating',
        noiseLevel: 'social',
        seatingCapacity: 100,
        reservable: false,
        amenities: ['power-outlets', 'wifi', 'cafe'],
        hasPowerOutlets: true,
        description: 'Bustling area near Starbucks, best for casual study',
        popularTimes: cafePopularTimes(),
        isActive: true,
      },
      {
        id: 'su-upper-lounges',
        buildingId: 'ub-su',
        name: 'Upper Floor Lounges',
        floor: '2-3',
        type: 'open-seating',
        noiseLevel: 'moderate',
        seatingCapacity: 150,
        reservable: false,
        amenities: ['power-outlets', 'wifi', 'natural-light'],
        hasPowerOutlets: true,
        description: 'Quieter seating on upper floors with good natural light',
        isActive: true,
      },
    ],
  },

  // ==========================================================================
  // RESIDENCE HALLS - Late Night Options
  // ==========================================================================
  {
    id: 'ub-ellicott',
    campusId: 'ub-buffalo',
    name: 'Ellicott Complex',
    abbreviation: 'Ellicott',
    description: 'Residence complex with 24-hour study lounges for residents',
    type: 'residence',
    address: 'Ellicott Complex, Buffalo, NY 14260',
    coordinates: {
      latitude: 43.0009,
      longitude: -78.7885,
    },
    hours: [
      { day: 'monday', isOpen: true, openTime: '00:00', closeTime: '23:59' },
      { day: 'tuesday', isOpen: true, openTime: '00:00', closeTime: '23:59' },
      { day: 'wednesday', isOpen: true, openTime: '00:00', closeTime: '23:59' },
      { day: 'thursday', isOpen: true, openTime: '00:00', closeTime: '23:59' },
      { day: 'friday', isOpen: true, openTime: '00:00', closeTime: '23:59' },
      { day: 'saturday', isOpen: true, openTime: '00:00', closeTime: '23:59' },
      { day: 'sunday', isOpen: true, openTime: '00:00', closeTime: '23:59' },
    ],
    amenities: ['power-outlets', 'wifi', 'vending', 'restrooms'],
    goodForStudying: true,
    typicalNoiseLevel: 'quiet',
    isActive: true,
    lastUpdated: new Date().toISOString(),
    dataSource: 'manual',
    studySpaces: [
      {
        id: 'ellicott-study-lounges',
        buildingId: 'ub-ellicott',
        name: '24-Hour Study Lounges',
        floor: 'Various',
        type: 'quiet-zone',
        noiseLevel: 'quiet',
        seatingCapacity: 80,
        reservable: false,
        amenities: ['power-outlets', 'wifi', 'vending'],
        hasPowerOutlets: true,
        description: 'Multiple study lounges open 24/7 for residents and guests',
        isActive: true,
      },
    ],
  },
];

// Export count for verification
export const TOTAL_BUILDINGS = UB_BUILDINGS.length;
export const TOTAL_STUDY_SPACES = UB_BUILDINGS.reduce((sum, b) => sum + b.studySpaces.length, 0);
