'use client';

/**
 * WorkflowPipeline Element
 *
 * Kanban-style multi-stage approval pipeline for budget requests, event proposals, etc.
 * Config: stages, intakeFields, title
 * Actions: submit, approve, reject, request_changes
 * State: collections.requests, counters.totalRequests, counters per stage
 */

import * as React from 'react';
import { useState, useCallback, useMemo } from 'react';
import {
  ArrowRightIcon,
  PlusIcon,
  XMarkIcon,
  CheckIcon,
  ArrowUturnLeftIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { springPresets } from '@hive/tokens';

import { Button } from '../../../../design-system/primitives';
import { Card, CardContent } from '../../../../design-system/primitives';
import { AnimatedNumber, numberSpringPresets } from '../../../motion-primitives/animated-number';

import type { ElementProps } from '../../../../lib/hivelab/element-system';
import { StateContainer, type ElementMode } from '../core';

// ============================================================
// Types
// ============================================================

interface StageConfig {
  id: string;
  name: string;
  color: string;
}

interface IntakeField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  required?: boolean;
  options?: string[];
}

interface RequestEntry {
  id: string;
  createdAt: string;
  createdBy: string;
  data: {
    title: string;
    description: string;
    stage: string;
    submittedBy: string;
    submittedByName: string;
    submittedAt: string;
    status: 'active' | 'approved' | 'rejected';
    fields?: Record<string, string>;
  };
}

interface WorkflowPipelineConfig {
  title?: string;
  stages?: StageConfig[];
  intakeFields?: IntakeField[];
}

interface WorkflowPipelineElementProps extends ElementProps {
  config: WorkflowPipelineConfig;
  mode?: ElementMode;
}

// ============================================================
// WorkflowPipeline Element
// ============================================================

export function WorkflowPipelineElement({
  id,
  config,
  onAction,
  sharedState,
  userState,
  context,
  mode = 'runtime',
}: WorkflowPipelineElementProps) {
  const prefersReducedMotion = useReducedMotion();
  const instanceId = id || 'workflow-pipeline';

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const title = config.title || 'Workflow Pipeline';
  const stages: StageConfig[] = config.stages || [
    { id: 'submitted', name: 'Submitted', color: 'bg-blue-500' },
    { id: 'review', name: 'In Review', color: 'bg-amber-500' },
    { id: 'approved', name: 'Approved', color: 'bg-green-500' },
  ];
  const intakeFields: IntakeField[] = config.intakeFields || [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
  ];

  const requestsKey = `${instanceId}:requests`;
  const requestsMap = (sharedState?.collections?.[requestsKey] || {}) as Record<string, RequestEntry>;
  const allRequests = Object.values(requestsMap);

  const totalRequests = sharedState?.counters?.[`${instanceId}:totalRequests`] ?? allRequests.length;
  const currentUserId = context?.userId || userState?.userId as string || '';

  const requestsByStage = useMemo(() => {
    const map: Record<string, RequestEntry[]> = {};
    for (const stage of stages) {
      map[stage.id] = [];
    }
    for (const request of allRequests) {
      const stageId = request.data?.stage;
      if (stageId && map[stageId]) {
        map[stageId].push(request);
      }
    }
    return map;
  }, [allRequests, stages]);

  const handleSubmit = useCallback(() => {
    const titleField = formData.title?.trim();
    if (!titleField) return;
    setLoadingAction('submitting');

    onAction?.('submit', {
      title: titleField,
      description: formData.description || '',
      fields: formData,
    });

    setFormData({});
    setShowForm(false);
    setLoadingAction(null);
  }, [formData, onAction]);

  const handleApprove = useCallback((requestId: string) => {
    setLoadingAction(requestId);
    onAction?.('approve', { requestId });
    setLoadingAction(null);
  }, [onAction]);

  const handleReject = useCallback((requestId: string) => {
    setLoadingAction(requestId);
    onAction?.('reject', { requestId });
    setLoadingAction(null);
  }, [onAction]);

  const handleRequestChanges = useCallback((requestId: string) => {
    setLoadingAction(requestId);
    onAction?.('request_changes', { requestId });
    setLoadingAction(null);
  }, [onAction]);

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    if (diffH < 1) return 'just now';
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD}d ago`;
  };

  return (
    <StateContainer status="success">
      <Card className="overflow-hidden">
        <CardContent className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardDocumentCheckIcon className="h-5 w-5 text-primary" />
              <span className="font-semibold">{title}</span>
              <span className="text-xs text-muted-foreground tabular-nums ml-1">
                <AnimatedNumber value={totalRequests} springOptions={numberSpringPresets.quick} /> requests
              </span>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
            >
              {showForm ? (
                <>
                  <XMarkIcon className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </>
              ) : (
                <>
                  <PlusIcon className="h-3.5 w-3.5 mr-1" />
                  New Request
                </>
              )}
            </Button>
          </div>

          {/* Intake Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : springPresets.snappy}
                className="border rounded-lg p-4 space-y-3 bg-muted/20"
              >
                {intakeFields.map((field) => (
                  <div key={field.key}>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      {field.label}{field.required && ' *'}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      />
                    ) : field.type === 'select' && field.options ? (
                      <select
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="">Select...</option>
                        {field.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    )}
                  </div>
                ))}
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.title?.trim() || loadingAction === 'submitting'}
                  size="sm"
                  className="w-full"
                >
                  Submit Request
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stage Columns */}
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
            {stages.map((stage) => {
              const stageRequests = requestsByStage[stage.id] || [];
              const stageCount = sharedState?.counters?.[`${instanceId}:stage:${stage.id}`] ?? stageRequests.length;
              const isLastStage = stage.id === stages[stages.length - 1].id;

              return (
                <div key={stage.id} className="flex-1 min-w-[180px]">
                  {/* Stage Header */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                    <span className="text-xs font-medium">{stage.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums ml-auto">
                      <AnimatedNumber value={stageCount} springOptions={numberSpringPresets.quick} />
                    </span>
                  </div>

                  {/* Request Cards */}
                  <div className="space-y-2">
                    <AnimatePresence>
                      {stageRequests.map((request) => {
                        const isOwner = request.data?.submittedBy === currentUserId || request.createdBy === currentUserId;
                        return (
                          <motion.div
                            key={request.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={prefersReducedMotion ? { duration: 0 } : springPresets.snappy}
                            className={`border rounded-md p-2.5 text-xs space-y-1.5 ${
                              isOwner ? 'border-primary/30 bg-primary/5' : 'border-border'
                            }`}
                          >
                            <div className="font-medium truncate">{request.data?.title}</div>
                            <div className="text-muted-foreground flex items-center gap-1">
                              <span>{request.data?.submittedByName || 'Anonymous'}</span>
                              <span>&middot;</span>
                              <span>{formatTime(request.data?.submittedAt || request.createdAt)}</span>
                            </div>

                            {!isLastStage && request.data?.status === 'active' && (
                              <div className="flex gap-1 pt-0.5">
                                <Button
                                  onClick={() => handleApprove(request.id)}
                                  disabled={loadingAction === request.id}
                                  variant="outline"
                                  size="sm"
                                  className="h-5 px-1.5 text-[10px]"
                                >
                                  <CheckIcon className="h-2.5 w-2.5 mr-0.5" />
                                  Approve
                                </Button>
                                <Button
                                  onClick={() => handleReject(request.id)}
                                  disabled={loadingAction === request.id}
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 px-1.5 text-[10px] text-destructive hover:text-destructive"
                                >
                                  <XMarkIcon className="h-2.5 w-2.5 mr-0.5" />
                                  Reject
                                </Button>
                                <Button
                                  onClick={() => handleRequestChanges(request.id)}
                                  disabled={loadingAction === request.id}
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 px-1.5 text-[10px]"
                                >
                                  <ArrowUturnLeftIcon className="h-2.5 w-2.5 mr-0.5" />
                                  Changes
                                </Button>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {stageRequests.length === 0 && (
                      <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-md">
                        Empty
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </StateContainer>
  );
}

export default WorkflowPipelineElement;
