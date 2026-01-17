/**
 * Tool Studio Example
 *
 * Complete example of HiveLab studio using new @dnd-kit architecture.
 * This demonstrates the full integration of all components.
 *
 * Features:
 * - Drag elements from palette to canvas
 * - Reorder elements on canvas
 * - Undo/redo with keyboard shortcuts
 * - Auto-save
 * - Mobile touch support
 * - Keyboard accessibility
 */

'use client';

import { StopIcon, PhotoIcon, MinusIcon, DocumentTextIcon, Bars3BottomLeftIcon, CheckIcon } from '@heroicons/react/24/outline';

// Aliases for lucide compatibility
const Type = DocumentTextIcon;
const AlignLeft = Bars3BottomLeftIcon;
const CheckSquare = CheckIcon;
import { useState } from 'react';
import { Button } from '../../../design-system/primitives';
import { useToolState } from '../../../hooks/hivelab/use-tool-state';
import type { Tool } from '../../../lib/hivelab/tool-state-manager';
import { CanvasDropZone } from './CanvasDropZone';
import { DndStudioProvider } from './DndStudioProvider';
import { DraggablePaletteItem } from './DraggablePaletteItem';
import { SortableCanvasElement } from './SortableCanvasElement';

// Element type definitions for palette
const ELEMENT_TYPES = [
  {
    id: 'text-input',
    type: 'TEXT_INPUT',
    label: 'Text Input',
    icon: Type,
    description: 'Short text field',
  },
  {
    id: 'textarea',
    type: 'TEXTAREA',
    label: 'Textarea',
    icon: AlignLeft,
    description: 'Long text field',
  },
  {
    id: 'radio',
    type: 'RADIO',
    label: 'Radio Choice',
    icon: StopIcon,
    description: 'Single choice',
  },
  {
    id: 'checkbox',
    type: 'CHECKBOX',
    label: 'Checkbox',
    icon: CheckSquare,
    description: 'Multiple choice',
  },
  {
    id: 'image-upload',
    type: 'IMAGE_UPLOAD',
    label: 'PhotoIcon Upload',
    icon: PhotoIcon,
    description: 'Upload images',
  },
  {
    id: 'divider',
    type: 'DIVIDER',
    label: 'Divider',
    icon: MinusIcon,
    description: 'Section separator',
  },
] as const;

export interface ToolStudioExampleProps {
  initialTool?: Tool;
  onSave?: (tool: Tool) => Promise<void>;
}

export function ToolStudioExample({
  initialTool,
  onSave,
}: ToolStudioExampleProps) {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Initialize tool state with undo/redo and auto-save
  const {
    tool,
    addElement,
    removeElement,
    updateElement,
    reorderElements,
    updateTool,
    undo,
    redo,
    canUndo,
    canRedo,
    lastAction,
  } = useToolState({
    initialTool: initialTool || {
      id: 'new-tool',
      title: 'Untitled Tool',
      description: '',
      elements: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    onAutoSave: onSave,
    autoSaveDelay: 10000, // 10 seconds
  });

  const handleElementAdd = (elementType: string) => {
    addElement(elementType);
  };

  const handleElementDelete = (elementId: string) => {
    removeElement(elementId);
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  };

  const handleElementSelect = (elementId: string) => {
    setSelectedElementId(elementId);
  };

  return (
    <div className="h-screen flex flex-col bg-background-primary">
      {/* Toolbar */}
      <div className="h-16 border-b border-border-default flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={tool.title}
            onChange={(e) => updateTool({ title: e.target.value })}
            className="text-lg font-semibold bg-transparent border-none outline-none text-text-primary"
            placeholder="Tool Title"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <Button
            onClick={undo}
            disabled={!canUndo}
            variant="ghost"
            size="sm"
            title={`Undo ${lastAction || ''} (Cmd+Z)`}
          >
            ↶ Undo
          </Button>
          <Button
            onClick={redo}
            disabled={!canRedo}
            variant="ghost"
            size="sm"
            title="Redo (Cmd+Shift+Z)"
          >
            ↷ Redo
          </Button>

          {/* Save */}
          <Button
            onClick={() => onSave?.(tool)}
            variant="secondary"
            size="sm"
          >
            Save
          </Button>
          <Button variant="default" size="sm">
            Deploy
          </Button>
        </div>
      </div>

      {/* Studio Layout */}
      <div className="flex-1 flex overflow-hidden">
        <DndStudioProvider
          onElementAdd={handleElementAdd}
          onElementReorder={reorderElements}
          elementIds={tool.elements.map((el) => el.id)}
        >
          {/* Left: Element Palette */}
          <div className="w-72 border-r border-border-default bg-background-secondary p-4 overflow-y-auto">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-3">
                Build
              </h3>
              <div className="space-y-1">
                {ELEMENT_TYPES.map((elementType) => (
                  <DraggablePaletteItem
                    key={elementType.id}
                    id={elementType.id}
                    elementType={elementType.type}
                    icon={elementType.icon}
                    label={elementType.label}
                    description={elementType.description}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Center: Canvas */}
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
              <CanvasDropZone isEmpty={tool.elements.length === 0}>
                <div className="space-y-4">
                  {tool.elements.map((element) => (
                    <SortableCanvasElement
                      key={element.id}
                      id={element.id}
                      isSelected={selectedElementId === element.id}
                      onSelect={() => handleElementSelect(element.id)}
                      onDelete={() => handleElementDelete(element.id)}
                    >
                      {/* Element Renderer */}
                      <div className="space-y-2">
                        <div className="text-xs text-text-tertiary uppercase tracking-wide">
                          {element.type}
                        </div>
                        <div className="text-sm font-medium text-text-primary">
                          {element.label}
                        </div>
                        {element.description && (
                          <div className="text-sm text-text-secondary">
                            {element.description}
                          </div>
                        )}
                      </div>
                    </SortableCanvasElement>
                  ))}
                </div>
              </CanvasDropZone>
            </div>
          </div>

          {/* Right: Properties Panel */}
          <div className="w-80 border-l border-border-default bg-background-secondary p-4 overflow-y-auto">
            {selectedElementId ? (
              <div>
                <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-4">
                  Properties
                </h3>
                {(() => {
                  const element = tool.elements.find(
                    (el) => el.id === selectedElementId
                  );
                  if (!element) return null;

                  return (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor={`element-label-${element.id}`} className="block text-xs text-text-secondary mb-1">
                          Label
                        </label>
                        <input
                          id={`element-label-${element.id}`}
                          type="text"
                          value={element.label}
                          onChange={(e) =>
                            updateElement(element.id, { label: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-background-tertiary border border-border-default rounded-sm text-sm text-text-primary"
                        />
                      </div>

                      <div>
                        <label htmlFor={`element-description-${element.id}`} className="block text-xs text-text-secondary mb-1">
                          Description (optional)
                        </label>
                        <textarea
                          id={`element-description-${element.id}`}
                          value={element.description || ''}
                          onChange={(e) =>
                            updateElement(element.id, {
                              description: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-background-tertiary border border-border-default rounded-sm text-sm text-text-primary"
                          rows={3}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="required"
                          checked={element.required}
                          onChange={(e) =>
                            updateElement(element.id, {
                              required: e.target.checked,
                            })
                          }
                          className="w-4 h-4"
                        />
                        <label
                          htmlFor="required"
                          className="text-sm text-text-primary"
                        >
                          Required field
                        </label>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-text-tertiary text-sm">
                  Select an element to edit its properties
                </div>
              </div>
            )}
          </div>
        </DndStudioProvider>
      </div>
    </div>
  );
}
