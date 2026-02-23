'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useStreamingGeneration } from '@hive/hooks';
import type { CanvasElement, Connection, Page } from '../types';

interface UseIDEAIOptions {
  elements: CanvasElement[];
  connections: Connection[];
  selectedIds: string[];
  toolId: string;
  toolName: string;
  toolDescription: string;
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  setSelectedIds: (ids: string[]) => void;
  pushHistory: (description: string) => void;
  /** Callback to load AI-generated pages into page state */
  onPagesGenerated?: (pages: Page[]) => void;
}

export function useIDEAI({
  elements,
  connections,
  selectedIds,
  toolId,
  toolName,
  toolDescription,
  setElements,
  setSelectedIds,
  pushHistory,
  onPagesGenerated,
}: UseIDEAIOptions) {
  // Track which AI elements have been processed to prevent duplicate additions
  const processedAIElementIdsRef = useRef<Set<string>>(new Set());

  const { state: aiState, generate, cancel: cancelGeneration } = useStreamingGeneration({
    onComplete: () => pushHistory('AI generation complete'),
    onError: () => {},
    onStatusUpdate: () => {},
    onElementAdded: () => {},
  });

  // Position helper for AI
  const getPositionNearSelection = useCallback(() => {
    if (selectedIds.length === 0) return { x: 100, y: 100 };
    const selected = elements.filter(el => selectedIds.includes(el.id));
    if (selected.length === 0) return { x: 100, y: 100 };
    const maxX = Math.max(...selected.map(el => el.position.x + (el.size?.width || 240)));
    const avgY = selected.reduce((sum, el) => sum + el.position.y, 0) / selected.length;
    return { x: maxX + 40, y: avgY };
  }, [elements, selectedIds]);

  // Merge AI elements - only process new elements that haven't been added yet
  useEffect(() => {
    if (aiState.elements.length > 0 && !aiState.isGenerating) {
      const newElements = aiState.elements.filter(
        el => el.instanceId && !processedAIElementIdsRef.current.has(el.instanceId)
      );

      if (newElements.length === 0) return;

      const insertPosition = getPositionNearSelection();
      const timestamp = Date.now();
      const canvasElements: CanvasElement[] = newElements.map((el, index) => ({
        id: `element_${timestamp}_${index}`,
        elementId: el.elementId || 'unknown',
        instanceId: el.instanceId || `${el.elementId}_${timestamp}_${index}`,
        position: el.position || {
          x: insertPosition.x + (index % 3) * 280,
          y: insertPosition.y + Math.floor(index / 3) * 160,
        },
        size: el.size || { width: 260, height: 140 },
        config: el.config || {},
        zIndex: elements.length + index + 1,
        locked: false,
        visible: true,
      }));

      // Mark these elements as processed
      newElements.forEach(el => {
        if (el.instanceId) {
          processedAIElementIdsRef.current.add(el.instanceId);
        }
      });

      if (canvasElements.length > 0) {
        setElements(prev => [...prev, ...canvasElements]);
        setSelectedIds(canvasElements.map(el => el.id));
      }
    }
  }, [aiState.elements, aiState.isGenerating, getPositionNearSelection, elements.length, setElements, setSelectedIds]);

  // Handle multi-page generation: when AI returns pages, load them into page state
  const pagesLoadedRef = useRef(false);
  useEffect(() => {
    if (
      aiState.pages &&
      aiState.pages.length > 1 &&
      !aiState.isGenerating &&
      onPagesGenerated &&
      !pagesLoadedRef.current
    ) {
      pagesLoadedRef.current = true;
      const timestamp = Date.now();
      const pages: Page[] = aiState.pages.map((p, idx) => ({
        id: p.id || `page_${timestamp}_${idx}`,
        name: p.name || `Page ${idx + 1}`,
        elements: (p.elements || []).map((el, elIdx) => {
          const elAny = el as unknown as Record<string, unknown>;
          const elementId = (elAny.elementId as string) || (elAny.type as string) || 'unknown';
          return {
            id: `element_${timestamp}_${idx}_${elIdx}`,
            elementId,
            instanceId: (elAny.instanceId as string) || `${elementId}_${timestamp}_${idx}_${elIdx}`,
            position: (elAny.position as { x: number; y: number }) || { x: 0, y: 100 + elIdx * 220 },
            size: (elAny.size as { width: number; height: number }) || { width: 260, height: 140 },
            config: (elAny.config as Record<string, unknown>) || {},
            zIndex: elIdx + 1,
            locked: false,
            visible: true,
            onAction: elAny.onAction as Page['elements'][number]['onAction'],
          };
        }),
        connections: (p.connections || []).map((conn, cIdx) => ({
          id: `conn_${timestamp}_${idx}_${cIdx}`,
          from: { instanceId: conn.from.instanceId, port: conn.from.port || 'output' },
          to: { instanceId: conn.to.instanceId, port: conn.to.port || 'input' },
        })),
        isStartPage: p.isStartPage,
      }));
      onPagesGenerated(pages);
      pushHistory('AI multi-page generation');
    }
    // Reset when generation starts again
    if (aiState.isGenerating) {
      pagesLoadedRef.current = false;
    }
  }, [aiState.pages, aiState.isGenerating, onPagesGenerated, pushHistory]);

  // AI handler
  const handleAISubmit = useCallback(async (prompt: string, type: string) => {
    const selectedEls = elements.filter(el => selectedIds.includes(el.id));
    const hasSelection = selectedEls.length > 0;
    const isIteration = type === 'modify' || type === 'iterate' || hasSelection;
    const elementsForContext = hasSelection ? selectedEls : elements;

    const existingComposition = isIteration ? {
      id: toolId,
      name: toolName || 'Untitled Tool',
      description: toolDescription,
      elements: elementsForContext.map(el => ({
        elementId: el.elementId,
        instanceId: el.instanceId,
        type: el.elementId,
        name: el.elementId,
        config: el.config,
        position: el.position,
        size: el.size,
      })),
      connections: connections.filter(conn =>
        elementsForContext.some(el =>
          el.instanceId === conn.from.instanceId || el.instanceId === conn.to.instanceId
        )
      ).map(conn => ({
        from: { instanceId: conn.from.instanceId, output: conn.from.port || 'default' },
        to: { instanceId: conn.to.instanceId, input: conn.to.port || 'default' },
      })),
      layout: 'flow' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } : undefined;

    const selectionContext = hasSelection ? {
      count: selectedEls.length,
      types: selectedEls.map(el => el.elementId),
      prompt: `Acting on ${selectedEls.length} selected element(s): ${selectedEls.map(el => el.elementId).join(', ')}`,
    } : undefined;

    await generate({
      prompt: selectionContext ? `${selectionContext.prompt}. ${prompt}` : prompt,
      isIteration,
      existingComposition,
    });
  }, [generate, toolId, toolName, toolDescription, elements, connections, selectedIds]);

  return {
    aiState,
    handleAISubmit,
    cancelGeneration,
  };
}
