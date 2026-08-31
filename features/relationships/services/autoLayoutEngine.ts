import { Table, TableNode, Relationship } from '../../../types/index';
import { LayoutDirection, LayoutOptions } from '../types/erDesignerTypes';

export interface LayoutResult {
  nodes: TableNode[];
}

/**
 * High-performance hierarchical DAG auto-layout algorithm for ER diagrams
 */
export function calculateAutoLayout(
  tables: Table[],
  relationships: Relationship[],
  currentNodes: TableNode[],
  options: Partial<LayoutOptions> = {}
): LayoutResult {
  const direction: LayoutDirection = options.direction || 'TB';
  const nodeSep = options.nodeSep || 80;
  const rankSep = options.rankSep || 120;
  const isHorizontal = direction === 'LR' || direction === 'RL';

  if (tables.length === 0) {
    return { nodes: [] };
  }

  // 1. Build Adjacency Graph and in-degree map
  const tableIds = tables.map(t => t.id);
  const inDegree: Record<string, number> = {};
  const adjList: Record<string, string[]> = {};
  const revAdjList: Record<string, string[]> = {};

  tableIds.forEach(id => {
    inDegree[id] = 0;
    adjList[id] = [];
    revAdjList[id] = [];
  });

  relationships.forEach(rel => {
    if (adjList[rel.fromTableId] && adjList[rel.toTableId]) {
      // fromTable -> toTable (parent -> child)
      if (!adjList[rel.fromTableId].includes(rel.toTableId)) {
        adjList[rel.fromTableId].push(rel.toTableId);
        revAdjList[rel.toTableId].push(rel.fromTableId);
        inDegree[rel.toTableId] = (inDegree[rel.toTableId] || 0) + 1;
      }
    }
  });

  // 2. Assign Ranks using Topological / Longest Path Leveling
  const ranks: Record<string, number> = {};
  const visited = new Set<string>();

  // Find roots (in-degree === 0)
  const roots = tableIds.filter(id => (inDegree[id] || 0) === 0);
  const queue: Array<{ id: string; rank: number }> = roots.length > 0
    ? roots.map(id => ({ id, rank: 0 }))
    : [{ id: tableIds[0], rank: 0 }];

  queue.forEach(item => {
    ranks[item.id] = item.rank;
    visited.add(item.id);
  });

  let maxRank = 0;

  while (queue.length > 0) {
    const { id, rank } = queue.shift()!;
    maxRank = Math.max(maxRank, rank);

    const neighbors = adjList[id] || [];
    for (const neighbor of neighbors) {
      const nextRank = rank + 1;
      if (!visited.has(neighbor) || (ranks[neighbor] || 0) < nextRank) {
        ranks[neighbor] = nextRank;
        visited.add(neighbor);
        queue.push({ id: neighbor, rank: nextRank });
      }
    }
  }

  // Handle any disconnected or cyclic components
  tableIds.forEach(id => {
    if (ranks[id] === undefined) {
      ranks[id] = 0;
    }
  });

  // 3. Group tables by rank
  const rankGroups: Record<number, string[]> = {};
  tableIds.forEach(id => {
    const rank = ranks[id] || 0;
    if (!rankGroups[rank]) {
      rankGroups[rank] = [];
    }
    rankGroups[rank].push(id);
  });

  // 4. Sort within rank to minimize crossings (barycenter heuristic)
  const sortedRanks = Object.keys(rankGroups).map(Number).sort((a, b) => a - b);
  
  for (let i = 1; i < sortedRanks.length; i++) {
    const r = sortedRanks[i];
    const prevRank = sortedRanks[i - 1];
    const prevOrder = rankGroups[prevRank];

    rankGroups[r].sort((a, b) => {
      const aParents = revAdjList[a] || [];
      const bParents = revAdjList[b] || [];

      const aAvgPos = aParents.length > 0
        ? aParents.reduce((sum, p) => sum + Math.max(0, prevOrder.indexOf(p)), 0) / aParents.length
        : 0;
      const bAvgPos = bParents.length > 0
        ? bParents.reduce((sum, p) => sum + Math.max(0, prevOrder.indexOf(p)), 0) / bParents.length
        : 0;

      return aAvgPos - bAvgPos;
    });
  }

  // 5. Estimate dimensions of each table card
  const tableDimensions: Record<string, { width: number; height: number }> = {};
  tables.forEach(table => {
    const fieldCount = table.fields.length || 1;
    // Base width 260px, Header 48px, Each field 32px, Footer padding 16px
    tableDimensions[table.id] = {
      width: 260,
      height: 48 + fieldCount * 32 + 16
    };
  });

  // 6. Compute absolute coordinates
  const newPositions: Record<string, { x: number; y: number }> = {};
  const startX = 60;
  const startY = 80;

  if (direction === 'TB') {
    let currentY = startY;
    sortedRanks.forEach(rank => {
      const nodesInRank = rankGroups[rank];
      const totalWidth = nodesInRank.reduce((sum, id) => sum + tableDimensions[id].width, 0) + (nodesInRank.length - 1) * nodeSep;
      
      let currentX = Math.max(startX, 600 - totalWidth / 2);
      let maxRankHeight = 0;

      nodesInRank.forEach(id => {
        newPositions[id] = {
          x: Math.round(currentX / 20) * 20,
          y: Math.round(currentY / 20) * 20
        };
        const dim = tableDimensions[id];
        currentX += dim.width + nodeSep;
        maxRankHeight = Math.max(maxRankHeight, dim.height);
      });

      currentY += maxRankHeight + rankSep;
    });
  } else if (direction === 'LR') {
    let currentX = startX;
    sortedRanks.forEach(rank => {
      const nodesInRank = rankGroups[rank];
      const totalHeight = nodesInRank.reduce((sum, id) => sum + tableDimensions[id].height, 0) + (nodesInRank.length - 1) * nodeSep;

      let currentY = Math.max(startY, 400 - totalHeight / 2);
      let maxRankWidth = 0;

      nodesInRank.forEach(id => {
        newPositions[id] = {
          x: Math.round(currentX / 20) * 20,
          y: Math.round(currentY / 20) * 20
        };
        const dim = tableDimensions[id];
        currentY += dim.height + nodeSep;
        maxRankWidth = Math.max(maxRankWidth, dim.width);
      });

      currentX += maxRankWidth + rankSep;
    });
  }

  // Map to TableNode structure preserving groupIds
  const updatedNodes: TableNode[] = tables.map(table => {
    const existingNode = currentNodes.find(n => n.tableId === table.id);
    const computedPos = newPositions[table.id] || { x: 100, y: 100 };

    return {
      id: existingNode ? existingNode.id : crypto.randomUUID(),
      tableId: table.id,
      x: computedPos.x,
      y: computedPos.y,
      groupId: existingNode?.groupId
    };
  });

  return { nodes: updatedNodes };
}

export const AutoLayoutEngine = {
  calculateAutoLayout
};
