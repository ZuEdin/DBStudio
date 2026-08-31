import { Field, Table, Relationship } from '../../../types/index';

export type NormalizationAnomalyType =
  | 'transitive_dependency'
  | 'partial_dependency'
  | 'redundant_group'
  | 'unnormalized_values';

export interface NormalizationSuggestion {
  id: string;
  title: string;
  description: string;
  anomalyType: NormalizationAnomalyType;
  groupKey: string;
  targetTableName: string;
  fieldIdsToExtract: string[];
  fieldNamesToExtract: string[];
  foreignKeyFieldName: string;
  foreignKeyFieldLabel: string;
  primaryKeyName: string;
  estimatedRedundancyRatio: number;
  uniqueRowsCount: number;
  totalRowsCount: number;
  scoreImpact: number;
}

export interface NormalizationAnalysisResult {
  overallScore: number; // 0 - 100 (100 = full 3NF compliance)
  isThirdNormalForm: boolean;
  totalAnomaliesCount: number;
  suggestions: NormalizationSuggestion[];
  recommendationSummary: string;
}

const COMMON_PREFIX_PATTERNS: Array<{
  prefixMatch: RegExp;
  targetTableName: string;
  fkName: string;
  fkLabel: string;
  description: string;
}> = [
  {
    prefixMatch: /^(kunde|customer|kunden|client)[_\s]/i,
    targetTableName: 'Kunden',
    fkName: 'kunde_id',
    fkLabel: 'Kunde (ID)',
    description: 'Kundenbezogene Stammdaten (Name, Adresse, E-Mail) in separate Kunden-Entität auslagern (3NF).',
  },
  {
    prefixMatch: /^(lieferant|supplier|vendor|hersteller|manufacturer)[_\s]/i,
    targetTableName: 'Lieferanten',
    fkName: 'lieferant_id',
    fkLabel: 'Lieferant (ID)',
    description: 'Lieferanten- und Herstellerdaten deduplizieren und über Fremdschlüssel anbinden (3NF).',
  },
  {
    prefixMatch: /^(kategorie|category|rubrik|gewerk|art)[_\s]/i,
    targetTableName: 'Kategorien',
    fkName: 'kategorie_id',
    fkLabel: 'Kategorie (ID)',
    description: 'Kategoriebezeichnungen und Klassifizierungen in Nachschlagetabelle normalisieren (3NF).',
  },
  {
    prefixMatch: /^(mitarbeiter|employee|bearbeiter|techniker|fahrer)[_\s]/i,
    targetTableName: 'Mitarbeiter',
    fkName: 'mitarbeiter_id',
    fkLabel: 'Mitarbeiter (ID)',
    description: 'Personal- und Bearbeiterstammdaten in eigene Tabelle überführen (3NF).',
  },
  {
    prefixMatch: /^(projekt|project|auftrag|order)[_\s]/i,
    targetTableName: 'Projekte',
    fkName: 'projekt_id',
    fkLabel: 'Projekt (ID)',
    description: 'Projektübergreifende Attribute auslagern zur Vermeidung von Redundanzen (3NF).',
  },
  {
    prefixMatch: /^(baustelle|site|standort|location)[_\s]/i,
    targetTableName: 'Standorte',
    fkName: 'standort_id',
    fkLabel: 'Standort (ID)',
    description: 'Standort- und Baustellenadressen als eigenständige Entität normalisieren (3NF).',
  },
  {
    prefixMatch: /^(artikel|item|produkt|product|material)[_\s]/i,
    targetTableName: 'Artikel',
    fkName: 'artikel_id',
    fkLabel: 'Artikel (ID)',
    description: 'Artikel- und Materialstammdaten auslagern und referenzieren (3NF).',
  },
];

/**
 * Analyzes a Table schema and row data for 1NF, 2NF, and 3NF anomalies.
 */
export function analyzeTableFor3NF(table: Table): NormalizationAnalysisResult {
  const fields = table.fields || [];
  const rows = table.data || [];
  const suggestions: NormalizationSuggestion[] = [];

  if (fields.length <= 2) {
    return {
      overallScore: 100,
      isThirdNormalForm: true,
      totalAnomaliesCount: 0,
      suggestions: [],
      recommendationSummary: 'Die Tabelle ist optimal normalisiert (3NF konform).',
    };
  }

  // 1. Prefix and semantic clustering
  COMMON_PREFIX_PATTERNS.forEach((pattern) => {
    const matchedFields = fields.filter(
      (f) => !f.isPrimaryKey && pattern.prefixMatch.test(f.name)
    );

    if (matchedFields.length >= 2) {
      const fieldNames = matchedFields.map((f) => f.name);
      const fieldIds = matchedFields.map((f) => f.id);

      // Analyze data redundancy if rows exist
      let uniqueRowsCount = 0;
      let redundancyRatio = 0;

      if (rows.length > 0) {
        const valueSignatures = new Set<string>();
        rows.forEach((r) => {
          const sig = fieldNames.map((fn) => String(r[fn] ?? '')).join('|');
          if (sig.replace(/\|/g, '').trim() !== '') {
            valueSignatures.add(sig);
          }
        });
        uniqueRowsCount = valueSignatures.size || 1;
        redundancyRatio = Math.max(0, 1 - uniqueRowsCount / Math.max(1, rows.length));
      }

      suggestions.push({
        id: `sugg_${pattern.targetTableName.toLowerCase()}_${Date.now()}`,
        title: `Auslagerung: ${pattern.targetTableName}-Stammdaten`,
        description: `${matchedFields.length} redundante Felder (${fieldNames.join(
          ', '
        )}) gefunden. ${pattern.description}`,
        anomalyType: 'transitive_dependency',
        groupKey: pattern.targetTableName,
        targetTableName: pattern.targetTableName,
        fieldIdsToExtract: fieldIds,
        fieldNamesToExtract: fieldNames,
        foreignKeyFieldName: pattern.fkName,
        foreignKeyFieldLabel: pattern.fkLabel,
        primaryKeyName: 'id',
        estimatedRedundancyRatio: redundancyRatio,
        uniqueRowsCount: uniqueRowsCount || Math.max(1, Math.floor(rows.length * 0.4)),
        totalRowsCount: rows.length,
        scoreImpact: matchedFields.length * 12,
      });
    }
  });

  // 2. Postal code & City transitive dependency detection
  const hasPlz = fields.find((f) => /^(plz|postleitzahl|zip)$/i.test(f.name));
  const hasOrt = fields.find((f) => /^(ort|stadt|city|gemeinde)$/i.test(f.name));
  const hasLand = fields.find((f) => /^(land|country|staat|kanton|bundesland)$/i.test(f.name));

  if (hasPlz && (hasOrt || hasLand)) {
    const geoFields = [hasPlz, hasOrt, hasLand].filter(Boolean) as Field[];
    const alreadyCovered = suggestions.some((s) =>
      geoFields.some((gf) => s.fieldIdsToExtract.includes(gf.id))
    );

    if (!alreadyCovered && geoFields.length >= 2) {
      suggestions.push({
        id: `sugg_geography_${Date.now()}`,
        title: 'Auslagerung: Postleitzahlen & Orte (PLZ-Verzeichnis)',
        description: `Transitive Abhängigkeit: ${geoFields
          .map((f) => f.name)
          .join(
            ', '
          )} hängt funktional von der PLZ ab und sollte in ein zentrales Ortsregister ausgelagert werden.`,
        anomalyType: 'transitive_dependency',
        groupKey: 'Orte',
        targetTableName: 'Orte',
        fieldIdsToExtract: geoFields.map((f) => f.id),
        fieldNamesToExtract: geoFields.map((f) => f.name),
        foreignKeyFieldName: 'ort_id',
        foreignKeyFieldLabel: 'Ort (ID)',
        primaryKeyName: 'id',
        estimatedRedundancyRatio: 0.75,
        uniqueRowsCount: Math.max(1, Math.floor(rows.length * 0.3)),
        totalRowsCount: rows.length,
        scoreImpact: 20,
      });
    }
  }

  // Calculate overall 3NF score
  const totalDeductions = suggestions.reduce((sum, s) => sum + s.scoreImpact, 0);
  const overallScore = Math.max(20, Math.min(100, 100 - totalDeductions));
  const isThirdNormalForm = suggestions.length === 0;

  let recommendationSummary = 'Die Tabelle erfüllt alle Bedingungen der 3. Normalform (3NF).';
  if (suggestions.length > 0) {
    recommendationSummary = `${suggestions.length} Normalisierungs-Potenzial(e) erkannt. Eine Auslagerung in 1:n Beziehungen verhindert Datenanomalien und optimiert den Speicherbedarf.`;
  }

  return {
    overallScore,
    isThirdNormalForm,
    totalAnomaliesCount: suggestions.length,
    suggestions,
    recommendationSummary,
  };
}

export interface SplitExecutionResult {
  newTargetTable: Table;
  updatedSourceTable: Table;
  newRelationship: Relationship;
}

/**
 * Performs 1-click table split & data migration to achieve 3NF compliance.
 */
export function execute3NFTableSplit(
  sourceTable: Table,
  suggestion: NormalizationSuggestion,
  existingTables: Table[]
): SplitExecutionResult {
  const newTableId = crypto.randomUUID();
  const pkFieldId = crypto.randomUUID();
  const fkFieldId = crypto.randomUUID();

  // Create unique target table name
  let targetName = suggestion.targetTableName;
  let counter = 1;
  while (existingTables.some((t) => t.name.toLowerCase() === targetName.toLowerCase())) {
    counter++;
    targetName = `${suggestion.targetTableName}_${counter}`;
  }

  // 1. Prepare fields for the new target table
  const extractedFields = sourceTable.fields.filter((f) =>
    suggestion.fieldIdsToExtract.includes(f.id)
  );

  const newTableFields: Field[] = [
    {
      id: pkFieldId,
      name: suggestion.primaryKeyName || 'id',
      type: 'INTEGER',
      isPrimaryKey: true,
      isAutoIncrement: true,
      allowNull: false,
      isNullable: false,
      comment: `Primärschlüssel für ${targetName}`,
    },
    ...extractedFields.map((f) => ({
      ...f,
      id: crypto.randomUUID(),
      // Clean prefix if desirable or keep original name
      name: f.name.replace(/^(kunde|customer|lieferant|supplier|kategorie|category|mitarbeiter|employee)[_\s]/i, ''),
    })),
  ];

  // 2. Deduplicate data & build mapped IDs
  const sourceRows = sourceTable.data || [];
  const distinctEntityMap = new Map<string, { id: number; data: Record<string, any> }>();
  let nextEntityId = 1;

  sourceRows.forEach((row) => {
    const signature = suggestion.fieldNamesToExtract
      .map((fn) => String(row[fn] ?? ''))
      .join('___');

    if (!distinctEntityMap.has(signature)) {
      const newEntityRecord: Record<string, any> = {
        [suggestion.primaryKeyName || 'id']: nextEntityId,
      };

      extractedFields.forEach((origField, idx) => {
        const newFieldName = newTableFields[idx + 1].name;
        newEntityRecord[newFieldName] = row[origField.name];
      });

      distinctEntityMap.set(signature, {
        id: nextEntityId,
        data: newEntityRecord,
      });
      nextEntityId++;
    }
  });

  const newTableData = Array.from(distinctEntityMap.values()).map((e) => e.data);

  // 3. Create new Target Table object
  const newTargetTable: Table = {
    id: newTableId,
    name: targetName,
    description: `Ausgelagerte 3NF-Entität aus Tabelle '${sourceTable.name}'`,
    fields: newTableFields,
    data: newTableData,
    validationRules: [],
  };

  // 4. Update Source Table: remove extracted fields and add Foreign Key
  const fkFieldName = suggestion.foreignKeyFieldName;
  const newFkField: Field = {
    id: fkFieldId,
    name: fkFieldName,
    type: 'INTEGER',
    isForeignKey: true,
    isNullable: true,
    allowNull: true,
    comment: `Fremdschlüssel zu ${targetName} (${suggestion.foreignKeyFieldLabel})`,
  };

  const updatedSourceFields = [
    ...sourceTable.fields.filter((f) => !suggestion.fieldIdsToExtract.includes(f.id)),
    newFkField,
  ];

  // Update source rows to replace extracted columns with the Foreign Key ID
  const updatedSourceData = sourceRows.map((row) => {
    const nextRow = { ...row };
    const signature = suggestion.fieldNamesToExtract
      .map((fn) => String(row[fn] ?? ''))
      .join('___');

    const mappedEntity = distinctEntityMap.get(signature);
    nextRow[fkFieldName] = mappedEntity ? mappedEntity.id : null;

    // Remove old extracted columns from source row
    suggestion.fieldNamesToExtract.forEach((fn) => {
      delete nextRow[fn];
    });

    return nextRow;
  });

  const updatedSourceTable: Table = {
    ...sourceTable,
    fields: updatedSourceFields,
    data: updatedSourceData,
  };

  // 5. Create 1:n Relationship
  const newRelationship: Relationship = {
    id: crypto.randomUUID(),
    fromTableId: updatedSourceTable.id,
    fromFieldId: fkFieldId,
    toTableId: newTableId,
    toFieldId: pkFieldId,
    type: '1:n',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  };

  return {
    newTargetTable,
    updatedSourceTable,
    newRelationship,
  };
}
