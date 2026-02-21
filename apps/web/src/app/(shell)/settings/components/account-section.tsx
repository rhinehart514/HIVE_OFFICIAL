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
  onLogoutAll: () => void;
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
  onLogoutAll,
  onDeleteAccount,
}: AccountSectionProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white/[0.06] border-white/[0.06]">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-[var(--hive-brand-primary)]" />
          Connected Calendars
        </h3>
        <div className="space-y-3">
          <p className="text-white/50 text-sm">
            Connect your calendar to help space leaders find the best times for events. Only your free/busy times are shared.
          </p>
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <CalendarClock className="h-5 w-5 text-white/30 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/60 font-medium">Google Calendar</p>
              <p className="text-xs text-white/30">Coming this spring</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-white/[0.06] border-white/[0.06]">
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
              <span className="text-xs text-white/50">(Locked to dark for vBETA)</span>
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
                      : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.06]'
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-white/[0.06] border-white/[0.06]">
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
                      : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.06]'
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
            className="border-white/[0.06] text-white hover:bg-white/[0.06]"
          >
            {isDownloading ? (
              <>
                <ArrowPathIcon className="h-4 w-4  mr-2" aria-hidden="true" />
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
          <p className="text-xs text-white/50 mt-2">
            {isDownloading
              ? 'Gathering your profile, spaces, connections, tools, and calendar...'
              : 'Get a complete copy of all your data including spaces, connections, tools, and events'}
          </p>
        </div>
      </Card>

      <Card className="p-6 bg-white/[0.06] border-white/[0.06] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium mb-1">Sign Out</h3>
            <p className="text-white/50 text-sm">Sign out on this device</p>
          </div>
          <Button
            variant="secondary"
            className="border-white/[0.06] text-white hover:bg-white/[0.06]"
            onClick={onLogout}
            aria-label="Sign out of your HIVE account"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" aria-hidden="true" />
            Sign Out
          </Button>
        </div>
        <div className="border-t border-white/[0.06] pt-4 flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium mb-1">Sign Out Everywhere</h3>
            <p className="text-white/50 text-sm">Sign out on all devices and browsers</p>
          </div>
          <Button
            variant="secondary"
            className="border-white/[0.06] text-white hover:bg-white/[0.06]"
            onClick={onLogoutAll}
            aria-label="Sign out of all sessions"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" aria-hidden="true" />
            Sign Out All
          </Button>
        </div>
      </Card>

      <Card className="p-6 border-red-500/20 bg-red-500/5">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
          Danger Zone
        </h3>
        <div className="p-4border-red-500/20 rounded-lg">
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
