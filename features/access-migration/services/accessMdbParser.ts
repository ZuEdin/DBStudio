import MDBReader from 'mdb-reader';
import { Buffer } from 'buffer';
import { Table, Field, Relationship, DbType } from '../../../types';
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

export interface AccessDatabaseMetadata {
  fileName: string;
  fileSize: number;
  formatVersion: 'JET_3' | 'JET_4' | 'ACE_12' | 'ACE_14' | 'ACE_16' | 'UNKNOWN';
  formatName: string;
  pageSize: number;
  tableCount: number;
  relationshipCount: number;
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

          // Check if first column can act as primary key if none was set
          if (!primaryKey && columns.length > 0) {
            const idCol = columns.find(c => c.name.toLowerCase().endsWith('id') || c.name.toLowerCase() === 'id');
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

    return {
      fileName,
      fileSize: buffer.byteLength,
      formatVersion,
      formatName,
      pageSize,
      tableCount: tables.filter(t => !t.isSystem).length,
      relationshipCount: relationships.length,
      tables,
      relationships
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
   * Transforms Access Tables into DB Studio Pro Table[] & Relationships
   */
  public static convertToDBSP(metadata: AccessDatabaseMetadata): {
    tables: Table[];
    relationships: Relationship[];
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
        }
      }
    }

    return { tables, relationships };
  }
}
