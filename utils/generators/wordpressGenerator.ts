import {
  Table,
  Query,
  Form,
  Report,
  CustomPage,
  VirtualFile,
  BackendConfig,
} from '../../types/index';
import { WordPressPluginConfig } from '../../types/wordpress';

export const getDefaultWordPressConfig = (
  backendConfig?: BackendConfig
): WordPressPluginConfig => {
  const baseName = backendConfig?.projectName || 'CustomApp';
  const slug =
    baseName
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'dbs-custom-plugin';

  return {
    pluginName: `${baseName} Integration Plugin`,
    pluginSlug: slug,
    pluginUri: 'https://dbstudiopro.edv-knowhow.at',
    description: `Enterprise WordPress Plugin für ${baseName} mit Custom Tables ($wpdb), REST API v1, Shortcodes und Admin-Dashboard.`,
    version: '1.0.0',
    author: 'DB Studio Pro Enterprise',
    authorUri: 'https://edv-knowhow.at',
    textDomain: slug,
    license: 'GPL-2.0-or-later',
    requiresPhp: '7.4',
    requiresWp: '5.8',
    menuTitle: baseName,
    menuIcon: 'dashicons-database',
    menuPosition: 30,
    capability: 'manage_options',
    tablePrefix: 'dbs_',
    enableRestApi: true,
    enableShortcodes: true,
    enableGutenberg: true,
    enableAdminMenu: true,
    enableCustomTables: true,
    enableRolePermissions: true,
    includedTableIds: [],
    includedFormIds: [],
    includedReportIds: [],
    includedPageIds: [],
    includedQueryIds: [],
    publicSubmissions: true,
  };
};

export const generateWordPressPlugin = (
  tables: Table[] = [],
  forms: Form[] = [],
  reports: Report[] = [],
  pages: CustomPage[] = [],
  queries: Query[] = [],
  customConfig?: Partial<WordPressPluginConfig>,
  backendConfig?: BackendConfig
): VirtualFile[] => {
  const config: WordPressPluginConfig = {
    ...getDefaultWordPressConfig(backendConfig),
    ...(backendConfig?.wordpressPlugin || {}),
    ...(customConfig || {}),
  };

  const slug = config.pluginSlug || 'dbs-custom-plugin';
  const phpPrefix = slug.replace(/[^a-zA-Z0-9_]/g, '_');
  const files: VirtualFile[] = [];

  const selectedTables =
    config.includedTableIds && config.includedTableIds.length > 0
      ? tables.filter((t) => config.includedTableIds.includes(t.id))
      : tables;

  const selectedForms =
    config.includedFormIds && config.includedFormIds.length > 0
      ? forms.filter((f) => config.includedFormIds.includes(f.id))
      : forms;

  const selectedReports =
    config.includedReportIds && config.includedReportIds.length > 0
      ? reports.filter((r) => config.includedReportIds.includes(r.id))
      : reports;

  const selectedPages =
    config.includedPageIds && config.includedPageIds.length > 0
      ? pages.filter((p) => config.includedPageIds.includes(p.id))
      : pages;

  // 1. Main Plugin File
  const mainPhpContent = `<?php
/**
 * Plugin Name:       ${config.pluginName}
 * Plugin URI:        ${config.pluginUri || 'https://dbstudiopro.edv-knowhow.at'}
 * Description:       ${config.description}
 * Version:           ${config.version}
 * Requires at least: ${config.requiresWp}
 * Requires PHP:      ${config.requiresPhp}
 * Author:            ${config.author}
 * Author URI:        ${config.authorUri || 'https://edv-knowhow.at'}
 * License:           ${config.license}
 * Text Domain:       ${config.textDomain}
 */

if (!defined('ABSPATH')) {
    exit;
}

define('${phpPrefix.toUpperCase()}_VERSION', '${config.version}');
define('${phpPrefix.toUpperCase()}_PATH', plugin_dir_path(__FILE__));
define('${phpPrefix.toUpperCase()}_URL', plugin_dir_url(__FILE__));

require_once ${phpPrefix.toUpperCase()}_PATH . 'includes/class-db.php';
require_once ${phpPrefix.toUpperCase()}_PATH . 'includes/class-rest-api.php';
require_once ${phpPrefix.toUpperCase()}_PATH . 'includes/class-shortcodes.php';

// Activation & Database Delta
register_activation_hook(__FILE__, array('${phpPrefix}_DB', 'install'));

// Admin Menu
add_action('admin_menu', function () {
    add_menu_page(
        '${config.menuTitle}',
        '${config.menuTitle}',
        '${config.capability}',
        '${slug}',
        function () {
            include ${phpPrefix.toUpperCase()}_PATH . 'admin/admin-dashboard.php';
        },
        '${config.menuIcon}',
        ${config.menuPosition}
    );
});
`;

  files.push({
    name: `${slug}.php`,
    path: `WordPressPlugin/${slug}/${slug}.php`,
    content: mainPhpContent,
    language: 'php',
  });

  // 2. Database installer & helper
  const dbPhpContent = `<?php
if (!defined('ABSPATH')) exit;

class ${phpPrefix}_DB {
    public static function install() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');

        ${selectedTables
          .map((table) => {
            const tblName = `$wpdb->prefix . '${config.tablePrefix}${table.name.toLowerCase()}'`;
            const cols = (table.fields || [])
              .map((f) => {
                let colType = 'varchar(255)';
                if (f.type === 'INTEGER') colType = 'bigint(20)';
                if (f.type === 'DECIMAL' || f.type === 'CURRENCY') colType = 'decimal(15,2)';
                if (f.type === 'BOOLEAN') colType = 'tinyint(1) DEFAULT 0';
                if (f.type === 'TEXT' || f.type === 'JSON') colType = 'longtext';
                if (f.type === 'DATE' || f.type === 'DATETIME') colType = 'datetime';
                if (f.isPrimaryKey) colType += ' NOT NULL AUTO_INCREMENT';
                return `    \`${f.name}\` ${colType}`;
              })
              .join(',\n');

            const pkField = table.fields.find((f) => f.isPrimaryKey) || table.fields[0];
            const pkSql = pkField ? `,\n    PRIMARY KEY (\`${pkField.name}\`)` : '';

            return `
        $sql_${table.name.toLowerCase()} = "CREATE TABLE " . ${tblName} . " (
${cols}${pkSql}
        ) $charset_collate;";
        dbDelta($sql_${table.name.toLowerCase()});`;
          })
          .join('\n')}
    }
}
`;

  files.push({
    name: 'class-db.php',
    path: `WordPressPlugin/${slug}/includes/class-db.php`,
    content: dbPhpContent,
    language: 'php',
  });

  // 3. REST API Handler
  const restApiContent = `<?php
if (!defined('ABSPATH')) exit;

class ${phpPrefix}_REST_API {
    public static function register_routes() {
        ${selectedTables
          .map((table) => {
            const route = `/tables/${table.name.toLowerCase()}`;
            return `
        // Route for table: ${table.name}
        register_rest_route('${slug}/v1', '${route}', array(
            array(
                'methods'             => 'GET',
                'callback'            => array(__CLASS__, 'get_${table.name.toLowerCase()}_records'),
                'permission_callback' => '__return_true'
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array(__CLASS__, 'create_${table.name.toLowerCase()}_record'),
                'permission_callback' => function() {
                    return current_user_can('${config.capability}') || ${config.publicSubmissions ? 'true' : 'false'};
                }
            )
        ));`;
          })
          .join('\n')}
    }

    ${selectedTables
      .map((table) => {
        return `
    public static function get_${table.name.toLowerCase()}_records($request) {
        global $wpdb;
        $table_name = $wpdb->prefix . '${config.tablePrefix}${table.name.toLowerCase()}';
        $results = $wpdb->get_results("SELECT * FROM $table_name ORDER BY 1 DESC LIMIT 100", ARRAY_A);
        return new WP_REST_Response($results ?: array(), 200);
    }

    public static function create_${table.name.toLowerCase()}_record($request) {
        global $wpdb;
        $table_name = $wpdb->prefix . '${config.tablePrefix}${table.name.toLowerCase()}';
        $data = $request->get_json_params() ?: $request->get_body_params();
        $wpdb->insert($table_name, $data);
        return new WP_REST_Response(array('success' => true, 'id' => $wpdb->insert_id), 201);
    }`;
      })
      .join('\n')}
}

add_action('rest_api_init', array('${phpPrefix}_REST_API', 'register_routes'));
`;

  files.push({
    name: 'class-rest-api.php',
    path: `WordPressPlugin/${slug}/includes/class-rest-api.php`,
    content: restApiContent,
    language: 'php',
  });

  // 4. Shortcodes Handler
  const shortcodesContent = `<?php
if (!defined('ABSPATH')) exit;

class ${phpPrefix}_Shortcodes {
    public static function init() {
        add_shortcode('dbs_app', array(__CLASS__, 'render_app'));
        add_shortcode('dbs_table', array(__CLASS__, 'render_table'));
        add_shortcode('dbs_form', array(__CLASS__, 'render_form'));
        add_shortcode('dbs_report', array(__CLASS__, 'render_report'));
        add_shortcode('dbs_page', array(__CLASS__, 'render_page'));
    }

    public static function render_app($atts) {
        return '<div class="dbs-app-container" style="padding: 1rem; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">' .
               '<h3>' . esc_html__('${config.pluginName}', '${config.textDomain}') . '</h3>' .
               '<p>' . esc_html__('DB Studio Pro Embedded Application View.', '${config.textDomain}') . '</p>' .
               '</div>';
    }

    public static function render_table($atts) {
        $a = shortcode_atts(array('id' => '', 'name' => ''), $atts);
        return '<div class="dbs-table-embed" data-table="' . esc_attr($a['name'] ?: $a['id']) . '">Table Loading...</div>';
    }

    public static function render_form($atts) {
        $a = shortcode_atts(array('id' => '', 'name' => ''), $atts);
        return '<div class="dbs-form-embed" data-form="' . esc_attr($a['name'] ?: $a['id']) . '">Form Loading...</div>';
    }

    public static function render_report($atts) {
        $a = shortcode_atts(array('id' => ''), $atts);
        return '<div class="dbs-report-embed" data-report="' . esc_attr($a['id']) . '">Report Loading...</div>';
    }

    public static function render_page($atts) {
        $a = shortcode_atts(array('id' => ''), $atts);
        return '<div class="dbs-page-embed" data-page="' . esc_attr($a['id']) . '">Page Loading...</div>';
    }
}

add_action('init', array('${phpPrefix}_Shortcodes', 'init'));
`;

  files.push({
    name: 'class-shortcodes.php',
    path: `WordPressPlugin/${slug}/includes/class-shortcodes.php`,
    content: shortcodesContent,
    language: 'php',
  });

  // 5. Admin Dashboard
  const adminDashboardContent = `<?php
if (!defined('ABSPATH')) exit;
?>
<div class="wrap" style="max-width: 1200px; margin-top: 20px;">
    <h1 style="display: flex; align-items: center; gap: 10px;">
        <span class="dashicons dashicons-database" style="font-size: 28px;"></span>
        ${config.pluginName} &mdash; Dashboard
    </h1>
    <div style="background: #ffffff; border: 1px solid #ccd0d4; box-shadow: 0 1px 3px rgba(0,0,0,.05); border-radius: 8px; padding: 20px; margin-top: 20px;">
        <h2>${config.menuTitle}</h2>
        <p>${config.description}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <h3>Verfügbare Tabellen (${selectedTables.length})</h3>
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th>Tabellenname</th>
                    <th>Felder</th>
                    <th>REST API Endpoint</th>
                    <th>Shortcode</th>
                </tr>
            </thead>
            <tbody>
                ${selectedTables
                  .map(
                    (t) => `
                <tr>
                    <td><strong>${t.name}</strong></td>
                    <td>${(t.fields || []).length} Felder</td>
                    <td><code>/wp-json/${slug}/v1/tables/${t.name.toLowerCase()}</code></td>
                    <td><code>[dbs_table name="${t.name}"]</code></td>
                </tr>`
                  )
                  .join('')}
            </tbody>
        </table>
    </div>
</div>
`;

  files.push({
    name: 'admin-dashboard.php',
    path: `WordPressPlugin/${slug}/admin/admin-dashboard.php`,
    content: adminDashboardContent,
    language: 'php',
  });

  // 6. Readme
  const readmeContent = `=== ${config.pluginName} ===
Contributors: DB Studio Pro
Tags: database, rest-api, forms, shortcodes, enterprise
Requires at least: ${config.requiresWp}
Tested up to: 6.7
Requires PHP: ${config.requiresPhp}
Stable tag: ${config.version}
License: ${config.license}

== Description ==
${config.description}

== Installation ==
1. Laden Sie den Ordner \`${slug}\` in das Verzeichnis \`/wp-content/plugins/\` hoch.
2. Aktivieren Sie das Plugin im Menü 'Plugins' in WordPress.
3. Die Datenbank-Tabellen werden automatisch via dbDelta() installiert.
`;

  files.push({
    name: 'readme.txt',
    path: `WordPressPlugin/${slug}/readme.txt`,
    content: readmeContent,
    language: 'text',
  });

  return files;
};
