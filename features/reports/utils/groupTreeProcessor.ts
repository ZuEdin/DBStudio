import { GroupLevel, ReportSummary, Field } from '../../../types';

export interface SummaryResult {
  fieldName: string;
  calc: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';
  label: string;
  value: number | string;
}

export interface GroupTreeNode {
  id: string;
  level: number; // 0 = first level, 1 = second level, etc.
  groupFieldId: string;
  fieldLabel: string;
  groupValue: string;
  groupPath: string[];
  items: Record<string, any>[];
  subGroups?: GroupTreeNode[];
  summaries: SummaryResult[];
  totalCount: number;
  config?: GroupLevel;
}

/**
 * Safely extracts a value from a record given multiple candidate keys
 */
export function getRecordFieldValue(
  record: Record<string, any>,
  ...candidateKeys: (string | undefined)[]
): any {
  if (!record) return '';
  for (const key of candidateKeys) {
    if (!key) continue;
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }

  // Case-insensitive and dotted/prefixed fallback
  const recordKeys = Object.keys(record);
  for (const candidate of candidateKeys) {
    if (!candidate) continue;
    const lowerCandidate = candidate.toLowerCase().trim();
    
    // Direct case-insensitive match
    const matchedKey = recordKeys.find((k) => k.toLowerCase().trim() === lowerCandidate);
    if (matchedKey && record[matchedKey] !== undefined && record[matchedKey] !== null) {
      return record[matchedKey];
    }

    // Dotted or underscore table prefix match (e.g. "Mitarbeiter.Geschlecht" -> "Geschlecht")
    const prefixedKey = recordKeys.find((k) => {
      const lowerK = k.toLowerCase().trim();
      return (
        lowerK.endsWith(`.${lowerCandidate}`) ||
        lowerK.endsWith(`_${lowerCandidate}`) ||
        lowerCandidate.endsWith(`.${lowerK}`) ||
        lowerCandidate.endsWith(`_${lowerK}`)
      );
    });
    if (prefixedKey && record[prefixedKey] !== undefined && record[prefixedKey] !== null) {
      return record[prefixedKey];
    }
  }

  return '';
}

/**
 * Calculates aggregates (SUM, COUNT, AVG, MIN, MAX) for a specific slice of records.
 */
export function calculateSliceSummaries(
  items: Record<string, any>[],
  allSummaries: ReportSummary[] = [],
  currentGroupFieldId?: string
): SummaryResult[] {
  const results: SummaryResult[] = [];
  if (!items) return results;

  // Filter summaries relevant to this group level or global summaries
  const applicableSummaries = allSummaries.filter((s) => {
    if (!currentGroupFieldId) return true;
    return !s.groupFieldId || s.groupFieldId === currentGroupFieldId;
  });

  if (applicableSummaries.length === 0) {
    // Default count for slice if no explicit summaries defined
    results.push({
      fieldName: 'Anzahl',
      calc: 'COUNT',
      label: 'Anzahl Datensätze',
      value: items.length,
    });
    return results;
  }

  applicableSummaries.forEach((summary) => {
    const fieldName = summary.fieldName;

    if (summary.calculation === 'COUNT') {
      results.push({
        fieldName,
        calc: 'COUNT',
        label: `Anzahl (${fieldName})`,
        value: items.length,
      });
      return;
    }

    const numericVals = items
      .map((item) => {
        const raw = getRecordFieldValue(item, fieldName, summary.fieldId);
        if (typeof raw === 'number') return raw;
        if (typeof raw === 'string') {
          const parsed = parseFloat(raw.replace(/[^\d.-]/g, '').replace(',', '.'));
          return isNaN(parsed) ? null : parsed;
        }
        return null;
      })
      .filter((v): v is number => v !== null && !isNaN(v));

    if (numericVals.length === 0) {
      results.push({
        fieldName,
        calc: summary.calculation,
        label: `${summary.calculation} (${fieldName})`,
        value: 0,
      });
      return;
    }

    if (summary.calculation === 'SUM') {
      const sum = numericVals.reduce((acc, v) => acc + v, 0);
      results.push({
        fieldName,
        calc: 'SUM',
        label: `Summe (${fieldName})`,
        value: Math.round(sum * 100) / 100,
      });
    } else if (summary.calculation === 'AVG') {
      const avg = numericVals.reduce((acc, v) => acc + v, 0) / numericVals.length;
      results.push({
        fieldName,
        calc: 'AVG',
        label: `Durchschnitt (${fieldName})`,
        value: Math.round(avg * 100) / 100,
      });
    } else if (summary.calculation === 'MIN') {
      const min = Math.min(...numericVals);
      results.push({
        fieldName,
        calc: 'MIN',
        label: `Minimum (${fieldName})`,
        value: min,
      });
    } else if (summary.calculation === 'MAX') {
      const max = Math.max(...numericVals);
      results.push({
        fieldName,
        calc: 'MAX',
        label: `Maximum (${fieldName})`,
        value: max,
      });
    }
  });

  return results;
}

/**
 * Builds a multi-level recursive tree of groups for arbitrary levels (1, 2, 3 ... N).
 * Ensures that subgroup calculations are strictly computed on each subgroup's partition of records!
 */
export function buildMultiLevelGroupTree(
  data: Record<string, any>[],
  groupLevels: GroupLevel[],
  sourceFields: Field[],
  summaries: ReportSummary[] = [],
  groupMethod?: string
): GroupTreeNode[] {
  if (!data || data.length === 0) {
    return [];
  }

  // If no group levels configured, return single root node
  if (!groupLevels || groupLevels.length === 0) {
    return [
      {
        id: 'root_flat',
        level: 0,
        groupFieldId: '',
        fieldLabel: '',
        groupValue: 'Gesamt',
        groupPath: [],
        items: data,
        summaries: calculateSliceSummaries(data, summaries),
        totalCount: data.length,
      },
    ];
  }

  function recurseBuildLevel(
    subset: Record<string, any>[],
    levelIndex: number,
    parentPath: string[]
  ): GroupTreeNode[] {
    if (levelIndex >= groupLevels.length) {
      return [];
    }

    const currentLevelConfig = groupLevels[levelIndex];
    const fieldObj = sourceFields.find(
      (f) =>
        f.id === currentLevelConfig.fieldId ||
        (currentLevelConfig.fieldName && f.name.toLowerCase() === currentLevelConfig.fieldName.toLowerCase())
    );
    const fieldName = fieldObj?.name || currentLevelConfig.fieldName || currentLevelConfig.fieldId;
    const fieldLabel = currentLevelConfig.fieldName || fieldObj?.name || fieldName || `Ebene ${levelIndex + 1}`;

    // Group subset by currentLevelConfig's field value
    const partitionMap: Record<string, Record<string, any>[]> = {};
    subset.forEach((row) => {
      let rawVal = getRecordFieldValue(
        row,
        fieldName,
        fieldObj?.name,
        currentLevelConfig.fieldName,
        currentLevelConfig.fieldId,
        fieldObj?.id
      );
      if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') {
        rawVal = '(Nicht angegeben)';
      }
      let key = String(rawVal).trim();
      if (levelIndex === 0 && groupMethod === 'firstLetter' && key !== '(Nicht angegeben)') {
        key = key.charAt(0).toUpperCase();
      }

      if (!partitionMap[key]) {
        partitionMap[key] = [];
      }
      partitionMap[key].push(row);
    });

    const isDesc = currentLevelConfig.sortOrder === 'desc';
    const sortedKeys = Object.keys(partitionMap).sort((a, b) => {
      if (a === '(Nicht angegeben)') return 1;
      if (b === '(Nicht angegeben)') return -1;
      return isDesc ? b.localeCompare(a, 'de', { numeric: true }) : a.localeCompare(b, 'de', { numeric: true });
    });

    const isLeafLevel = levelIndex === groupLevels.length - 1;

    return sortedKeys.map((key) => {
      const nodeItems = partitionMap[key];
      const currentPath = [...parentPath, key];
      const nodeId = `grp_${levelIndex}_${currentPath.map((p) => encodeURIComponent(p)).join('__')}`;

      const childSubGroups = isLeafLevel
        ? undefined
        : recurseBuildLevel(nodeItems, levelIndex + 1, currentPath);

      // Calculations are strictly isolated to this group / sub-group slice!
      const sliceSummaries = calculateSliceSummaries(nodeItems, summaries, currentLevelConfig.fieldId);

      return {
        id: nodeId,
        level: levelIndex,
        groupFieldId: currentLevelConfig.fieldId,
        fieldLabel,
        groupValue: key,
        groupPath: currentPath,
        items: nodeItems,
        subGroups: childSubGroups,
        summaries: sliceSummaries,
        totalCount: nodeItems.length,
        config: currentLevelConfig,
      };
    });
  }

  return recurseBuildLevel(data, 0, []);
}

/**
 * Flattens the multi-level group tree for tabular exports (Excel, CSV)
 */
export function flattenGroupTreeForExport(
  treeNodes: GroupTreeNode[],
  groupLevels: GroupLevel[],
  columns: { label: string; fieldName: string }[]
): Record<string, any>[] {
  const flattenedRows: Record<string, any>[] = [];

  function traverseNode(node: GroupTreeNode) {
    if (node.subGroups && node.subGroups.length > 0) {
      node.subGroups.forEach(traverseNode);
    } else {
      // Leaf node - export actual record items
      node.items.forEach((item) => {
        const row: Record<string, any> = {};

        // Include Group level breadcrumb values
        node.groupPath.forEach((groupVal, idx) => {
          const grpLevel = groupLevels[idx];
          const colName = `[Gruppe ${idx + 1}] ${grpLevel?.fieldName || `Ebene ${idx + 1}`}`;
          row[colName] = groupVal;
        });

        columns.forEach((col) => {
          row[col.label] = getRecordFieldValue(item, col.fieldName, col.label);
        });

        flattenedRows.push(row);
      });
    }
  }

  treeNodes.forEach(traverseNode);
  return flattenedRows;
}
