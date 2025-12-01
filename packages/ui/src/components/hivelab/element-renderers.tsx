'use client';

import * as React from 'react';
import {
  Search,
  Filter,
  Users,
  Calendar,
  Tag,
  BarChart3,
  Clock,
  FileText,
  Bell,
  MapPin,
  Timer,
  Vote,
  Trophy,
  UserPlus,
  Check,
  Crown,
  Medal,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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
} from '../../atomic';

import type { ElementProps } from '../../lib/hivelab/element-system';

// Search Input Element
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

// Filter Selector Element
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

// Result List Element
export function ResultListElement({ config, data }: ElementProps) {
  const items = data?.items || [];
  const itemsPerPage = config.itemsPerPage || 10;
  const showPagination = config.showPagination !== false;

  // Always call useMemo, even if items is empty (Rules of Hooks)
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

// Date Picker Element
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

// User Selector Element
export function UserSelectorElement({ config, onChange }: ElementProps) {
  const fakeUsers = [
    { id: '1', name: 'Amelia Chen', handle: '@amelia' },
    { id: '2', name: 'Jordan Smith', handle: '@jordan' },
    { id: '3', name: 'Liam Patel', handle: '@liam' },
    { id: '4', name: 'Sophia Martinez', handle: '@sophia' }
  ];

  const [selectedUser, setSelectedUser] = useState<string | undefined>();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Select user</span>
      </div>

      <Select
        value={selectedUser}
        onValueChange={(value) => {
          setSelectedUser(value);
          if (onChange) {
            onChange({ selectedUser: value });
          }
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Choose a member" />
        </SelectTrigger>
        <SelectContent>
          {fakeUsers.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              <div className="flex flex-col">
                <span>{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.handle}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {config.allowMultiple && (
        <div className="text-xs text-muted-foreground">
          Multi-select will support drag-assignment once live data is wired.
        </div>
      )}
    </div>
  );
}

// Tag Cloud Element
export function TagCloudElement({ config, data }: ElementProps) {
  const tags = data?.tags || [
    { label: 'Rush Week', weight: 18 },
    { label: 'Study Groups', weight: 12 },
    { label: 'Gaming', weight: 9 },
    { label: 'Student Gov', weight: 7 },
    { label: 'Dorm Deals', weight: 5 },
  ];

  const sortedTags = [...tags].sort((a, b) => b.weight - a.weight).slice(0, config.maxTags || 30);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Tag Cloud</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {sortedTags.map((tag, index) => (
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
        ))}
      </div>
    </div>
  );
}

// Map View Element
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

// Chart Display Element
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

// Form Builder Element
export function FormBuilderElement({ config }: ElementProps) {
  const fields = config.fields || [
    { name: 'Title', type: 'text', required: true },
    { name: 'Description', type: 'textarea', required: false },
    { name: 'Location', type: 'text', required: false },
    { name: 'Date', type: 'date', required: true },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Form Fields</span>
      </div>

      <div className="space-y-3">
        {fields.map((field: any, index: number) => (
          <div
            key={index}
            className="border border-dashed border-border rounded-lg px-4 py-3"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{field.name}</span>
              <Badge variant={field.required ? 'default' : 'outline'}>
                {field.type}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {field.required ? 'Required field' : 'Optional field'}
            </p>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm">
        + Add field
      </Button>
    </div>
  );
}

// Notification Center Element
export function NotificationCenterElement({ config }: ElementProps) {
  const notifications = [
    { title: 'New RSVP', description: '14 students joined Powerlifting Rush Week', timeAgo: '2m' },
    { title: 'Tool Deployment', description: 'Dorm Dash Delivery went live in Founders Commons', timeAgo: '12m' },
    { title: 'Feedback', description: '3 students rated your form 5 stars', timeAgo: '1h' },
  ];

  return (
    <Card>
      <CardContent className="p-0">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Live Notifications</span>
          </div>
          <Badge variant="outline">{config.maxNotifications || 10} max</Badge>
        </div>

        <div className="divide-y divide-border">
          {notifications.map((notification, index) => (
            <div key={index} className="px-6 py-4 hover:bg-muted/40 transition-colors">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{notification.title}</span>
                <span className="text-xs text-muted-foreground">{notification.timeAgo}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {notification.description}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Countdown Timer Element
export function CountdownTimerElement({ config, onChange }: ElementProps) {
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (config.targetDate) {
      const target = new Date(config.targetDate).getTime();
      const now = Date.now();
      return Math.max(0, Math.floor((target - now) / 1000));
    }
    return config.seconds || 3600; // Default 1 hour
  });

  useEffect(() => {
    if (timeLeft <= 0) {
      onChange?.({ finished: true, timeLeft: 0 });
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          onChange?.({ finished: true, timeLeft: 0 });
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onChange]);

  const formatTime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) {
      return { days, hours, mins, secs, format: 'days' };
    }
    return { hours, mins, secs, format: 'hours' };
  };

  const time = formatTime(timeLeft);

  return (
    <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
      <CardContent className="p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Timer className="h-5 w-5 text-amber-500" />
          <span className="text-sm font-medium text-muted-foreground">
            {config.label || 'Time Remaining'}
          </span>
        </div>

        <div className="flex items-center justify-center gap-3">
          {time.format === 'days' && (
            <div className="text-center">
              <div className="text-4xl font-bold tabular-nums">{time.days}</div>
              <div className="text-xs text-muted-foreground uppercase">Days</div>
            </div>
          )}
          <div className="text-center">
            <div className="text-4xl font-bold tabular-nums">{time.hours.toString().padStart(2, '0')}</div>
            <div className="text-xs text-muted-foreground uppercase">Hours</div>
          </div>
          <div className="text-2xl font-bold text-muted-foreground">:</div>
          <div className="text-center">
            <div className="text-4xl font-bold tabular-nums">{time.mins.toString().padStart(2, '0')}</div>
            <div className="text-xs text-muted-foreground uppercase">Mins</div>
          </div>
          <div className="text-2xl font-bold text-muted-foreground">:</div>
          <div className="text-center">
            <div className="text-4xl font-bold tabular-nums">{time.secs.toString().padStart(2, '0')}</div>
            <div className="text-xs text-muted-foreground uppercase">Secs</div>
          </div>
        </div>

        {timeLeft <= 0 && (
          <div className="mt-4 text-amber-500 font-medium">Time's up!</div>
        )}
      </CardContent>
    </Card>
  );
}

// Poll Element
export function PollElement({ config, data, onChange, onAction }: ElementProps) {
  const options = config.options || ['Option A', 'Option B', 'Option C'];

  // Hydrate from server state (data prop) or initialize empty
  const serverResponses = (data?.responses as Record<string, { choice: string }>) || {};
  const serverTotalVotes = (data?.totalVotes as number) || 0;
  const serverUserVote = (data?.userVote as string) || null;

  // Calculate vote counts from server responses
  const calculateVoteCounts = (): Record<string, number> => {
    const counts: Record<string, number> = {};
    options.forEach((opt: string) => { counts[opt] = 0; });
    Object.values(serverResponses).forEach((response) => {
      if (response?.choice && counts[response.choice] !== undefined) {
        counts[response.choice]++;
      }
    });
    return counts;
  };

  const [votes, setVotes] = useState<Record<string, number>>(calculateVoteCounts);
  const [userVote, setUserVote] = useState<string | null>(serverUserVote);
  const [hasVoted, setHasVoted] = useState(!!serverUserVote);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync with server state when data changes
  useEffect(() => {
    setVotes(calculateVoteCounts());
    if (serverUserVote) {
      setUserVote(serverUserVote);
      setHasVoted(true);
    }
  }, [data?.responses, data?.totalVotes, serverUserVote]);

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0) || serverTotalVotes;
  const showResults = config.showResultsBeforeVoting || hasVoted;

  const handleVote = async (option: string) => {
    if ((hasVoted && !config.allowChangeVote) || isSubmitting) return;

    setIsSubmitting(true);

    // Optimistic update
    setVotes((prev) => ({
      ...prev,
      [option]: (prev[option] || 0) + 1,
      ...(userVote ? { [userVote]: Math.max(0, (prev[userVote] || 0) - 1) } : {}),
    }));
    setUserVote(option);
    setHasVoted(true);

    // Call server action
    onChange?.({ selectedOption: option, votes });
    onAction?.('vote', { choice: option });

    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Vote className="h-5 w-5 text-primary" />
          <span className="font-semibold">{config.question || 'Cast your vote'}</span>
        </div>

        <div className="space-y-3">
          {options.map((option: string) => {
            const voteCount = votes[option] || 0;
            const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
            const isSelected = userVote === option;

            return (
              <button
                key={option}
                onClick={() => handleVote(option)}
                disabled={(hasVoted && !config.allowChangeVote) || isSubmitting}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                } ${(hasVoted && !config.allowChangeVote) || isSubmitting ? 'cursor-default opacity-70' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                    <span className={isSelected ? 'font-medium' : ''}>{option}</span>
                  </div>
                  {showResults && (
                    <span className="text-sm text-muted-foreground">{percentage}%</span>
                  )}
                </div>
                {showResults && (
                  <div className="mt-2">
                    <Progress value={percentage} className="h-2" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
          {config.deadline && <span>Ends {config.deadline}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

// Leaderboard Element
export function LeaderboardElement({ config, data }: ElementProps) {
  // Hydrate from server state - convert entries object to sorted array
  const serverEntries = data?.entries as Record<string, { score: number; name?: string; updatedAt?: string }> | undefined;

  const entries = useMemo(() => {
    if (serverEntries && Object.keys(serverEntries).length > 0) {
      // Convert server entries object to sorted array with ranks
      return Object.entries(serverEntries)
        .map(([id, entry]) => ({
          id,
          name: entry.name || `User ${id.slice(0, 6)}`,
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
  }, [serverEntries]);

  const maxEntries = config.maxEntries || 10;
  const displayEntries = entries.slice(0, maxEntries);
  const hasData = displayEntries.length > 0;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="w-5 text-center text-muted-foreground font-mono">{rank}</span>;
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
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
              <Trophy className="h-8 w-8 mx-auto mb-2 opacity-30" />
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

// RSVP Button Element
export function RsvpButtonElement({ config, data, onChange, onAction }: ElementProps) {
  // Hydrate from server state
  const serverAttendees = (data?.attendees as Record<string, unknown>) || {};
  const serverCount = (data?.count as number) || 0;
  const serverWaitlist = (data?.waitlist as string[]) || [];
  const serverUserRsvp = (data?.userRsvp as string) || null; // 'yes', 'maybe', 'no', or null

  const [isRsvped, setIsRsvped] = useState(serverUserRsvp === 'yes');
  const [rsvpCount, setRsvpCount] = useState(serverCount || Object.keys(serverAttendees).length);
  const [isLoading, setIsLoading] = useState(false);

  // Sync with server state when data changes
  useEffect(() => {
    const count = serverCount || Object.keys(serverAttendees).length;
    setRsvpCount(count);
    setIsRsvped(serverUserRsvp === 'yes');
  }, [data?.attendees, data?.count, serverUserRsvp, serverCount, serverAttendees]);

  const maxAttendees = config.maxAttendees || null;
  const isFull = maxAttendees && rsvpCount >= maxAttendees;

  const handleRsvp = async () => {
    if ((isFull && !isRsvped) || isLoading) return;

    setIsLoading(true);

    const newState = !isRsvped;

    // Optimistic update
    setIsRsvped(newState);
    setRsvpCount((prev: number) => (newState ? prev + 1 : Math.max(0, prev - 1)));

    // Call server action
    onChange?.({ isRsvped: newState, rsvpCount: rsvpCount + (newState ? 1 : -1) });
    onAction?.(newState ? 'rsvp' : 'cancel_rsvp', {
      response: newState ? 'yes' : 'no',
      eventName: config.eventName
    });

    setIsLoading(false);
  };

  return (
    <Card className={isRsvped ? 'border-green-500/50 bg-green-500/5' : ''}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">{config.eventName || 'Event'}</div>
            {config.eventDate && (
              <div className="text-sm text-muted-foreground">{config.eventDate}</div>
            )}
          </div>

          <Button
            onClick={handleRsvp}
            disabled={isLoading || (isFull && !isRsvped)}
            variant={isRsvped ? 'outline' : 'default'}
            className={isRsvped ? 'border-green-500 text-green-600 hover:bg-green-500/10' : ''}
          >
            {isLoading ? (
              <span className="animate-pulse">...</span>
            ) : isRsvped ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Going
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                RSVP
              </>
            )}
          </Button>
        </div>

        {config.showCount !== false && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              <Users className="h-4 w-4 inline mr-1" />
              {rsvpCount} {rsvpCount === 1 ? 'person' : 'people'} going
            </span>
            {maxAttendees && (
              <span className={isFull ? 'text-red-500' : 'text-muted-foreground'}>
                {isFull ? 'Full' : `${maxAttendees - rsvpCount} spots left`}
              </span>
            )}
          </div>
        )}

        {isFull && !isRsvped && (
          <div className="mt-3 p-2 bg-amber-500/10 text-amber-600 text-sm rounded-lg text-center">
            This event is full. Join the waitlist?
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Element renderer map
const ELEMENT_RENDERERS: Record<string, (props: ElementProps) => React.JSX.Element> = {
  'search-input': SearchInputElement,
  'filter-selector': FilterSelectorElement,
  'result-list': ResultListElement,
  'date-picker': DatePickerElement,
  'user-selector': UserSelectorElement,
  'tag-cloud': TagCloudElement,
  'map-view': MapViewElement,
  'chart-display': ChartDisplayElement,
  'form-builder': FormBuilderElement,
  'notification-center': NotificationCenterElement,
  // New elements
  'countdown-timer': CountdownTimerElement,
  'poll-element': PollElement,
  'leaderboard': LeaderboardElement,
  'rsvp-button': RsvpButtonElement,
};

export function renderElement(elementId: string, props: ElementProps) {
  const renderer = ELEMENT_RENDERERS[elementId];
  if (!renderer) {
    return (
      <div className="border border-dashed border-border rounded-lg p-4 text-sm text-muted-foreground">
        Unimplemented element: {elementId}
      </div>
    );
  }

  return renderer(props);
}
