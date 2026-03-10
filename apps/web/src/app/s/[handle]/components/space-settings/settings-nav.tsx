'use client';

import * as React from 'react';
import {
  Globe,
  Mail,
  Users,
  Hash,
  Shield,
  UserCheck,
  Wrench,
  Zap,
  BarChart3,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Text } from '@hive/ui';
import type { SettingsSection } from './types';

interface SettingsNavItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant?: 'default' | 'danger';
}

function SettingsNavItem({
  active,
  onClick,
  icon,
  label,
  variant = 'default',
}: SettingsNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
        'transition-colors duration-150',
        'text-left',
        active
          ? 'bg-white/[0.06] text-white'
          : variant === 'danger'
          ? 'text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.04]'
          : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      <Text size="sm" weight={active ? 'medium' : 'normal'}>
        {label}
      </Text>
    </button>
  );
}

interface SettingsNavProps {
  activeSection: SettingsSection;
  setActiveSection: (section: SettingsSection) => void;
  isLeader: boolean;
  isModeratorOrAbove: boolean;
  isAdminOrOwner: boolean;
  isPublic: boolean;
  onModerationClick: () => void;
  onAnalyticsClick: () => void;
}

export function SettingsNav({
  activeSection,
  setActiveSection,
  isLeader,
  isModeratorOrAbove,
  isAdminOrOwner,
  isPublic,
  onModerationClick,
  onAnalyticsClick,
}: SettingsNavProps) {
  return (
    <div className="w-56 border-r border-white/[0.06] p-4 flex-shrink-0">
      <nav className="space-y-1">
        <SettingsNavItem
          active={activeSection === 'general'}
          onClick={() => setActiveSection('general')}
          icon={<Globe className="w-4 h-4" />}
          label="General"
        />
        {isLeader && (
          <SettingsNavItem
            active={activeSection === 'contact'}
            onClick={() => setActiveSection('contact')}
            icon={<Mail className="w-4 h-4" />}
            label="Contact Info"
          />
        )}
        <SettingsNavItem
          active={activeSection === 'members'}
          onClick={() => setActiveSection('members')}
          icon={<Users className="w-4 h-4" />}
          label="Members"
        />
        {isModeratorOrAbove && (
          <SettingsNavItem
            active={activeSection === 'moderation'}
            onClick={onModerationClick}
            icon={<Shield className="w-4 h-4" />}
            label="Moderation"
          />
        )}
        {isModeratorOrAbove && !isPublic && (
          <SettingsNavItem
            active={activeSection === 'requests'}
            onClick={() => setActiveSection('requests')}
            icon={<UserCheck className="w-4 h-4" />}
            label="Requests"
          />
        )}
        <SettingsNavItem
          active={activeSection === 'boards'}
          onClick={() => setActiveSection('boards')}
          icon={<Hash className="w-4 h-4" />}
          label="Boards"
        />
        {isLeader && (
          <SettingsNavItem
            active={activeSection === 'tools'}
            onClick={() => setActiveSection('tools')}
            icon={<Wrench className="w-4 h-4" />}
            label="Apps"
          />
        )}
        {isLeader && (
          <SettingsNavItem
            active={activeSection === 'automations'}
            onClick={() => setActiveSection('automations')}
            icon={<Zap className="w-4 h-4" />}
            label="Automations"
          />
        )}
        {isAdminOrOwner && (
          <SettingsNavItem
            active={activeSection === 'analytics'}
            onClick={onAnalyticsClick}
            icon={<BarChart3 className="w-4 h-4" />}
            label="Analytics"
          />
        )}
        <SettingsNavItem
          active={activeSection === 'danger'}
          onClick={() => setActiveSection('danger')}
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Danger Zone"
          variant="danger"
        />
      </nav>
    </div>
  );
}
