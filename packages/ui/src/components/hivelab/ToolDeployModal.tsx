import { ArrowLeftIcon, CheckCircleIcon, RocketLaunchIcon, Cog6ToothIcon, ShieldCheckIcon, UserIcon, UsersIcon } from '@heroicons/react/24/outline';
import * as React from 'react';

import { Button } from '../../design-system/primitives';
import { Card } from '../../design-system/primitives';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../design-system/components/Dialog';
import { FlightAnimation } from './deploy/flight-animation';

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
  const [validationErrors, setValidationErrors] = React.useState<Array<{ field: string; message: string; elementId?: string; severity: string }>>([]);
  const [animationComplete, setAnimationComplete] = React.useState(false);

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
      setValidationErrors([]);
      setAnimationComplete(false);
    }
  }, [open]);

  // Auto-complete animation after 1200ms for space deployments
  React.useEffect(() => {
    if (step === 'success' && deploymentConfig.targetType === 'space' && !animationComplete) {
      const timer = setTimeout(() => setAnimationComplete(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [step, deploymentConfig.targetType, animationComplete]);

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
    setValidationErrors([]);
    try {
      await onDeploy(deploymentConfig);
      setStep('success');
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Failed to deploy tool';
      setError(errorMsg);
      // Try to parse validation errors from the error message
      if (e instanceof Error && 'validationErrors' in (e as any)) {
        setValidationErrors((e as any).validationErrors || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderTargetSelection = () => {
    const profileTargets = availableTargets.filter(t => t.type === 'profile');
    const spaceTargets = availableTargets.filter(t => t.type === 'space');

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--hivelab-text-primary)]">Select Deployment Target</h3>
          <p className="text-sm text-[var(--hivelab-text-secondary)]">Choose where to deploy</p>
        </div>

        {/* Profile targets */}
        {profileTargets.length > 0 && (
          <div className="grid gap-3">
            {profileTargets.map((target) => (
              <Card key={target.id} className="p-4 cursor-pointer transition-colors hover:bg-[var(--hivelab-surface)] border-[var(--hivelab-border)]" onClick={() => handleTargetSelect(target)}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[var(--hivelab-surface)] rounded-lg flex items-center justify-center text-[var(--hivelab-text-secondary)]">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-[var(--hivelab-text-primary)]">{target.name}</div>
                    {target.description && (
                      <div className="text-sm text-[var(--hivelab-text-secondary)]">{target.description}</div>
                    )}
                  </div>
                  <ArrowLeftIcon className="h-4 w-4 text-[var(--hivelab-text-secondary)] rotate-180" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Space targets section */}
        <div className="pt-2">
          <div className="text-xs font-medium text-[var(--hivelab-text-secondary)] uppercase tracking-wide mb-2">
            Spaces you lead
          </div>
          {spaceTargets.length > 0 ? (
            <div className="grid gap-3">
              {spaceTargets.map((target) => (
                <Card key={target.id} className="p-4 cursor-pointer transition-colors hover:bg-[var(--hivelab-surface)] border-[var(--hivelab-border)]" onClick={() => handleTargetSelect(target)}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-[var(--hivelab-surface)] rounded-lg flex items-center justify-center text-[var(--hivelab-text-secondary)]">
                      <UsersIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-[var(--hivelab-text-primary)]">{target.name}</div>
                      {target.description && (
                        <div className="text-sm text-[var(--hivelab-text-secondary)]">{target.description}</div>
                      )}
                    </div>
                    <ArrowLeftIcon className="h-4 w-4 text-[var(--hivelab-text-secondary)] rotate-180" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-lg border border-dashed border-[var(--hivelab-border)] bg-[var(--hivelab-surface)]/30">
              <div className="text-center">
                <UsersIcon className="h-6 w-6 text-[var(--hivelab-text-secondary)]/50 mx-auto mb-2" />
                <p className="text-sm text-[var(--hivelab-text-secondary)]">
                  You're not leading any spaces yet
                </p>
                <p className="text-xs text-[var(--hivelab-text-secondary)]/70 mt-1">
                  Deploy to your profile, or claim a space first
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const spaceSurfaces = [
    { id: 'tools', name: 'Creations', description: 'Main creations section' },
    { id: 'pinned', name: 'Pinned', description: 'Pinned at top of space' },
    { id: 'posts', name: 'Posts Feed', description: 'Within the posts feed' },
    { id: 'events', name: 'Events', description: 'Events section' },
  ];

  const profileVisibilityOptions = [
    { id: 'public', name: 'Public', description: 'Anyone can see this' },
    { id: 'campus', name: 'Campus', description: 'Only campus members can see' },
    { id: 'connections', name: 'Connections', description: 'Only your connections can see' },
    { id: 'private', name: 'Private', description: 'Only you can see' },
  ] as const;

  const renderConfiguration = () => (
    <div className="space-y-6">
      {deploymentConfig.targetType === 'space' && (
        <Card className="p-4">
          <h4 className="font-semibold text-[var(--hivelab-text-primary)] mb-2 flex items-center gap-2"><Cog6ToothIcon className="h-4 w-4" /> Surface Location</h4>
          <div className="grid gap-2">
            {spaceSurfaces.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-3 p-2 rounded-lg border border-[var(--hivelab-border)] cursor-pointer hover:bg-[var(--hivelab-surface)]"
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
                  <div className="font-medium text-[var(--hivelab-text-primary)]">{s.name}</div>
                  <div className="text-sm text-[var(--hivelab-text-secondary)]">{s.description}</div>
                </div>
              </label>
            ))}
          </div>
        </Card>
      )}

      {/* Profile Privacy Settings */}
      {deploymentConfig.targetType === 'profile' && (
        <Card className="p-4">
          <h4 className="font-semibold text-[var(--hivelab-text-primary)] mb-2 flex items-center gap-2"><ShieldCheckIcon className="h-4 w-4" /> Visibility</h4>
          <p className="text-sm text-[var(--hivelab-text-secondary)] mb-3">Choose who can see this on your profile</p>

          {/* Inherit from profile toggle */}
          <label className="flex items-center gap-2 mb-4 p-2 rounded-lg border border-[var(--hivelab-border)] cursor-pointer hover:bg-[var(--hivelab-surface)]">
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
              <div className="font-medium text-[var(--hivelab-text-primary)]">Use profile privacy</div>
              <div className="text-sm text-[var(--hivelab-text-secondary)]">Inherit visibility from your profile settings</div>
            </div>
          </label>

          {/* Custom visibility options (only shown when not inheriting) */}
          {!deploymentConfig.privacy?.inheritFromProfile && (
            <div className="grid gap-2">
              {profileVisibilityOptions.map((opt) => (
                <label
                  key={opt.id}
                  className="flex items-center gap-3 p-2 rounded-lg border border-[var(--hivelab-border)] cursor-pointer hover:bg-[var(--hivelab-surface)]"
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
                    <div className="font-medium text-[var(--hivelab-text-primary)]">{opt.name}</div>
                    <div className="text-sm text-[var(--hivelab-text-secondary)]">{opt.description}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </Card>
      )}

      <Card className="p-4">
        <h4 className="font-semibold text-[var(--hivelab-text-primary)] mb-2 flex items-center gap-2"><Cog6ToothIcon className="h-4 w-4" /> Deployment Settings</h4>
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
            <span className="text-sm text-[var(--hivelab-text-secondary)]">Show in directory</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={deploymentConfig.settings.allowSharing} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleConfigUpdate({ settings: { ...deploymentConfig.settings, allowSharing: e.target.checked } })} />
            <span className="text-sm text-[var(--hivelab-text-secondary)]">Allow sharing</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={deploymentConfig.settings.collectAnalytics} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleConfigUpdate({ settings: { ...deploymentConfig.settings, collectAnalytics: e.target.checked } })} />
            <span className="text-sm text-[var(--hivelab-text-secondary)]">Collect analytics</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={deploymentConfig.settings.notifyOnInteraction} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleConfigUpdate({ settings: { ...deploymentConfig.settings, notifyOnInteraction: e.target.checked } })} />
            <span className="text-sm text-[var(--hivelab-text-secondary)]">Notify on interaction</span>
          </label>
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="font-semibold text-[var(--hivelab-text-primary)] mb-2 flex items-center gap-2"><ShieldCheckIcon className="h-4 w-4" /> Permissions</h4>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={deploymentConfig.permissions.canView} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleConfigUpdate({ permissions: { ...deploymentConfig.permissions, canView: e.target.checked } })} />
            <span className="text-sm text-[var(--hivelab-text-secondary)]">Can view</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={deploymentConfig.permissions.canInteract} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleConfigUpdate({ permissions: { ...deploymentConfig.permissions, canInteract: e.target.checked } })} />
            <span className="text-sm text-[var(--hivelab-text-secondary)]">Can interact</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={deploymentConfig.permissions.canEdit} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleConfigUpdate({ permissions: { ...deploymentConfig.permissions, canEdit: e.target.checked } })} />
            <span className="text-sm text-[var(--hivelab-text-secondary)]">Can edit</span>
          </label>
        </div>
      </Card>

      <div className="flex gap-2 justify-between">
        <Button variant="secondary" onClick={() => setStep('target')}>Back</Button>
        <Button onClick={() => setStep('confirm')} className="bg-[var(--life-gold)] text-black hover:bg-[var(--life-gold)]/90">Review</Button>
      </div>
    </div>
  );

  const renderConfirmation = () => {
    const target = availableTargets.find(t => t.id === deploymentConfig.targetId);
    return (
      <div className="space-y-4">
        {/* Error display - prominent at top */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-red-400 text-xs font-bold">!</span>
              </div>
              <div className="flex-1">
                <p className="text-red-400 text-sm font-medium">
                  {validationErrors.length > 0 ? 'Tool needs fixes before deploying' : 'Deployment failed'}
                </p>
                {validationErrors.length === 0 && (
                  <p className="text-red-400/80 text-sm mt-1">{error}</p>
                )}
              </div>
            </div>
            {validationErrors.length > 0 && (
              <ul className="mt-3 space-y-1.5 ml-8">
                {validationErrors.map((err, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className={err.severity === 'error' ? 'text-red-400' : 'text-yellow-400'}>
                      {err.severity === 'error' ? '\u2715' : '\u26A0'}
                    </span>
                    <span className="text-[var(--hivelab-text-secondary)]">
                      {err.message}
                      {err.elementId && (
                        <span className="text-[var(--hivelab-text-tertiary)]"> ({err.elementId})</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <Card className="p-4">
          <h4 className="font-semibold text-[var(--hivelab-text-primary)] mb-2">Deployment Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[var(--hivelab-text-secondary)]">Tool:</span><span className="text-[var(--hivelab-text-primary)] font-medium">{toolName}</span></div>
            <div className="flex justify-between"><span className="text-[var(--hivelab-text-secondary)]">Target:</span><span className="text-[var(--hivelab-text-primary)] font-medium">{target?.name}</span></div>
            <div className="flex justify-between"><span className="text-[var(--hivelab-text-secondary)]">Visibility:</span><span className="text-[var(--hivelab-text-primary)] font-medium">{deploymentConfig.targetType === 'profile' ? (deploymentConfig.privacy?.inheritFromProfile ? 'Inherits from profile' : (deploymentConfig.privacy?.visibility || 'Public')) : (deploymentConfig.settings.showInDirectory ? 'Public' : 'Private')}</span></div>
          </div>
        </Card>

        <div className="flex gap-2 justify-between">
          <Button variant="secondary" onClick={() => setStep('config')}>Back</Button>
          <Button onClick={handleDeploy} disabled={isLoading} className="bg-[var(--life-gold)] text-black hover:bg-[var(--life-gold)]/90 flex items-center gap-2">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black" />
                Deploying...
              </>
            ) : (
              <>
                <RocketLaunchIcon className="h-4 w-4" />
                {error ? 'Try Again' : 'Deploy'}
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

    // For space deployments, show FlightAnimation celebration
    if (isSpaceDeployment && target && !animationComplete) {
      const targetSpace = {
        id: target.id,
        name: target.name,
        handle: target.name.toLowerCase().replace(/\s/g, '-'),
        memberCount: 0,
      };

      return (
        <div className="py-4">
          <FlightAnimation toolName={toolName} targetSpace={targetSpace} />
        </div>
      );
    }

    // Profile deployments or post-animation state
    return (
      <div className="text-center space-y-4">
        {isSpaceDeployment ? (
          // Post-animation success for space deployments
          <div className="w-14 h-14 bg-[var(--life-gold)]/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircleIcon className="h-8 w-8 text-[var(--life-gold)]" />
          </div>
        ) : (
          // Profile deployment success
          <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircleIcon className="h-8 w-8 text-green-400" />
          </div>
        )}

        <div>
          <div className="text-lg text-[var(--hivelab-text-primary)] font-semibold">
            Deployed to {target?.name || 'target'}
          </div>
          <p className="text-sm text-[var(--hivelab-text-secondary)] mt-1">
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
              className="bg-[var(--life-gold)] text-black hover:bg-[var(--life-gold)]/90"
            >
              View in space →
            </Button>
          )}
          <Button
            variant={isSpaceDeployment && onViewInSpace ? "secondary" : "default"}
            onClick={() => onOpenChange(false)}
            className={!isSpaceDeployment || !onViewInSpace ? "bg-[var(--life-gold)] text-black hover:bg-[var(--life-gold)]/90" : ""}
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
          <DialogTitle>Deploy</DialogTitle>
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
