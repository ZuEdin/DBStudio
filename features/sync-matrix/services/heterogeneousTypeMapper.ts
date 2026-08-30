/**
 * Heterogeneous Type Mapper
 * Maps data types and transforms between SQLite and PostgreSQL
 */

export interface TypeMappingDefinition {
  sqliteType: string;
  postgresType: string;
  castExpressionSqliteToPg: (col: string) => string;
  castExpressionPgToSqlite: (col: string) => string;
}

export class HeterogeneousTypeMapper {
  private static mappings: Record<string, TypeMappingDefinition> = {
    INTEGER: {
      sqliteType: 'INTEGER',
      postgresType: 'BIGINT',
      castExpressionSqliteToPg: (c) => `CAST(${c} AS BIGINT)`,
      castExpressionPgToSqlite: (c) => `CAST(${c} AS INTEGER)`,
    },
    AUTONUMBER: {
      sqliteType: 'INTEGER PRIMARY KEY AUTOINCREMENT',
      postgresType: 'BIGSERIAL PRIMARY KEY',
      castExpressionSqliteToPg: (c) => `CAST(${c} AS BIGINT)`,
      castExpressionPgToSqlite: (c) => `CAST(${c} AS INTEGER)`,
    },
    TEXT: {
      sqliteType: 'TEXT',
      postgresType: 'TEXT',
      castExpressionSqliteToPg: (c) => `${c}`,
      castExpressionPgToSqlite: (c) => `${c}`,
    },
    VARCHAR: {
      sqliteType: 'TEXT',
      postgresType: 'VARCHAR(255)',
      castExpressionSqliteToPg: (c) => `CAST(${c} AS VARCHAR(255))`,
      castExpressionPgToSqlite: (c) => `CAST(${c} AS TEXT)`,
    },
    BOOLEAN: {
      sqliteType: 'INTEGER', // SQLite uses 0/1
      postgresType: 'BOOLEAN',
      castExpressionSqliteToPg: (c) => `CASE WHEN ${c} = 1 THEN TRUE ELSE FALSE END`,
      castExpressionPgToSqlite: (c) => `CASE WHEN ${c} = TRUE THEN 1 ELSE 0 END`,
    },
    DECIMAL: {
      sqliteType: 'REAL',
      postgresType: 'NUMERIC(14, 2)',
      castExpressionSqliteToPg: (c) => `CAST(${c} AS NUMERIC(14, 2))`,
      castExpressionPgToSqlite: (c) => `CAST(${c} AS REAL)`,
    },
    CURRENCY: {
      sqliteType: 'REAL',
      postgresType: 'NUMERIC(14, 2)',
      castExpressionSqliteToPg: (c) => `CAST(${c} AS NUMERIC(14, 2))`,
      castExpressionPgToSqlite: (c) => `CAST(${c} AS REAL)`,
    },
    DATETIME: {
      sqliteType: 'TEXT', // ISO string
      postgresType: 'TIMESTAMPTZ',
      castExpressionSqliteToPg: (c) => `TO_TIMESTAMP(${c}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`,
      castExpressionPgToSqlite: (c) => `TO_CHAR(${c}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`,
    },
    DATE: {
      sqliteType: 'TEXT',
      postgresType: 'DATE',
      castExpressionSqliteToPg: (c) => `CAST(${c} AS DATE)`,
      castExpressionPgToSqlite: (c) => `CAST(${c} AS TEXT)`,
    },
    JSON: {
      sqliteType: 'TEXT',
      postgresType: 'JSONB',
      castExpressionSqliteToPg: (c) => `CAST(${c} AS JSONB)`,
      castExpressionPgToSqlite: (c) => `CAST(${c} AS TEXT)`,
    },
    BLOB: {
      sqliteType: 'BLOB',
      postgresType: 'BYTEA',
      castExpressionSqliteToPg: (c) => `DECODE(${c}, 'hex')`,
      castExpressionPgToSqlite: (c) => `ENCODE(${c}, 'hex')`,
    },
  };

  public static getPostgresType(sqliteOrAppType: string): string {
    const key = (sqliteOrAppType || '').toUpperCase().trim();
    if (this.mappings[key]) return this.mappings[key].postgresType;
    if (key.includes('INT')) return 'BIGINT';
    if (key.includes('CHAR') || key.includes('TEXT')) return 'TEXT';
    if (key.includes('REAL') || key.includes('FLOAT') || key.includes('DOUBLE')) return 'DOUBLE PRECISION';
    if (key.includes('BOOL')) return 'BOOLEAN';
    if (key.includes('TIME') || key.includes('DATE')) return 'TIMESTAMPTZ';
    return 'TEXT';
  }

  public static getSqliteType(pgOrAppType: string): string {
    const key = (pgOrAppType || '').toUpperCase().trim();
    if (key.includes('INT') || key.includes('SERIAL')) return 'INTEGER';
    if (key.includes('NUMERIC') || key.includes('DECIMAL') || key.includes('DOUBLE') || key.includes('FLOAT')) return 'REAL';
    if (key.includes('BOOL')) return 'INTEGER';
    if (key.includes('BYTEA')) return 'BLOB';
    return 'TEXT';
  }

  public static transformValue(
    value: any,
    transformType: string = 'none',
    targetDb: 'sqlite' | 'postgres'
  ): any {
    if (value === null || value === undefined) {
      if (transformType === 'coalesce_null') {
        return targetDb === 'sqlite' ? '' : null;
      }
      return null;
    }

    switch (transformType) {
      case 'trim':
        return typeof value === 'string' ? value.trim() : value;
      case 'uppercase':
        return typeof value === 'string' ? value.toUpperCase() : value;
      case 'json_stringify':
        return typeof value === 'object' ? JSON.stringify(value) : value;
      case 'json_parse':
        if (typeof value === 'string') {
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        }
        return value;
      case 'hash_sha256':
        return `sha256_${String(value).slice(0, 16)}`;
      default:
        // Default DB type formatting
        if (targetDb === 'sqlite' && typeof value === 'boolean') {
          return value ? 1 : 0;
        }
        if (targetDb === 'postgres' && typeof value === 'number' && (value === 0 || value === 1)) {
          // If destination is boolean
          return Boolean(value);
        }
        return value;
    }
  }
}
