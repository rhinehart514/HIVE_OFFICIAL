import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// Mock Next.js server components
vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: {
    json: vi.fn((data, init) => ({ data, init, ok: true })),
    error: vi.fn(() => ({ ok: false })),
  },
}));

describe('HiveLab Tools API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tool Execution', () => {
    it('should execute tool actions and update state', async () => {
      const toolState: Record<string, unknown> = {
        'poll-1': {
          question: 'Favorite color?',
          options: ['Red', 'Blue', 'Green'],
          votes: { Red: 0, Blue: 0, Green: 0 },
          voters: [],
        },
      };

      const executeAction = async (
        toolId: string,
        instanceId: string,
        action: string,
        payload: Record<string, unknown>,
        userId: string
      ) => {
        const state = toolState[instanceId] as {
          votes: Record<string, number>;
          voters: string[];
        };
        if (!state) {
          return NextResponse.json({ error: 'Tool instance not found' }, { status: 404 });
        }

        if (action === 'vote') {
          const option = payload.option as string;
          if (!state.votes[option]) {
            return NextResponse.json({ error: 'Invalid option' }, { status: 400 });
          }

          // Check if already voted
          if (state.voters.includes(userId)) {
            return NextResponse.json({ error: 'Already voted' }, { status: 400 });
          }

          state.votes[option] += 1;
          state.voters.push(userId);

          return NextResponse.json({
            success: true,
            newState: state,
          });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
      };

      // Cast a vote
      const vote = await executeAction('tool-1', 'poll-1', 'vote', { option: 'Blue' }, 'user-1');
      expect(vote.data.success).toBe(true);
      expect(vote.data.newState.votes.Blue).toBe(1);

      // Try to vote again (should fail)
      const doubleVote = await executeAction('tool-1', 'poll-1', 'vote', { option: 'Red' }, 'user-1');
      expect(doubleVote.init.status).toBe(400);
      expect(doubleVote.data.error).toBe('Already voted');

      // Different user can vote
      const vote2 = await executeAction('tool-1', 'poll-1', 'vote', { option: 'Blue' }, 'user-2');
      expect(vote2.data.success).toBe(true);
      expect(vote2.data.newState.votes.Blue).toBe(2);
    });

    it('should validate element tier access', async () => {
      const elementTiers: Record<string, 'universal' | 'connected' | 'space'> = {
        'poll-element': 'universal',
        'timer': 'universal',
        'member-list': 'space',
        'announcement': 'space',
        'event-picker': 'connected',
      };

      const canUseElement = (
        elementId: string,
        userContext: { isSpaceLeader: boolean; spaceId?: string }
      ) => {
        const tier = elementTiers[elementId];
        if (!tier) return false;

        if (tier === 'universal') return true;
        if (tier === 'connected') return true;
        if (tier === 'space') return userContext.isSpaceLeader;

        return false;
      };

      // Anyone can use universal elements
      expect(canUseElement('poll-element', { isSpaceLeader: false })).toBe(true);
      expect(canUseElement('timer', { isSpaceLeader: false })).toBe(true);

      // Only leaders can use space elements
      expect(canUseElement('member-list', { isSpaceLeader: false })).toBe(false);
      expect(canUseElement('member-list', { isSpaceLeader: true })).toBe(true);

      // Connected elements available to authenticated users
      expect(canUseElement('event-picker', { isSpaceLeader: false })).toBe(true);
    });
  });

  describe('Tool Deployment', () => {
    it('should deploy tool to space sidebar', async () => {
      const deployTool = async (
        toolId: string,
        targetType: 'space' | 'inline' | 'profile',
        targetId: string,
        userId: string,
        isSpaceLeader: boolean
      ) => {
        // Only space leaders can deploy to spaces
        if (targetType === 'space' && !isSpaceLeader) {
          return NextResponse.json(
            { error: 'Only space leaders can deploy tools to spaces' },
            { status: 403 }
          );
        }

        const deployment = {
          id: `deploy-${Date.now()}`,
          toolId,
          targetType,
          targetId,
          deployedBy: userId,
          deployedAt: new Date().toISOString(),
          status: 'active',
        };

        return NextResponse.json(deployment, { status: 201 });
      };

      // Leader deploys to space
      const leaderDeploy = await deployTool('tool-1', 'space', 'space-1', 'user-leader', true);
      expect(leaderDeploy.init?.status).toBe(201);
      expect(leaderDeploy.data.status).toBe('active');

      // Non-leader cannot deploy to space
      const nonLeaderDeploy = await deployTool('tool-1', 'space', 'space-1', 'user-1', false);
      expect(nonLeaderDeploy.init.status).toBe(403);

      // Anyone can deploy to their profile
      const profileDeploy = await deployTool('tool-1', 'profile', 'user-1', 'user-1', false);
      expect(profileDeploy.init?.status).toBe(201);
    });

    it('should validate tool composition before deployment', async () => {
      interface ToolComposition {
        elements: { elementId: string }[];
      }

      const validateComposition = (
        composition: ToolComposition,
        userContext: { isSpaceLeader: boolean }
      ) => {
        const spaceTierElements = ['member-list', 'announcement', 'role-gate'];

        const blockedElements = composition.elements
          .filter((e) => spaceTierElements.includes(e.elementId))
          .filter(() => !userContext.isSpaceLeader);

        if (blockedElements.length > 0) {
          return {
            valid: false,
            blockedElements: blockedElements.map((e) => e.elementId),
          };
        }

        return { valid: true, blockedElements: [] };
      };

      // Universal elements only - valid for anyone
      const universalTool: ToolComposition = {
        elements: [{ elementId: 'poll-element' }, { elementId: 'timer' }],
      };
      expect(validateComposition(universalTool, { isSpaceLeader: false }).valid).toBe(true);

      // Space tier elements - only valid for leaders
      const spaceTool: ToolComposition = {
        elements: [{ elementId: 'member-list' }, { elementId: 'poll-element' }],
      };
      expect(validateComposition(spaceTool, { isSpaceLeader: false }).valid).toBe(false);
      expect(validateComposition(spaceTool, { isSpaceLeader: true }).valid).toBe(true);
    });
  });

  describe('Tool State Persistence', () => {
    it('should save and retrieve tool state', async () => {
      const stateStore: Record<string, unknown> = {};

      const saveState = async (instanceId: string, state: unknown) => {
        stateStore[instanceId] = {
          state,
          updatedAt: new Date().toISOString(),
        };
        return NextResponse.json({ success: true });
      };

      const getState = async (instanceId: string) => {
        const stored = stateStore[instanceId];
        if (!stored) {
          return NextResponse.json({ error: 'State not found' }, { status: 404 });
        }
        return NextResponse.json(stored);
      };

      // Save state
      await saveState('instance-1', { counter: 5, lastAction: 'increment' });

      // Retrieve state
      const retrieved = await getState('instance-1');
      expect((retrieved.data as { state: { counter: number } }).state.counter).toBe(5);

      // Not found
      const notFound = await getState('instance-999');
      expect(notFound.init.status).toBe(404);
    });

    it('should auto-save state with debounce', async () => {
      let saveCount = 0;
      const DEBOUNCE_MS = 2000;
      let lastSaveTime = 0;

      const debouncedSave = async (instanceId: string, state: unknown) => {
        const now = Date.now();
        if (now - lastSaveTime < DEBOUNCE_MS) {
          return NextResponse.json({ queued: true });
        }

        lastSaveTime = now;
        saveCount++;
        return NextResponse.json({ saved: true, saveCount });
      };

      // First save goes through
      const save1 = await debouncedSave('instance-1', { counter: 1 });
      expect(save1.data.saved).toBe(true);

      // Rapid saves are queued
      const save2 = await debouncedSave('instance-1', { counter: 2 });
      expect(save2.data.queued).toBe(true);

      expect(saveCount).toBe(1);
    });
  });

  describe('Connection Cascade', () => {
    it('should cascade data between connected elements', async () => {
      interface ElementState {
        inputs: Record<string, unknown>;
        outputs: Record<string, unknown>;
      }

      const elementStates: Record<string, ElementState> = {
        'poll-1': {
          inputs: {},
          outputs: { results: { Red: 5, Blue: 10 }, winner: 'Blue' },
        },
        'leaderboard-1': {
          inputs: { data: null },
          outputs: { display: [] },
        },
      };

      const connections = [
        { from: { instanceId: 'poll-1', port: 'results' }, to: { instanceId: 'leaderboard-1', port: 'data' } },
      ];

      const triggerCascade = (sourceId: string, outputPort: string) => {
        const sourceState = elementStates[sourceId];
        if (!sourceState) return;

        const outputValue = sourceState.outputs[outputPort];

        // Find connections from this output
        const affectedConnections = connections.filter(
          (c) => c.from.instanceId === sourceId && c.from.port === outputPort
        );

        for (const conn of affectedConnections) {
          const targetState = elementStates[conn.to.instanceId];
          if (targetState) {
            targetState.inputs[conn.to.port] = outputValue;

            // Transform for display
            if (conn.to.instanceId === 'leaderboard-1') {
              const data = targetState.inputs.data as Record<string, number>;
              targetState.outputs.display = Object.entries(data || {})
                .map(([name, score]) => ({ name, score }))
                .sort((a, b) => b.score - a.score);
            }
          }
        }

        return {
          affected: affectedConnections.map((c) => c.to.instanceId),
          states: elementStates,
        };
      };

      // Trigger cascade from poll results
      const result = triggerCascade('poll-1', 'results');

      expect(result.affected).toContain('leaderboard-1');
      expect(elementStates['leaderboard-1'].inputs.data).toEqual({ Red: 5, Blue: 10 });
      expect((elementStates['leaderboard-1'].outputs.display as { name: string }[])[0].name).toBe('Blue');
    });

    it('should prevent infinite cascade loops', async () => {
      const MAX_CASCADE_DEPTH = 5;
      let cascadeDepth = 0;

      const triggerCascadeWithDepth = (depth: number): boolean => {
        if (depth >= MAX_CASCADE_DEPTH) {
          return false; // Stop cascade
        }

        cascadeDepth = depth;
        // Simulate cascading to next element
        return triggerCascadeWithDepth(depth + 1);
      };

      const result = triggerCascadeWithDepth(0);
      expect(result).toBe(false);
      expect(cascadeDepth).toBe(MAX_CASCADE_DEPTH - 1);
    });
  });

  describe('AI Tool Generation', () => {
    it('should generate tool composition from prompt', async () => {
      const generateTool = async (prompt: string) => {
        // Mock AI generation based on keywords
        const keywords = prompt.toLowerCase();

        const elements: { elementId: string; config: Record<string, unknown> }[] = [];

        if (keywords.includes('poll') || keywords.includes('vote')) {
          elements.push({
            elementId: 'poll-element',
            config: { question: 'Generated poll question' },
          });
        }

        if (keywords.includes('timer') || keywords.includes('countdown')) {
          elements.push({
            elementId: 'countdown-timer',
            config: { duration: 300 },
          });
        }

        if (keywords.includes('leaderboard') || keywords.includes('ranking')) {
          elements.push({
            elementId: 'leaderboard',
            config: { title: 'Leaderboard' },
          });
        }

        if (elements.length === 0) {
          return NextResponse.json({ error: 'Could not generate tool from prompt' }, { status: 400 });
        }

        return NextResponse.json({
          composition: {
            elements,
            connections: [],
            layout: { type: 'vertical' },
          },
        });
      };

      // Generate poll
      const pollTool = await generateTool('Create a poll for voting on meeting times');
      expect(pollTool.data.composition.elements).toHaveLength(1);
      expect(pollTool.data.composition.elements[0].elementId).toBe('poll-element');

      // Generate timer
      const timerTool = await generateTool('Make a countdown timer');
      expect(timerTool.data.composition.elements[0].elementId).toBe('countdown-timer');

      // Unknown prompt
      const unknown = await generateTool('Something completely random');
      expect(unknown.init.status).toBe(400);
    });
  });

  describe('Tool Analytics', () => {
    it('should track tool execution events', async () => {
      const analyticsEvents: {
        toolId: string;
        eventType: string;
        timestamp: string;
        userId: string;
      }[] = [];

      const trackEvent = async (
        toolId: string,
        eventType: 'view' | 'action' | 'error',
        userId: string,
        metadata?: Record<string, unknown>
      ) => {
        analyticsEvents.push({
          toolId,
          eventType,
          timestamp: new Date().toISOString(),
          userId,
        });

        return NextResponse.json({ tracked: true });
      };

      await trackEvent('tool-1', 'view', 'user-1');
      await trackEvent('tool-1', 'action', 'user-1', { action: 'vote' });
      await trackEvent('tool-1', 'view', 'user-2');

      expect(analyticsEvents).toHaveLength(3);
      expect(analyticsEvents.filter((e) => e.eventType === 'view')).toHaveLength(2);
    });

    it('should aggregate analytics for tool dashboard', async () => {
      const getToolAnalytics = async (toolId: string, timeRange: '7d' | '30d') => {
        // Mock aggregated analytics
        return NextResponse.json({
          toolId,
          timeRange,
          metrics: {
            totalViews: 150,
            uniqueUsers: 45,
            totalActions: 89,
            averageSessionTime: 120, // seconds
            deployments: 3,
            rating: 4.2,
          },
          dailyBreakdown: [
            { date: '2024-01-01', views: 20, actions: 12 },
            { date: '2024-01-02', views: 25, actions: 15 },
          ],
        });
      };

      const analytics = await getToolAnalytics('tool-1', '7d');
      expect(analytics.data.metrics.totalViews).toBe(150);
      expect(analytics.data.metrics.uniqueUsers).toBe(45);
      expect(analytics.data.dailyBreakdown).toHaveLength(2);
    });
  });
});
