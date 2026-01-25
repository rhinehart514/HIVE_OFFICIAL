import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  CubeIcon,
  RocketLaunchIcon,
  Cog6ToothIcon,
  SparklesIcon,
  UsersIcon,
  WrenchIcon,
} from '@heroicons/react/24/outline';
import * as React from 'react';

// Aliases for lucide compatibility
const ArrowLeft = ArrowLeftIcon;
const ArrowRight = ArrowRightIcon;
const Calendar = CalendarIcon;
const CheckCircle = CheckCircleIcon;
const Clock = ClockIcon;
const Loader2 = ArrowPathIcon;
const Package = CubeIcon;
const Rocket = RocketLaunchIcon;
const Settings = Cog6ToothIcon;
const Sparkles = SparklesIcon;
const Users = UsersIcon;
const Wrench = WrenchIcon;

import { Button } from '../../design-system/primitives';
import { Card } from '../../design-system/primitives';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../design-system/components/Dialog';
import { Input } from '../../design-system/primitives';
import { Label } from '../../design-system/primitives/Label';

// ============================================================================
// Types
// ============================================================================

export interface SetupTemplateItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'event' | 'campaign' | 'workflow' | 'engagement';
  tools: Array<{
    slotId: string;
    name: string;
    description?: string;
    icon?: string;
    initiallyVisible: boolean;
  }>;
  setupFields: Array<{
    key: string;
    label: string;
    type: 'text' | 'number' | 'datetime' | 'select' | 'toggle';
    required?: boolean;
    defaultValue?: unknown;
    options?: Array<{ value: string; label: string }>;
    description?: string;
  }>;
  orchestrationRules: number;
  deploymentCount?: number;
  tags?: string[];
  isFeatured?: boolean;
}

export interface SetupDeployConfig {
  templateId: string;
  spaceId: string;
  config: Record<string, unknown>;
}

export interface SetupDeployWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: string;
  spaceName: string;
  templates: SetupTemplateItem[];
  isLoadingTemplates?: boolean;
  onDeploy: (config: SetupDeployConfig) => Promise<{ deploymentId: string }>;
  onSuccess?: (deploymentId: string) => void;
}

// ============================================================================
// Category Icons & Colors
// ============================================================================

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  event: <Calendar className="h-4 w-4" />,
  campaign: <Sparkles className="h-4 w-4" />,
  workflow: <Settings className="h-4 w-4" />,
  engagement: <Users className="h-4 w-4" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  event: 'Event',
  campaign: 'Campaign',
  workflow: 'Workflow',
  engagement: 'Engagement',
};

// ============================================================================
// Component
// ============================================================================

export function SetupDeployWizard({
  open,
  onOpenChange,
  spaceId,
  spaceName,
  templates,
  isLoadingTemplates = false,
  onDeploy,
  onSuccess,
}: SetupDeployWizardProps) {
  const [step, setStep] = React.useState<'select' | 'configure' | 'preview' | 'deploying' | 'success'>('select');
  const [selectedTemplate, setSelectedTemplate] = React.useState<SetupTemplateItem | null>(null);
  const [config, setConfig] = React.useState<Record<string, unknown>>({});
  const [isDeploying, setIsDeploying] = React.useState(false);
  const [deploymentId, setDeploymentId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Reset on close
  React.useEffect(() => {
    if (!open) {
      setStep('select');
      setSelectedTemplate(null);
      setConfig({});
      setIsDeploying(false);
      setDeploymentId(null);
      setError(null);
    }
  }, [open]);

  // Initialize config when template is selected
  React.useEffect(() => {
    if (selectedTemplate) {
      const initialConfig: Record<string, unknown> = {};
      for (const field of selectedTemplate.setupFields) {
        if (field.defaultValue !== undefined) {
          initialConfig[field.key] = field.defaultValue;
        }
      }
      setConfig(initialConfig);
    }
  }, [selectedTemplate]);

  const handleTemplateSelect = (template: SetupTemplateItem) => {
    setSelectedTemplate(template);
    setStep('configure');
  };

  const handleConfigChange = (key: string, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleDeploy = async () => {
    if (!selectedTemplate) return;

    setIsDeploying(true);
    setStep('deploying');
    setError(null);

    try {
      const result = await onDeploy({
        templateId: selectedTemplate.id,
        spaceId,
        config,
      });
      setDeploymentId(result.deploymentId);
      setStep('success');
      onSuccess?.(result.deploymentId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to deploy setup');
      setStep('preview');
    } finally {
      setIsDeploying(false);
    }
  };

  const canProceedToConfigure = selectedTemplate !== null;
  const canProceedToPreview = selectedTemplate?.setupFields.every(field => {
    if (!field.required) return true;
    const value = config[field.key];
    return value !== undefined && value !== null && value !== '';
  }) ?? false;

  // ============================================================================
  // Render Steps
  // ============================================================================

  const renderTemplateSelection = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-[var(--hive-text-primary)]">Select a Setup</h3>
        <p className="text-sm text-[var(--hive-text-secondary)]">
          Deploy an orchestrated bundle of tools to {spaceName}
        </p>
      </div>

      {isLoadingTemplates ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--hive-text-secondary)]" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 text-[var(--hive-text-secondary)]">
          No setup templates available
        </div>
      ) : (
        <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`p-4 cursor-pointer transition-all border-[var(--hive-border-primary)] hover:bg-[var(--hive-background-secondary)] ${
                selectedTemplate?.id === template.id ? 'ring-2 ring-[var(--hive-accent-gold)]' : ''
              }`}
              onClick={() => handleTemplateSelect(template)}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[var(--hive-background-secondary)] rounded-lg flex items-center justify-center text-[var(--hive-text-secondary)]">
                  <Package className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--hive-text-primary)]">{template.name}</span>
                    {template.isFeatured && (
                      <span className="px-1.5 py-0.5 text-label-xs font-medium bg-[var(--hive-accent-gold)]/10 text-[var(--hive-accent-gold)] rounded">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--hive-text-secondary)] line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-[var(--hive-text-subtle)]">
                    <span className="flex items-center gap-1">
                      {CATEGORY_ICONS[template.category]}
                      {CATEGORY_LABELS[template.category]}
                    </span>
                    <span className="flex items-center gap-1">
                      <Wrench className="h-3 w-3" />
                      {template.tools.length} tools
                    </span>
                    <span className="flex items-center gap-1">
                      <Settings className="h-3 w-3" />
                      {template.orchestrationRules} rules
                    </span>
                    {template.deploymentCount !== undefined && template.deploymentCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Rocket className="h-3 w-3" />
                        {template.deploymentCount} deployed
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--hive-text-secondary)] flex-shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderConfiguration = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-[var(--hive-text-primary)]">Configure {selectedTemplate?.name}</h3>
        <p className="text-sm text-[var(--hive-text-secondary)]">
          Set up the initial configuration for this setup
        </p>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {selectedTemplate?.setupFields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key} className="text-[var(--hive-text-primary)]">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-xs text-[var(--hive-text-secondary)]">{field.description}</p>
            )}
            {field.type === 'text' && (
              <Input
                id={field.key}
                type="text"
                value={(config[field.key] as string) ?? ''}
                onChange={(e) => handleConfigChange(field.key, e.target.value)}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                className="bg-[var(--hive-background-secondary)] border-[var(--hive-border-primary)]"
              />
            )}
            {field.type === 'number' && (
              <Input
                id={field.key}
                type="number"
                value={(config[field.key] as number) ?? ''}
                onChange={(e) => handleConfigChange(field.key, Number(e.target.value))}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                className="bg-[var(--hive-background-secondary)] border-[var(--hive-border-primary)]"
              />
            )}
            {field.type === 'datetime' && (
              <Input
                id={field.key}
                type="datetime-local"
                value={(config[field.key] as string) ?? ''}
                onChange={(e) => handleConfigChange(field.key, e.target.value)}
                className="bg-[var(--hive-background-secondary)] border-[var(--hive-border-primary)]"
              />
            )}
            {field.type === 'select' && (
              <select
                id={field.key}
                value={(config[field.key] as string) ?? ''}
                onChange={(e) => handleConfigChange(field.key, e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--hive-background-secondary)] border border-[var(--hive-border-primary)] text-[var(--hive-text-primary)]"
              >
                <option value="">Select...</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
            {field.type === 'toggle' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(config[field.key] as boolean) ?? false}
                  onChange={(e) => handleConfigChange(field.key, e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--hive-border-primary)]"
                />
                <span className="text-sm text-[var(--hive-text-secondary)]">Enabled</span>
              </label>
            )}
          </div>
        ))}

        {(!selectedTemplate?.setupFields || selectedTemplate.setupFields.length === 0) && (
          <Card className="p-4 bg-[var(--hive-background-secondary)]">
            <p className="text-sm text-[var(--hive-text-secondary)] text-center">
              No configuration needed. You can proceed to preview.
            </p>
          </Card>
        )}
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-[var(--hive-text-primary)]">Review & Deploy</h3>
        <p className="text-sm text-[var(--hive-text-secondary)]">
          Confirm your setup before deploying to {spaceName}
        </p>
      </div>

      {error && (
        <Card className="p-3 bg-red-500/10 border-red-500/30">
          <p className="text-sm text-red-400">{error}</p>
        </Card>
      )}

      <Card className="p-4 space-y-4">
        <div>
          <h4 className="text-sm font-medium text-[var(--hive-text-primary)] mb-2">Setup</h4>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-[var(--hive-text-secondary)]" />
            <span className="text-[var(--hive-text-primary)]">{selectedTemplate?.name}</span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-[var(--hive-text-primary)] mb-2">Tools to Deploy</h4>
          <div className="space-y-2">
            {selectedTemplate?.tools.map((tool) => (
              <div
                key={tool.slotId}
                className="flex items-center gap-2 text-sm"
              >
                <Wrench className="h-3.5 w-3.5 text-[var(--hive-text-secondary)]" />
                <span className="text-[var(--hive-text-primary)]">{tool.name}</span>
                {!tool.initiallyVisible && (
                  <span className="text-xs text-[var(--hive-text-subtle)]">(hidden initially)</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {Object.keys(config).length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-[var(--hive-text-primary)] mb-2">Configuration</h4>
            <div className="space-y-1 text-sm">
              {selectedTemplate?.setupFields.map((field) => {
                const value = config[field.key];
                if (value === undefined || value === null || value === '') return null;
                return (
                  <div key={field.key} className="flex justify-between">
                    <span className="text-[var(--hive-text-secondary)]">{field.label}:</span>
                    <span className="text-[var(--hive-text-primary)]">
                      {field.type === 'datetime'
                        ? new Date(value as string).toLocaleString()
                        : field.type === 'toggle'
                          ? (value ? 'Yes' : 'No')
                          : String(value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium text-[var(--hive-text-primary)] mb-2">Orchestration</h4>
          <p className="text-sm text-[var(--hive-text-secondary)]">
            {selectedTemplate?.orchestrationRules} automation rules will manage tool interactions
          </p>
        </div>
      </Card>
    </div>
  );

  const renderDeploying = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="w-16 h-16 bg-[var(--hive-background-secondary)] rounded-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--hive-accent-gold)]" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-[var(--hive-text-primary)]">Deploying Setup</h3>
        <p className="text-sm text-[var(--hive-text-secondary)]">
          Setting up {selectedTemplate?.tools.length} tools with orchestration...
        </p>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-green-500" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-[var(--hive-text-primary)]">Setup Deployed!</h3>
        <p className="text-sm text-[var(--hive-text-secondary)]">
          {selectedTemplate?.name} is now active in {spaceName}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs mt-4">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="border-[var(--hive-border-primary)]"
        >
          Close
        </Button>
        <Button
          onClick={() => onOpenChange(false)}
          className="bg-[var(--hive-accent-gold)] text-black hover:bg-[var(--hive-accent-gold)]/90"
        >
          View Setup
        </Button>
      </div>
    </div>
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[var(--hive-background-primary)] border-[var(--hive-border-primary)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--hive-text-primary)]">
            <Rocket className="h-5 w-5" />
            Deploy Setup
          </DialogTitle>
          <DialogDescription className="text-[var(--hive-text-secondary)]">
            Deploy an orchestrated bundle of tools to your space
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 'select' && renderTemplateSelection()}
          {step === 'configure' && renderConfiguration()}
          {step === 'preview' && renderPreview()}
          {step === 'deploying' && renderDeploying()}
          {step === 'success' && renderSuccess()}
        </div>

        {step !== 'deploying' && step !== 'success' && (
          <DialogFooter className="flex justify-between sm:justify-between gap-2">
            <div>
              {step !== 'select' && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (step === 'configure') setStep('select');
                    if (step === 'preview') setStep('configure');
                  }}
                  className="text-[var(--hive-text-secondary)]"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-[var(--hive-border-primary)]"
              >
                Cancel
              </Button>
              {step === 'select' && (
                <Button
                  onClick={() => setStep('configure')}
                  disabled={!canProceedToConfigure}
                  className="bg-[var(--hive-accent-gold)] text-black hover:bg-[var(--hive-accent-gold)]/90 disabled:opacity-50"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
              {step === 'configure' && (
                <Button
                  onClick={() => setStep('preview')}
                  disabled={!canProceedToPreview}
                  className="bg-[var(--hive-accent-gold)] text-black hover:bg-[var(--hive-accent-gold)]/90 disabled:opacity-50"
                >
                  Preview
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
              {step === 'preview' && (
                <Button
                  onClick={handleDeploy}
                  disabled={isDeploying}
                  className="bg-[var(--hive-accent-gold)] text-black hover:bg-[var(--hive-accent-gold)]/90"
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Deploy Setup
                </Button>
              )}
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
