'use client';

/**
 * Universal HiveLab Elements - Basic UI components that work anywhere
 *
 * These elements have no data dependencies and can be used in any context.
 * Split from element-renderers.tsx for better maintainability.
 *
 * GTM Polish Pass (January 2026):
 * - Added Framer Motion animations
 * - Improved focus states and transitions
 * - Better visual feedback on interactions
 */

import * as React from 'react';
import { useEffect, useMemo, useState, useRef } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, CalendarIcon, TagIcon, MapPinIcon, DocumentTextIcon, BellIcon, CheckIcon, UsersIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { springPresets } from '@hive/tokens';

import { Input } from '../../../design-system/primitives';
import { Button } from '../../../design-system/primitives';
import { Card, CardContent } from '../../../design-system/primitives';
import { Badge } from '../../../design-system/primitives';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../design-system/primitives';
import { Progress } from '../../../design-system/primitives';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import type { ElementProps } from '../../../lib/hivelab/element-system';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** FunnelIcon option can be a string or an object with value/label/count */
interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

/** Result item for list rendering */
interface ResultItem {
  id?: string;
  title?: string;
  description?: string;
  badge?: string;
  meta?: string[];
}

/** Form field configuration */
interface FormField {
  name: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select';
  label?: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
}

/** Normalizes filter option to consistent interface */
function normalizeFilterOption(option: string | FilterOption): FilterOption {
  if (typeof option === 'string') {
    return { value: option, label: option };
  }
  return {
    value: option.value || String(option),
    label: option.label || option.value || String(option),
    count: option.count
  };
}

// ============================================================================
// SEARCH INPUT ELEMENT - Premium search with animated suggestions
// ============================================================================

export function SearchInputElement({ config, onChange }: ElementProps) {
  const prefersReducedMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const debounceMs = config.debounceMs || 300;

  useEffect(() => {
    if (query.length > 0) {
      setIsSearching(true);
    }

    const timer = setTimeout(() => {
      setIsSearching(false);
      if (onChange && query !== '') {
        onChange({ query, searchTerm: query });
      }

      // Mock suggestions for demo
      if (config.showSuggestions && query.length > 2) {
        setSuggestions([
          `${query} in spaces`,
          `${query} in users`,
          `${query} in posts`
        ]);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs, onChange, config.showSuggestions]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      setQuery(suggestions[selectedIndex]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleClear = () => {
    setQuery('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <motion.div
      className="relative"
      initial={false}
      animate={isFocused ? { scale: 1.01 } : { scale: 1 }}
      transition={springPresets.snappy}
    >
      <div className="relative">
        {/* Animated search icon */}
        <motion.div
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10"
          animate={isSearching && !prefersReducedMotion ? { rotate: [0, 360] } : {}}
          transition={isSearching ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
        >
          <MagnifyingGlassIcon className={`h-4 w-4 transition-colors duration-200 ${
            isFocused ? 'text-primary' : 'text-muted-foreground'
          }`} />
        </motion.div>

        <Input
          ref={inputRef}
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            // Delay hiding suggestions to allow click
            setTimeout(() => setShowSuggestions(false), 150);
          }}
          onKeyDown={handleKeyDown}
          placeholder={config.placeholder || 'Search...'}
          className={`pl-10 pr-10 transition-all duration-200 ${
            isFocused
              ? 'ring-2 ring-primary/20 border-primary/50'
              : ''
          }`}
        />

        {/* Clear button with animation */}
        <AnimatePresence>
          {query.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={springPresets.snappy}
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              ×
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Animated suggestions dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={springPresets.snappy}
            className="absolute z-20 w-full mt-2 bg-background border border-border rounded-xl shadow-xl overflow-hidden"
          >
            <div className="py-1">
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={prefersReducedMotion ? {} : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                    selectedIndex === index
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => {
                    setQuery(suggestion);
                    setShowSuggestions(false);
                    setSelectedIndex(-1);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <SparklesIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{suggestion}</span>
                </motion.button>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
              Use ↑↓ to navigate, Enter to select
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// FILTER SELECTOR ELEMENT - Premium animated filter pills
// ============================================================================

export function FilterSelectorElement({ config, onChange }: ElementProps) {
  const prefersReducedMotion = useReducedMotion();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [justSelected, setJustSelected] = useState<string | null>(null);
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
    if (!selectedFilters.includes(value)) {
      setJustSelected(value);
      setTimeout(() => setJustSelected(null), 300);
    }

    if (onChange) {
      onChange({ selectedFilters: newFilters, filters: newFilters });
    }
  };

  const clearAll = () => {
    setSelectedFilters([]);
    onChange?.({ selectedFilters: [], filters: [] });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <motion.div
            animate={selectedFilters.length > 0 && !prefersReducedMotion ? { rotate: [0, -10, 10, 0] } : {}}
            transition={{ duration: 0.3 }}
          >
            <FunnelIcon className={`h-4 w-4 transition-colors duration-200 ${
              selectedFilters.length > 0 ? 'text-primary' : 'text-muted-foreground'
            }`} />
          </motion.div>
          <span className="text-sm font-medium">{config.label || 'Filters'}</span>
        </div>

        {/* Clear all button */}
        <AnimatePresence>
          {selectedFilters.length > 0 && (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={springPresets.snappy}
              onClick={clearAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear all
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        className="flex flex-wrap gap-2"
        layout
      >
        {(options as Array<string | FilterOption>).map((rawOption, index: number) => {
          const option = normalizeFilterOption(rawOption);
          const { value, label, count } = option;
          const isSelected = selectedFilters.includes(value);
          const wasJustSelected = justSelected === value;

          return (
            <motion.div
              key={value}
              initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              layout
            >
              <motion.button
                onClick={() => handleFilterToggle(value)}
                whileHover={{ opacity: 0.9 }}
                whileTap={{ opacity: 0.8 }}
                animate={wasJustSelected && !prefersReducedMotion ? { scale: [1, 1.1, 1] } : {}}
                transition={springPresets.snappy}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border'
                }`}
              >
                {/* Animated checkmark for selected state */}
                <AnimatePresence mode="wait">
                  {isSelected && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 'auto', opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={springPresets.snappy}
                      className="overflow-hidden"
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <span>{label}</span>

                {config.showCounts && count !== undefined && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted-foreground/10 text-muted-foreground'
                  }`}>
                    {count}
                  </span>
                )}
              </motion.button>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Selected count indicator */}
      <AnimatePresence>
        {selectedFilters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={springPresets.snappy}
            className="flex items-center gap-2 text-xs"
          >
            <span className="text-primary font-medium">
              {selectedFilters.length} filter{selectedFilters.length !== 1 ? 's' : ''} active
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              {options.length - selectedFilters.length} more available
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// RESULT LIST ELEMENT
// ============================================================================

export function ResultListElement({ config, data }: ElementProps) {
  const items = data?.items || [];
  const itemsPerPage = config.itemsPerPage || 10;
  const showPagination = config.showPagination !== false;

  const paginatedItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    return items.slice(0, itemsPerPage);
  }, [items, itemsPerPage]);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="space-y-0">
          {paginatedItems.length > 0 ? (
            (paginatedItems as ResultItem[]).map((item, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, ...springPresets.snappy }}
                className="px-6 py-4 border-b last:border-b-0 border-border hover:bg-muted/40 transition-colors"
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
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={springPresets.gentle}
              className="px-6 py-16 text-center"
            >
              <motion.div
                initial={{ y: 10 }}
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 flex items-center justify-center mx-auto mb-4"
              >
                <DocumentTextIcon className="h-8 w-8 text-muted-foreground/50" />
              </motion.div>
              <p className="font-medium text-foreground mb-1">No results yet</p>
              <p className="text-sm text-muted-foreground">
                Results will appear here when data is connected
              </p>
            </motion.div>
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

// ============================================================================
// DATE PICKER ELEMENT
// ============================================================================

export function DatePickerElement({ config, onChange }: ElementProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Date & Time</span>
      </div>

      <Input
        type={config.includeTime ? 'datetime-local' : 'date'}
        value={selectedDate}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const value = e.target.value;
          setSelectedDate(value);
          if (onChange) {
            onChange({ selectedDate: value });
          }
        }}
      />

      {config.helperText && (
        <p className="text-xs text-muted-foreground">{config.helperText}</p>
      )}
    </div>
  );
}

// ============================================================================
// TAG CLOUD ELEMENT
// ============================================================================

export function TagCloudElement({ config, data }: ElementProps) {
  const tags = data?.tags || [];
  const sortedTags = [...tags].sort((a, b) => b.weight - a.weight).slice(0, config.maxTags || 30);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TagIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">TagIcon Cloud</span>
      </div>

      <motion.div className="flex flex-wrap gap-2" layout>
        {sortedTags.length > 0 ? (
          sortedTags.map((tag, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03, ...springPresets.snappy }}
              whileHover={{ opacity: 0.9 }}
            >
              <Badge
                variant="outline"
                className="text-sm font-medium px-3 py-1 cursor-default transition-colors hover:border-primary/50"
                style={{
                  fontSize: `${Math.max(12, Math.min(22, tag.weight + 12))}px`,
                }}
              >
                {tag.label}
                {config.showCounts && (
                  <span className="text-xs text-muted-foreground ml-2">
                    {tag.weight}
                  </span>
                )}
              </Badge>
            </motion.div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springPresets.gentle}
            className="w-full py-10 text-center"
          >
            <motion.div
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
              className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-3"
            >
              <TagIcon className="h-7 w-7 text-primary/40" />
            </motion.div>
            <p className="font-medium text-foreground mb-1">No tags yet</p>
            <p className="text-sm text-muted-foreground">Tags will appear when data is connected</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// ============================================================================
// CHART DISPLAY ELEMENT
// ============================================================================

/** Chart data point structure */
interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

/** Default sample data for charts */
const DEFAULT_CHART_DATA: ChartDataPoint[] = [
  { name: 'Week 1', value: 60, secondary: 45 },
  { name: 'Week 2', value: 40, secondary: 55 },
  { name: 'Week 3', value: 80, secondary: 70 },
  { name: 'Week 4', value: 55, secondary: 50 },
  { name: 'Week 5', value: 70, secondary: 65 },
];

/** HIVE color palette for charts - uses CSS custom properties */
const CHART_COLORS = [
  'var(--life-gold)', // Gold - primary
  'var(--hivelab-text-primary)', // White - secondary
  'var(--hivelab-text-secondary)', // Gray
  'var(--hivelab-surface)', // Dark gray
  'var(--hivelab-text-tertiary)', // Medium gray
];

export function ChartDisplayElement({ config, data }: ElementProps) {
  const chartType = (config.chartType as string) || 'bar';
  const title = (config.title as string) || 'Analytics';
  const chartData = (data?.chartData as ChartDataPoint[]) ||
                    (config.data as ChartDataPoint[]) ||
                    DEFAULT_CHART_DATA;
  const height = (config.height as number) || 280;
  const showLegend = config.showLegend !== false;
  const dataKey = (config.dataKey as string) || 'value';
  const secondaryKey = (config.secondaryKey as string) || undefined;

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="name"
                stroke="rgba(255,255,255,0.5)"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.5)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              {showLegend && <Legend />}
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                dot={{ fill: CHART_COLORS[0], strokeWidth: 0 }}
                activeDot={{ r: 6, fill: CHART_COLORS[0] }}
              />
              {secondaryKey && (
                <Line
                  type="monotone"
                  dataKey={secondaryKey}
                  stroke={CHART_COLORS[1]}
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS[1], strokeWidth: 0 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey={dataKey}
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'bar':
      default:
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="name"
                stroke="rgba(255,255,255,0.5)"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.5)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              {showLegend && <Legend />}
              <Bar
                dataKey={dataKey}
                fill={CHART_COLORS[0]}
                radius={[4, 4, 0, 0]}
              />
              {secondaryKey && (
                <Bar
                  dataKey={secondaryKey}
                  fill={CHART_COLORS[1]}
                  radius={[4, 4, 0, 0]}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Card className="bg-gradient-to-br from-muted/50 to-muted">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Analytics</p>
            <p className="text-xl font-semibold">{title}</p>
          </div>
          <Badge variant="outline" className="uppercase text-body-xs tracking-wide">
            {chartType} chart
          </Badge>
        </div>

        <div className="w-full">
          {renderChart()}
        </div>

        {!data?.chartData && !config.data && (
          <div className="text-xs text-muted-foreground text-center">
            Sample data shown. Connect analytics data to see real metrics.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// FORM BUILDER ELEMENT - Premium form with field animations
// ============================================================================

export function FormBuilderElement({ id, config, data, onChange, onAction, sharedState, userState }: ElementProps) {
  const prefersReducedMotion = useReducedMotion();
  const instanceId = id || 'form';
  const fields = config.fields || [
    { name: 'Title', type: 'text', required: true },
    { name: 'Description', type: 'textarea', required: false },
    { name: 'Location', type: 'text', required: false },
    { name: 'Date', type: 'date', required: true },
  ];

  // Read submission count from shared state (server-side) or data (legacy)
  const sharedSubmissionCount = sharedState?.counters?.[`${instanceId}:submissionCount`] || 0;
  const legacySubmissions = (data?.submissions as Array<Record<string, unknown>>) || [];
  const legacySubmissionCount = (data?.submissionCount as number) || legacySubmissions.length;
  const serverSubmissionCount = sharedSubmissionCount || legacySubmissionCount;

  // Check if user has already submitted (from userState)
  const hasUserSubmitted = userState?.participation?.[`${instanceId}:hasSubmitted`] === true;

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(hasUserSubmitted);
  const [submissionCount, setSubmissionCount] = useState(serverSubmissionCount);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [justSubmitted, setJustSubmitted] = useState(false);

  // Sync with server state
  useEffect(() => {
    setSubmissionCount(serverSubmissionCount);
  }, [serverSubmissionCount]);

  useEffect(() => {
    if (hasUserSubmitted && !config.allowMultipleSubmissions) {
      setSubmitted(true);
    }
  }, [hasUserSubmitted, config.allowMultipleSubmissions]);

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: false }));
    }
    onChange?.({ formData: { ...formData, [fieldName]: value } });
  };

  const handleSubmit = async () => {
    const typedFields = fields as FormField[];
    const missingRequired = typedFields
      .filter((f) => f.required && !formData[f.name])
      .map((f) => f.name);

    if (missingRequired.length > 0) {
      // Show errors for missing fields
      const newErrors: Record<string, boolean> = {};
      missingRequired.forEach(name => { newErrors[name] = true; });
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    // Simulate submission delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 500));

    setSubmitted(true);
    setJustSubmitted(true);
    setSubmissionCount(prev => prev + 1);
    onAction?.('submit', { formData, timestamp: new Date().toISOString(), elementId: instanceId });
    setIsSubmitting(false);

    setTimeout(() => setJustSubmitted(false), 1500);
  };

  const handleReset = () => {
    setFormData({});
    setSubmitted(false);
    setErrors({});
  };

  // Success state with celebration
  if (submitted && !config.allowMultipleSubmissions) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={springPresets.bouncy}
      >
        <Card className="border-green-500/50 bg-gradient-to-br from-green-500/10 to-emerald-500/5 shadow-lg shadow-green-500/10 overflow-hidden">
          <CardContent className="p-8 text-center relative">
            {/* Celebration particles */}
            {justSubmitted && !prefersReducedMotion && (
              <>
                {[...Array(8)].map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                    animate={{
                      opacity: 0,
                      scale: 1,
                      x: (Math.random() - 0.5) * 100,
                      y: (Math.random() - 0.5) * 80 - 20,
                    }}
                    transition={{ duration: 0.8, delay: i * 0.05 }}
                    className="absolute text-lg"
                    style={{ left: '50%', top: '40%' }}
                  >
                    {['✨', '🎉', '✓', '⭐', '💫', '🎊', '✅', '🌟'][i]}
                  </motion.span>
                ))}
              </>
            )}

            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ ...springPresets.bouncy, delay: 0.1 }}
              className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"
            >
              <CheckIcon className="h-8 w-8 text-green-500" />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg font-semibold text-foreground"
            >
              Response submitted!
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-muted-foreground mt-2"
            >
              {submissionCount} total submission{submissionCount !== 1 ? 's' : ''}
            </motion.p>

            {config.allowMultipleSubmissions && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button variant="outline" size="sm" className="mt-4" onClick={handleReset}>
                  Submit another response
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const filledCount = Object.values(formData).filter(v => v && v.trim()).length;
  const totalFields = fields.length;
  const progress = (filledCount / totalFields) * 100;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5 space-y-4">
        {/* Header with progress */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              animate={focusedField && !prefersReducedMotion ? { rotate: [0, -5, 5, 0] } : {}}
              transition={{ duration: 0.3 }}
            >
              <DocumentTextIcon className={`h-4 w-4 transition-colors duration-200 ${
                focusedField ? 'text-primary' : 'text-muted-foreground'
              }`} />
            </motion.div>
            <span className="text-sm font-medium">{config.title || 'Form'}</span>
          </div>

          {/* Progress indicator */}
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={springPresets.default}
              />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {filledCount}/{totalFields}
            </span>
          </motion.div>
        </div>

        {/* Form fields with staggered animation */}
        <div className="space-y-4">
          {(fields as FormField[]).map((field, index: number) => {
            const hasError = errors[field.name];
            const isFocused = focusedField === field.name;
            const hasValue = formData[field.name] && formData[field.name].trim();

            return (
              <motion.div
                key={field.name}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="space-y-1.5"
              >
                <label className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  isFocused ? 'text-primary' : hasError ? 'text-red-500' : ''
                }`}>
                  {field.label || field.name}
                  {field.required && (
                    <span className={`text-xs ${hasError ? 'text-red-500' : 'text-muted-foreground'}`}>*</span>
                  )}
                  {hasValue && !hasError && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-green-500"
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                    </motion.span>
                  )}
                </label>

                <motion.div
                  animate={hasError && !prefersReducedMotion ? { x: [-4, 4, -4, 4, 0] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      onFocus={() => setFocusedField(field.name)}
                      onBlur={() => setFocusedField(null)}
                      placeholder={field.placeholder || `Enter ${field.name.toLowerCase()}...`}
                      className={`w-full h-24 p-3 text-sm bg-background border rounded-lg resize-none transition-all duration-200 focus:outline-none ${
                        hasError
                          ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : isFocused
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-border hover:border-muted-foreground/50'
                      }`}
                    />
                  ) : field.type === 'select' ? (
                    <Select
                      value={formData[field.name] || ''}
                      onValueChange={(value) => handleFieldChange(field.name, value)}
                    >
                      <SelectTrigger className={hasError ? 'border-red-500' : ''}>
                        <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {(field.options || []).map((opt, optIndex) => (
                          <SelectItem key={optIndex} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={field.type || 'text'}
                      value={formData[field.name] || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(field.name, e.target.value)}
                      onFocus={() => setFocusedField(field.name)}
                      onBlur={() => setFocusedField(null)}
                      placeholder={field.placeholder || `Enter ${field.name.toLowerCase()}...`}
                      className={`transition-all duration-200 ${
                        hasError
                          ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : ''
                      }`}
                    />
                  )}
                </motion.div>

                {/* Error message */}
                <AnimatePresence>
                  {hasError && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-red-500"
                    >
                      This field is required
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Submit button with loading state */}
        <motion.div
          whileHover={{ opacity: 0.9 }}
          whileTap={{ opacity: 0.8 }}
        >
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full relative overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {isSubmitting ? (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                  />
                  Submitting...
                </motion.span>
              ) : (
                <motion.span
                  key="submit"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {config.submitLabel || 'Submit Response'}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>

        {/* Submission count */}
        {submissionCount > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground text-center"
          >
            {submissionCount} response{submissionCount !== 1 ? 's' : ''} collected
          </motion.p>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// NOTIFICATION CENTER ELEMENT
// ============================================================================

export function NotificationCenterElement({ config, data }: ElementProps) {
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
            <AnimatePresence initial={false}>
              {displayedNotifications.map((notification, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05, ...springPresets.snappy }}
                  className="px-6 py-4 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{notification.title}</span>
                    <span className="text-xs text-muted-foreground">{notification.timeAgo}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.description}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={springPresets.gentle}
              className="px-6 py-12 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 flex items-center justify-center mx-auto mb-4"
              >
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse', delay: 0.5 }}
                >
                  <BellIcon className="h-8 w-8 text-amber-500/50" />
                </motion.div>
              </motion.div>
              <p className="font-medium text-foreground mb-1">No notifications yet</p>
              <p className="text-sm text-muted-foreground">
                They will appear here in real-time
              </p>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// USER SELECTOR ELEMENT
// ============================================================================

interface UserOption {
  id: string;
  name: string;
  handle: string;
  photoURL?: string;
}

export function UserSelectorElement({ config, onChange, data, context, onAction }: ElementProps) {
  const [selectedUser, setSelectedUser] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveSpaceId = context?.spaceId || config.spaceId || data?.spaceId;

  useEffect(() => {
    const fetchUsers = async () => {
      if (data?.users && Array.isArray(data.users)) {
        setUsers(data.users.map((u: Record<string, unknown>) => ({
          id: u.id as string,
          name: u.fullName as string || u.name as string || 'Unknown',
          handle: u.handle as string || `@${(u.id as string).slice(0, 8)}`,
          photoURL: u.photoURL as string | undefined
        })));
        return;
      }

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
            query: searchQuery || 'a',
            limit: config.maxResults || 20,
            spaceId: effectiveSpaceId,
            campusId: context?.campusId,
            sortBy: 'relevance'
          })
        });

        if (!response.ok) throw new Error('Failed to fetch users');

        const result = await response.json();
        setUsers((result.users || []).map((u: Record<string, unknown>) => ({
          id: u.id as string,
          name: u.fullName as string || 'Unknown',
          handle: u.handle as string || `@${(u.id as string).slice(0, 8)}`,
          photoURL: u.photoURL as string | undefined
        })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, effectiveSpaceId, config.maxResults, data?.users, context?.campusId]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <UsersIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{config.label || 'Select user'}</span>
      </div>

      <Input
        value={searchQuery}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
        placeholder="Search members..."
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
                    <img src={user.photoURL} alt="" className="h-5 w-5 rounded-full object-cover" />
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

// ============================================================================
// MAP VIEW ELEMENT
// ============================================================================

interface MapMarker {
  id: string;
  name: string;
  x: number;
  y: number;
  type?: 'building' | 'event' | 'meetup' | 'custom';
  color?: string;
}

export function MapViewElement({ config, data, onChange, onAction }: ElementProps) {
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

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
      case 'event': return 'rgb(245 158 11)';
      case 'meetup': return 'rgb(16 185 129)';
      case 'custom': return 'rgb(139 92 246)';
      default: return 'rgb(59 130 246)';
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

// ============================================================================
// PHOTO GALLERY ELEMENT - Re-export from universal/ directory
// ============================================================================

export { PhotoGalleryElement } from './universal/photo-gallery';
