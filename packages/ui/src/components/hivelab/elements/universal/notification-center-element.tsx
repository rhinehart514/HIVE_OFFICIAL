'use client';

/**
 * Notification Center Element - Refactored with Core Abstractions
 *
 * Real-time notification display with:
 * - Animated entrance/exit
 * - Empty state with bell animation
 * - Badge showing count
 */

import * as React from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { springPresets } from '@hive/tokens';

import { Card, CardContent } from '../../../../design-system/primitives';
import { Badge } from '../../../../design-system/primitives';

import type { ElementProps } from '../../../../lib/hivelab/element-system';
import type { ElementMode } from '../core';

// ============================================================
// Types
// ============================================================

interface Notification {
  title: string;
  description: string;
  timeAgo: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface NotificationCenterConfig {
  title?: string;
  maxNotifications?: number;
}

interface NotificationCenterElementProps extends ElementProps {
  config: NotificationCenterConfig;
  mode?: ElementMode;
}

// ============================================================
// Main Notification Center Element
// ============================================================

export function NotificationCenterElement({
  config,
  data,
  mode = 'runtime',
}: NotificationCenterElementProps) {
  const notifications = (data?.notifications as Notification[]) || [];

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

export default NotificationCenterElement;
