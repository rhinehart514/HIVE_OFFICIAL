import type { ShellConfig } from '@/lib/shells/types';

const DEPLOY_STORAGE_KEY = 'hive_pending_deploy';

interface PendingDeploy {
  prompt: string;
  format?: string;
  config?: ShellConfig;
}

export function savePendingDeploy(state: PendingDeploy): void {
  try {
    localStorage.setItem(DEPLOY_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable
  }
}

export function loadPendingDeploy(): PendingDeploy | null {
  try {
    const raw = localStorage.getItem(DEPLOY_STORAGE_KEY);
    if (!raw) return null;
    localStorage.removeItem(DEPLOY_STORAGE_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
