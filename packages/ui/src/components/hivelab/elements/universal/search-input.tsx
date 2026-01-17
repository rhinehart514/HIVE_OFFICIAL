'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Input } from '../../../../design-system/primitives';
import type { ElementProps } from '../shared/types';

/**
 * MagnifyingGlassIcon Input Element
 *
 * A search input with debounced queries and optional suggestions.
 * Supports real API calls when deployed, mock data in preview mode.
 */
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

      if (config.showSuggestions && query.length > 2) {
        if (context?.campusId) {
          setIsLoadingSuggestions(true);
          try {
            const searchTypes = config.searchTypes || ['spaces', 'people', 'tools'];
            const response = await fetch(
              `/api/search?q=${encodeURIComponent(query)}&limit=5&types=${searchTypes.join(',')}`
            );
            if (response.ok) {
              const data = await response.json();
              const results = data.results || [];
              const suggestionTitles = results.slice(0, 5).map(
                (r: { title?: string; name?: string; type: string }) =>
                  r.title || r.name || `${query} (${r.type})`
              );
              setSuggestions(suggestionTitles.length > 0 ? suggestionTitles : [`No results for "${query}"`]);
            } else {
              setSuggestions([`${query} in spaces`, `${query} in users`]);
            }
          } catch {
            setSuggestions([`${query} in spaces`, `${query} in users`]);
          } finally {
            setIsLoadingSuggestions(false);
          }
        } else {
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
