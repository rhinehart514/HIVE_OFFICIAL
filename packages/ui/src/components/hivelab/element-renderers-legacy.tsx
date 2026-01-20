'use client';

/**
 * Legacy Element Renderers
 *
 * This file contains element components that haven't been extracted yet.
 * New elements should be added to the elements/ directory instead.
 *
 * @deprecated Import from elements/registry.tsx instead for the full element set.
 * This file will be removed once all elements are extracted.
 */

import * as React from 'react';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, UsersIcon, CalendarIcon, TagIcon, ChartBarIcon, ClockIcon, DocumentTextIcon, BellIcon, MapPinIcon, TrophyIcon, UserPlusIcon, CheckIcon, ArrowPathIcon, HandThumbUpIcon } from '@heroicons/react/24/outline';

// Alias for lucide compatibility
const Vote = HandThumbUpIcon;
import { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { springPresets, durationSeconds, easingArrays } from '@hive/tokens';

import { Input } from '../../design-system/primitives';
import { Button } from '../../design-system/primitives';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../design-system/primitives';
import { Badge } from '../../design-system/primitives';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../design-system/primitives';
import { Progress } from '../../design-system/primitives';

import { AnimatedNumber, numberSpringPresets } from '../motion-primitives/animated-number';

import type { ElementProps } from '../../lib/hivelab/element-system';

// ============================================================================
// ERROR BOUNDARY - Prevents individual element crashes from breaking entire tool
// ============================================================================

interface ElementErrorBoundaryProps {
  elementType: string;
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ElementErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for HiveLab elements.
 * Catches render errors in individual elements without crashing the entire tool.
 */
class ElementErrorBoundary extends Component<ElementErrorBoundaryProps, ElementErrorBoundaryState> {
  constructor(props: ElementErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ElementErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error for debugging
    console.error(`[HiveLab] Element "${this.props.elementType}" crashed:`, error, errorInfo);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ElementErrorFallback
          elementType={this.props.elementType}
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Fallback UI shown when an element crashes.
 * Provides user-friendly error message and retry option.
 */
function ElementErrorFallback({
  elementType,
  error,
  onRetry
}: {
  elementType: string;
  error: Error | null;
  onRetry: () => void;
}) {
  const isDevMode = process.env.NODE_ENV === 'development';

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-destructive/10 p-2">
            <BellIcon className="h-4 w-4 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">
              Element failed to load
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              The {elementType.replace(/-/g, ' ')} element encountered an error.
            </p>
            {isDevMode && error && (
              <pre className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded overflow-x-auto">
                {error.message}
              </pre>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="mt-2 h-7 text-xs"
            >
              Try again
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// MagnifyingGlassIcon Input Element
export function SearchInputElement({ config, onChange, onAction, context }: ElementProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const debounceMs = config.debounceMs || 300;

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query !== '') {
        onChange?.({ query, searchTerm: query });
        onAction?.('search', { query, searchTerm: query });
      }

      // Fetch real suggestions when in deployed context (has campusId)
      if (config.showSuggestions && query.length > 2) {
        if (context?.campusId) {
          // Real API call for deployed tools
          setIsLoadingSuggestions(true);
          try {
            const searchTypes = config.searchTypes || ['spaces', 'people', 'tools'];
            const response = await fetch(
              `/api/search?q=${encodeURIComponent(query)}&limit=5&types=${searchTypes.join(',')}`
            );
            if (response.ok) {
              const data = await response.json();
              const results = data.results || [];
              // Extract titles from search results for suggestions
              const suggestionTitles = results.slice(0, 5).map(
                (r: { title?: string; name?: string; type: string }) =>
                  r.title || r.name || `${query} (${r.type})`
              );
              setSuggestions(suggestionTitles.length > 0 ? suggestionTitles : [`No results for "${query}"`]);
            } else {
              // Fallback to mock on API error
              setSuggestions([`${query} in spaces`, `${query} in users`]);
            }
          } catch {
            // Fallback to mock on network error
            setSuggestions([`${query} in spaces`, `${query} in users`]);
          } finally {
            setIsLoadingSuggestions(false);
          }
        } else {
          // Mock suggestions for preview/demo mode (no campusId)
          setSuggestions([
            `${query} in spaces`,
            `${query} in users`,
            `${query} in posts`
          ]);
        }
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs, onChange, onAction, config.showSuggestions, config.searchTypes, context?.campusId]);

  return (
    <div className="relative">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          placeholder={config.placeholder || 'MagnifyingGlassIcon...'}
          className="pl-10"
        />
      </div>
      
      {showSuggestions && (
        <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg">
          {isLoadingSuggestions ? (
            <div className="px-3 py-2 text-sm text-muted-foreground animate-pulse">
              Searching...
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent first:rounded-t-lg last:rounded-b-lg"
                onClick={() => {
                  setQuery(suggestion);
                  setShowSuggestions(false);
                  // Trigger action with selected suggestion
                  onChange?.({ query: suggestion, searchTerm: suggestion, selectedSuggestion: suggestion });
                  onAction?.('select_suggestion', { query: suggestion, suggestion });
                }}
              >
                {suggestion}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// FunnelIcon Selector Element
export function FilterSelectorElement({ config, onChange, onAction }: ElementProps) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const options = config.options || [];
  const allowMultiple = config.allowMultiple !== false;

  const handleFilterToggle = (value: string) => {
    let newFilters: string[];

    if (allowMultiple) {
      newFilters = selectedFilters.includes(value)
        ? selectedFilters.filter(f => f !== value)
        : [...selectedFilters, value];
    } else {
      newFilters = selectedFilters.includes(value) ? [] : [value];
    }

    setSelectedFilters(newFilters);
    onChange?.({ selectedFilters: newFilters, filters: newFilters });
    onAction?.('filter', { selectedFilters: newFilters, filters: newFilters, toggled: value });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <FunnelIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filters</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {options.map((option: any, index: number) => {
          const value = option.value || option;
          const label = option.label || option;
          const count = option.count;
          const isSelected = selectedFilters.includes(value);
          
          return (
            <Button
              key={index}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterToggle(value)}
              className="h-8"
            >
              {label}
              {config.showCounts && count && (
                <Badge variant="secondary" className="ml-2 h-4 text-xs">
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
      
      {selectedFilters.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {selectedFilters.length} filter{selectedFilters.length !== 1 ? 's' : ''} applied
        </div>
      )}
    </div>
  );
}

// Result List Element
export function ResultListElement({ config, data, onChange, onAction }: ElementProps) {
  const items = data?.items || [];
  const itemsPerPage = config.itemsPerPage || 10;
  const showPagination = config.showPagination !== false;
  const [selectedItem, setSelectedItem] = useState<unknown>(null);

  // Always call useMemo, even if items is empty (Rules of Hooks)
  const paginatedItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    return items.slice(0, itemsPerPage);
  }, [items, itemsPerPage]);

  const handleItemSelect = (item: unknown, index: number) => {
    setSelectedItem(item);
    onChange?.({ selectedItem: item, selectedIndex: index });
    onAction?.('select', { selectedItem: item, selectedIndex: index, items });
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="space-y-0">
          {paginatedItems.length > 0 ? (
            paginatedItems.map((item: any, index: number) => (
              <div
                key={index}
                className="px-6 py-4 border-b last:border-b-0 border-border hover:bg-muted/40 transition-colors cursor-pointer"
                onClick={() => handleItemSelect(item, index)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.title || `Result ${index + 1}`}</span>
                      {item.badge && (
                        <Badge variant="outline">{item.badge}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.description || 'Campus tool description placeholder text'}
                    </p>
                    {item.meta && (
                      <div className="text-xs text-muted-foreground mt-2 flex gap-4">
                        {item.meta.map((meta: string, metaIndex: number) => (
                          <span key={metaIndex}>{meta}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    Open
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">No results yet. Add data sources to see live preview.</p>
            </div>
          )}
        </div>

        {showPagination && (
          <div className="px-6 py-3 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Showing {paginatedItems.length} of {items.length} results
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">Previous</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Date Picker Element
export function DatePickerElement({ config, onChange, onAction }: ElementProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    onChange?.({ selectedDate: value, date: value });
    onAction?.('select', { selectedDate: value, date: value });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Date & Time</span>
      </div>

      <Input
        type={config.includeTime ? 'datetime-local' : 'date'}
        value={selectedDate}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDateChange(e.target.value)}
      />

      {config.helperText && (
        <p className="text-xs text-muted-foreground">{config.helperText}</p>
      )}
    </div>
  );
}

// User Selector Element - Fetches real users from API
export function UserSelectorElement({ config, onChange, data, context, onAction }: ElementProps) {
  const [selectedUser, setSelectedUser] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<Array<{ id: string; name: string; handle: string; photoURL?: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prioritize: context > config > data for spaceId
  const effectiveSpaceId = context?.spaceId || config.spaceId || data?.spaceId;

  // Fetch users from API when search query changes
  useEffect(() => {
    const fetchUsers = async () => {
      // Use provided data if available (for space context)
      if (data?.users && Array.isArray(data.users)) {
        setUsers(data.users.map((u: Record<string, unknown>) => ({
          id: u.id as string,
          name: u.fullName as string || u.name as string || 'Unknown',
          handle: u.handle as string || `@${(u.id as string).slice(0, 8)}`,
          photoURL: u.photoURL as string | undefined
        })));
        return;
      }

      // Only search if we have a query or spaceId context
      if (!searchQuery && !effectiveSpaceId) {
        setUsers([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/users/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: searchQuery || 'a', // Default search if in space context
            limit: config.maxResults || 20,
            spaceId: effectiveSpaceId,
            campusId: context?.campusId, // Include campus for filtering
            sortBy: 'relevance'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const result = await response.json();
        setUsers((result.users || []).map((u: Record<string, unknown>) => ({
          id: u.id as string,
          name: u.fullName as string || 'Unknown',
          handle: u.handle as string || `@${(u.id as string).slice(0, 8)}`,
          photoURL: u.photoURL as string | undefined
        })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
        // Fallback to empty state - no fake data
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the search
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, effectiveSpaceId, config.maxResults, data?.users, context?.campusId]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <UsersIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{config.label || 'Select user'}</span>
      </div>

      {/* MagnifyingGlassIcon input for filtering */}
      <Input
        value={searchQuery}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
        placeholder="MagnifyingGlassIcon members..."
        className="mb-2"
      />

      <Select
        value={selectedUser}
        onValueChange={(value) => {
          setSelectedUser(value);
          const user = users.find(u => u.id === value);
          onChange?.({ selectedUser: value, userId: value, selectedUserData: user });
          onAction?.('select', { selectedUser: value, userId: value, selectedUserData: user });
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? "Loading..." : "Choose a member"} />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Loading users...</div>
          ) : error ? (
            <div className="px-3 py-2 text-sm text-red-500">{error}</div>
          ) : users.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {searchQuery ? 'No users found' : 'Type to search for members'}
            </div>
          ) : (
            users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                <div className="flex items-center gap-2">
                  {user.photoURL && (
                    <img
                      src={user.photoURL}
                      alt=""
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  )}
                  <div className="flex flex-col">
                    <span>{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.handle}</span>
                  </div>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {config.allowMultiple && (
        <div className="text-xs text-muted-foreground">
          Hold Ctrl/Cmd to select multiple members
        </div>
      )}
    </div>
  );
}

// TagIcon Cloud Element - Uses real data when available
export function TagCloudElement({ config, data, onChange, onAction }: ElementProps) {
  // Use provided data, or show empty state (no mock data)
  const tags = data?.tags || [];
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const sortedTags = [...tags].sort((a, b) => b.weight - a.weight).slice(0, config.maxTags || 30);

  const handleTagClick = (tag: { label: string; weight: number }) => {
    const newSelected = selectedTags.includes(tag.label)
      ? selectedTags.filter(t => t !== tag.label)
      : [...selectedTags, tag.label];
    setSelectedTags(newSelected);
    onChange?.({ selectedTags: newSelected, tags: newSelected });
    onAction?.('select', { selectedTags: newSelected, tags: newSelected, clickedTag: tag.label });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TagIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">TagIcon Cloud</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {sortedTags.length > 0 ? (
          sortedTags.map((tag, index) => (
            <Badge
              key={index}
              variant={selectedTags.includes(tag.label) ? "default" : "outline"}
              className="text-sm font-medium px-3 py-1 cursor-pointer hover:bg-accent transition-colors"
              style={{
                fontSize: `${Math.max(12, Math.min(22, tag.weight + 12))}px`,
              }}
              onClick={() => handleTagClick(tag)}
            >
              {tag.label}
              {config.showCounts && (
                <span className="text-xs text-muted-foreground ml-2">
                  {tag.weight}
                </span>
              )}
            </Badge>
          ))
        ) : (
          <div className="w-full py-4 text-center text-sm text-muted-foreground">
            <TagIcon className="h-6 w-6 mx-auto mb-2 opacity-40" />
            <p>No tags yet. Tags will appear when data is connected.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Map View Element - Interactive campus map with configurable markers
interface MapMarker {
  id: string;
  name: string;
  x: number; // Percentage position
  y: number;
  type?: 'building' | 'event' | 'meetup' | 'custom';
  color?: string;
}

export function MapViewElement({ config, data, onChange, onAction }: ElementProps) {
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  // Default campus markers if none provided
  const defaultMarkers: MapMarker[] = [
    { id: '1', name: 'Student Union', x: 45, y: 35, type: 'building' },
    { id: '2', name: 'Library', x: 60, y: 45, type: 'building' },
    { id: '3', name: 'Commons', x: 35, y: 55, type: 'meetup' },
    { id: '4', name: 'Study Hall', x: 70, y: 30, type: 'building' },
  ];

  const markers: MapMarker[] = data?.markers || config?.markers || defaultMarkers;
  const mapTitle = config?.title || 'Campus Map';
  const showGrid = config?.showGrid !== false;

  const getMarkerColor = (marker: MapMarker) => {
    if (marker.color) return marker.color;
    switch (marker.type) {
      case 'event': return 'rgb(var(--amber-500, 245 158 11))'; // Amber
      case 'meetup': return 'rgb(var(--emerald-500, 16 185 129))'; // Emerald
      case 'custom': return 'rgb(var(--violet-500, 139 92 246))'; // Purple
      default: return 'rgb(var(--blue-500, 59 130 246))'; // Blue for buildings
    }
  };

  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedMarker(marker.id);
    onChange?.({ selectedMarker: marker });
    onAction?.('select_location', { marker, markerId: marker.id, name: marker.name });
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative bg-gradient-to-br from-emerald-50 to-sky-50 dark:from-emerald-950/30 dark:to-sky-950/30">
          {/* Map Header */}
          <div className="absolute top-3 left-3 z-10 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
            <p className="text-sm font-medium">{mapTitle}</p>
          </div>

          {/* SVG Map */}
          <svg viewBox="0 0 100 70" className="w-full h-56" preserveAspectRatio="xMidYMid slice">
            {/* Grid lines for visual reference */}
            {showGrid && (
              <g className="opacity-10">
                {[20, 40, 60, 80].map((x) => (
                  <line key={`v${x}`} x1={x} y1="0" x2={x} y2="70" stroke="currentColor" strokeWidth="0.2" />
                ))}
                {[15, 30, 45, 60].map((y) => (
                  <line key={`h${y}`} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" strokeWidth="0.2" />
                ))}
              </g>
            )}

            {/* Stylized paths (roads) */}
            <g className="text-muted-foreground/30">
              <path d="M10,35 Q50,20 90,40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M25,10 Q40,40 55,65" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M70,15 L75,55" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </g>

            {/* Building shapes */}
            <g className="text-muted-foreground/20">
              <rect x="42" y="32" width="8" height="6" rx="1" fill="currentColor" />
              <rect x="57" y="42" width="7" height="8" rx="1" fill="currentColor" />
              <rect x="32" y="52" width="6" height="5" rx="1" fill="currentColor" />
              <rect x="67" y="27" width="6" height="5" rx="1" fill="currentColor" />
            </g>

            {/* Markers */}
            {markers.map((marker) => (
              <g
                key={marker.id}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => handleMarkerClick(marker)}
                style={{ transformOrigin: `${marker.x}px ${marker.y}px` }}
              >
                {/* Marker pin */}
                <circle
                  cx={marker.x}
                  cy={marker.y}
                  r={selectedMarker === marker.id ? 3 : 2.5}
                  fill={getMarkerColor(marker)}
                  className="transition-all"
                />
                {/* Pulse animation for selected */}
                {selectedMarker === marker.id && (
                  <circle
                    cx={marker.x}
                    cy={marker.y}
                    r="4"
                    fill="none"
                    stroke={getMarkerColor(marker)}
                    strokeWidth="0.5"
                    className="animate-ping"
                  />
                )}
              </g>
            ))}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm rounded-lg p-2 shadow-sm">
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Building</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Meetup</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected marker info */}
        {selectedMarker && (
          <div className="p-3 border-t bg-muted/30">
            <div className="flex items-center gap-2">
              <MapPinIcon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {markers.find(m => m.id === selectedMarker)?.name || 'Selected Location'}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Chart Display Element
export function ChartDisplayElement({ config, data, onChange, onAction }: ElementProps) {
  const chartData = data?.chartData || [60, 40, 80, 55];
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  const handlePointClick = (value: number, index: number) => {
    setSelectedPoint(index);
    onChange?.({ selectedPoint: { value, index }, chartData });
    onAction?.('select', { selectedPoint: { value, index }, chartData });
  };

  return (
    <Card className="bg-gradient-to-br from-muted/50 to-muted">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Chart Preview</p>
            <p className="text-2xl font-semibold">{config.title || 'Registration Flow'}</p>
          </div>
          <Badge variant="outline" className="uppercase text-body-xs tracking-wide">
            {config.chartType || 'bar'} chart
          </Badge>
        </div>

        <div className="space-y-4">
          {chartData.map((value: number, index: number) => (
            <div
              key={index}
              className={`cursor-pointer transition-opacity ${selectedPoint === index ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}
              onClick={() => handlePointClick(value, index)}
            >
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Week {index + 1}</span>
                <span>{value}%</span>
              </div>
              <Progress value={value} className={selectedPoint === index ? 'ring-2 ring-primary' : ''} />
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground">
          {data?.chartData ? 'Click a data point to select it.' : 'Sample data shown. Connect analytics data to see real student behavior.'}
        </div>
      </CardContent>
    </Card>
  );
}

// Form Builder Element
export function FormBuilderElement({ config, data, onChange, onAction }: ElementProps) {
  const fields = config.fields || [
    { name: 'Title', type: 'text', required: true },
    { name: 'Description', type: 'textarea', required: false },
    { name: 'Location', type: 'text', required: false },
    { name: 'Date', type: 'date', required: true },
  ];

  // Hydrate from server state
  const serverSubmissions = (data?.submissions as Array<Record<string, unknown>>) || [];
  const serverSubmissionCount = (data?.submissionCount as number) || serverSubmissions.length;

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(serverSubmissionCount);

  // Sync with server state
  useEffect(() => {
    setSubmissionCount(serverSubmissionCount);
  }, [serverSubmissionCount]);

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    onChange?.({ formData: { ...formData, [fieldName]: value } });
  };

  const handleSubmit = async () => {
    // Validate required fields
    const missingRequired = fields
      .filter((f: any) => f.required && !formData[f.name])
      .map((f: any) => f.name);

    if (missingRequired.length > 0) {
      return; // Could add error UI here
    }

    setIsSubmitting(true);

    // Optimistic update
    setSubmitted(true);
    setSubmissionCount(prev => prev + 1);

    // Call server action
    onAction?.('submit', { formData, timestamp: new Date().toISOString() });

    setIsSubmitting(false);
  };

  const handleReset = () => {
    setFormData({});
    setSubmitted(false);
  };

  if (submitted && !config.allowMultipleSubmissions) {
    return (
      <Card className="border-green-500/50 bg-green-500/5">
        <CardContent className="p-6 text-center">
          <CheckIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <p className="font-medium">Response submitted!</p>
          <p className="text-sm text-muted-foreground mt-1">
            {submissionCount} total submission{submissionCount !== 1 ? 's' : ''}
          </p>
          {config.allowMultipleSubmissions && (
            <Button variant="outline" size="sm" className="mt-3" onClick={handleReset}>
              Submit another
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{config.title || 'Form'}</span>
        </div>

        <div className="space-y-3">
          {fields.map((field: any, index: number) => (
            <div key={index} className="space-y-1">
              <label className="text-sm font-medium flex items-center gap-1">
                {field.name}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  value={formData[field.name] || ''}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  placeholder={field.placeholder || `Enter ${field.name.toLowerCase()}...`}
                  className="w-full h-20 p-2 text-sm bg-background border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              ) : field.type === 'select' ? (
                <Select
                  value={formData[field.name] || ''}
                  onValueChange={(value) => handleFieldChange(field.name, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options || []).map((opt: string, optIndex: number) => (
                      <SelectItem key={optIndex} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={field.type || 'text'}
                  value={formData[field.name] || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(field.name, e.target.value)}
                  placeholder={field.placeholder || `Enter ${field.name.toLowerCase()}...`}
                />
              )}
            </div>
          ))}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : config.submitLabel || 'Submit'}
        </Button>

        {submissionCount > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {submissionCount} response{submissionCount !== 1 ? 's' : ''} collected
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Notification Center Element - Uses real data when available
export function NotificationCenterElement({ config, data }: ElementProps) {
  // Use provided notifications data, or empty array (no mock data)
  const notifications = (data?.notifications as Array<{
    title: string;
    description: string;
    timeAgo: string;
    type?: 'info' | 'success' | 'warning' | 'error';
  }>) || [];

  const maxNotifications = config.maxNotifications || 10;
  const displayedNotifications = notifications.slice(0, maxNotifications);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{config.title || 'Live Notifications'}</span>
          </div>
          <Badge variant="outline">{notifications.length} / {maxNotifications}</Badge>
        </div>

        <div className="divide-y divide-border">
          {displayedNotifications.length > 0 ? (
            displayedNotifications.map((notification, index) => (
              <div key={index} className="px-6 py-4 hover:bg-muted/40 transition-colors">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{notification.title}</span>
                  <span className="text-xs text-muted-foreground">{notification.timeAgo}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.description}
                </p>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <BellIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">
                No notifications yet. They will appear here in real-time.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Animated Flip Digit Component
function FlipDigit({ value, urgencyLevel }: { value: string; urgencyLevel: 'calm' | 'warning' | 'urgent' | 'critical' }) {
  const prefersReducedMotion = useReducedMotion();

  const colorClasses = {
    calm: 'text-foreground',
    warning: 'text-amber-500',
    urgent: 'text-orange-500',
    critical: 'text-red-500',
  };

  return (
    <div className="relative h-[56px] w-[40px] overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={prefersReducedMotion ? false : { y: -56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { y: 56, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
          className={`absolute inset-0 flex items-center justify-center text-4xl font-bold tabular-nums ${colorClasses[urgencyLevel]}`}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// Time Unit Display with flip animation
function TimeUnit({
  value,
  label,
  urgencyLevel,
  pulse = false,
}: {
  value: number;
  label: string;
  urgencyLevel: 'calm' | 'warning' | 'urgent' | 'critical';
  pulse?: boolean;
}) {
  const paddedValue = value.toString().padStart(2, '0');
  const digits = paddedValue.split('');

  return (
    <motion.div
      className="text-center"
      animate={pulse ? { scale: [1, 1.02, 1] } : {}}
      transition={pulse ? { duration: 1, repeat: Infinity, repeatType: 'loop' } : {}}
    >
      <div className="flex items-center justify-center">
        {digits.map((digit, i) => (
          <FlipDigit key={`${label}-${i}`} value={digit} urgencyLevel={urgencyLevel} />
        ))}
      </div>
      <div className="text-xs text-muted-foreground uppercase mt-1">{label}</div>
    </motion.div>
  );
}

// Countdown ClockIcon Element
export function CountdownTimerElement({ config, data, onChange, onAction }: ElementProps) {
  const prefersReducedMotion = useReducedMotion();

  // Hydrate from server state
  const serverTimeLeft = (data?.timeLeft as number) || null;
  const serverFinished = (data?.finished as boolean) || false;

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (serverTimeLeft !== null) return serverTimeLeft;
    if (config.targetDate) {
      const target = new Date(config.targetDate).getTime();
      const now = Date.now();
      return Math.max(0, Math.floor((target - now) / 1000));
    }
    return config.seconds || 3600; // Default 1 hour
  });
  const [finished, setFinished] = useState(serverFinished);
  const [justFinished, setJustFinished] = useState(false);

  // Sync with server state
  useEffect(() => {
    if (serverTimeLeft !== null) setTimeLeft(serverTimeLeft);
    if (serverFinished) setFinished(true);
  }, [serverTimeLeft, serverFinished]);

  useEffect(() => {
    if (timeLeft <= 0 && !finished) {
      setFinished(true);
      setJustFinished(true);
      onChange?.({ finished: true, timeLeft: 0 });
      onAction?.('finished', { completedAt: new Date().toISOString() });

      // Clear celebration after 2 seconds
      setTimeout(() => setJustFinished(false), 2000);
      return;
    }

    if (finished) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setFinished(true);
          setJustFinished(true);
          onChange?.({ finished: true, timeLeft: 0 });
          onAction?.('finished', { completedAt: new Date().toISOString() });
          setTimeout(() => setJustFinished(false), 2000);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, finished, onChange, onAction]);

  const formatTime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) {
      return { days, hours, mins, secs, format: 'days' as const };
    }
    return { days: 0, hours, mins, secs, format: 'hours' as const };
  };

  // Determine urgency level for color cascade
  const getUrgencyLevel = (seconds: number): 'calm' | 'warning' | 'urgent' | 'critical' => {
    if (seconds <= 60) return 'critical'; // Under 1 minute
    if (seconds <= 300) return 'urgent'; // Under 5 minutes
    if (seconds <= 3600) return 'warning'; // Under 1 hour
    return 'calm';
  };

  const time = formatTime(timeLeft);
  const urgencyLevel = getUrgencyLevel(timeLeft);
  const shouldPulse = timeLeft <= 60 && timeLeft > 0;

  // Background gradient based on urgency
  const gradientClasses = {
    calm: 'from-blue-500/10 to-indigo-500/10 border-blue-500/20',
    warning: 'from-amber-500/10 to-orange-500/10 border-amber-500/20',
    urgent: 'from-orange-500/15 to-red-500/10 border-orange-500/30',
    critical: 'from-red-500/20 to-rose-500/15 border-red-500/40',
  };

  const iconColorClasses = {
    calm: 'text-blue-500',
    warning: 'text-amber-500',
    urgent: 'text-orange-500',
    critical: 'text-red-500',
  };

  return (
    <motion.div
      initial={false}
      animate={justFinished ? { scale: [1, 1.05, 1] } : {}}
      transition={springPresets.bouncy}
    >
      <Card className={`bg-gradient-to-br transition-colors duration-500 ${gradientClasses[urgencyLevel]}`}>
        <CardContent className="p-6 text-center">
          <motion.div
            className="flex items-center justify-center gap-2 mb-4"
            animate={shouldPulse && !prefersReducedMotion ? { opacity: [1, 0.7, 1] } : {}}
            transition={shouldPulse ? { duration: 1, repeat: Infinity } : {}}
          >
            <motion.div
              animate={shouldPulse && !prefersReducedMotion ? { rotate: [0, -10, 10, 0] } : {}}
              transition={shouldPulse ? { duration: 0.5, repeat: Infinity } : {}}
            >
              <ClockIcon className={`h-5 w-5 transition-colors duration-300 ${iconColorClasses[urgencyLevel]}`} />
            </motion.div>
            <span className="text-sm font-medium text-muted-foreground">
              {config.label || 'Time Remaining'}
            </span>
          </motion.div>

          <div className="flex items-center justify-center gap-2">
            {time.format === 'days' && (
              <>
                <TimeUnit value={time.days} label="Days" urgencyLevel={urgencyLevel} />
                <div className="text-2xl font-bold text-muted-foreground self-start mt-2">:</div>
              </>
            )}
            <TimeUnit value={time.hours} label="Hours" urgencyLevel={urgencyLevel} />
            <motion.div
              className="text-2xl font-bold text-muted-foreground self-start mt-2"
              animate={!finished ? { opacity: [1, 0.3, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              :
            </motion.div>
            <TimeUnit value={time.mins} label="Mins" urgencyLevel={urgencyLevel} pulse={shouldPulse} />
            <motion.div
              className="text-2xl font-bold text-muted-foreground self-start mt-2"
              animate={!finished ? { opacity: [1, 0.3, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              :
            </motion.div>
            <TimeUnit value={time.secs} label="Secs" urgencyLevel={urgencyLevel} pulse={shouldPulse} />
          </div>

          <AnimatePresence>
            {finished && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={springPresets.bouncy}
                className="mt-4"
              >
                <motion.div
                  className="text-lg font-medium"
                  animate={justFinished ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5, repeat: justFinished ? 3 : 0 }}
                >
                  {justFinished ? '🎉' : ''} Time's up! {justFinished ? '🎉' : ''}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Poll Element
// Helper to normalize poll options - handles both string and object formats
interface PollOption {
  id: string;
  label: string;
  color?: string;
}

function normalizePollOptions(options: unknown[]): PollOption[] {
  return options.map((opt, index) => {
    if (typeof opt === 'string') {
      return { id: opt, label: opt };
    }
    if (typeof opt === 'object' && opt !== null) {
      const o = opt as Record<string, unknown>;
      return {
        id: (o.id as string) || (o.value as string) || `option-${index}`,
        label: (o.label as string) || (o.name as string) || `Option ${index + 1}`,
        color: o.color as string | undefined,
      };
    }
    return { id: `option-${index}`, label: `Option ${index + 1}` };
  });
}

export function PollElement({ id, config, data, sharedState, userState, onChange, onAction }: ElementProps) {
  const rawOptions = config.options || ['Option A', 'Option B', 'Option C'];
  const options = normalizePollOptions(rawOptions);
  const prefersReducedMotion = useReducedMotion();
  const instanceId = id || 'poll';

  // ============================================================================
  // Phase 1: SharedState Architecture
  // Read vote counts from sharedState.counters (aggregate data visible to all)
  // Read user's selection from userState (per-user personal data)
  // ============================================================================

  // Get vote counts from sharedState counters (Phase 1 architecture)
  const getVoteCountsFromSharedState = (): Record<string, number> => {
    const counts: Record<string, number> = {};
    options.forEach((opt) => {
      // Counter key format: "{instanceId}:{optionId}"
      const counterKey = `${instanceId}:${opt.id}`;
      counts[opt.id] = sharedState?.counters?.[counterKey] || 0;
    });
    return counts;
  };

  // Get user's vote from userState (Phase 1 architecture)
  const getUserVoteFromUserState = (): string | null => {
    const selectionKey = `${instanceId}:selectedOption`;
    return (userState?.selections?.[selectionKey] as string) || null;
  };

  // Get hasVoted from userState participation (Phase 1 architecture)
  const getHasVotedFromUserState = (): boolean => {
    const participationKey = `${instanceId}:hasVoted`;
    return userState?.participation?.[participationKey] || false;
  };

  // ============================================================================
  // Backward compatibility: Fall back to legacy data prop if sharedState is empty
  // ============================================================================
  const hasSharedState = sharedState && Object.keys(sharedState.counters || {}).length > 0;

  // Legacy: Hydrate from server state (data prop) for backward compatibility
  const serverResponses = (data?.responses as Record<string, { choice: string }>) || {};
  const serverTotalVotes = (data?.totalVotes as number) || 0;
  const serverUserVote = (data?.userVote as string) || null;

  // Legacy: Calculate vote counts from server responses
  const calculateLegacyVoteCounts = (): Record<string, number> => {
    const counts: Record<string, number> = {};
    options.forEach((opt) => { counts[opt.id] = 0; });
    Object.values(serverResponses).forEach((response) => {
      if (response?.choice && counts[response.choice] !== undefined) {
        counts[response.choice]++;
      }
    });
    return counts;
  };

  // Use sharedState if available, otherwise fall back to legacy data prop
  const initialVotes = hasSharedState ? getVoteCountsFromSharedState() : calculateLegacyVoteCounts();
  const initialUserVote = hasSharedState ? getUserVoteFromUserState() : serverUserVote;
  const initialHasVoted = hasSharedState ? getHasVotedFromUserState() : !!serverUserVote;

  const [votes, setVotes] = useState<Record<string, number>>(initialVotes);
  const [userVote, setUserVote] = useState<string | null>(initialUserVote);
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justVoted, setJustVoted] = useState<string | null>(null);

  // Sync with sharedState/userState when they change (Phase 1 architecture)
  useEffect(() => {
    if (hasSharedState) {
      setVotes(getVoteCountsFromSharedState());
      const userVoteFromState = getUserVoteFromUserState();
      if (userVoteFromState) {
        setUserVote(userVoteFromState);
        setHasVoted(true);
      }
    } else {
      // Legacy: sync with data prop
      setVotes(calculateLegacyVoteCounts());
      if (serverUserVote) {
        setUserVote(serverUserVote);
        setHasVoted(true);
      }
    }
  }, [sharedState?.counters, sharedState?.version, userState?.selections, userState?.participation, data?.responses, data?.totalVotes, serverUserVote]);

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0) || serverTotalVotes;
  const showResults = config.showResultsBeforeVoting || hasVoted;

  const handleVote = async (optionId: string) => {
    if ((hasVoted && !config.allowChangeVote) || isSubmitting) return;

    setIsSubmitting(true);
    setJustVoted(optionId);

    // Optimistic update
    setVotes((prev) => ({
      ...prev,
      [optionId]: (prev[optionId] || 0) + 1,
      ...(userVote ? { [userVote]: Math.max(0, (prev[userVote] || 0) - 1) } : {}),
    }));
    setUserVote(optionId);
    setHasVoted(true);

    // Call server action - the vote handler will update sharedState atomically
    onChange?.({ selectedOption: optionId, votes });
    onAction?.('vote', { optionId });

    setIsSubmitting(false);

    // Clear justVoted after animation
    setTimeout(() => setJustVoted(null), 600);
  };

  // Find winning option for visual emphasis
  const maxVotes = Math.max(...Object.values(votes), 0);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <motion.div
            initial={false}
            animate={hasVoted ? { rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.4, ease: easingArrays.default }}
          >
            <Vote className="h-5 w-5 text-primary" />
          </motion.div>
          <span className="font-semibold">{config.question || 'Cast your vote'}</span>
        </div>

        <div className="space-y-3">
          {options.map((option, index) => {
            const voteCount = votes[option.id] || 0;
            const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
            const isSelected = userVote === option.id;
            const isWinning = showResults && voteCount === maxVotes && voteCount > 0;
            const wasJustVoted = justVoted === option.id;

            return (
              <motion.button
                key={option.id}
                onClick={() => handleVote(option.id)}
                disabled={(hasVoted && !config.allowChangeVote) || isSubmitting}
                initial={false}
                animate={wasJustVoted ? { scale: [1, 0.98, 1.02, 1] } : { scale: 1 }}
                whileHover={!hasVoted || config.allowChangeVote ? { opacity: 0.9 } : {}}
                whileTap={!hasVoted || config.allowChangeVote ? { opacity: 0.8 } : {}}
                transition={springPresets.snappy}
                className={`w-full text-left p-3 rounded-lg border transition-colors relative overflow-hidden ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                } ${(hasVoted && !config.allowChangeVote) || isSubmitting ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {/* Animated result bar background */}
                {showResults && (
                  <motion.div
                    className={`absolute inset-y-0 left-0 ${
                      isSelected
                        ? 'bg-primary/20'
                        : isWinning
                          ? 'bg-amber-500/15'
                          : 'bg-muted/50'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : {
                            type: 'spring',
                            stiffness: 100,
                            damping: 20,
                            delay: index * 0.05, // Stagger effect
                          }
                    }
                    style={{ borderRadius: 'inherit' }}
                  />
                )}

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AnimatePresence mode="wait">
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={springPresets.bouncy}
                        >
                          <CheckIcon className="h-4 w-4 text-primary" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <span className={`${isSelected ? 'font-medium' : ''} ${isWinning ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                      {option.label}
                    </span>
                    {isWinning && showResults && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ ...springPresets.bouncy, delay: 0.2 }}
                        className="text-amber-500"
                      >
                        👑
                      </motion.span>
                    )}
                  </div>
                  {showResults && (
                    <motion.span
                      className="text-sm font-mono text-muted-foreground tabular-nums"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <AnimatedNumber
                        value={percentage}
                        springOptions={numberSpringPresets.snappy}
                      />%
                    </motion.span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        <motion.div
          className="flex items-center justify-between text-sm text-muted-foreground"
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 1 }}
        >
          <span>
            <AnimatedNumber
              value={totalVotes}
              springOptions={numberSpringPresets.quick}
            /> vote{totalVotes !== 1 ? 's' : ''}
          </span>
          {config.deadline && <span>Ends {config.deadline}</span>}
        </motion.div>
      </CardContent>
    </Card>
  );
}

// Leaderboard Element
export function LeaderboardElement({ id, config, data, sharedState, onAction }: ElementProps) {
  const instanceId = id || 'leaderboard';
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ============================================================================
  // Phase 1: SharedState Architecture
  // Read leaderboard entries from sharedState.collections (aggregate data)
  // OR from sharedState.computed for pre-computed rankings
  // ============================================================================

  // Get entries from sharedState collections (Phase 1 architecture)
  const getEntriesFromSharedState = (): Record<string, { score: number; name?: string; updatedAt?: string }> | null => {
    const collectionKey = `${instanceId}:entries`;
    const collection = sharedState?.collections?.[collectionKey];
    if (!collection) return null;

    // Convert collection entities to leaderboard entries
    const entries: Record<string, { score: number; name?: string; updatedAt?: string }> = {};
    for (const [entryId, entity] of Object.entries(collection)) {
      entries[entryId] = {
        score: (entity.data?.score as number) || 0,
        name: (entity.data?.name as string) || undefined,
        updatedAt: entity.createdAt,
      };
    }
    return entries;
  };

  // Get pre-computed rankings from sharedState.computed (Phase 1 architecture)
  const getComputedRankings = (): Array<{ id: string; name: string; score: number; rank: number }> | null => {
    const computedKey = `${instanceId}:rankings`;
    const rankings = sharedState?.computed?.[computedKey];
    if (Array.isArray(rankings)) {
      return rankings as Array<{ id: string; name: string; score: number; rank: number }>;
    }
    return null;
  };

  // ============================================================================
  // Backward compatibility: Fall back to legacy data prop if sharedState is empty
  // ============================================================================
  const hasSharedState = sharedState && (
    Object.keys(sharedState.collections || {}).length > 0 ||
    Object.keys(sharedState.computed || {}).length > 0
  );

  // Legacy: Hydrate from server state
  const serverEntries = data?.entries as Record<string, { score: number; name?: string; updatedAt?: string }> | undefined;

  // Allow manual refresh action (useful for connection cascade)
  const handleRefresh = async () => {
    setIsRefreshing(true);
    onAction?.('refresh', {});
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const entries = useMemo(() => {
    // First, check for pre-computed rankings (fastest)
    const computedRankings = getComputedRankings();
    if (computedRankings && computedRankings.length > 0) {
      return computedRankings.map(entry => ({
        ...entry,
        change: 'same' as const,
      }));
    }

    // Second, try sharedState collections (Phase 1 architecture)
    const sharedStateEntries = hasSharedState ? getEntriesFromSharedState() : null;
    const entriesToUse = sharedStateEntries || serverEntries;

    if (entriesToUse && Object.keys(entriesToUse).length > 0) {
      // Convert entries object to sorted array with ranks
      return Object.entries(entriesToUse)
        .map(([entryId, entry]) => ({
          id: entryId,
          name: entry.name || `User ${entryId.slice(0, 6)}`,
          score: entry.score || 0,
          updatedAt: entry.updatedAt,
        }))
        .sort((a, b) => b.score - a.score)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
          change: 'same' as const, // Could track previous rank for change indicator
        }));
    }
    // Fallback to empty state (no mock data in production)
    return [];
  }, [sharedState?.collections, sharedState?.computed, sharedState?.version, serverEntries]);

  const maxEntries = config.maxEntries || 10;
  const displayEntries = entries.slice(0, maxEntries);
  const hasData = displayEntries.length > 0;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <TrophyIcon className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <TrophyIcon className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <TrophyIcon className="h-5 w-5 text-amber-600" />;
    return <span className="w-5 text-center text-muted-foreground font-mono">{rank}</span>;
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <TrophyIcon className="h-5 w-5 text-yellow-500" />
          <span className="font-semibold">{config.title || 'Leaderboard'}</span>
        </div>

        <div className="divide-y divide-border">
          {hasData ? (
            displayEntries.map((entry: any, index: number) => (
              <div
                key={entry.id || index}
                className={`px-6 py-3 flex items-center gap-4 ${
                  entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-500/5 to-transparent' : ''
                }`}
              >
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(entry.rank)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{entry.name}</div>
                  {config.showSubtitle && entry.subtitle && (
                    <div className="text-xs text-muted-foreground">{entry.subtitle}</div>
                  )}
                </div>

                {config.showScore !== false && (
                  <div className="text-right">
                    <div className="font-semibold tabular-nums">
                      {entry.score.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {config.scoreLabel || 'pts'}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-muted-foreground">
              <TrophyIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No entries yet. Be the first to score!</p>
            </div>
          )}
        </div>

        {hasData && entries.length > maxEntries && (
          <div className="px-6 py-3 border-t border-border text-center">
            <Button variant="ghost" size="sm">
              View all {entries.length} entries
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Connected tier elements have been extracted to elements/connected/
// - EventPickerElement
// - SpacePickerElement
// - ConnectionListElement

// ============================================================
// Space Tier Elements — EXTRACTED
// Location: ./elements/space/
// Elements: MemberListElement, MemberSelectorElement, SpaceEventsElement,
//           SpaceFeedElement, SpaceStatsElement, AnnouncementElement,
//           RoleGateElement, AvailabilityHeatmapElement
// ============================================================

// RSVP Button Element
export function RsvpButtonElement({ id, config, data, sharedState, userState, onChange, onAction }: ElementProps) {
  const prefersReducedMotion = useReducedMotion();
  const instanceId = id || 'rsvp';

  // ============================================================================
  // Phase 1: SharedState Architecture
  // Read RSVP count from sharedState.counters (aggregate data visible to all)
  // Read attendee list from sharedState.collections
  // Read user's RSVP status from userState (per-user personal data)
  // ============================================================================

  // Get RSVP count from sharedState counters (Phase 1 architecture)
  const getRsvpCountFromSharedState = (): number => {
    const counterKey = `${instanceId}:total`;
    return sharedState?.counters?.[counterKey] || 0;
  };

  // Get attendee count from sharedState collections (Phase 1 architecture)
  const getAttendeeCountFromSharedState = (): number => {
    const collectionKey = `${instanceId}:attendees`;
    const attendees = sharedState?.collections?.[collectionKey] || {};
    return Object.keys(attendees).length;
  };

  // Get waitlist count from sharedState collections
  const getWaitlistCountFromSharedState = (): number => {
    const collectionKey = `${instanceId}:waitlist`;
    const waitlist = sharedState?.collections?.[collectionKey] || {};
    return Object.keys(waitlist).length;
  };

  // Get user's RSVP status from userState (Phase 1 architecture)
  const getUserRsvpFromUserState = (): boolean => {
    const participationKey = `${instanceId}:hasRsvped`;
    return userState?.participation?.[participationKey] || false;
  };

  // Get user's waitlist status from userState
  const getUserWaitlistFromUserState = (): boolean => {
    const waitlistKey = `${instanceId}:onWaitlist`;
    return userState?.participation?.[waitlistKey] || false;
  };

  // Get user's waitlist position from userState
  const getUserWaitlistPositionFromUserState = (): number | null => {
    const positionKey = `${instanceId}:waitlistPosition`;
    const position = userState?.selections?.[positionKey];
    return typeof position === 'number' ? position : null;
  };

  // Get user's response type from userState (Phase 1 architecture)
  const getUserResponseFromUserState = (): string | null => {
    const selectionKey = `${instanceId}:response`;
    return (userState?.selections?.[selectionKey] as string) || null;
  };

  // ============================================================================
  // Backward compatibility: Fall back to legacy data prop if sharedState is empty
  // ============================================================================
  const hasSharedState = sharedState && (
    Object.keys(sharedState.counters || {}).length > 0 ||
    Object.keys(sharedState.collections || {}).length > 0
  );

  // Legacy: Hydrate from server state
  const serverAttendees = (data?.attendees as Record<string, unknown>) || {};
  const serverCount = (data?.count as number) || 0;
  const serverWaitlist = (data?.waitlist as string[]) || [];
  const serverUserRsvp = (data?.userRsvp as string) || null; // 'yes', 'maybe', 'no', or null
  const serverUserOnWaitlist = (data?.userOnWaitlist as boolean) || false;
  const serverUserWaitlistPosition = (data?.userWaitlistPosition as number) || null;

  // Use sharedState if available, otherwise fall back to legacy data prop
  const initialCount = hasSharedState
    ? (getRsvpCountFromSharedState() || getAttendeeCountFromSharedState())
    : (serverCount || Object.keys(serverAttendees).length);
  const initialIsRsvped = hasSharedState ? getUserRsvpFromUserState() : serverUserRsvp === 'yes';
  const initialIsOnWaitlist = hasSharedState ? getUserWaitlistFromUserState() : serverUserOnWaitlist;
  const initialWaitlistPosition = hasSharedState ? getUserWaitlistPositionFromUserState() : serverUserWaitlistPosition;
  const initialWaitlistCount = hasSharedState ? getWaitlistCountFromSharedState() : serverWaitlist.length;

  const [isRsvped, setIsRsvped] = useState(initialIsRsvped);
  const [rsvpCount, setRsvpCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const [justRsvped, setJustRsvped] = useState(false);

  // Waitlist state
  const [isOnWaitlist, setIsOnWaitlist] = useState(initialIsOnWaitlist);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(initialWaitlistPosition);
  const [waitlistCount, setWaitlistCount] = useState(initialWaitlistCount);
  const [isWaitlistLoading, setIsWaitlistLoading] = useState(false);
  const [justJoinedWaitlist, setJustJoinedWaitlist] = useState(false);

  // Sync with sharedState/userState when they change (Phase 1 architecture)
  useEffect(() => {
    if (hasSharedState) {
      const count = getRsvpCountFromSharedState() || getAttendeeCountFromSharedState();
      setRsvpCount(count);
      setIsRsvped(getUserRsvpFromUserState());
      setIsOnWaitlist(getUserWaitlistFromUserState());
      setWaitlistPosition(getUserWaitlistPositionFromUserState());
      setWaitlistCount(getWaitlistCountFromSharedState());
    } else {
      // Legacy: sync with data prop
      const count = serverCount || Object.keys(serverAttendees).length;
      setRsvpCount(count);
      setIsRsvped(serverUserRsvp === 'yes');
      setIsOnWaitlist(serverUserOnWaitlist);
      setWaitlistPosition(serverUserWaitlistPosition);
      setWaitlistCount(serverWaitlist.length);
    }
  }, [sharedState?.counters, sharedState?.collections, sharedState?.version, userState?.participation, userState?.selections, data?.attendees, data?.count, serverUserRsvp, serverCount, serverAttendees, serverUserOnWaitlist, serverUserWaitlistPosition, serverWaitlist.length]);

  const maxAttendees = config.maxAttendees || null;
  const isFull = maxAttendees && rsvpCount >= maxAttendees;
  const capacityPercentage = maxAttendees ? Math.min(100, (rsvpCount / maxAttendees) * 100) : 0;
  const isNearlyFull = capacityPercentage >= 80;
  const spotsLeft = maxAttendees ? maxAttendees - rsvpCount : null;

  const handleRsvp = async () => {
    if ((isFull && !isRsvped) || isLoading) return;

    setIsLoading(true);

    const newState = !isRsvped;

    // Optimistic update
    setIsRsvped(newState);
    setRsvpCount((prev: number) => (newState ? prev + 1 : Math.max(0, prev - 1)));

    if (newState) {
      setJustRsvped(true);
      setTimeout(() => setJustRsvped(false), 1500);
    }

    // Call server action
    onChange?.({ isRsvped: newState, rsvpCount: rsvpCount + (newState ? 1 : -1) });
    onAction?.(newState ? 'rsvp' : 'cancel_rsvp', {
      response: newState ? 'yes' : 'no',
      eventName: config.eventName
    });

    setIsLoading(false);
  };

  // Handle joining or leaving the waitlist
  const handleWaitlistToggle = async () => {
    if (isWaitlistLoading) return;

    setIsWaitlistLoading(true);

    const newState = !isOnWaitlist;

    // Optimistic update
    setIsOnWaitlist(newState);
    if (newState) {
      const newPosition = waitlistCount + 1;
      setWaitlistPosition(newPosition);
      setWaitlistCount((prev: number) => prev + 1);
      setJustJoinedWaitlist(true);
      setTimeout(() => setJustJoinedWaitlist(false), 1500);
    } else {
      setWaitlistPosition(null);
      setWaitlistCount((prev: number) => Math.max(0, prev - 1));
    }

    // Call server action
    onChange?.({
      isOnWaitlist: newState,
      waitlistPosition: newState ? (waitlistCount + 1) : null,
      waitlistCount: waitlistCount + (newState ? 1 : -1),
    });
    onAction?.(newState ? 'join_waitlist' : 'leave_waitlist', {
      eventName: config.eventName,
      position: newState ? (waitlistCount + 1) : null,
    });

    setIsWaitlistLoading(false);
  };

  // Capacity bar color based on fill level
  const getCapacityColor = () => {
    if (isFull) return 'bg-red-500';
    if (capacityPercentage >= 90) return 'bg-orange-500';
    if (capacityPercentage >= 80) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <motion.div
      initial={false}
      animate={justRsvped ? { scale: [1, 1.02, 1] } : {}}
      transition={springPresets.bouncy}
    >
      <Card
        className={`overflow-hidden transition-all duration-300 ${
          isRsvped
            ? 'border-green-500/50 bg-green-500/5 shadow-[0_0_20px_rgba(34,197,94,0.15)]'
            : ''
        }`}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{config.eventName || 'Event'}</div>
              {config.eventDate && (
                <div className="text-sm text-muted-foreground">{config.eventDate}</div>
              )}
            </div>

            <motion.div
              whileHover={{ opacity: 0.9 }}
              whileTap={{ opacity: 0.8 }}
              transition={springPresets.snappy}
            >
              <Button
                onClick={handleRsvp}
                disabled={isLoading || (isFull && !isRsvped)}
                variant={isRsvped ? 'outline' : 'default'}
                className={`relative overflow-hidden ${
                  isRsvped
                    ? 'border-green-500 text-green-600 hover:bg-green-500/10'
                    : ''
                }`}
              >
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center"
                    >
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"
                      />
                      ...
                    </motion.span>
                  ) : isRsvped ? (
                    <motion.span
                      key="going"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center"
                    >
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={springPresets.bouncy}
                      >
                        <CheckIcon className="h-4 w-4 mr-2" />
                      </motion.div>
                      Going
                    </motion.span>
                  ) : (
                    <motion.span
                      key="rsvp"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center"
                    >
                      <UserPlusIcon className="h-4 w-4 mr-2" />
                      RSVP
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Celebration particles */}
                {justRsvped && !prefersReducedMotion && (
                  <>
                    {[...Array(6)].map((_, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                        animate={{
                          opacity: 0,
                          scale: 1,
                          x: (Math.random() - 0.5) * 60,
                          y: (Math.random() - 0.5) * 40 - 20,
                        }}
                        transition={{ duration: 0.6, delay: i * 0.05 }}
                        className="absolute text-xs"
                        style={{ left: '50%', top: '50%' }}
                      >
                        {['✨', '🎉', '🎊', '⭐', '💫', '🌟'][i]}
                      </motion.span>
                    ))}
                  </>
                )}
              </Button>
            </motion.div>
          </div>

          {/* Capacity bar */}
          {maxAttendees && config.showCount !== false && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Capacity</span>
                <motion.span
                  className={`font-medium ${isFull ? 'text-red-500' : isNearlyFull ? 'text-amber-500' : 'text-muted-foreground'}`}
                  animate={isNearlyFull && !prefersReducedMotion ? { opacity: [1, 0.7, 1] } : {}}
                  transition={isNearlyFull ? { duration: 1.5, repeat: Infinity } : {}}
                >
                  <AnimatedNumber value={rsvpCount} springOptions={numberSpringPresets.quick} />/{maxAttendees}
                </motion.span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden relative">
                <motion.div
                  className={`h-full rounded-full ${getCapacityColor()} ${
                    isNearlyFull ? 'shadow-[0_0_8px_currentColor]' : ''
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${capacityPercentage}%` }}
                  transition={prefersReducedMotion ? { duration: 0 } : springPresets.default}
                />
                {/* Glow effect at high capacity */}
                {isNearlyFull && !prefersReducedMotion && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `linear-gradient(90deg, transparent 0%, transparent ${capacityPercentage - 10}%, rgba(251,191,36,0.4) ${capacityPercentage}%, transparent ${capacityPercentage}%)`,
                    }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>
            </div>
          )}

          {config.showCount !== false && (
            <motion.div
              className="mt-3 flex items-center justify-between text-sm"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
            >
              <span className="text-muted-foreground flex items-center gap-1">
                <UsersIcon className="h-4 w-4" />
                <AnimatedNumber value={rsvpCount} springOptions={numberSpringPresets.quick} />
                {' '}{rsvpCount === 1 ? 'person' : 'people'} going
              </span>
              {maxAttendees && spotsLeft !== null && (
                <motion.span
                  className={`font-medium ${isFull ? 'text-red-500' : spotsLeft <= 3 ? 'text-amber-500' : 'text-muted-foreground'}`}
                  animate={spotsLeft <= 3 && spotsLeft > 0 && !prefersReducedMotion ? { scale: [1, 1.05, 1] } : {}}
                  transition={spotsLeft <= 3 ? { duration: 0.8, repeat: Infinity } : {}}
                >
                  {isFull ? '🔒 Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
                </motion.span>
              )}
            </motion.div>
          )}

          {/* Waitlist UI - Show when event is full and user hasn't RSVP'd */}
          <AnimatePresence>
            {isFull && !isRsvped && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={springPresets.gentle}
                className="overflow-hidden"
              >
                <motion.button
                  onClick={handleWaitlistToggle}
                  disabled={isWaitlistLoading}
                  className={`w-full p-3 text-sm rounded-lg text-center border transition-all duration-200 ${
                    isOnWaitlist
                      ? 'bg-amber-500/15 text-amber-500 border-amber-500/30 hover:bg-amber-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/15'
                  }`}
                  whileHover={!isWaitlistLoading ? { opacity: 0.9 } : {}}
                  whileTap={!isWaitlistLoading ? { opacity: 0.8 } : {}}
                  animate={justJoinedWaitlist && !prefersReducedMotion ? { scale: [1, 1.02, 1] } : {}}
                  aria-label={isOnWaitlist ? 'Leave waitlist' : 'Join waitlist'}
                >
                  <AnimatePresence mode="wait">
                    {isWaitlistLoading ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                        />
                        <span>Processing...</span>
                      </motion.span>
                    ) : isOnWaitlist ? (
                      <motion.span
                        key="on-waitlist"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="flex flex-col items-center gap-1"
                      >
                        <span className="flex items-center gap-2">
                          <CheckIcon className="h-4 w-4" />
                          <span className="font-medium">On Waitlist</span>
                        </span>
                        {waitlistPosition && (
                          <span className="text-xs opacity-80">
                            Position #{waitlistPosition} of {waitlistCount}
                          </span>
                        )}
                        <span className="text-xs opacity-60 mt-0.5">Click to leave waitlist</span>
                      </motion.span>
                    ) : (
                      <motion.span
                        key="join"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="flex flex-col items-center gap-1"
                      >
                        <span className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4" />
                          <span>Join Waitlist</span>
                        </span>
                        {waitlistCount > 0 && (
                          <span className="text-xs opacity-70">
                            {waitlistCount} {waitlistCount === 1 ? 'person' : 'people'} waiting
                          </span>
                        )}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Celebration effect when joining waitlist */}
                  {justJoinedWaitlist && !prefersReducedMotion && (
                    <>
                      {[...Array(4)].map((_, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                          animate={{
                            opacity: 0,
                            scale: 1,
                            x: (Math.random() - 0.5) * 40,
                            y: (Math.random() - 0.5) * 30 - 10,
                          }}
                          transition={{ duration: 0.5, delay: i * 0.05 }}
                          className="absolute text-xs"
                          style={{ left: '50%', top: '50%' }}
                        >
                          {['📋', '✨', '🎯', '👍'][i]}
                        </motion.span>
                      ))}
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ClockIcon Element (stopwatch-style: start/stop/reset)
export function TimerElement({ config, data, onAction }: ElementProps) {
  // Hydrate from server state
  const serverElapsed = (data?.elapsed as number) || 0;
  const serverIsRunning = (data?.isRunning as boolean) || false;
  const serverStartedAt = (data?.startedAt as string) || null;

  const [elapsed, setElapsed] = useState(serverElapsed);
  const [isRunning, setIsRunning] = useState(serverIsRunning);
  const [startTime, setStartTime] = useState<number | null>(
    serverStartedAt ? new Date(serverStartedAt).getTime() : null
  );

  // Sync with server state
  useEffect(() => {
    setElapsed(serverElapsed);
    setIsRunning(serverIsRunning);
    if (serverStartedAt) {
      setStartTime(new Date(serverStartedAt).getTime());
    }
  }, [serverElapsed, serverIsRunning, serverStartedAt]);

  // ClockIcon tick
  useEffect(() => {
    if (!isRunning || !startTime) return;

    const interval = setInterval(() => {
      setElapsed(serverElapsed + Math.floor((Date.now() - startTime) / 1000));
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, startTime, serverElapsed]);

  const handleStart = () => {
    setIsRunning(true);
    setStartTime(Date.now());
    onAction?.('start', { startedAt: new Date().toISOString() });
  };

  const handleStop = () => {
    setIsRunning(false);
    setStartTime(null);
    onAction?.('stop', { elapsed, stoppedAt: new Date().toISOString() });
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsed(0);
    setStartTime(null);
    onAction?.('reset', {});
  };

  const formatElapsed = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={`${isRunning ? 'border-green-500/50 bg-green-500/5' : ''}`}>
      <CardContent className="p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <ClockIcon className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            {config.label || 'ClockIcon'}
          </span>
        </div>

        <div className="text-5xl font-bold tabular-nums mb-6">
          {formatElapsed(elapsed)}
        </div>

        <div className="flex items-center justify-center gap-3">
          {!isRunning ? (
            <Button onClick={handleStart} variant="default" size="sm">
              Start
            </Button>
          ) : (
            <Button onClick={handleStop} variant="outline" size="sm">
              Stop
            </Button>
          )}
          <Button
            onClick={handleReset}
            variant="ghost"
            size="sm"
            disabled={elapsed === 0 && !isRunning}
          >
            Reset
          </Button>
        </div>

        {config.showLapTimes && (
          <div className="mt-4 text-xs text-muted-foreground">
            Lap times can be tracked here
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Counter Element (increment/decrement)
export function CounterElement({ config, data, onAction }: ElementProps) {
  const serverCount = (data?.count as number) || config.initialValue || 0;
  const [count, setCount] = useState(serverCount);
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync with server state
  useEffect(() => {
    setCount(serverCount);
  }, [serverCount]);

  const handleIncrement = async () => {
    setIsUpdating(true);
    const step = config.step || 1;
    const newCount = count + step;

    // Respect max if set
    if (config.max !== undefined && newCount > config.max) {
      setIsUpdating(false);
      return;
    }

    setCount(newCount);
    onAction?.('increment', { count: newCount, step });
    setIsUpdating(false);
  };

  const handleDecrement = async () => {
    setIsUpdating(true);
    const step = config.step || 1;
    const newCount = count - step;

    // Respect min if set
    if (config.min !== undefined && newCount < config.min) {
      setIsUpdating(false);
      return;
    }

    setCount(newCount);
    onAction?.('decrement', { count: newCount, step });
    setIsUpdating(false);
  };

  const handleReset = async () => {
    const initialValue = config.initialValue || 0;
    setCount(initialValue);
    onAction?.('reset', { count: initialValue });
  };

  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="text-sm font-medium text-muted-foreground mb-4">
          {config.label || 'Counter'}
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={handleDecrement}
            variant="outline"
            size="sm"
            disabled={isUpdating || (config.min !== undefined && count <= config.min)}
          >
            −
          </Button>

          <div className="text-4xl font-bold tabular-nums min-w-[80px]">
            {count}
          </div>

          <Button
            onClick={handleIncrement}
            variant="outline"
            size="sm"
            disabled={isUpdating || (config.max !== undefined && count >= config.max)}
          >
            +
          </Button>
        </div>

        {config.showReset && (
          <Button
            onClick={handleReset}
            variant="ghost"
            size="sm"
            className="mt-4"
            disabled={count === (config.initialValue || 0)}
          >
            Reset
          </Button>
        )}

        {(config.min !== undefined || config.max !== undefined) && (
          <div className="mt-3 text-xs text-muted-foreground">
            {config.min !== undefined && `Min: ${config.min}`}
            {config.min !== undefined && config.max !== undefined && ' • '}
            {config.max !== undefined && `Max: ${config.max}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// AvailabilityHeatmapElement — EXTRACTED to ./elements/space/availability-heatmap.tsx

// Element renderer map - focused element set for tool building
const ELEMENT_RENDERERS: Record<string, (props: ElementProps) => React.JSX.Element> = {
  // Input Elements - Collect user input
  'search-input': SearchInputElement,
  'date-picker': DatePickerElement,
  'user-selector': UserSelectorElement,
  'form-builder': FormBuilderElement,

  // FunnelIcon Elements
  'filter-selector': FilterSelectorElement,

  // Display Elements - Show data
  'result-list': ResultListElement,
  'chart-display': ChartDisplayElement,
  'tag-cloud': TagCloudElement,
  'map-view': MapViewElement,
  'notification-center': NotificationCenterElement,
  'notification-display': NotificationCenterElement, // Alias for registry consistency

  // Action Elements - Interactive engagement (core of HiveLab)
  'poll-element': PollElement,
  'rsvp-button': RsvpButtonElement,
  'countdown-timer': CountdownTimerElement,
  'leaderboard': LeaderboardElement,
  'counter': CounterElement,
  'timer': TimerElement,

  // Connected tier - EXTRACTED to ./elements/connected/
  // Space tier - EXTRACTED to ./elements/space/
};

/**
 * Raw element renderer - use renderElementSafe for production
 */
export function renderElement(elementId: string, props: ElementProps) {
  // Normalize: strip numeric suffixes like "-1", "-2" that AI generation might add
  const normalizedId = elementId.replace(/-\d+$/, '');

  const renderer = ELEMENT_RENDERERS[normalizedId];
  if (!renderer) {
    // Unknown element type - render placeholder
    return (
      <div className="border border-dashed border-border rounded-lg p-4 text-sm text-muted-foreground">
        Unimplemented element: {elementId}
      </div>
    );
  }

  return renderer(props);
}

/**
 * Safe element renderer with error boundary.
 * Use this in production to prevent individual element crashes from breaking the tool.
 *
 * @param elementId - The element type ID (e.g., 'poll-element', 'counter')
 * @param props - Element props including config and callbacks
 * @param onError - Optional error handler for logging/analytics
 */
export function renderElementSafe(
  elementId: string,
  props: ElementProps,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  // Normalize: strip numeric suffixes like "-1", "-2" that AI generation might add
  const normalizedId = elementId.replace(/-\d+$/, '');

  const renderer = ELEMENT_RENDERERS[normalizedId];
  if (!renderer) {
    // Unknown element type - render placeholder (no boundary needed)
    return (
      <div className="border border-dashed border-border rounded-lg p-4 text-sm text-muted-foreground">
        Unimplemented element: {elementId}
      </div>
    );
  }

  return (
    <ElementErrorBoundary elementType={normalizedId} onError={onError}>
      {renderer(props)}
    </ElementErrorBoundary>
  );
}

/**
 * CheckIcon if an element type is supported
 */
export function isElementSupported(elementId: string): boolean {
  const normalizedId = elementId.replace(/-\d+$/, '');
  return normalizedId in ELEMENT_RENDERERS;
}

/**
 * Get list of all supported element types
 */
export function getSupportedElementTypes(): string[] {
  return Object.keys(ELEMENT_RENDERERS);
}
