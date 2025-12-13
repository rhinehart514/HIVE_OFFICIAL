'use client';

/**
 * Universal HiveLab Elements - Basic UI components that work anywhere
 *
 * These elements have no data dependencies and can be used in any context.
 * Split from element-renderers.tsx for better maintainability.
 */

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Tag,
  MapPin,
  FileText,
  Bell,
  Check,
} from 'lucide-react';

import {
  Input,
  Button,
  Card,
  CardContent,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Progress,
} from '../../../atomic';

import type { ElementProps } from '../../../lib/hivelab/element-system';

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
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          placeholder={config.placeholder || 'Search...'}
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
        <Filter className="h-4 w-4 text-muted-foreground" />
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
                <Badge variant="sophomore" className="ml-2 h-4 text-xs">
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
            paginatedItems.map((item: any, index: number) => (
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
        <Calendar className="h-4 w-4 text-muted-foreground" />
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
        <Tag className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Tag Cloud</span>
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
            <Tag className="h-6 w-6 mx-auto mb-2 opacity-40" />
            <p>No tags yet. Tags will appear when data is connected.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAP VIEW ELEMENT
// ============================================================================

export function MapViewElement() {
  return (
    <div className="border border-dashed border-border rounded-lg h-60 flex items-center justify-center bg-muted/10 text-sm text-muted-foreground">
      <div className="space-y-2 text-center">
        <MapPin className="h-6 w-6 mx-auto text-muted-foreground" />
        <p>Interactive map preview renders here once data is connected.</p>
      </div>
    </div>
  );
}

// ============================================================================
// CHART DISPLAY ELEMENT
// ============================================================================

export function ChartDisplayElement({ config }: ElementProps) {
  return (
    <Card className="bg-gradient-to-br from-muted/50 to-muted">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Chart Preview</p>
            <p className="text-2xl font-semibold">Registration Flow</p>
          </div>
          <Badge variant="outline" className="uppercase text-body-xs tracking-wide">
            {config.chartType || 'bar'} chart
          </Badge>
        </div>

        <div className="space-y-4">
          {[60, 40, 80, 55].map((value, index) => (
            <div key={index}>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Week {index + 1}</span>
                <span>{value}%</span>
              </div>
              <Progress value={value} />
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground">
          Sample data shown. Connect analytics data to see real student behavior.
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// FORM BUILDER ELEMENT
// ============================================================================

export function FormBuilderElement({ config, data, onChange, onAction }: ElementProps) {
  const fields = config.fields || [
    { name: 'Title', type: 'text', required: true },
    { name: 'Description', type: 'textarea', required: false },
    { name: 'Location', type: 'text', required: false },
    { name: 'Date', type: 'date', required: true },
  ];

  const serverSubmissions = (data?.submissions as Array<Record<string, unknown>>) || [];
  const serverSubmissionCount = (data?.submissionCount as number) || serverSubmissions.length;

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(serverSubmissionCount);

  useEffect(() => {
    setSubmissionCount(serverSubmissionCount);
  }, [serverSubmissionCount]);

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    onChange?.({ formData: { ...formData, [fieldName]: value } });
  };

  const handleSubmit = async () => {
    const missingRequired = fields
      .filter((f: any) => f.required && !formData[f.name])
      .map((f: any) => f.name);

    if (missingRequired.length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitted(true);
    setSubmissionCount(prev => prev + 1);
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
          <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
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
          <FileText className="h-4 w-4 text-muted-foreground" />
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
            <Bell className="h-4 w-4 text-muted-foreground" />
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
              <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-40" />
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
