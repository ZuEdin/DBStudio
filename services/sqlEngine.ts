
import { Table } from '../types/index';

// Declare global SQL type from the loaded script
declare var window: any;

let db: any = null;
let SQL: any = null;

export const initSqlEngine = async () => {
  if (db) return;
  try {
    // Check if SQL is loaded from script tag
    if (typeof window !== 'undefined' && window.initSqlJs) {
      SQL = await window.initSqlJs({
        locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/${file}`
      });
      db = new SQL.Database();
      console.log("SQL Engine Initialized (WASM)");
    } else {
        console.error("SQL.js not loaded. Verify the script tag in index.html");
    }
  } catch (e) {
    console.error("Failed to init SQL Engine", e);
  }
};

const mapTypeToSql = (type: string): string => {
    switch(type) {
        case 'INTEGER': return 'INTEGER';
        case 'DECIMAL': case 'DOUBLE': return 'REAL';
        default: return 'TEXT';
    }
};

export const syncTablesToSql = (tables: Table[]) => {
    if (!db) {
        console.warn("SQL Engine not ready. Cannot sync tables.");
        return;
    }
    
    try {
        const existing = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
        if (existing.length > 0 && existing[0].values) {
            existing[0].values.forEach((row: any[]) => {
                if (row[0] !== 'sqlite_sequence') db.run(`DROP TABLE IF EXISTS "${row[0]}"`);
            });
        }

        tables.forEach(table => {
            const fields = table.fields.map(f => `"${f.name}" ${mapTypeToSql(f.type)}`).join(', ');
            // Handle empty tables (no fields) to avoid SQL errors
            if (!fields) return;

            const createSql = `CREATE TABLE "${table.name}" (${fields});`;
            db.run(createSql);

            if (table.data && table.data.length > 0) {
                const stmt = db.prepare(`INSERT INTO "${table.name}" VALUES (${table.fields.map(() => '?').join(',')})`);
                table.data.forEach(row => {
                    const values = table.fields.map(f => {
                        const val = row[f.name];
                        // sql.js throws on undefined, use null instead
                        return val === undefined ? null : val;
                    });
                    stmt.run(values);
                });
                stmt.free();
            }
        });
    } catch (e) {
        console.error("SQL Sync Error", e);
    }
};

export const executeRawSql = (sql: string): any[] => {
    if (!db) {
        console.warn("SQL Engine not ready. Call initSqlEngine() first.");
        return [];
    }
    try {
        const res = db.exec(sql);
        if (res.length === 0) return [];
        
        const columns = res[0].columns;
        const values = res[0].values;
        
        return values.map((row: any[]) => {
            const obj: any = {};
            columns.forEach((col: string, i: number) => {
                obj[col] = row[i];
            });
            return obj;
        });
    } catch (e: any) {
        console.warn("SQL Execution Error:", e);
        return []; 
    }
};
