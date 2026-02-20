'use client';

/**
 * Result List Element - Refactored with Core Abstractions
 *
 * Displays paginated results with:
 * - Animated item entrance
 * - Empty state with floating icon
 * - Badge and metadata support
 */

import * as React from 'react';
import { useMemo } from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { springPresets } from '@hive/tokens';

import { Card, CardContent } from '../../../../design-system/primitives';
import { Button } from '../../../../design-system/primitives';
import { Badge } from '../../../../design-system/primitives';

import type { ElementProps } from '../../../../lib/hivelab/element-system';
import type { ElementMode } from '../core';

// ============================================================
// Types
// ============================================================

interface ResultItem {
  id?: string;
  title?: string;
  description?: string;
  badge?: string;
  meta?: string[];
}

interface ResultListConfig {
  itemsPerPage?: number;
  showPagination?: boolean;
}

interface ResultListElementProps extends ElementProps {
  config: ResultListConfig;
  mode?: ElementMode;
}

// ============================================================
// Main Result List Element
// ============================================================

export function ResultListElement({
  config,
  data,
  mode = 'runtime',
}: ResultListElementProps) {
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
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    )}
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

export default ResultListElement;
