'use client';

/**
 * Map View Element - Refactored with Core Abstractions
 *
 * SVG-based campus map with:
 * - Interactive markers
 * - Grid overlay
 * - Selection state
 */

import * as React from 'react';
import { useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

import { Card, CardContent } from '../../../../design-system/primitives';

import type { ElementProps } from '../../../../lib/hivelab/element-system';
import type { ElementMode } from '../core';

// ============================================================
// Types
// ============================================================

interface MapMarker {
  id: string;
  name: string;
  x: number;
  y: number;
  type?: 'building' | 'event' | 'meetup' | 'custom';
  color?: string;
}

interface MapViewConfig {
  title?: string;
  markers?: MapMarker[];
  showGrid?: boolean;
}

interface MapViewElementProps extends ElementProps {
  config: MapViewConfig;
  mode?: ElementMode;
}

// ============================================================
// Constants
// ============================================================

const DEFAULT_MARKERS: MapMarker[] = [
  { id: '1', name: 'Student Union', x: 45, y: 35, type: 'building' },
  { id: '2', name: 'Library', x: 60, y: 45, type: 'building' },
  { id: '3', name: 'Commons', x: 35, y: 55, type: 'meetup' },
  { id: '4', name: 'Study Hall', x: 70, y: 30, type: 'building' },
];

// ============================================================
// Helper
// ============================================================

function getMarkerColor(marker: MapMarker): string {
  if (marker.color) return marker.color;
  switch (marker.type) {
    case 'event': return 'rgb(245 158 11)';
    case 'meetup': return 'rgb(16 185 129)';
    case 'custom': return 'rgb(139 92 246)';
    default: return 'rgb(59 130 246)';
  }
}

// ============================================================
// Main Map View Element
// ============================================================

export function MapViewElement({
  config,
  data,
  onChange,
  onAction,
  mode = 'runtime',
}: MapViewElementProps) {
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  const markers: MapMarker[] = data?.markers || config?.markers || DEFAULT_MARKERS;
  const mapTitle = config?.title || 'Campus Map';
  const showGrid = config?.showGrid !== false;

  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedMarker(marker.id);
    onChange?.({ selectedMarker: marker });
    onAction?.('select_location', { marker, markerId: marker.id, name: marker.name });
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative bg-gradient-to-br from-emerald-50 to-sky-50 dark:from-emerald-950/30 dark:to-sky-950/30">
          <div className="absolute top-3 left-3 z-10 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
            <p className="text-sm font-medium">{mapTitle}</p>
          </div>

          <svg viewBox="0 0 100 70" className="w-full h-56" preserveAspectRatio="xMidYMid slice">
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

            <g className="text-muted-foreground/30">
              <path d="M10,35 Q50,20 90,40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M25,10 Q40,40 55,65" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M70,15 L75,55" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </g>

            <g className="text-muted-foreground/20">
              <rect x="42" y="32" width="8" height="6" rx="1" fill="currentColor" />
              <rect x="57" y="42" width="7" height="8" rx="1" fill="currentColor" />
              <rect x="32" y="52" width="6" height="5" rx="1" fill="currentColor" />
              <rect x="67" y="27" width="6" height="5" rx="1" fill="currentColor" />
            </g>

            {markers.map((marker) => (
              <g
                key={marker.id}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => handleMarkerClick(marker)}
                style={{ transformOrigin: `${marker.x}px ${marker.y}px` }}
              >
                <circle
                  cx={marker.x}
                  cy={marker.y}
                  r={selectedMarker === marker.id ? 3 : 2.5}
                  fill={getMarkerColor(marker)}
                  className="transition-all"
                />
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

export default MapViewElement;
