/**
 * SQLite WASM Engine & Direct Binary I/O Service
 * Provides complete Local-First SQLite Binary Management:
 * - Load .sqlite / .db / .sqlite3 files directly into sql.js WASM
 * - Inspect SQLite Master (Tables, Columns, Types, Triggers, Indexes)
 * - Transpile SQLite Schema into DB Studio Pro Table[] & Relationships
 * - Execute Transactional Queries (BEGIN/COMMIT/ROLLBACK)
 * - Save & Export binary .sqlite via File System Access API & Blob Download
 */

import initSqlJs from 'sql.js';
import { Table, Field, Relationship } from '../types';

export interface SqliteTableMetadata {
  name: string;
  type: 'table' | 'view' | 'index' | 'trigger';
  sql: string;
  rowCount: number;
  columns: {
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: any;
    pk: number;
  }[];
  sampleRows?: Record<string, any>[];
}

export interface SqliteInspectionResult {
  fileName: string;
  fileSizeBytes: number;
  tableCount: number;
  tables: SqliteTableMetadata[];
  views: string[];
  indexes: string[];
  transpiledTables: Table[];
}

export class SqliteWasmEngine {
  private static sqlJsInstance: any = null;
  private static activeDb: any = null;
  private static currentFileName: string = 'dbstudio_local.sqlite';

  /**
   * Initializes the sql.js WASM module
   */
  public static async getSqlJs() {
    if (!this.sqlJsInstance) {
      const initializer = (typeof window !== 'undefined' && (window as any).initSqlJs) 
        ? (window as any).initSqlJs 
        : initSqlJs;

      if (typeof initializer === 'function') {
        this.sqlJsInstance = await initializer({
          locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/${file}`
        });
      } else {
        throw new Error("sql.js Initializer not available");
      }
    }
    return this.sqlJsInstance;
  }

  /**
   * Loads a binary SQLite file (.sqlite, .db, .sqlite3) into WASM
   */
  public static async loadBinary(binaryData: Uint8Array | ArrayBuffer, fileName: string = 'database.sqlite'): Promise<SqliteInspectionResult> {
    const SQL = await this.getSqlJs();
    const bytes = binaryData instanceof Uint8Array ? binaryData : new Uint8Array(binaryData);
    
    // Create new WASM database from binary bytes
    this.activeDb = new SQL.Database(bytes);
    this.currentFileName = fileName;

    return this.inspectDatabase(fileName, bytes.byteLength);
  }

  /**
   * Creates an empty SQLite WASM database
   */
  public static async createEmptyDatabase(fileName: string = 'new_database.sqlite'): Promise<SqliteInspectionResult> {
    const SQL = await this.getSqlJs();
    this.activeDb = new SQL.Database();
    this.currentFileName = fileName;
    return this.inspectDatabase(fileName, 0);
  }

  /**
   * Inspects all sqlite_master tables, columns (PRAGMA table_info), and row counts
   */
  public static inspectDatabase(fileName: string, fileSizeBytes: number = 0): SqliteInspectionResult {
    if (!this.activeDb) {
      throw new Error("Keine aktive SQLite WASM Datenbank geladen.");
    }

    const tables: SqliteTableMetadata[] = [];
    const views: string[] = [];
    const indexes: string[] = [];

    // Query sqlite_master
    const masterRes = this.activeDb.exec("SELECT type, name, tbl_name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'");
    
    if (masterRes.length > 0 && masterRes[0].values) {
      const rows = masterRes[0].values;
      for (const row of rows) {
        const type = row[0] as string;
        const name = row[1] as string;
        const sql = (row[3] as string) || '';

        if (type === 'table') {
          // Fetch table schema via PRAGMA
          let columns: any[] = [];
          try {
            const pragmaRes = this.activeDb.exec(`PRAGMA table_info("${name}")`);
            if (pragmaRes.length > 0 && pragmaRes[0].values) {
              columns = pragmaRes[0].values.map((c: any[]) => ({
                cid: c[0],
                name: c[1],
                type: c[2],
                notnull: c[3],
                dflt_value: c[4],
                pk: c[5],
              }));
            }
          } catch (err) {
            console.warn(`Could not read pragma table_info for ${name}:`, err);
          }

          // Fetch row count
          let rowCount = 0;
          let sampleRows: Record<string, any>[] = [];
          try {
            const countRes = this.activeDb.exec(`SELECT COUNT(*) FROM "${name}"`);
            if (countRes.length > 0 && countRes[0].values && countRes[0].values[0]) {
              rowCount = Number(countRes[0].values[0][0]) || 0;
            }

            const sampleRes = this.activeDb.exec(`SELECT * FROM "${name}" LIMIT 5`);
            if (sampleRes.length > 0 && sampleRes[0].values) {
              const cols = sampleRes[0].columns;
              sampleRows = sampleRes[0].values.map((vRow: any[]) => {
                const obj: Record<string, any> = {};
                cols.forEach((col: string, idx: number) => {
                  obj[col] = vRow[idx];
                });
                return obj;
              });
            }
          } catch (err) {
            console.warn(`Could not query table ${name}:`, err);
          }

          tables.push({
            name,
            type: 'table',
            sql,
            rowCount,
            columns,
            sampleRows,
          });
        } else if (type === 'view') {
          views.push(name);
        } else if (type === 'index') {
          indexes.push(name);
        }
      }
    }

    // Transpile SQLite tables to DB Studio Table[]
    const transpiledTables = this.transpileToDbStudioTables(tables);

    return {
      fileName,
      fileSizeBytes,
      tableCount: tables.length,
      tables,
      views,
      indexes,
      transpiledTables,
    };
  }

  /**
   * Transpiles SQLite Table metadata into DB Studio Pro Table entities
   */
  public static transpileToDbStudioTables(sqliteTables: SqliteTableMetadata[]): Table[] {
    return sqliteTables.map((st, idx) => {
      const fields: Field[] = st.columns.map((c, colIdx) => {
        const upperType = (c.type || 'TEXT').toUpperCase();
        let normalizedType: any = 'VARCHAR';

        if (upperType.includes('INT')) normalizedType = 'INT';
        else if (upperType.includes('CHAR') || upperType.includes('TEXT') || upperType.includes('CLOB')) normalizedType = 'VARCHAR';
        else if (upperType.includes('REAL') || upperType.includes('FLOA') || upperType.includes('DOUB') || upperType.includes('DEC')) normalizedType = 'DECIMAL';
        else if (upperType.includes('BLOB')) normalizedType = 'BINARY';
        else if (upperType.includes('DATE') || upperType.includes('TIME')) normalizedType = 'DATE';
        else if (upperType.includes('BOOL')) normalizedType = 'BOOLEAN';

        return {
          id: `fld_${st.name}_${c.name}_${colIdx}`,
          name: c.name,
          type: normalizedType,
          isPrimaryKey: c.pk > 0,
          isNullable: c.notnull === 0,
          defaultValue: c.dflt_value !== null ? String(c.dflt_value) : undefined,
          length: normalizedType === 'VARCHAR' ? 255 : undefined,
        };
      });

      return {
        id: `tbl_sqlite_${st.name}_${idx}`,
        name: st.name,
        fields,
        data: st.sampleRows || [],
      };
    });
  }

  /**
   * Executes a raw SQL query inside SQLite WASM
   */
  public static executeSql(query: string): { columns: string[]; rows: any[]; affectedRows?: number; error?: string } {
    if (!this.activeDb) {
      return { columns: [], rows: [], error: 'Keine aktive SQLite WASM Datenbank initialisiert.' };
    }

    try {
      const res = this.activeDb.exec(query);
      if (res.length === 0) {
        return { columns: [], rows: [], affectedRows: 0 };
      }

      const columns = res[0].columns;
      const rows = res[0].values.map((vRow: any[]) => {
        const obj: Record<string, any> = {};
        columns.forEach((c: string, i: number) => {
          obj[c] = vRow[i];
        });
        return obj;
      });

      return { columns, rows };
    } catch (err: any) {
      return { columns: [], rows: [], error: err.message || String(err) };
    }
  }

  /**
   * Exports the entire database as a binary Uint8Array
   */
  public static exportBinary(): Uint8Array {
    if (!this.activeDb) {
      throw new Error("Keine Datenbank vorhanden zum Exportieren.");
    }
    return this.activeDb.export();
  }

  /**
   * Downloads the SQLite database file directly in the browser
   */
  public static downloadDatabaseFile(fileName?: string) {
    const binary = this.exportBinary();
    const saveName = fileName || this.currentFileName || 'dbstudio_local.sqlite';
    const blob = new Blob([binary], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = saveName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Saves directly to disk via the modern File System Access API (if supported)
   */
  public static async saveToDiskViaFileSystemApi(suggestedName?: string): Promise<boolean> {
    if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: suggestedName || this.currentFileName || 'dbstudio_local.sqlite',
          types: [
            {
              description: 'SQLite Database (*.sqlite, *.db)',
              accept: { 'application/x-sqlite3': ['.sqlite', '.db', '.sqlite3'] },
            },
          ],
        });
        const writable = await handle.createWritable();
        const binary = this.exportBinary();
        await writable.write(binary);
        await writable.close();
        return true;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn("FileSystem Access API write failed, falling back to download:", err);
          this.downloadDatabaseFile(suggestedName);
        }
        return false;
      }
    } else {
      this.downloadDatabaseFile(suggestedName);
      return true;
    }
  }
}
