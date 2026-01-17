'use client';

/**
 * Universal HiveLab Elements - Basic UI components that work anywhere
 *
 * These elements have no data dependencies and can be used in any context.
 * Split from element-renderers.tsx for better maintainability.
 */

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, CalendarIcon, TagIcon, MapPinIcon, DocumentTextIcon, BellIcon, CheckIcon, UsersIcon } from '@heroicons/react/24/outline';

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
// SEARCH INPUT ELEMENT
// ============================================================================

export function SearchInputElement({ config, onChange }: ElementProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const debounceMs = config.debounceMs || 300;

  useEffect(() => {
    const timer = setTimeout(() => {
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

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent rounded-lg"
              onClick={() => {
                setQuery(suggestion);
                setShowSuggestions(false);
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FILTER SELECTOR ELEMENT
// ============================================================================

export function FilterSelectorElement({ config, onChange }: ElementProps) {
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
    if (onChange) {
      onChange({ selectedFilters: newFilters, filters: newFilters });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <FunnelIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filters</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {(options as Array<string | FilterOption>).map((rawOption, index: number) => {
          const option = normalizeFilterOption(rawOption);
          const { value, label, count } = option;
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
              <div
                key={index}
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

      <div className="flex flex-wrap gap-2">
        {sortedTags.length > 0 ? (
          sortedTags.map((tag, index) => (
            <Badge
              key={index}
              variant="outline"
              className="text-sm font-medium px-3 py-1"
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
// FORM BUILDER ELEMENT
// ============================================================================

export function FormBuilderElement({ id, config, data, onChange, onAction, sharedState, userState }: ElementProps) {
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
    onChange?.({ formData: { ...formData, [fieldName]: value } });
  };

  const handleSubmit = async () => {
    const typedFields = fields as FormField[];
    const missingRequired = typedFields
      .filter((f) => f.required && !formData[f.name])
      .map((f) => f.name);

    if (missingRequired.length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitted(true);
    setSubmissionCount(prev => prev + 1);
    // Pass formData with instanceId for proper server-side storage
    onAction?.('submit', { formData, timestamp: new Date().toISOString(), elementId: instanceId });
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
          {(fields as FormField[]).map((field, index: number) => (
            <div key={index} className="space-y-1">
              <label className="text-sm font-medium flex items-center gap-1">
                {field.label || field.name}
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
                className="cursor-pointer transition-transform hover:scale-110"
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
