'use client';

/**
 * Study Spot Finder Element
 *
 * Connected-tier element that helps students find the perfect study spot
 * based on their preferences (noise level, power outlets, distance).
 *
 * Hero Demo 3: "Study Spot Finder"
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Clock,
  Users,
  Zap,
  Volume2,
  VolumeX,
  Wifi,
  Coffee,
  BookOpen,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Navigation,
  Building2,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

// Types based on domain model
type NoiseLevel = 'silent' | 'quiet' | 'moderate' | 'social';
type StudySpaceType = 'open-seating' | 'quiet-zone' | 'group-room' | 'computer-lab' | 'reading-room' | 'cafe-seating' | 'outdoor';

interface StudySpot {
  space: {
    id: string;
    name: string;
    floor: string;
    type: StudySpaceType;
    noiseLevel: NoiseLevel;
    noiseLevelDescription: string;
    seatingCapacity: number;
    reservable: boolean;
    amenities: string[];
    hasPowerOutlets: boolean;
    description?: string;
  };
  building: {
    id: string;
    name: string;
    abbreviation?: string;
    address?: string;
  };
  score: number;
  isAvailable: boolean;
  walkingTime?: number;
  distanceMeters?: number;
  busyness?: number;
  busynessLabel?: string;
}

interface StudySpotFinderConfig {
  title?: string;
  showFilters?: boolean;
  showRecommendation?: boolean;
  defaultNoiseLevel?: NoiseLevel;
  defaultNeedsPower?: boolean;
  maxItems?: number;
}

interface StudySpotFinderProps {
  id?: string;
  config: StudySpotFinderConfig;
  data?: unknown;
  onChange?: (data: unknown) => void;
  onAction?: (action: string, payload?: unknown) => void;
  context?: {
    userId?: string;
    campusId?: string;
    spaceId?: string;
    isSpaceLeader?: boolean;
  };
  sharedState?: {
    counters: Record<string, number>;
    collections: Record<string, Record<string, { id: string; createdAt: string; createdBy: string; data: Record<string, unknown> }>>;
    timeline: Array<{ id: string; type: string; timestamp: string; userId: string; action: string; data?: Record<string, unknown> }>;
    computed: Record<string, unknown>;
    version: number;
    lastModified: string;
  };
  userState?: Record<string, unknown>;
}

const NOISE_LEVELS: { value: NoiseLevel; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'silent', label: 'Silent', icon: <VolumeX className="w-4 h-4" />, description: 'No talking' },
  { value: 'quiet', label: 'Quiet', icon: <Volume2 className="w-4 h-4 opacity-50" />, description: 'Whispers only' },
  { value: 'moderate', label: 'Moderate', icon: <Volume2 className="w-4 h-4" />, description: 'Low conversation' },
  { value: 'social', label: 'Social', icon: <Users className="w-4 h-4" />, description: 'Group work' },
];

const SPACE_TYPE_ICONS: Record<StudySpaceType, React.ReactNode> = {
  'open-seating': <BookOpen className="w-4 h-4" />,
  'quiet-zone': <VolumeX className="w-4 h-4" />,
  'group-room': <Users className="w-4 h-4" />,
  'computer-lab': <Wifi className="w-4 h-4" />,
  'reading-room': <BookOpen className="w-4 h-4" />,
  'cafe-seating': <Coffee className="w-4 h-4" />,
  'outdoor': <Navigation className="w-4 h-4" />,
};

export function StudySpotFinderElement({ config, onAction }: StudySpotFinderProps) {
  const {
    title = 'Find a Study Spot',
    showFilters = true,
    showRecommendation = true,
    defaultNoiseLevel,
    defaultNeedsPower = false,
    maxItems = 8,
  } = config;

  const [noiseLevel, setNoiseLevel] = useState<NoiseLevel | null>(defaultNoiseLevel || null);
  const [needsPower, setNeedsPower] = useState(defaultNeedsPower);
  const [spots, setSpots] = useState<StudySpot[]>([]);
  const [recommendation, setRecommendation] = useState<{ spot: StudySpot; reason: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Silently fail - location is optional
        }
      );
    }
  }, []);

  // Fetch study spots
  const fetchSpots = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        openNow: 'true',
        sortBy: 'score',
        limit: maxItems.toString(),
      });

      if (noiseLevel) params.set('noiseLevel', noiseLevel);
      if (needsPower) params.set('needsPower', 'true');
      if (userLocation) {
        params.set('lat', userLocation.lat.toString());
        params.set('lng', userLocation.lng.toString());
      }

      const response = await fetch(`/api/campus/buildings/study-spots?${params}`);
      const data = await response.json();

      if (data.success) {
        setSpots(data.data.spots);
        setRecommendation(data.data.recommendation);
        onAction?.('spots-loaded', { count: data.data.spots.length });
      } else {
        setError(data.error || 'Failed to load study spots');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [noiseLevel, needsPower, userLocation, maxItems, onAction]);

  // Initial fetch and refetch on filter change
  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);

  const handleSpotSelect = (spot: StudySpot) => {
    onAction?.('spot-selected', {
      spaceId: spot.space.id,
      buildingId: spot.building.id,
      spaceName: spot.space.name,
      buildingName: spot.building.name,
    });
  };

  const getBusynessColor = (busyness?: number) => {
    if (busyness === undefined) return 'text-neutral-500';
    if (busyness < 30) return 'text-green-500';
    if (busyness < 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="w-full h-full flex flex-col bg-neutral-950 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">{title}</h2>
          </div>
          <button
            onClick={fetchSpots}
            disabled={loading}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4 text-white/60', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 border-b border-white/10 space-y-4">
          {/* Noise Level Selector */}
          <div>
            <label className="text-sm text-white/60 mb-2 block">Noise Level</label>
            <div className="flex gap-2">
              {NOISE_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setNoiseLevel(noiseLevel === level.value ? null : level.value)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1 p-2 rounded-lg transition-all',
                    noiseLevel === level.value
                      ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400'
                      : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                  )}
                >
                  {level.icon}
                  <span className="text-xs font-medium">{level.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Power Filter */}
          <button
            onClick={() => setNeedsPower(!needsPower)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
              needsPower
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400'
                : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
            )}
          >
            <Zap className="w-4 h-4" />
            <span className="text-sm">Needs Power Outlets</span>
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Error State */}
        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
          </div>
        )}

        {/* Recommendation */}
        {!loading && showRecommendation && recommendation && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">Top Pick</span>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-white">{recommendation.spot.space.name}</h3>
                <p className="text-sm text-white/60">{recommendation.spot.building.name}</p>
                <p className="text-xs text-amber-400/80 mt-1">{recommendation.reason}</p>
              </div>

              <button
                onClick={() => handleSpotSelect(recommendation.spot)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-black text-sm font-medium hover:bg-amber-400 transition-colors"
              >
                Go Here
              </button>
            </div>

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
              {recommendation.spot.walkingTime && (
                <div className="flex items-center gap-1 text-sm text-white/60">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{recommendation.spot.walkingTime} min walk</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-sm text-white/60">
                <Volume2 className="w-3.5 h-3.5" />
                <span className="capitalize">{recommendation.spot.space.noiseLevel}</span>
              </div>
              {recommendation.spot.space.hasPowerOutlets && (
                <div className="flex items-center gap-1 text-sm text-white/60">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Power</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Spots List */}
        {!loading && spots.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-white/60">
              {showRecommendation && recommendation ? 'Other Options' : 'Available Spots'}
            </h3>

            <AnimatePresence mode="popLayout">
              {spots
                .filter((s) => !recommendation || s.space.id !== recommendation.spot.space.id)
                .map((spot, index) => (
                  <motion.button
                    key={spot.space.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSpotSelect(spot)}
                    className="w-full p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white/60">
                          {SPACE_TYPE_ICONS[spot.space.type]}
                        </div>
                        <div>
                          <h4 className="font-medium text-white group-hover:text-amber-400 transition-colors">
                            {spot.space.name}
                          </h4>
                          <p className="text-sm text-white/50">
                            {spot.building.abbreviation || spot.building.name} · {spot.space.floor}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-amber-400 transition-colors" />
                    </div>

                    <div className="flex items-center gap-3 mt-2 ml-13 text-xs text-white/50">
                      {spot.walkingTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {spot.walkingTime}min
                        </span>
                      )}
                      <span className="flex items-center gap-1 capitalize">
                        <Volume2 className="w-3 h-3" />
                        {spot.space.noiseLevel}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {spot.space.seatingCapacity}
                      </span>
                      {spot.busynessLabel && (
                        <span className={cn('flex items-center gap-1', getBusynessColor(spot.busyness))}>
                          {spot.busynessLabel}
                        </span>
                      )}
                      {spot.space.hasPowerOutlets && (
                        <span className="flex items-center gap-1 text-amber-400/70">
                          <Zap className="w-3 h-3" />
                          Power
                        </span>
                      )}
                    </div>
                  </motion.button>
                ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && spots.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="w-12 h-12 text-white/20 mb-4" />
            <h3 className="font-medium text-white mb-1">No spots found</h3>
            <p className="text-sm text-white/50 max-w-xs">
              Try adjusting your filters or check back later for available study spaces.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudySpotFinderElement;
