'use client';

/**
 * DiningPicker Element (Connected Tier)
 *
 * Displays campus dining locations with real-time status.
 * Supports filtering by type, dietary options, and distance.
 * Powers the "What Should I Eat" hero demo.
 */

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  BuildingStorefrontIcon,
  ClockIcon,
  MapPinIcon,
  SparklesIcon,
  FunnelIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent } from '../../../../design-system/primitives';
import { Badge } from '../../../../design-system/primitives';
import { Button } from '../../../../design-system/primitives';
import type { ElementProps } from '../../../../lib/hivelab/element-system';

interface DiningLocation {
  id: string;
  name: string;
  description?: string;
  type: string;
  building: string;
  priceRange: number;
  dietaryOptions: string[];
  popularItems?: string[];
  avgWaitTime?: number;
}

interface DiningLocationStatus {
  location: DiningLocation;
  isOpen: boolean;
  currentMealPeriod?: {
    type: string;
    menuHighlights?: string[];
  };
  minutesUntilClose?: number;
  walkingTime?: number;
  distanceMeters?: number;
}

interface DiningRecommendation {
  recommended: DiningLocationStatus;
  reason: string;
  alternatives: DiningLocationStatus[];
  factors: {
    closingSoon: boolean;
    matchesDietary: boolean;
    walkingTime?: number;
    priceRange: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const DIETARY_OPTIONS = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'halal', label: 'Halal' },
  { value: 'gluten-free', label: 'Gluten-Free' },
];

const MOOD_OPTIONS = [
  { value: 'quick', label: 'Quick Bite' },
  { value: 'sit-down', label: 'Sit Down' },
  { value: 'healthy', label: 'Healthy' },
  { value: 'comfort', label: 'Comfort Food' },
  { value: 'late-night', label: 'Late Night' },
];

function formatPrice(priceRange: number): string {
  return '$'.repeat(priceRange);
}

function formatWaitTime(minutes?: number): string {
  if (!minutes) return '';
  if (minutes < 5) return 'No wait';
  return `~${minutes} min wait`;
}

function formatClosingTime(minutes?: number): string {
  if (!minutes) return '';
  if (minutes < 30) return 'Closing soon!';
  if (minutes < 60) return `Closes in ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `Open ${hours}+ hrs`;
}

export function DiningPickerElement({ config, onChange, onAction }: ElementProps) {
  const [locations, setLocations] = useState<DiningLocationStatus[]>([]);
  const [recommendation, setRecommendation] = useState<DiningRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const showRecommendation = config.showRecommendation !== false;
  const showFiltersToggle = config.showFilters !== false;
  const maxItems = (config.maxItems as number) || 8;
  const sortBy = (config.sortBy as string) || 'closing-soon';

  // Fetch dining locations
  const fetchLocations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        openNow: 'true',
        sortBy,
      });

      if (selectedDietary.length > 0) {
        params.set('dietary', selectedDietary.join(','));
      }

      const response = await fetch(`/api/campus/dining?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch dining locations');

      const result: ApiResponse<{ locations: DiningLocationStatus[] }> = await response.json();

      if (result.success && result.data) {
        setLocations(result.data.locations.slice(0, maxItems));
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dining options');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDietary, sortBy, maxItems]);

  // Fetch recommendation
  const fetchRecommendation = useCallback(async () => {
    if (!showRecommendation) return;

    try {
      const params = new URLSearchParams();

      if (selectedDietary.length > 0) {
        params.set('dietary', selectedDietary.join(','));
      }
      if (selectedMood) {
        params.set('mood', selectedMood);
      }

      const response = await fetch(`/api/campus/dining/recommend?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) return;

      const result: ApiResponse<DiningRecommendation> = await response.json();

      if (result.success && result.data) {
        setRecommendation(result.data);
      }
    } catch {
      // Silently fail - recommendation is optional
    }
  }, [showRecommendation, selectedDietary, selectedMood]);

  useEffect(() => {
    fetchLocations();
    fetchRecommendation();
  }, [fetchLocations, fetchRecommendation]);

  const handleLocationClick = (location: DiningLocationStatus) => {
    onChange?.({ selectedLocation: location.location, locationId: location.location.id });
    onAction?.('select', { location: location.location });
  };

  const handleDecideForMe = () => {
    if (recommendation) {
      onChange?.({ selectedLocation: recommendation.recommended.location });
      onAction?.('decide', { recommendation });
    }
  };

  const toggleDietary = (option: string) => {
    setSelectedDietary(prev =>
      prev.includes(option)
        ? prev.filter(d => d !== option)
        : [...prev, option]
    );
  };

  return (
    <Card className="bg-gradient-to-br from-amber-500/5 to-orange-500/5">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BuildingStorefrontIcon className="h-5 w-5 text-amber-500" />
            <span className="font-semibold">{config.title || 'Campus Dining'}</span>
          </div>
          {showFiltersToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-8 px-2"
            >
              <FunnelIcon className="h-4 w-4 mr-1" />
              Filters
            </Button>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-3 bg-muted/50 rounded-lg space-y-3">
            {/* Mood selector */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">What mood are you in?</p>
              <div className="flex flex-wrap gap-1.5">
                {MOOD_OPTIONS.map(mood => (
                  <Badge
                    key={mood.value}
                    variant={selectedMood === mood.value ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => setSelectedMood(selectedMood === mood.value ? null : mood.value)}
                  >
                    {mood.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Dietary filters */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Dietary preferences</p>
              <div className="flex flex-wrap gap-1.5">
                {DIETARY_OPTIONS.map(opt => (
                  <Badge
                    key={opt.value}
                    variant={selectedDietary.includes(opt.value) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleDietary(opt.value)}
                  >
                    {opt.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recommendation Card */}
        {showRecommendation && recommendation && (
          <div className="p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <SparklesIcon className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Recommended for you</span>
            </div>
            <button
              onClick={handleDecideForMe}
              className="w-full text-left group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold group-hover:text-amber-600 transition-colors">
                    {recommendation.recommended.location.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">{recommendation.reason}</p>
                </div>
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600">
                  Go Here
                </Button>
              </div>
            </button>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <ExclamationTriangleIcon className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchLocations} className="mt-3">
              Try Again
            </Button>
          </div>
        ) : locations.length === 0 ? (
          <div className="py-8 text-center">
            <BuildingStorefrontIcon className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No dining locations open right now</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {selectedDietary.length > 0 ? 'Try removing some filters' : 'Check back later'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {locations.map(status => (
              <button
                key={status.location.id}
                onClick={() => handleLocationClick(status)}
                className="w-full text-left group"
              >
                <div className="p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-background hover:border-border transition-all">
                  {/* Location Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm truncate group-hover:text-amber-600 transition-colors">
                          {status.location.name}
                        </h4>
                        {status.isOpen && (
                          <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600">
                            Open
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{status.location.building}</p>
                    </div>
                    <span className="text-sm text-muted-foreground shrink-0">
                      {formatPrice(status.location.priceRange)}
                    </span>
                  </div>

                  {/* Location Details */}
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    {status.minutesUntilClose && (
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-3.5 w-3.5" />
                        <span className={status.minutesUntilClose < 60 ? 'text-amber-600' : ''}>
                          {formatClosingTime(status.minutesUntilClose)}
                        </span>
                      </div>
                    )}
                    {status.walkingTime && (
                      <div className="flex items-center gap-1">
                        <MapPinIcon className="h-3.5 w-3.5" />
                        <span>{status.walkingTime} min walk</span>
                      </div>
                    )}
                  </div>

                  {/* Dietary badges */}
                  {status.location.dietaryOptions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {status.location.dietaryOptions.slice(0, 3).map(opt => (
                        <Badge key={opt} variant="outline" className="text-[10px] px-1.5 py-0">
                          {opt}
                        </Badge>
                      ))}
                      {status.location.dietaryOptions.length > 3 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          +{status.location.dietaryOptions.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Current meal period */}
                  {status.currentMealPeriod && (
                    <div className="mt-2 text-[10px] text-muted-foreground/70">
                      Now serving: {status.currentMealPeriod.type}
                      {status.currentMealPeriod.menuHighlights && status.currentMealPeriod.menuHighlights.length > 0 && (
                        <span> • {status.currentMealPeriod.menuHighlights.slice(0, 2).join(', ')}</span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Decide for Me Button (if no recommendation shown) */}
        {!showRecommendation && locations.length > 0 && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              fetchRecommendation();
              if (recommendation) handleDecideForMe();
            }}
          >
            <SparklesIcon className="h-4 w-4 mr-2" />
            Decide for Me
          </Button>
        )}

        {/* Footer */}
        {locations.length > 0 && (
          <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground text-center">
            {locations.length} locations open now
          </div>
        )}
      </CardContent>
    </Card>
  );
}
