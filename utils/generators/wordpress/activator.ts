import { Table } from '../../../types/index';
import { WordPressPluginConfig } from '../../../types/wordpress';

export const generateActivatorFile = (
  config: WordPressPluginConfig,
  tables: Table[]
): string => {
  const className = config.pluginSlug
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('_');

  const selectedTables = config.includedTableIds.length > 0 
    ? tables.filter(t => config.includedTableIds.includes(t.id))
    : tables;

  const sqlStatements = selectedTables.map(table => {
    const tableNameVar = `$wpdb->prefix . '${config.tablePrefix || 'dbs_'}${table.name.toLowerCase()}'`;
    const fieldDefs: string[] = [];

    table.fields.forEach(field => {
      let sqlType = 'VARCHAR(255)';
      const upperType = (field.type || 'TEXT').toUpperCase();

      if (upperType === 'INTEGER' || upperType === 'NUMBER' || upperType === 'INT') {
        sqlType = 'BIGINT(20)';
      } else if (upperType === 'DECIMAL' || upperType === 'FLOAT' || upperType === 'DOUBLE' || upperType === 'CURRENCY') {
        sqlType = 'DECIMAL(12,2)';
      } else if (upperType === 'BOOLEAN' || upperType === 'BOOL') {
        sqlType = 'TINYINT(1)';
      } else if (upperType === 'DATETIME' || upperType === 'DATE') {
        sqlType = 'DATETIME';
      } else if (upperType === 'LONGTEXT' || upperType === 'MEMO' || upperType === 'JSON') {
        sqlType = 'LONGTEXT';
      }

      let line = `\`${field.name}\` ${sqlType}`;
      if (field.isPrimaryKey && field.isAutoIncrement) {
        line += ' NOT NULL AUTO_INCREMENT';
      } else if (field.isPrimaryKey) {
        line += ' NOT NULL';
      } else if (field.isNullable === false) {
        line += ' NOT NULL';
      }
      fieldDefs.push(line);
    });

    const pk = table.fields.find(f => f.isPrimaryKey);
    if (pk) {
      fieldDefs.push(`PRIMARY KEY (\`${pk.name}\`)`);
    }

    return `        $table_name_${table.name.toLowerCase()} = ${tableNameVar};
        $sql_${table.name.toLowerCase()} = "CREATE TABLE $table_name_${table.name.toLowerCase()} (
            ${fieldDefs.join(',\n            ')}
        ) $charset_collate;";
        dbDelta($sql_${table.name.toLowerCase()});`;
  }).join('\n\n');

  return `<?php
/**
 * Fired during plugin activation
 */
class ${className}_Activator {
    public static function activate() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');

${sqlStatements || '        // Keine benutzerdefinierten Tabellen definiert'}

        // Set default plugin version in options
        update_option('${config.pluginSlug}_version', '${config.version || '1.0.0'}');
        update_option('${config.pluginSlug}_activated_at', current_time('mysql'));
    }
}
`;
};

export const generateDeactivatorFile = (
  config: WordPressPluginConfig
): string => {
  const className = config.pluginSlug
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('_');

  return `<?php
/**
 * Fired during plugin deactivation
 */
class ${className}_Deactivator {
    public static function deactivate() {
        // Clear cached transients or scheduled cron jobs
        delete_transient('${config.pluginSlug}_cache');
    }
}
`;
};
