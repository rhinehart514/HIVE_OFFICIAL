'use client';

/**
 * SimpleEditor — Adaptive editor for non-IDE complexity levels
 *
 * Three render paths:
 * - Embed: Preview card + settings toggle + deploy (space primitives)
 * - Configure: Config form + live preview, side-by-side (single standalone element)
 * - Compose: Stacked config cards + add element (2-6 elements)
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cog6ToothIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowsPointingOutIcon,
  RocketLaunchIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { springPresets } from '@hive/tokens';
import { cn } from '../../../lib/utils';
import { FOCUS_RING } from '../tokens';
import { renderElementSafe } from '../element-renderers';
import { ELEMENT_SCHEMAS, PropertyField } from '../ide/config-fields';
import { ElementPickerModal } from './element-picker-modal';
import type { EditorLevel } from '../../../lib/hivelab/detect-editor-level';
import type { CanvasElement, HiveLabComposition } from '../ide/types';
import type { UserContext } from '../../../lib/hivelab/element-system';

const focusRing = FOCUS_RING;

export interface SimpleEditorProps {
  editorMode: Exclude<EditorLevel, 'flow'>;
  toolId: string;
  composition: {
    id: string;
    name: string;
    description: string;
    elements: CanvasElement[];
    connections: Array<{ id: string; from: { instanceId: string; port: string }; to: { instanceId: string; port: string } }>;
  };
  onSave: (comp: HiveLabComposition) => Promise<void>;
  onDeploy: () => void;
  onEscalateToIDE: () => void;
  onUpdateComposition: (updates: Partial<{ elements: CanvasElement[]; name: string; description: string }>) => void;
  userContext?: UserContext;
  saving?: boolean;
  justSaved?: boolean;
}

/** Get human-readable name for an element ID */
function elementDisplayName(elementId: string): string {
  return elementId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─────────────────────────────────────────────
// EMBED MODE — Preview card + settings + deploy
// ─────────────────────────────────────────────

function EmbedEditor({
  composition,
  onSave,
  onDeploy,
  onEscalateToIDE,
  onUpdateComposition,
  saving,
  userContext,
}: SimpleEditorProps) {
  const [showSettings, setShowSettings] = useState(false);
  const element = composition.elements[0];
  const schema = ELEMENT_SCHEMAS[element.elementId] || [];
  const displayName = elementDisplayName(element.elementId);

  const updateConfig = (key: string, value: unknown) => {
    const updated = {
      ...element,
      config: { ...element.config, [key]: value },
    };
    onUpdateComposition({ elements: [updated] });
  };

  return (
    <div className="h-full overflow-auto bg-[var(--hivelab-bg)]">
      <div className="mx-auto max-w-lg px-4 py-8 md:py-16">
        {/* Element card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springPresets.snappy}
          className="rounded-2xl border border-white/[0.06] bg-[var(--hivelab-panel)] overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-lg font-semibold text-white">{displayName}</h2>
            <p className="text-sm text-white/40 mt-1">Space element — deploys into any space</p>
          </div>

          {/* Preview */}
          <div className="px-6 pb-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 min-h-[120px]">
              {renderElementSafe(element.elementId, {
                id: element.instanceId,
                config: element.config,
                context: {
                  userId: userContext?.userId,
                  userRole: userContext?.isSpaceLeader ? 'admin' : 'member',
                  isSpaceLeader: userContext?.isSpaceLeader,
                },
              })}
            </div>
          </div>

          {/* Settings toggle */}
          {schema.length > 0 && (
            <div className="border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  'flex w-full items-center justify-between px-6 py-3 text-sm text-white/50 hover:text-white/70 transition-colors',
                  focusRing
                )}
              >
                <span className="flex items-center gap-2">
                  <Cog6ToothIcon className="h-4 w-4" />
                  Settings
                </span>
                {showSettings ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
              </button>

              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={springPresets.gentle}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 space-y-4">
                      {schema.map((prop) => (
                        <div key={prop.key}>
                          <label className="text-xs text-white/40 mb-1.5 block">{prop.label}</label>
                          <PropertyField
                            schema={prop}
                            value={element.config[prop.key]}
                            onChange={(v) => updateConfig(prop.key, v)}
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 border-t border-white/[0.06] px-6 py-4">
            <button
              type="button"
              onClick={onDeploy}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--life-gold)] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[var(--life-gold)]/90 transition-colors',
                focusRing
              )}
            >
              <RocketLaunchIcon className="h-4 w-4" />
              Deploy
            </button>
            <button
              type="button"
              onClick={() =>
                onSave({
                  id: composition.id,
                  name: composition.name,
                  description: composition.description,
                  elements: composition.elements,
                  connections: composition.connections,
                  layout: 'flow',
                })
              }
              disabled={saving}
              className={cn(
                'rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors',
                focusRing
              )}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </motion.div>

        {/* IDE escalation link */}
        <button
          type="button"
          onClick={onEscalateToIDE}
          className="mt-4 flex items-center gap-1.5 mx-auto text-xs text-white/30 hover:text-white/50 transition-colors"
        >
          <ArrowsPointingOutIcon className="h-3.5 w-3.5" />
          Open in IDE
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CONFIGURE MODE — Config form + live preview
// ─────────────────────────────────────────────

function ConfigureEditor({
  composition,
  onSave,
  onDeploy,
  onEscalateToIDE,
  onUpdateComposition,
  saving,
  userContext,
}: SimpleEditorProps) {
  const element = composition.elements[0];
  const schema = ELEMENT_SCHEMAS[element.elementId] || [];
  const displayName = elementDisplayName(element.elementId);

  const updateConfig = (key: string, value: unknown) => {
    const updated = {
      ...element,
      config: { ...element.config, [key]: value },
    };
    onUpdateComposition({ elements: [updated] });
  };

  return (
    <div className="h-full overflow-auto bg-[var(--hivelab-bg)]">
      <div className="mx-auto max-w-[960px] px-4 py-6 md:py-10">
        <div className="flex flex-col gap-6 md:flex-row">
          {/* Config panel */}
          <div className="w-full md:w-[400px] md:shrink-0">
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={springPresets.snappy}
              className="rounded-2xl border border-white/[0.06] bg-[var(--hivelab-panel)] p-5"
            >
              <h2 className="text-base font-semibold text-white mb-1">{displayName}</h2>
              <p className="text-xs text-white/40 mb-5">Configure your element</p>

              {schema.length > 0 ? (
                <div className="space-y-4">
                  {schema.map((prop) => (
                    <div key={prop.key}>
                      <label className="text-xs text-white/40 mb-1.5 block">{prop.label}</label>
                      <PropertyField
                        schema={prop}
                        value={element.config[prop.key]}
                        onChange={(v) => updateConfig(prop.key, v)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/30">No configuration needed</p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 mt-6 pt-5 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={onDeploy}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--life-gold)] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[var(--life-gold)]/90 transition-colors',
                    focusRing
                  )}
                >
                  <RocketLaunchIcon className="h-4 w-4" />
                  Deploy
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onSave({
                      id: composition.id,
                      name: composition.name,
                      description: composition.description,
                      elements: composition.elements,
                      connections: composition.connections,
                      layout: 'flow',
                    })
                  }
                  disabled={saving}
                  className={cn(
                    'rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors',
                    focusRing
                  )}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </motion.div>

            {/* IDE link */}
            <button
              type="button"
              onClick={onEscalateToIDE}
              className="mt-3 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              <ArrowsPointingOutIcon className="h-3.5 w-3.5" />
              Open in IDE
            </button>
          </div>

          {/* Live preview */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springPresets.snappy, delay: 0.05 }}
            className="flex-1 min-w-0"
          >
            <div className="rounded-2xl border border-white/[0.06] bg-[var(--hivelab-panel)] p-6 min-h-[300px]">
              <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-white/30 mb-4">
                Preview
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                {renderElementSafe(element.elementId, {
                  id: element.instanceId,
                  config: element.config,
                  context: {
                    userId: userContext?.userId,
                    userRole: userContext?.isSpaceLeader ? 'admin' : 'member',
                    isSpaceLeader: userContext?.isSpaceLeader,
                  },
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPOSE MODE — Stacked element cards
// ─────────────────────────────────────────────

function ComposeEditor({
  composition,
  onSave,
  onDeploy,
  onEscalateToIDE,
  onUpdateComposition,
  saving,
  userContext,
}: SimpleEditorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const updateElementConfig = (elementIdx: number, key: string, value: unknown) => {
    const updated = composition.elements.map((el, i) =>
      i === elementIdx ? { ...el, config: { ...el.config, [key]: value } } : el
    );
    onUpdateComposition({ elements: updated });
  };

  const removeElement = (elementIdx: number) => {
    const updated = composition.elements.filter((_, i) => i !== elementIdx);
    onUpdateComposition({ elements: updated });
  };

  const addElement = (elementId: string) => {
    const instanceId = `${elementId}_${Date.now()}`;
    const newElement: CanvasElement = {
      id: instanceId,
      elementId,
      instanceId,
      position: { x: 0, y: 0 },
      size: { width: 240, height: 120 },
      config: {},
      zIndex: composition.elements.length + 1,
      locked: false,
      visible: true,
    };
    onUpdateComposition({ elements: [...composition.elements, newElement] });
  };

  const moveElement = (fromIdx: number, toIdx: number) => {
    const updated = [...composition.elements];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    onUpdateComposition({ elements: updated });
  };

  return (
    <div className="h-full overflow-auto bg-[var(--hivelab-bg)]">
      <div className="mx-auto max-w-2xl px-4 py-6 md:py-10">
        {/* Element cards */}
        <div className="space-y-3">
          {composition.elements.map((element, idx) => {
            const schema = ELEMENT_SCHEMAS[element.elementId] || [];
            const displayName = elementDisplayName(element.elementId);
            const isExpanded = expandedId === element.id;

            return (
              <motion.div
                key={element.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ ...springPresets.snappy, delay: idx * 0.03 }}
                className="rounded-xl border border-white/[0.06] bg-[var(--hivelab-panel)] overflow-hidden"
              >
                {/* Card header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Reorder controls */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => idx > 0 && moveElement(idx, idx - 1)}
                      disabled={idx === 0}
                      className="p-0.5 text-white/20 hover:text-white/50 disabled:opacity-30 transition-colors"
                    >
                      <ChevronUpIcon className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => idx < composition.elements.length - 1 && moveElement(idx, idx + 1)}
                      disabled={idx === composition.elements.length - 1}
                      className="p-0.5 text-white/20 hover:text-white/50 disabled:opacity-30 transition-colors"
                    >
                      <ChevronDownIcon className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Element name */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : element.id)}
                    className="flex-1 text-left"
                  >
                    <span className="text-sm font-medium text-white">{displayName}</span>
                    <span className="text-xs text-white/30 ml-2">
                      {schema.length} settings
                    </span>
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => removeElement(idx)}
                    className={cn(
                      'p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors',
                      focusRing
                    )}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Expanded config */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={springPresets.gentle}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/[0.06] px-4 py-4 space-y-4">
                        {/* Mini preview */}
                        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                          {renderElementSafe(element.elementId, {
                            id: element.instanceId,
                            config: element.config,
                            context: {
                              userId: userContext?.userId,
                              userRole: userContext?.isSpaceLeader ? 'admin' : 'member',
                              isSpaceLeader: userContext?.isSpaceLeader,
                            },
                          })}
                        </div>

                        {/* Config fields */}
                        {schema.length > 0 && (
                          <div className="space-y-3">
                            {schema.map((prop) => (
                              <div key={prop.key}>
                                <label className="text-xs text-white/40 mb-1.5 block">{prop.label}</label>
                                <PropertyField
                                  schema={prop}
                                  value={element.config[prop.key]}
                                  onChange={(v) => updateElementConfig(idx, prop.key, v)}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Add element button */}
        <motion.button
          type="button"
          onClick={() => setPickerOpen(true)}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.1] px-4 py-3 text-sm text-white/40 hover:text-white/60 hover:border-white/20 transition-colors',
            focusRing
          )}
        >
          <PlusIcon className="h-4 w-4" />
          Add Element
        </motion.button>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={onDeploy}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--life-gold)] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[var(--life-gold)]/90 transition-colors',
              focusRing
            )}
          >
            <RocketLaunchIcon className="h-4 w-4" />
            Deploy
          </button>
          <button
            type="button"
            onClick={() =>
              onSave({
                id: composition.id,
                name: composition.name,
                description: composition.description,
                elements: composition.elements,
                connections: composition.connections,
                layout: 'flow',
              })
            }
            disabled={saving}
            className={cn(
              'rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors',
              focusRing
            )}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* IDE escalation link */}
        <button
          type="button"
          onClick={onEscalateToIDE}
          className="mt-3 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/50 transition-colors"
        >
          <ArrowsPointingOutIcon className="h-3.5 w-3.5" />
          Open in IDE
        </button>

        {/* Element picker */}
        <ElementPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={addElement}
          userContext={userContext}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN EXPORT — Routes to correct editor
// ─────────────────────────────────────────────

export function SimpleEditor(props: SimpleEditorProps) {
  switch (props.editorMode) {
    case 'embed':
      return <EmbedEditor {...props} />;
    case 'configure':
      return <ConfigureEditor {...props} />;
    case 'compose':
      return <ComposeEditor {...props} />;
    default:
      return null;
  }
}
