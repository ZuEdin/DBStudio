import { Table, Relationship, Field } from '../../../types/index';
import { LinterIssue, LinterReport, NormalizationSuggestion } from '../types/erDesignerTypes';

export class SchemaLinterService {
  /**
   * Run full schema analysis and return a complete diagnostic report with score and issues
   */
  public static analyzeSchema(tables: Table[], relationships: Relationship[]): LinterReport {
    const issues: LinterIssue[] = [];

    // 1. Missing Primary Key Check
    tables.forEach(table => {
      const pkFields = table.fields.filter(f => f.isPrimaryKey);
      if (pkFields.length === 0) {
        issues.push({
          id: `pk-missing-${table.id}`,
          code: 'ERR_NO_PRIMARY_KEY',
          severity: 'error',
          title: `Kein Primärschlüssel in Tabelle "${table.name}"`,
          description: `Die Tabelle "${table.name}" besitzt keinen Primärschlüssel. Dies verhindert eindeutige Identifizierung, beschädigt Replikationen und bremst relationale Lookups.`,
          tableId: table.id,
          tableName: table.name,
          recommendation: 'Fügen Sie ein Primärschlüsselfeld "id" (Typ UUID oder INTEGER mit Auto-Increment) hinzu.',
          quickFixType: 'add_pk'
        });
      }
    });

    // 2. Missing Foreign Key Index Check (Performance bottleneck)
    relationships.forEach(rel => {
      const childTable = tables.find(t => t.id === rel.toTableId);
      const childField = childTable?.fields.find(f => f.id === rel.toFieldId);

      if (childTable && childField) {
        const isIndexed = childField.isIndexed || childField.isUnique || childField.isPrimaryKey;
        if (!isIndexed) {
          issues.push({
            id: `fk-no-index-${rel.id}`,
            code: 'WARN_FK_NOT_INDEXED',
            severity: 'warning',
            title: `Fehlender Index auf Fremdschlüssel "${childTable.name}.${childField.name}"`,
            description: `Die Spalte "${childField.name}" referenziert eine Elterntabelle, besitzt aber keinen Index. Bei JOINs und CASCADE DELETE führt dies zu teuren Sequential Scans (Full Table Scans).`,
            tableId: childTable.id,
            tableName: childTable.name,
            fieldId: childField.id,
            fieldName: childField.name,
            recommendation: `Erstellen Sie einen Index auf "${childTable.name}.${childField.name}".`,
            quickFixType: 'add_index'
          });
        }
      }
    });

    // 3. Type Inconsistency Check between PK and FK
    relationships.forEach(rel => {
      const parentTable = tables.find(t => t.id === rel.fromTableId);
      const parentField = parentTable?.fields.find(f => f.id === rel.fromFieldId);
      const childTable = tables.find(t => t.id === rel.toTableId);
      const childField = childTable?.fields.find(f => f.id === rel.toFieldId);

      if (parentField && childField) {
        const pType = parentField.type.toUpperCase();
        const cType = childField.type.toUpperCase();

        const areCompatible = 
          pType === cType ||
          (pType === 'ID' && (cType === 'INTEGER' || cType === 'INT' || cType === 'BIGINT' || cType === 'UUID')) ||
          (cType === 'ID' && (pType === 'INTEGER' || pType === 'INT' || pType === 'BIGINT' || pType === 'UUID')) ||
          ((pType === 'INT' || pType === 'INTEGER') && (cType === 'INT' || cType === 'INTEGER')) ||
          ((pType === 'VARCHAR' || pType === 'TEXT' || pType === 'CHAR') && (cType === 'VARCHAR' || cType === 'TEXT' || cType === 'CHAR'));

        if (!areCompatible) {
          issues.push({
            id: `type-mismatch-${rel.id}`,
            code: 'ERR_TYPE_MISMATCH',
            severity: 'error',
            title: `Datentyp-Inkonsistenz in Relation`,
            description: `Fremdschlüssel "${childTable?.name}.${childField.name}" (${cType}) hat einen anderen Typ als der referenzierte Primärschlüssel "${parentTable?.name}.${parentField.name}" (${pType}).`,
            tableId: childTable?.id,
            tableName: childTable?.name,
            fieldId: childField.id,
            fieldName: childField.name,
            recommendation: `Passen Sie den Typ von "${childField.name}" an "${pType}" an.`,
            quickFixType: 'align_types'
          });
        }
      }
    });

    // 4. Audit Fields Completeness Check
    tables.forEach(table => {
      if (table.isApiImport) return;
      const fieldNames = table.fields.map(f => f.name.toLowerCase());
      const hasCreatedAt = fieldNames.some(n => n === 'created_at' || n === 'erstellt_am' || n === 'creation_date');
      const hasUpdatedAt = fieldNames.some(n => n === 'updated_at' || n === 'geaendert_am' || n === 'modification_date');

      if (!hasCreatedAt || !hasUpdatedAt) {
        issues.push({
          id: `audit-missing-${table.id}`,
          code: 'INFO_MISSING_AUDIT',
          severity: 'info',
          title: `Fehlende Zeitstempel-Auditspalten in "${table.name}"`,
          description: `Die Tabelle verfügt nicht über standardmäßige Audit-Felder (created_at, updated_at). Diese sind für Revisionssicherheit, Synchronisation und Caching essenziell.`,
          tableId: table.id,
          tableName: table.name,
          recommendation: 'Fügen Sie created_at und updated_at (Typ TIMESTAMP) hinzu.',
          quickFixType: 'add_audit_fields'
        });
      }
    });

    // 5. Naming Convention Consistency Check
    const tableNamingStyles = tables.map(t => {
      if (t.name.includes('_')) return 'snake_case';
      if (/^[A-Z][a-zA-Z0-9]*$/.test(t.name)) return 'PascalCase';
      if (/^[a-z][a-zA-Z0-9]*$/.test(t.name)) return 'camelCase';
      return 'other';
    });

    const snakeCount = tableNamingStyles.filter(s => s === 'snake_case').length;
    const pascalCount = tableNamingStyles.filter(s => s === 'PascalCase').length;
    const camelCount = tableNamingStyles.filter(s => s === 'camelCase').length;
    const dominantStyle = snakeCount >= pascalCount && snakeCount >= camelCount ? 'snake_case' : (pascalCount >= camelCount ? 'PascalCase' : 'camelCase');

    tables.forEach(t => {
      const isSnake = t.name.includes('_');
      const isPascal = /^[A-Z][a-zA-Z0-9]*$/.test(t.name);
      const isCamel = /^[a-z][a-zA-Z0-9]*$/.test(t.name);

      if (dominantStyle === 'snake_case' && !isSnake && (isPascal || isCamel) && tables.length > 2) {
        issues.push({
          id: `naming-${t.id}`,
          code: 'INFO_NAMING_CONVENTION',
          severity: 'info',
          title: `Uneinheitliche Tabellenbenennung: "${t.name}"`,
          description: `Das Projekt verwendet überwiegend snake_case. "${t.name}" weicht von der Konvention ab.`,
          tableId: t.id,
          tableName: t.name,
          recommendation: `Benennen Sie "${t.name}" in snake_case um.`
        });
      }
    });

    // 6. Calculate Overall Schema Health Score (100 Max)
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warnCount = issues.filter(i => i.severity === 'warning').length;
    const infoCount = issues.filter(i => i.severity === 'info').length;

    let score = 100 - (errorCount * 25) - (warnCount * 10) - (infoCount * 2);
    score = Math.max(0, Math.min(100, score));

    return {
      score,
      issues,
      checkedAt: new Date().toLocaleTimeString(),
      summary: {
        errors: errorCount,
        warnings: warnCount,
        infos: infoCount
      }
    };
  }

  /**
   * Analyzes potential database normalization violations (1NF, 2NF, 3NF)
   */
  public static analyzeNormalization(tables: Table[], relationships: Relationship[]): NormalizationSuggestion[] {
    const suggestions: NormalizationSuggestion[] = [];

    tables.forEach(table => {
      // Check 1NF: Repeating columns (e.g. telefon_1, telefon_2, email_1, email_2, tag1, tag2)
      const fieldNames = table.fields.map(f => f.name.toLowerCase());
      const repeatingPatterns: Record<string, string[]> = {};

      fieldNames.forEach(name => {
        const match = name.match(/^([a-zA-Z_]+)[_]?([0-9]+)$/);
        if (match) {
          const prefix = match[1];
          if (!repeatingPatterns[prefix]) repeatingPatterns[prefix] = [];
          repeatingPatterns[prefix].push(name);
        }
      });

      Object.entries(repeatingPatterns).forEach(([prefix, matchedFields]) => {
        if (matchedFields.length > 1) {
          suggestions.push({
            id: `1nf-repeat-${table.id}-${prefix}`,
            level: '1NF',
            tableId: table.id,
            tableName: table.name,
            fieldNames: matchedFields,
            reason: `Die Felder [${matchedFields.join(', ')}] deuten auf eine Wiederholungsgruppe hin (1NF Verletzung).`,
            proposal: `Erstellen Sie eine separate Detailtabelle "${table.name}_${prefix}s" mit Fremdschlüssel zu "${table.name}" (1:n Beziehung).`,
            suggestedNewTable: {
              name: `${table.name}_${prefix}s`,
              fields: [
                { name: 'id', type: 'UUID', isPrimaryKey: true },
                { name: `${table.name.toLowerCase()}_id`, type: 'UUID' },
                { name: 'value', type: 'VARCHAR' },
                { name: 'type', type: 'VARCHAR' }
              ]
            }
          });
        }
      });

      // Check 3NF: Address attributes clustered together inside transactional entities (e.g. orders)
      const hasPlz = fieldNames.some(n => n.includes('plz') || n.includes('zip'));
      const hasOrt = fieldNames.some(n => n.includes('ort') || n.includes('city'));
      const hasStrasse = fieldNames.some(n => n.includes('strasse') || n.includes('street'));

      if (hasPlz && hasOrt && hasStrasse && (table.name.toLowerCase().includes('order') || table.name.toLowerCase().includes('rechnung') || table.name.toLowerCase().includes('auftrag'))) {
        suggestions.push({
          id: `3nf-address-${table.id}`,
          level: '3NF',
          tableId: table.id,
          tableName: table.name,
          fieldNames: ['plz', 'ort', 'strasse'],
          reason: `Vollständige Adressblöcke in Transaktionstabellen erzeugen Redundanz und Update-Anomalien bei Adressänderungen.`,
          proposal: `Lagern Sie Adressen in eine zentrale Tabelle "addresses" oder "customers" aus und referenzieren Sie diese per customer_id oder address_id.`
        });
      }
    });

    return suggestions;
  }
}
