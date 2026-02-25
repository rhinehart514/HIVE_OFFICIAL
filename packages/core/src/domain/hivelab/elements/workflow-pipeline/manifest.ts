import type { ElementSpec } from '../../element-spec';

export const workflowPipelineSpec: ElementSpec = {
  elementId: 'workflow-pipeline',
  name: 'Workflow Pipeline',
  category: 'action',
  dataSource: 'none',
  config: {
    title: { type: 'string', description: 'Pipeline title', default: 'Approval Pipeline', required: false },
    stages: {
      type: 'object[]',
      description: 'Pipeline stages with name and approver rules',
      default: [
        { id: 'submitted', name: 'Submitted', color: '#3B82F6' },
        { id: 'in_review', name: 'In Review', color: '#F59E0B' },
        { id: 'approved', name: 'Approved', color: '#10B981' },
      ],
      required: true,
    },
    intakeFields: {
      type: 'object[]',
      description: 'Form fields for the intake/submission step',
      default: [
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'textarea', required: true },
      ],
      required: false,
    },
    autoAdvanceRules: { type: 'object[]', description: 'Rules for auto-advancing between stages', default: [], required: false },
    notifyOnStageChange: { type: 'boolean', description: 'Notify submitter when request moves stages', default: true, required: false },
  },
  connection: {
    minDepth: 'standalone',
    levels: [
      { depth: 'standalone', provides: 'Basic submit/approve/reject pipeline', requiredContext: [] },
      { depth: 'space', provides: 'Space leaders as approvers, member-only submissions', requiredContext: ['spaceId'] },
    ],
  },
  permissions: { create: 'anyone', interact: 'authenticated' },
  executeActions: ['submit', 'approve', 'reject', 'request_changes', 'move_stage'],
  state: { shared: ['counters', 'collections'], personal: ['participation'] },
  aliases: ['workflow-pipeline-element'],
};
