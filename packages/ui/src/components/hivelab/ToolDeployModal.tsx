import { ArrowLeftIcon, CheckCircleIcon, RocketLaunchIcon, Cog6ToothIcon, ShieldCheckIcon, UserIcon, UsersIcon } from '@heroicons/react/24/outline';
import * as React from 'react';

import { Button } from '../../design-system/primitives';
import { Card } from '../../design-system/primitives';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../design-system/components/Dialog';

export type DeploymentTarget = {
  id: string;
  name: string;
  type: 'profile' | 'space';
  description?: string;
  permissions?: string[];
};

export type DeploymentConfig = {
  targetType: 'profile' | 'space';
  targetId: string;
  surface?: string;
  permissions: {
    canInteract: boolean;
    canView: boolean;
    canEdit: boolean;
    allowedRoles?: string[];
  };
  settings: {
    showInDirectory: boolean;
    allowSharing: boolean;
    collectAnalytics: boolean;
    notifyOnInteraction: boolean;
  };
  // Profile-specific privacy settings
  privacy?: {
    visibility: 'public' | 'campus' | 'connections' | 'private';
    inheritFromProfile: boolean;
  };
};

export interface ToolDeployModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolName: string;
  availableTargets: DeploymentTarget[];
  onDeploy: (config: DeploymentConfig) => Promise<void> | void;
  initialConfig?: Partial<DeploymentConfig>;
  /** Called when user clicks "View in space" after successful deployment */
  onViewInSpace?: (spaceId: string) => void;
}

export function ToolDeployModal({ open, onOpenChange, toolName, availableTargets, onDeploy, initialConfig, onViewInSpace }: ToolDeployModalProps) {
  const [step, setStep] = React.useState<'target' | 'config' | 'confirm' | 'success'>('target');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [deploymentConfig, setDeploymentConfig] = React.useState<DeploymentConfig>(() => ({
    targetType: initialConfig?.targetType ?? 'profile',
    targetId: initialConfig?.targetId ?? (availableTargets[0]?.id || ''),
    surface: initialConfig?.surface,
    permissions: initialConfig?.permissions ?? { canInteract: true, canView: true, canEdit: false },
    settings: initialConfig?.settings ?? { showInDirectory: true, allowSharing: true, collectAnalytics: true, notifyOnInteraction: false },
    privacy: initialConfig?.privacy ?? { visibility: 'public', inheritFromProfile: true },
  }));

  React.useEffect(() => {
    if (!open) {
      setStep('target');
      setIsLoading(false);
      setError(null);
    }
  }, [open]);

  const handleTargetSelect = (target: DeploymentTarget) => {
    setDeploymentConfig(prev => ({ ...prev, targetType: target.type, targetId: target.id }));
    setStep('config');
  };

  const handleConfigUpdate = (updates: Partial<DeploymentConfig>) => {
    setDeploymentConfig(prev => ({ ...prev, ...updates, permissions: { ...prev.permissions, ...(updates as any).permissions }, settings: { ...prev.settings, ...(updates as any).settings } }));
  };

  const handleDeploy = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onDeploy(deploymentConfig);
      setStep('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to deploy tool');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTargetSelection = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-[var(--hive-text-primary)]">Select Deployment Target</h3>
        <p className="text-sm text-[var(--hive-text-secondary)]">Choose where you want to deploy this tool</p>
      </div>
      <div className="grid gap-3">
        {availableTargets.map((target) => (
          <Card key={target.id} className="p-4 cursor-pointer transition-colors hover:bg-[var(--hive-background-secondary)] border-[var(--hive-border-primary)]" onClick={() => handleTargetSelect(target)}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[var(--hive-background-secondary)] rounded-lg flex items-center justify-center text-hive-text-secondary">
                {target.type === 'profile' ? <UserIcon className="h-4 w-4" /> : <UsersIcon className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <div className="font-medium text-[var(--hive-text-primary)]">{target.name}</div>
                {target.description && (
                  <div className="text-sm text-[var(--hive-text-secondary)]">{target.description}</div>
                )}
              </div>
              <ArrowLeftIcon className="h-4 w-4 text-[var(--hive-text-secondary)] rotate-180" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const spaceSurfaces = [
    { id: 'tools', name: 'Tools Gallery', description: 'Main tools section' },
    { id: 'pinned', name: 'Pinned', description: 'Pinned at top of space' },
    { id: 'posts', name: 'Posts Feed', description: 'Within the posts feed' },
    { id: 'events', name: 'Events', description: 'Events section' },
  ];

  const profileVisibilityOptions = [
    { id: 'public', name: 'Public', description: 'Anyone can see this tool' },
    { id: 'campus', name: 'Campus', description: 'Only campus members can see' },
    { id: 'connections', name: 'Connections', description: 'Only your connections can see' },
    { id: 'private', name: 'Private', description: 'Only you can see' },
  ] as const;

  const renderConfiguration = () => (
    <div className="space-y-6">
      {deploymentConfig.targetType === 'space' && (
        <Card className="p-4">
          <h4 className="font-semibold text-[var(--hive-text-primary)] mb-2 flex items-center gap-2"><Cog6ToothIcon className="h-4 w-4" /> Surface Location</h4>
          <div className="grid gap-2">
            {spaceSurfaces.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-3 p-2 rounded-lg border border-[var(--hive-border-primary)] cursor-pointer hover:bg-[var(--hive-background-secondary)]"
              >
                <input
                  type="radio"
                  name="surface"
                  value={s.id}
                  checked={deploymentConfig.surface === s.id}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleConfigUpdate({ surface: e.target.value })
                  }
                  aria-label={s.name}
                />
                <div>
                  <div className="font-medium text-[var(--hive-text-primary)]">{s.name}</div>
                  <div className="text-sm text-[var(--hive-text-secondary)]">{s.description}</div>
                </div>
              </label>
            ))}
          </div>
        </Card>
      )}

      {/* Profile Privacy Settings */}
      {deploymentConfig.targetType === 'profile' && (
        <Card className="p-4">
          <h4 className="font-semibold text-[var(--hive-text-primary)] mb-2 flex items-center gap-2"><ShieldCheckIcon className="h-4 w-4" /> Tool Visibility</h4>
          <p className="text-sm text-[var(--hive-text-secondary)] mb-3">Choose who can see this tool on your profile</p>

          {/* Inherit from profile toggle */}
          <label className="flex items-center gap-2 mb-4 p-2 rounded-lg border border-[var(--hive-border-primary)] cursor-pointer hover:bg-[var(--hive-background-secondary)]">
            <input
              type="checkbox"
              checked={deploymentConfig.privacy?.inheritFromProfile ?? true}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleConfigUpdate({
                  privacy: {
                    ...deploymentConfig.privacy!,
                    inheritFromProfile: e.target.checked,
                  },
                })
              }
            />
            <div>
              <div className="font-medium text-[var(--hive-text-primary)]">Use profile privacy</div>
              <div className="text-sm text-[var(--hive-text-secondary)]">Inherit visibility from your profile settings</div>
            </div>
          </label>

          {/* Custom visibility options (only shown when not inheriting) */}
          {!deploymentConfig.privacy?.inheritFromProfile && (
            <div className="grid gap-2">
              {profileVisibilityOptions.map((opt) => (
                <label
                  key={opt.id}
                  className="flex items-center gap-3 p-2 rounded-lg border border-[var(--hive-border-primary)] cursor-pointer hover:bg-[var(--hive-background-secondary)]"
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={opt.id}
                    checked={deploymentConfig.privacy?.visibility === opt.id}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleConfigUpdate({
                        privacy: {
                          ...deploymentConfig.privacy!,
                          visibility: e.target.value as 'public' | 'campus' | 'connections' | 'private',
                        },
                      })
                    }
                    aria-label={opt.name}
                  />
                  <div>
                    <div className="font-medium text-[var(--hive-text-primary)]">{opt.name}</div>
                    <div className="text-sm text-[var(--hive-text-secondary)]">{opt.description}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </Card>
      )}

      <Card className="p-4">
        <h4 className="font-semibold text-[var(--hive-text-primary)] mb-2 flex items-center gap-2"><Cog6ToothIcon className="h-4 w-4" /> Deployment Cog6ToothIcon</h4>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={deploymentConfig.settings.showInDirectory}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleConfigUpdate({
                  settings: {
                    ...deploymentConfig.settings,
                    showInDirectory: e.target.checked,
                  },
                })
              }
            />
            <span className="text-sm text-[var(--hive-text-secondary)]">Show in directory</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={deploymentConfig.settings.allowSharing} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleConfigUpdate({ settings: { ...deploymentConfig.settings, allowSharing: e.target.checked } })} />
            <span className="text-sm text-[var(--hive-text-secondary)]">Allow sharing</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={deploymentConfig.settings.collectAnalytics} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleConfigUpdate({ settings: { ...deploymentConfig.settings, collectAnalytics: e.target.checked } })} />
            <span className="text-sm text-[var(--hive-text-secondary)]">Collect analytics</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={deploymentConfig.settings.notifyOnInteraction} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleConfigUpdate({ settings: { ...deploymentConfig.settings, notifyOnInteraction: e.target.checked } })} />
            <span className="text-sm text-[var(--hive-text-secondary)]">Notify on interaction</span>
          </label>
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="font-semibold text-[var(--hive-text-primary)] mb-2 flex items-center gap-2"><ShieldCheckIcon className="h-4 w-4" /> Permissions</h4>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={deploymentConfig.permissions.canView} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleConfigUpdate({ permissions: { ...deploymentConfig.permissions, canView: e.target.checked } })} />
            <span className="text-sm text-[var(--hive-text-secondary)]">Can view</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={deploymentConfig.permissions.canInteract} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleConfigUpdate({ permissions: { ...deploymentConfig.permissions, canInteract: e.target.checked } })} />
            <span className="text-sm text-[var(--hive-text-secondary)]">Can interact</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={deploymentConfig.permissions.canEdit} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleConfigUpdate({ permissions: { ...deploymentConfig.permissions, canEdit: e.target.checked } })} />
            <span className="text-sm text-[var(--hive-text-secondary)]">Can edit</span>
          </label>
        </div>
      </Card>

      <div className="flex gap-2 justify-between">
        <Button variant="secondary" onClick={() => setStep('target')}>Back</Button>
        <Button onClick={() => setStep('confirm')} className="bg-[var(--hive-brand-primary)] text-hive-brand-on-gold hover:bg-hive-brand-hover">Review</Button>
      </div>
    </div>
  );

  const renderConfirmation = () => {
    const target = availableTargets.find(t => t.id === deploymentConfig.targetId);
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <h4 className="font-semibold text-[var(--hive-text-primary)] mb-2">Deployment Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[var(--hive-text-secondary)]">Tool:</span><span className="text-[var(--hive-text-primary)] font-medium">{toolName}</span></div>
            <div className="flex justify-between"><span className="text-[var(--hive-text-secondary)]">Target:</span><span className="text-[var(--hive-text-primary)] font-medium">{target?.name}</span></div>
            <div className="flex justify-between"><span className="text-[var(--hive-text-secondary)]">Visibility:</span><span className="text-[var(--hive-text-primary)] font-medium">{deploymentConfig.targetType === 'profile' ? (deploymentConfig.privacy?.inheritFromProfile ? 'Inherits from profile' : (deploymentConfig.privacy?.visibility || 'Public')) : (deploymentConfig.settings.showInDirectory ? 'Public' : 'Private')}</span></div>
          </div>
        </Card>
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">{error}</div>
        )}
        <div className="flex gap-2 justify-between">
          <Button variant="secondary" onClick={() => setStep('config')}>Back</Button>
          <Button onClick={handleDeploy} disabled={isLoading} className="bg-[var(--hive-brand-primary)] text-hive-brand-on-gold hover:bg-hive-brand-hover flex items-center gap-2">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--hive-brand-on-gold)]" />
                Deploying...
              </>
            ) : (
              <>
                <RocketLaunchIcon className="h-4 w-4" />
                Deploy Tool
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  const renderSuccess = () => {
    const target = availableTargets.find(t => t.id === deploymentConfig.targetId);
    const isSpaceDeployment = deploymentConfig.targetType === 'space';

    return (
      <div className="text-center space-y-4">
        <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircleIcon className="h-8 w-8 text-green-400" />
        </div>

        <div>
          <div className="text-lg text-[var(--hive-text-primary)] font-semibold">
            Deployed to {target?.name || 'target'}
          </div>
          <p className="text-sm text-[var(--hive-text-secondary)] mt-1">
            {isSpaceDeployment
              ? 'Space members can now use this tool.'
              : 'This tool is now visible on your profile.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          {isSpaceDeployment && onViewInSpace && (
            <Button
              onClick={() => {
                onViewInSpace(deploymentConfig.targetId);
                onOpenChange(false);
              }}
              className="bg-[var(--hive-brand-primary)] text-hive-brand-on-gold hover:bg-hive-brand-hover"
            >
              View in space →
            </Button>
          )}
          <Button
            variant={isSpaceDeployment && onViewInSpace ? "secondary" : "default"}
            onClick={() => onOpenChange(false)}
            className={!isSpaceDeployment || !onViewInSpace ? "bg-[var(--hive-brand-primary)] text-hive-brand-on-gold hover:bg-hive-brand-hover" : ""}
          >
            {isSpaceDeployment && onViewInSpace ? 'Stay here' : 'Done'}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Deploy Tool</DialogTitle>
          <DialogDescription>Select a target and confirm deployment</DialogDescription>
        </DialogHeader>

        {step === 'target' && renderTargetSelection()}
        {step === 'config' && renderConfiguration()}
        {step === 'confirm' && renderConfirmation()}
        {step === 'success' && renderSuccess()}

        <DialogFooter className="justify-between">
          {step !== 'target' && step !== 'success' ? (
            <Button variant="ghost" onClick={() => setStep('target')}><ArrowLeftIcon className="h-4 w-4 mr-2" />Start Over</Button>
          ) : <span />}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

ToolDeployModal.displayName = 'ToolDeployModal';
