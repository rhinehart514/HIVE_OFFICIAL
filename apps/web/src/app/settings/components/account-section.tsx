'use client';

import React from 'react';
import { Button, Card, Badge } from '@hive/ui';
import {
  CalendarDaysIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  CheckIcon,
  ArrowPathIcon,
  LinkIcon,
  LinkSlashIcon,
  ArrowDownTrayIcon,
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { SettingRow } from './ui-primitives';
import { logger } from '@/lib/structured-logger';
import type { AccountSettings, CalendarStatus, ExportProgress } from '../types';

const CalendarClock = CalendarDaysIcon;
const Unlink = LinkSlashIcon;
const SettingsIcon = Cog6ToothIcon;

interface AccountSectionProps {
  accountSettings: AccountSettings;
  onAccountChange: (setting: keyof AccountSettings, value: unknown) => void;
  calendarStatus: CalendarStatus | null;
  isCalendarLoading: boolean;
  onCalendarConnect: () => void;
  onCalendarDisconnect: () => void;
  isDisconnecting: boolean;
  loadCalendarStatus: () => Promise<void>;
  isDownloading: boolean;
  exportProgress: ExportProgress | null;
  onDownloadData: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export function AccountSection({
  accountSettings,
  onAccountChange,
  calendarStatus,
  isCalendarLoading,
  onCalendarConnect,
  onCalendarDisconnect,
  isDisconnecting,
  loadCalendarStatus,
  isDownloading,
  exportProgress,
  onDownloadData,
  onLogout,
  onDeleteAccount,
}: AccountSectionProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white/5 border-white/[0.08]">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-[var(--hive-brand-primary)]" />
          Connected Calendars
        </h3>
        {isCalendarLoading ? (
          <div className="flex items-center justify-center py-8">
            <ArrowPathIcon className="h-6 w-6 animate-spin text-white/40" />
          </div>
        ) : !calendarStatus?.available ? (
          <div className="py-4 text-center">
            <p className="text-white/50 text-sm">Calendar integration is not available at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-white/50 text-sm">
              Connect your calendar to help space leaders find the best times for events. Only your free/busy times are shared.
            </p>
            {calendarStatus.connected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <CheckIcon className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Google Calendar Connected</p>
                      <p className="text-emerald-400/80 text-xs">
                        {calendarStatus.lastSyncedAt
                          ? `Last synced ${new Date(calendarStatus.lastSyncedAt).toLocaleDateString()}`
                          : 'Syncing...'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={onCalendarDisconnect}
                    disabled={isDisconnecting}
                    aria-label={isDisconnecting ? 'Disconnecting calendar' : 'Disconnect Google Calendar'}
                    className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                  >
                    {isDisconnecting ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <>
                        <Unlink className="h-4 w-4 mr-2" aria-hidden="true" />
                        Disconnect
                      </>
                    )}
                  </Button>
                </div>
                <SettingRow
                  label="Share availability with spaces"
                  description="Space leaders can see when you're free to schedule better events"
                  checked={calendarStatus.sharing?.enabled ?? true}
                  onCheckedChange={async (v) => {
                    try {
                      await fetch('/api/calendar/status', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                          sharing: { enabled: v, spaceIds: calendarStatus.sharing?.spaceIds || [] },
                        }),
                      });
                      await loadCalendarStatus();
                    } catch (err) {
                      logger.error('Failed to update sharing', { component: 'SettingsPage' }, err instanceof Error ? err : undefined);
                    }
                  }}
                />
              </div>
            ) : (
              <Button
                onClick={onCalendarConnect}
                aria-label="Connect your Google Calendar account"
                className="bg-white/10 text-white hover:bg-white/20 border border-white/20"
              >
                <LinkIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                Connect Google Calendar
              </Button>
            )}
          </div>
        )}
      </Card>

      <Card className="p-6 bg-white/5 border-white/[0.08]">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-[var(--hive-brand-primary)]" />
          Preferences
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Theme</label>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-[var(--hive-brand-primary)]/20 text-[var(--hive-brand-primary)] border-0">
                Dark
              </Badge>
              <span className="text-xs text-white/40">(Locked to dark for vBETA)</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Email Frequency</label>
            <div className="flex flex-wrap gap-2">
              {(['immediate', 'daily', 'weekly', 'never'] as const).map((freq) => (
                <button
                  key={freq}
                  onClick={() => onAccountChange('emailFrequency', freq)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                    accountSettings.emailFrequency === freq
                      ? 'bg-[var(--hive-brand-primary)] text-black'
                      : 'bg-white/10 text-white/50 hover:bg-white/20'
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-white/5 border-white/[0.08]">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <ShieldCheckIcon className="h-5 w-5 text-[var(--hive-brand-primary)]" />
          Data Management
        </h3>
        <SettingRow
          label="Auto-Delete Old Activity"
          description="Automatically delete your old posts and activity after a set period"
          checked={accountSettings.dataRetention.autoDelete}
          onCheckedChange={(v) =>
            onAccountChange('dataRetention', { ...accountSettings.dataRetention, autoDelete: v })
          }
        />
        {accountSettings.dataRetention.autoDelete && (
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <label className="text-sm font-medium text-white mb-2 block">Keep Data For</label>
            <div className="flex gap-2">
              {([90, 180, 365] as const).map((days) => (
                <button
                  key={days}
                  onClick={() =>
                    onAccountChange('dataRetention', { ...accountSettings.dataRetention, retentionDays: days })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    accountSettings.dataRetention.retentionDays === days
                      ? 'bg-[var(--hive-brand-primary)] text-black'
                      : 'bg-white/10 text-white/50 hover:bg-white/20'
                  }`}
                >
                  {days === 365 ? '1 year' : `${days} days`}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <Button
            variant="secondary"
            onClick={onDownloadData}
            disabled={isDownloading}
            aria-label={isDownloading ? 'Downloading your data' : 'Download a complete copy of all your data'}
            className="border-white/20 text-white hover:bg-white/10"
          >
            {isDownloading ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                {exportProgress
                  ? `${exportProgress.currentItem} (${exportProgress.current}/${exportProgress.total})`
                  : 'Preparing...'}
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                Download My Data
              </>
            )}
          </Button>
          <p className="text-xs text-white/40 mt-2">
            {isDownloading
              ? 'Gathering your profile, spaces, connections, tools, and calendar...'
              : 'Get a complete copy of all your data including spaces, connections, tools, and events'}
          </p>
        </div>
      </Card>

      <Card className="p-6 bg-white/5 border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium mb-1">Sign Out</h3>
            <p className="text-white/50 text-sm">Sign out of your HIVE account on this device</p>
          </div>
          <Button
            variant="secondary"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={onLogout}
            aria-label="Sign out of your HIVE account"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" aria-hidden="true" />
            Sign Out
          </Button>
        </div>
      </Card>

      <Card className="p-6 border-red-500/20 bg-red-500/5">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
          Danger Zone
        </h3>
        <div className="p-4 border border-red-500/20 rounded-lg">
          <h4 className="text-sm font-medium text-red-400 mb-2">Delete Account</h4>
          <p className="text-xs text-white/50 mb-3">
            Permanently delete your HIVE account and all associated data. This cannot be undone.
          </p>
          <Button variant="destructive" size="sm" onClick={onDeleteAccount}>
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
        </div>
      </Card>
    </div>
  );
}
