/**
 * DAG (Directed Acyclic Graph) Utilities for HiveLab
 *
 * Provides graph analysis for element connections:
 * - Cycle detection
 * - Topological sorting (execution order)
 * - Dependency analysis
 */

import type { Connection } from '../../components/hivelab/ide/types';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface DAGNode {
  id: string;
  incomingEdges: string[];  // IDs of nodes that connect TO this node
  outgoingEdges: string[];  // IDs of nodes this node connects TO
}

export interface DAGAnalysis {
  /** Whether the graph is a valid DAG (no cycles) */
  isValid: boolean;
  /** Nodes in topological order (root to leaf) */
  executionOrder: string[];
  /** Nodes involved in cycles (empty if valid DAG) */
  cycleNodes: string[];
  /** Map of node -> nodes it depends on */
  dependencies: Map<string, Set<string>>;
  /** Map of node -> nodes that depend on it */
  dependents: Map<string, Set<string>>;
  /** Nodes with no incoming connections (entry points) */
  rootNodes: string[];
  /** Nodes with no outgoing connections (terminal nodes) */
  leafNodes: string[];
}

export interface ExecutionPlan {
  /** Phases of execution (nodes in same phase can run in parallel) */
  phases: string[][];
  /** Total number of nodes to execute */
  totalNodes: number;
  /** Nodes that should be skipped (in cycles or unreachable) */
  skippedNodes: string[];
}

// ═══════════════════════════════════════════════════════════════════
// GRAPH CONSTRUCTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Build a DAG from connections
 */
export function buildDAG(
  connections: Connection[],
  nodeIds: string[]
): Map<string, DAGNode> {
  const graph = new Map<string, DAGNode>();

  // Initialize all nodes
  for (const id of nodeIds) {
    graph.set(id, {
      id,
      incomingEdges: [],
      outgoingEdges: [],
    });
  }

  // Add edges from connections
  for (const conn of connections) {
    const fromNode = graph.get(conn.from.instanceId);
    const toNode = graph.get(conn.to.instanceId);

    if (fromNode && toNode) {
      if (!fromNode.outgoingEdges.includes(conn.to.instanceId)) {
        fromNode.outgoingEdges.push(conn.to.instanceId);
      }
      if (!toNode.incomingEdges.includes(conn.from.instanceId)) {
        toNode.incomingEdges.push(conn.from.instanceId);
      }
    }
  }

  return graph;
}

// ═══════════════════════════════════════════════════════════════════
// CYCLE DETECTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Detect cycles in the graph using DFS
 * Returns array of node IDs that are part of cycles
 */
export function detectCycles(graph: Map<string, DAGNode>): string[] {
  const WHITE = 0; // Not visited
  const GRAY = 1;  // In current DFS path
  const BLACK = 2; // Fully processed

  const colors = new Map<string, number>();
  const cycleNodes = new Set<string>();

  // Initialize all nodes as white
  for (const [id] of graph) {
    colors.set(id, WHITE);
  }

  function dfs(nodeId: string, path: Set<string>): boolean {
    colors.set(nodeId, GRAY);
    path.add(nodeId);

    const node = graph.get(nodeId);
    if (!node) return false;

    for (const neighborId of node.outgoingEdges) {
      const neighborColor = colors.get(neighborId);

      if (neighborColor === GRAY) {
        // Found a back edge - this is a cycle
        // Mark all nodes in current path as cycle nodes
        path.forEach((id) => cycleNodes.add(id));
        cycleNodes.add(neighborId);
        return true;
      }

      if (neighborColor === WHITE) {
        if (dfs(neighborId, path)) {
          return true;
        }
      }
    }

    colors.set(nodeId, BLACK);
    path.delete(nodeId);
    return false;
  }

  // Run DFS from each unvisited node
  for (const [id] of graph) {
    if (colors.get(id) === WHITE) {
      dfs(id, new Set());
    }
  }

  return Array.from(cycleNodes);
}

/**
 * Check if graph has cycles
 */
export function hasCycles(graph: Map<string, DAGNode>): boolean {
  return detectCycles(graph).length > 0;
}

// ═══════════════════════════════════════════════════════════════════
// TOPOLOGICAL SORT
// ═══════════════════════════════════════════════════════════════════

/**
 * Perform topological sort using Kahn's algorithm
 * Returns null if graph has cycles
 */
export function topologicalSort(graph: Map<string, DAGNode>): string[] | null {
  // Calculate in-degree for each node
  const inDegree = new Map<string, number>();
  for (const [id, node] of graph) {
    inDegree.set(id, node.incomingEdges.length);
  }

  // Find all nodes with no incoming edges
  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) {
      queue.push(id);
    }
  }

  const result: string[] = [];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    result.push(nodeId);

    const node = graph.get(nodeId);
    if (!node) continue;

    // Reduce in-degree for all neighbors
    for (const neighborId of node.outgoingEdges) {
      const newDegree = (inDegree.get(neighborId) || 0) - 1;
      inDegree.set(neighborId, newDegree);

      if (newDegree === 0) {
        queue.push(neighborId);
      }
    }
  }

  // If we didn't process all nodes, there's a cycle
  if (result.length !== graph.size) {
    return null;
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════
// DEPENDENCY ANALYSIS
// ═══════════════════════════════════════════════════════════════════

/**
 * Get all transitive dependencies of a node
 */
export function getTransitiveDependencies(
  graph: Map<string, DAGNode>,
  nodeId: string
): Set<string> {
  const dependencies = new Set<string>();
  const visited = new Set<string>();

  function dfs(currentId: string) {
    if (visited.has(currentId)) return;
    visited.add(currentId);

    const node = graph.get(currentId);
    if (!node) return;

    for (const depId of node.incomingEdges) {
      dependencies.add(depId);
      dfs(depId);
    }
  }

  dfs(nodeId);
  return dependencies;
}

/**
 * Get all transitive dependents of a node (nodes that depend on this one)
 */
export function getTransitiveDependents(
  graph: Map<string, DAGNode>,
  nodeId: string
): Set<string> {
  const dependents = new Set<string>();
  const visited = new Set<string>();

  function dfs(currentId: string) {
    if (visited.has(currentId)) return;
    visited.add(currentId);

    const node = graph.get(currentId);
    if (!node) return;

    for (const depId of node.outgoingEdges) {
      dependents.add(depId);
      dfs(depId);
    }
  }

  dfs(nodeId);
  return dependents;
}

// ═══════════════════════════════════════════════════════════════════
// FULL ANALYSIS
// ═══════════════════════════════════════════════════════════════════

/**
 * Perform complete DAG analysis
 */
export function analyzeDAG(connections: Connection[], nodeIds: string[]): DAGAnalysis {
  const graph = buildDAG(connections, nodeIds);
  const cycleNodes = detectCycles(graph);
  const isValid = cycleNodes.length === 0;
  const executionOrder = isValid ? topologicalSort(graph) || [] : [];

  // Build dependency maps
  const dependencies = new Map<string, Set<string>>();
  const dependents = new Map<string, Set<string>>();

  for (const [id] of graph) {
    dependencies.set(id, getTransitiveDependencies(graph, id));
    dependents.set(id, getTransitiveDependents(graph, id));
  }

  // Find root and leaf nodes
  const rootNodes: string[] = [];
  const leafNodes: string[] = [];

  for (const [id, node] of graph) {
    if (node.incomingEdges.length === 0) {
      rootNodes.push(id);
    }
    if (node.outgoingEdges.length === 0) {
      leafNodes.push(id);
    }
  }

  return {
    isValid,
    executionOrder,
    cycleNodes,
    dependencies,
    dependents,
    rootNodes,
    leafNodes,
  };
}

// ═══════════════════════════════════════════════════════════════════
// EXECUTION PLANNING
// ═══════════════════════════════════════════════════════════════════

/**
 * Generate an execution plan with parallel phases
 *
 * Nodes in the same phase have no dependencies on each other
 * and can theoretically be executed in parallel.
 */
export function generateExecutionPlan(
  connections: Connection[],
  nodeIds: string[]
): ExecutionPlan {
  const graph = buildDAG(connections, nodeIds);
  const cycleNodes = detectCycles(graph);

  if (cycleNodes.length > 0) {
    // Remove cycle nodes and generate plan for remaining nodes
    const validNodeIds = nodeIds.filter((id) => !cycleNodes.includes(id));
    const validConnections = connections.filter(
      (conn) =>
        !cycleNodes.includes(conn.from.instanceId) &&
        !cycleNodes.includes(conn.to.instanceId)
    );
    const validGraph = buildDAG(validConnections, validNodeIds);
    return generatePlanFromGraph(validGraph, cycleNodes);
  }

  return generatePlanFromGraph(graph, []);
}

function generatePlanFromGraph(
  graph: Map<string, DAGNode>,
  skippedNodes: string[]
): ExecutionPlan {
  const phases: string[][] = [];
  const remaining = new Set(graph.keys());
  const executed = new Set<string>();

  while (remaining.size > 0) {
    // Find all nodes whose dependencies have been executed
    const phase: string[] = [];

    for (const nodeId of remaining) {
      const node = graph.get(nodeId);
      if (!node) continue;

      // Check if all dependencies are satisfied
      const allDependenciesMet = node.incomingEdges.every(
        (depId) => executed.has(depId) || !remaining.has(depId)
      );

      if (allDependenciesMet) {
        phase.push(nodeId);
      }
    }

    if (phase.length === 0) {
      // No progress made - remaining nodes have unsatisfied dependencies
      // This shouldn't happen if we've removed cycles properly
      break;
    }

    // Add phase and mark nodes as executed
    phases.push(phase);
    for (const nodeId of phase) {
      remaining.delete(nodeId);
      executed.add(nodeId);
    }
  }

  return {
    phases,
    totalNodes: graph.size,
    skippedNodes,
  };
}

// ═══════════════════════════════════════════════════════════════════
// AFFECTED NODES
// ═══════════════════════════════════════════════════════════════════

/**
 * Get all nodes that would be affected if a source node's output changes
 * Returns nodes in execution order (topologically sorted)
 */
export function getAffectedNodes(
  connections: Connection[],
  nodeIds: string[],
  sourceNodeId: string
): string[] {
  const graph = buildDAG(connections, nodeIds);
  const dependents = getTransitiveDependents(graph, sourceNodeId);

  // Get these dependents in topological order
  const order = topologicalSort(graph);
  if (!order) return Array.from(dependents);

  return order.filter((id) => dependents.has(id));
}

/**
 * Get nodes that need to be executed before a target node
 */
export function getRequiredNodes(
  connections: Connection[],
  nodeIds: string[],
  targetNodeId: string
): string[] {
  const graph = buildDAG(connections, nodeIds);
  const dependencies = getTransitiveDependencies(graph, targetNodeId);

  // Get dependencies in topological order
  const order = topologicalSort(graph);
  if (!order) return Array.from(dependencies);

  return order.filter((id) => dependencies.has(id));
}
