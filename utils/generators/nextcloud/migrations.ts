import { Table } from '../../../types/index';
import { NextcloudAppConfig } from '../../../types/nextcloud';

export const generateMigrationFile = (
  tables: Table[],
  config: NextcloudAppConfig
): { filename: string; content: string } => {
  const appPascal = toPascalCase(config.appId || 'dbs_custom_app');
  const namespace = `OCA\\${appPascal}\\Migration`;
  const versionNum = 'Version' + new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

  const tableDefinitions = tables.map(table => {
    const rawTableName = `${config.tablePrefix || 'dbs_'}${table.name.toLowerCase()}`;
    const fields = table.fields || [];
    const pkCol = fields.find(c => c.isPrimaryKey);

    const columnDefs = fields.map(col => {
      const typeInfo = getDoctrineColumnType(col.type);
      const isNullable = col.isNullable || col.allowNull;
      let colCode = `            $table->addColumn('${col.name}', '${typeInfo.type}', [\n`;
      colCode += `                'notnull' => ${isNullable ? 'false' : 'true'},\n`;
      if (typeInfo.length) {
        colCode += `                'length' => ${typeInfo.length},\n`;
      }
      if (col.isPrimaryKey) {
        colCode += `                'autoincrement' => true,\n`;
      }
      if (col.defaultValue !== undefined && col.defaultValue !== null && col.defaultValue !== '') {
        colCode += `                'default' => '${col.defaultValue}',\n`;
      }
      colCode += `            ]);`;
      return colCode;
    }).join('\n');

    let pkCode = '';
    if (pkCol) {
      pkCode = `\n            $table->setPrimaryKey(['${pkCol.name}']);`;
    }

    return `        if (!$schema->hasTable('${rawTableName}')) {
            $table = $schema->createTable('${rawTableName}');
${columnDefs}${pkCode}
        }`;
  }).join('\n\n');

  const content = `<?php
declare(strict_types=1);

namespace ${namespace};

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\Migration\SimpleMigrationStep;
use OCP\Migration\IOutput;

/**
 * Auto-generated Nextcloud Database Schema Migration
 * Kompatibel mit allen Nextcloud DB-Engines: MySQL, MariaDB, PostgreSQL, SQLite
 */
class ${versionNum} extends SimpleMigrationStep {

    /**
     * @param IOutput $output
     * @param Closure $schemaClosure The Closure returns a ISchemaWrapper
     * @param array $params
     * @return null|ISchemaWrapper
     */
    public function changeSchema(IOutput $output, Closure $schemaClosure, array $params): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

${tableDefinitions}

        return $schema;
    }
}
`;

  return {
    filename: `lib/Migration/${versionNum}.php`,
    content
  };
};

const getDoctrineColumnType = (type: string): { type: string; length?: number } => {
  const t = type.toLowerCase();
  if (t.includes('int')) return { type: 'bigint' };
  if (t.includes('float') || t.includes('double') || t.includes('decimal') || t.includes('currency')) return { type: 'decimal' };
  if (t.includes('bool')) return { type: 'boolean' };
  if (t.includes('text') || t.includes('memo') || t.includes('long')) return { type: 'text' };
  if (t.includes('date') || t.includes('time')) return { type: 'datetime' };
  if (t.includes('blob') || t.includes('binary')) return { type: 'blob' };
  if (t.includes('json')) return { type: 'json' };
  return { type: 'string', length: 255 };
};

const toPascalCase = (str: string): string => {
  return str
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
};
