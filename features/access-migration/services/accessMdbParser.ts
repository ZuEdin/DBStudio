import MDBReader from 'mdb-reader';
import { Buffer } from 'buffer';
import { Table, Field, Relationship, DbType } from '../../../types';
import { Query, SelectQuery } from '../../../types/query';
import { Form, FormElement } from '../../../types/form';
import { Report } from '../../../types/report';
import { AccessDataTranspiler } from '../../../services/accessDataTranspiler';

export interface AccessTableDefinition {
  name: string;
  isSystem: boolean;
  rowCount: number;
  columns: AccessColumnDefinition[];
  rows: Record<string, any>[];
  primaryKey?: string;
}

export interface AccessColumnDefinition {
  name: string;
  accessType: string;
  mappedType: string;
  size?: number;
  isPrimaryKey?: boolean;
  isNullable?: boolean;
  isAutoNumber?: boolean;
  isOleObject?: boolean;
  isMemoRtf?: boolean;
}

export interface AccessQueryMetadata {
  id: string;
  name: string;
  sql: string;
}

export interface AccessFormMetadata {
  id: string;
  name: string;
  sourceTable?: string;
}

export interface AccessReportMetadata {
  id: string;
  name: string;
  sourceTable?: string;
}

export interface AccessDatabaseMetadata {
  fileName: string;
  fileSize: number;
  formatVersion: 'JET_3' | 'JET_4' | 'ACE_12' | 'ACE_14' | 'ACE_16' | 'UNKNOWN';
  formatName: string;
  pageSize: number;
  tableCount: number;
  relationshipCount: number;
  queryCount: number;
  formCount: number;
  reportCount: number;
  tables: AccessTableDefinition[];
  relationships: {
    name: string;
    fromTable: string;
    fromColumn: string;
    toTable: string;
    toColumn: string;
    cascadeDelete?: boolean;
    cascadeUpdate?: boolean;
  }[];
  queries: AccessQueryMetadata[];
  forms: AccessFormMetadata[];
  reports: AccessReportMetadata[];
}

/**
 * Access JET & ACE Binary Type Codes
 */
const ACCESS_DATA_TYPES: Record<number, { name: string; standardType: string }> = {
  0x01: { name: 'Boolean (Ja/Nein)', standardType: 'BOOLEAN' },
  0x02: { name: 'Byte (0-255)', standardType: 'INTEGER' },
  0x03: { name: 'Integer (16-bit)', standardType: 'INTEGER' },
  0x04: { name: 'Long Integer (32-bit AutoWert)', standardType: 'INTEGER' },
  0x05: { name: 'Currency (Währung)', standardType: 'DECIMAL' },
  0x06: { name: 'Single (Fließkomma 4 Byte)', standardType: 'FLOAT' },
  0x07: { name: 'Double (Fließkomma 8 Byte)', standardType: 'FLOAT' },
  0x08: { name: 'Date/Time (Datum/Uhrzeit)', standardType: 'DATETIME' },
  0x09: { name: 'Binary (Binärdaten)', standardType: 'TEXT' },
  0x0A: { name: 'Text (Kurzer Text)', standardType: 'VARCHAR' },
  0x0B: { name: 'OLE Object (Bild / Dokument)', standardType: 'TEXT' },
  0x0C: { name: 'Memo (Langer Text / RTF)', standardType: 'TEXT' },
  0x0F: { name: 'GUID / Replication ID', standardType: 'VARCHAR' },
  0x10: { name: 'Decimal (Exakte Dezimalzahl)', standardType: 'DECIMAL' },
  0x12: { name: 'Complex / Multivalue', standardType: 'JSON' }
};

export class AccessMdbParser {
  /**
   * Parse real binary MDB / ACCDB buffer using MDBReader in JavaScript / WebAssembly
   */
  public static async parseAccessBuffer(
    buffer: ArrayBuffer,
    fileName: string,
    password?: string
  ): Promise<AccessDatabaseMetadata> {
    const bytes = new Uint8Array(buffer);
    const nodeBuffer = Buffer.from(buffer);

    // 1. Detect Jet / ACE Format & Page Size
    let formatVersion: AccessDatabaseMetadata['formatVersion'] = 'UNKNOWN';
    let formatName = 'Microsoft Access MDB/ACCDB';
    let pageSize = 2048;

    if (bytes.length >= 0x20) {
      const jetEngineByte = bytes[0x14];
      if (jetEngineByte === 0x00) {
        formatVersion = 'JET_3';
        formatName = 'Microsoft Access 97 (Jet 3.5, 2048B Pages)';
        pageSize = 2048;
      } else if (jetEngineByte === 0x01) {
        formatVersion = 'JET_4';
        formatName = 'Microsoft Access 2000-2003 (Jet 4.0, 2048B Pages)';
        pageSize = 2048;
      } else if (jetEngineByte === 0x02) {
        formatVersion = 'ACE_12';
        formatName = 'Microsoft Access 2007 (ACE 12.0, 4096B Pages)';
        pageSize = 4096;
      } else if (jetEngineByte === 0x03) {
        formatVersion = 'ACE_14';
        formatName = 'Microsoft Access 2010 (ACE 14.0, 4096B Pages)';
        pageSize = 4096;
      } else if (jetEngineByte === 0x04 || jetEngineByte >= 0x05) {
        formatVersion = 'ACE_16';
        formatName = 'Microsoft Access 2016-2021 / Office 365 (ACE 16.0, 4096B Pages)';
        pageSize = 4096;
      }
    }

    // 2. Perform Real Binary Scan & Table Extraction with MDBReader
    let tables: AccessTableDefinition[] = [];
    const relationships: AccessDatabaseMetadata['relationships'] = [];
    const extractedQueries: AccessQueryMetadata[] = [];
    const extractedForms: AccessFormMetadata[] = [];
    const extractedReports: AccessReportMetadata[] = [];

    try {
      const reader = new MDBReader(nodeBuffer, { password: password || undefined });
      
      // Get all table names (normal + system tables)
      const allTableNames = reader.getTableNames({ normalTables: true, systemTables: true, linkedTables: true });
      
      for (const tableName of allTableNames) {
        const isSystem = tableName.startsWith('MSys') || tableName.startsWith('~') || tableName.startsWith('f_');
        
        try {
          const mdbTable = reader.getTable(tableName);
          const rawColumns = mdbTable.getColumns();
          
          let primaryKey: string | undefined;

          const columns: AccessColumnDefinition[] = rawColumns.map(col => {
            const mapped = this.mapMdbType(col.type);
            const isAuto = Boolean(col.autoLong || col.autoUUID);
            if (isAuto && !primaryKey) {
              primaryKey = col.name;
            }
            const isOle = col.type === 'ole' || col.type === 'binary';
            const isMemo = col.type === 'memo';

            return {
              name: col.name,
              accessType: this.getAccessTypeName(col.type, isAuto),
              mappedType: mapped,
              size: col.size || undefined,
              isPrimaryKey: isAuto,
              isNullable: col.nullable !== false,
              isAutoNumber: isAuto,
              isOleObject: isOle,
              isMemoRtf: isMemo,
            };
          });

          // Read data rows from binary
          let rawRows: any[] = [];
          try {
            rawRows = mdbTable.getData();
          } catch (dataErr) {
            console.warn(`Could not read records for table "${tableName}":`, dataErr);
          }

          // Format & sanitize row values
          const rows = rawRows.map(r => {
            const rowObj: Record<string, any> = {};
            for (const col of columns) {
              const val = r[col.name];
              if (val === undefined || val === null) {
                rowObj[col.name] = null;
              } else if (val instanceof Date) {
                rowObj[col.name] = val.toISOString().split('T')[0];
              } else if (typeof val === 'bigint') {
                rowObj[col.name] = Number(val);
              } else if (Buffer.isBuffer(val) || val instanceof Uint8Array) {
                const u8 = val instanceof Uint8Array ? val : new Uint8Array(val);
                if (col.isOleObject) {
                  try {
                    const stripped = AccessDataTranspiler.stripOleHeader(u8);
                    rowObj[col.name] = stripped.dataUrl;
                  } catch {
                    rowObj[col.name] = `[Binary OLE ${u8.length} Bytes]`;
                  }
                } else {
                  rowObj[col.name] = `[Binary BLOB ${u8.length} Bytes]`;
                }
              } else if (typeof val === 'string' && col.isMemoRtf && val.includes('{\\rtf')) {
                rowObj[col.name] = AccessDataTranspiler.transpileRtf(val).html;
              } else {
                rowObj[col.name] = val;
              }
            }
            return rowObj;
          });

          // Check if column can act as primary key if none was set
          if (!primaryKey && columns.length > 0) {
            const lowerTbl = tableName.toLowerCase();
            const idCol = columns.find(c => {
              const lower = c.name.toLowerCase();
              return lower === 'id' || 
                     lower === `${lowerTbl}id` || 
                     lower === `${lowerTbl}_id` ||
                     lower === `${lowerTbl}nr` ||
                     lower === `${lowerTbl}_nr` ||
                     lower.endsWith('id') || 
                     lower.endsWith('_id') || 
                     lower.endsWith('nr') || 
                     lower.endsWith('_nr') || 
                     lower.endsWith('nummer') || 
                     lower.endsWith('code') || 
                     lower.endsWith('key') ||
                     lower === lowerTbl;
            }) || columns[0];

            if (idCol) {
              idCol.isPrimaryKey = true;
              primaryKey = idCol.name;
            }
          }

          tables.push({
            name: tableName,
            isSystem,
            rowCount: mdbTable.rowCount ?? rows.length,
            columns,
            rows,
            primaryKey
          });
        } catch (tableErr) {
          console.warn(`Skipping unreadable table "${tableName}":`, tableErr);
        }
      }

      // Check MSysRelationships for real foreign keys
      try {
        if (allTableNames.includes('MSysRelationships')) {
          const relTable = reader.getTable('MSysRelationships');
          const relData = relTable.getData();
          for (const r of relData) {
            const fromTable = String(r.szReferencedObject || r.szObject || '');
            const toTable = String(r.szObject || '');
            const fromColumn = String(r.szReferencedColumn || r.szColumn || '');
            const toColumn = String(r.szColumn || '');
            const name = String(r.szRelationship || `rel_${fromTable}_${toTable}`);
            if (fromTable && toTable && fromTable !== toTable && fromColumn && toColumn) {
              relationships.push({
                name,
                fromTable,
                fromColumn,
                toTable,
                toColumn,
                cascadeDelete: Boolean(Number(r.grbit || 0) & 0x00000100),
                cascadeUpdate: Boolean(Number(r.grbit || 0) & 0x00000200),
              });
            }
          }
        }
      } catch (relErr) {
        console.warn('MSysRelationships could not be parsed:', relErr);
      }

      // Extract Queries, Forms, and Reports from MSysObjects & MSysQueries
      try {
        if (allTableNames.includes('MSysObjects')) {
          const sysObjTable = reader.getTable('MSysObjects');
          const sysObjData = sysObjTable.getData();

          const sqlMap = new Map<string, string>();
          if (allTableNames.includes('MSysQueries')) {
            try {
              const sysQueriesTable = reader.getTable('MSysQueries');
              const sysQueriesData = sysQueriesTable.getData();
              for (const q of sysQueriesData) {
                const objName = String(q.szName || q.Name || q.szObject || '');
                const expr = String(q.Expression || q.szAttribute || '');
                if (objName && expr) {
                  const current = sqlMap.get(objName) || '';
                  sqlMap.set(objName, current ? `${current} ${expr}` : expr);
                }
              }
            } catch {
              // Ignore MSysQueries parsing error
            }
          }

          const firstUserTable = tables.find(t => !t.isSystem)?.name;

          for (const row of sysObjData) {
            const objName = String(row.Name || row.szName || '');
            const type = Number(row.Type || row.type || 0);

            if (!objName || objName.startsWith('~') || objName.startsWith('MSys') || objName.startsWith('f_')) continue;

            if (type === 5) {
              // Access Query (Abfrage)
              const sql = sqlMap.get(objName) || `SELECT * FROM [${firstUserTable || 'Table'}]`;
              extractedQueries.push({
                id: `qry_${objName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                name: objName,
                sql
              });
            } else if (type === -32768 || type === 0x80000000) {
              // Access Form (Formular)
              extractedForms.push({
                id: `frm_${objName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                name: objName,
                sourceTable: firstUserTable
              });
            } else if (type === -32764) {
              // Access Report (Bericht)
              extractedReports.push({
                id: `rpt_${objName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                name: objName,
                sourceTable: firstUserTable
              });
            }
          }
        }
      } catch (sysObjErr) {
        console.warn('MSysObjects metadata extraction skipped:', sysObjErr);
      }

    } catch (parseError: any) {
      console.error("MDBReader extraction error:", parseError);
      throw new Error(`Konnte Access-Datenbank nicht einlesen: ${parseError?.message || String(parseError)}`);
    }

    // Sort: user tables first
    tables = tables.sort((a, b) => {
      if (a.isSystem && !b.isSystem) return 1;
      if (!a.isSystem && b.isSystem) return -1;
      return a.name.localeCompare(b.name);
    });

    const userTablesCount = tables.filter(t => !t.isSystem).length;

    return {
      fileName,
      fileSize: buffer.byteLength,
      formatVersion,
      formatName,
      pageSize,
      tableCount: userTablesCount,
      relationshipCount: relationships.length,
      queryCount: extractedQueries.length,
      formCount: extractedForms.length,
      reportCount: extractedReports.length,
      tables,
      relationships,
      queries: extractedQueries,
      forms: extractedForms,
      reports: extractedReports,
    };
  }

  private static mapMdbType(type: string): string {
    switch (type) {
      case 'boolean': return 'BOOLEAN';
      case 'byte':
      case 'integer':
      case 'long': return 'INTEGER';
      case 'currency': return 'DECIMAL';
      case 'float':
      case 'double':
      case 'numeric': return 'FLOAT';
      case 'datetime':
      case 'datetimextended': return 'DATETIME';
      case 'text': return 'VARCHAR';
      case 'memo': return 'TEXT';
      case 'ole':
      case 'binary': return 'TEXT';
      case 'complex': return 'JSON';
      case 'repid': return 'VARCHAR';
      case 'bigint': return 'BIGINT';
      default: return 'VARCHAR';
    }
  }

  private static getAccessTypeName(type: string, isAutoNumber: boolean): string {
    if (isAutoNumber) return 'Long Integer (AutoWert)';
    switch (type) {
      case 'boolean': return 'Boolean (Ja/Nein)';
      case 'byte': return 'Byte (0-255)';
      case 'integer': return 'Integer (16-bit)';
      case 'long': return 'Long Integer (32-bit)';
      case 'currency': return 'Currency (Währung)';
      case 'float': return 'Single (Fließkomma 4B)';
      case 'double': return 'Double (Fließkomma 8B)';
      case 'datetime': return 'Date/Time (Datum/Uhrzeit)';
      case 'datetimextended': return 'Date/Time Extended';
      case 'text': return 'Text (Kurzer Text)';
      case 'memo': return 'Memo (Langer Text / RTF)';
      case 'ole': return 'OLE Object (Bild / Dokument)';
      case 'binary': return 'Binary (Binärdaten)';
      case 'complex': return 'Complex (Multivalue/Attachment)';
      case 'repid': return 'GUID / Replication ID';
      case 'numeric': return 'Decimal (Exakte Zahl)';
      case 'bigint': return 'BigInt (64-bit)';
      default: return type.toUpperCase();
    }
  }

  /**
   * Transforms Access Tables, Queries, Forms, and Reports into DB Studio Pro objects
   */
  public static convertToDBSP(metadata: AccessDatabaseMetadata): {
    tables: Table[];
    relationships: Relationship[];
    queries: Query[];
    forms: Form[];
    reports: Report[];
  } {
    const tables: Table[] = [];
    const tableIdMap = new Map<string, string>();

    // 1. Create Tables
    for (const accTable of metadata.tables) {
      if (accTable.isSystem) continue; // Skip MSys*

      const tableId = `tbl_${accTable.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36).slice(-4)}`;
      tableIdMap.set(accTable.name, tableId);

      const fields: Field[] = accTable.columns.map(col => ({
        id: `fld_${col.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: col.name,
        type: col.mappedType as any,
        isPrimaryKey: Boolean(col.isPrimaryKey),
        allowNull: col.isNullable !== false,
        isAutoIncrement: Boolean(col.isAutoNumber),
        length: col.size
      }));

      tables.push({
        id: tableId,
        name: accTable.name,
        fields,
        data: accTable.rows
      });
    }

    // 2. Create Relationships
    const relationships: Relationship[] = [];
    for (const rel of metadata.relationships) {
      const fromTableId = tableIdMap.get(rel.fromTable);
      const toTableId = tableIdMap.get(rel.toTable);

      if (fromTableId && toTableId) {
        const fromTbl = tables.find(t => t.id === fromTableId);
        const toTbl = tables.find(t => t.id === toTableId);

        const fromField = fromTbl?.fields.find(f => f.name.toLowerCase() === rel.fromColumn.toLowerCase());
        const toField = toTbl?.fields.find(f => f.name.toLowerCase() === rel.toColumn.toLowerCase());

        if (fromField && toField) {
          relationships.push({
            id: `rel_${rel.fromTable}_${rel.toTable}_${Date.now().toString(36)}`,
            fromTableId,
            fromFieldId: fromField.id,
            toTableId,
            toFieldId: toField.id,
            type: '1:N',
            sourceTableId: fromTableId,
            targetTableId: toTableId,
            sourceFieldId: fromField.id,
            targetFieldId: toField.id
          } as any);

          // The source field in a 1:N relationship is almost always the PK of the parent table
          fromField.isPrimaryKey = true;
        }
      }
    }

    // Ensure every table has at least one explicit primary key
    for (const tbl of tables) {
      if (!tbl.fields.some(f => f.isPrimaryKey)) {
        const lowerTbl = tbl.name.toLowerCase();
        const cand = tbl.fields.find(f => {
          const lower = f.name.toLowerCase();
          return lower === 'id' || lower === `${lowerTbl}id` || lower.endsWith('id') || lower.endsWith('nr') || lower === lowerTbl;
        }) || tbl.fields[0];
        if (cand) {
          cand.isPrimaryKey = true;
        }
      }
    }

    // 3. Create Queries
    const queries: Query[] = [];
    if (metadata.queries && metadata.queries.length > 0) {
      for (const q of metadata.queries) {
        const targetTbl = tables[0];
        if (targetTbl) {
          queries.push({
            id: q.id || `qry_${Date.now().toString(36)}`,
            type: 'SELECT',
            name: q.name,
            nodes: [{ id: 'node_1', tableId: targetTbl.id, x: 100, y: 100 }],
            columns: targetTbl.fields.map(f => ({
              id: `col_${f.id}`,
              tableId: targetTbl.id,
              fieldId: f.id,
              tableName: targetTbl.name,
              fieldName: f.name,
              show: true,
              criteria: []
            }))
          });
        }
      }
    } else {
      // Auto-generate standard queries for main tables
      tables.forEach((tbl, idx) => {
        queries.push({
          id: `qry_${tbl.name.toLowerCase()}_${idx}`,
          type: 'SELECT',
          name: `Abfrage: ${tbl.name}`,
          nodes: [{ id: 'node_1', tableId: tbl.id, x: 100, y: 100 }],
          columns: tbl.fields.map(f => ({
            id: `col_${f.id}`,
            tableId: tbl.id,
            fieldId: f.id,
            tableName: tbl.name,
            fieldName: f.name,
            show: true,
            criteria: []
          }))
        });
      });
    }

    // 4. Create Forms
    const forms: Form[] = [];
    const formMetaList = metadata.forms && metadata.forms.length > 0
      ? metadata.forms
      : tables.map(t => ({ id: `frm_${t.name.toLowerCase()}`, name: `Formular ${t.name}`, sourceTable: t.name }));

    formMetaList.forEach((fm, idx) => {
      const tbl = tables.find(t => t.name === fm.sourceTable) || tables[idx] || tables[0];
      if (tbl) {
        const formElements: FormElement[] = tbl.fields.map(f => ({
          id: `elem_${f.id}`,
          type: 'field',
          fieldId: f.id,
          label: f.name,
          width: '1/2',
          widgetType: f.type === 'BOOLEAN' ? 'checkbox' : f.type === 'DATETIME' ? 'date' : f.type === 'DECIMAL' ? 'currency' : 'text'
        }));

        forms.push({
          id: fm.id || `frm_${tbl.id}`,
          name: fm.name,
          sourceType: 'table',
          sourceId: tbl.id,
          fields: tbl.fields.map(f => ({ fieldId: f.id, label: f.name })),
          layout: {
            id: `container_${tbl.id}`,
            type: 'container',
            label: tbl.name,
            className: 'grid grid-cols-12 gap-4 p-4 bg-white dark:bg-slate-900 rounded-lg shadow-sm',
            children: formElements
          }
        });
      }
    });

    // 5. Create Reports
    const reports: Report[] = [];
    const reportMetaList = metadata.reports && metadata.reports.length > 0
      ? metadata.reports
      : tables.map(t => ({ id: `rpt_${t.name.toLowerCase()}`, name: `Bericht ${t.name}`, sourceTable: t.name }));

    reportMetaList.forEach((rm, idx) => {
      const tbl = tables.find(t => t.name === rm.sourceTable) || tables[idx] || tables[0];
      if (tbl) {
        reports.push({
          id: rm.id || `rpt_${tbl.id}`,
          name: rm.name,
          sourceType: 'table',
          sourceId: tbl.id,
          columns: tbl.fields.map((f, i) => ({
            fieldId: f.id,
            label: f.name,
            visible: true,
            order: i
          })),
          summaries: [],
          settings: {
            orientation: 'portrait',
            pageSize: 'A4',
            showReportHeader: true,
            showReportFooter: true,
            showPageFooter: true,
            zebraStriping: true,
            subtitle: `Access Migration Bericht - ${tbl.name}`
          }
        });
      }
    });

    return { tables, relationships, queries, forms, reports };
  }
}
