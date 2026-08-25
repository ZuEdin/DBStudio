import { Table, Query, Form, Report, CustomPage } from '../../../types/index';
import { WordPressPluginConfig } from '../../../types/wordpress';

export const generateAdminMenuFile = (
  config: WordPressPluginConfig,
  tables: Table[],
  forms: Form[],
  reports: Report[],
  pages: CustomPage[],
  queries: Query[]
): string => {
  const className = config.pluginSlug
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('_');

  const selectedTables = config.includedTableIds.length > 0 
    ? tables.filter(t => config.includedTableIds.includes(t.id))
    : tables;

  const selectedForms = config.includedFormIds.length > 0
    ? forms.filter(f => config.includedFormIds.includes(f.id))
    : forms;

  const selectedReports = config.includedReportIds.length > 0
    ? reports.filter(r => config.includedReportIds.includes(r.id))
    : reports;

  const selectedPages = config.includedPageIds.length > 0
    ? pages.filter(p => config.includedPageIds.includes(p.id))
    : pages;

  return `<?php
/**
 * Admin Menu and Submenu Management for WordPress
 */
class ${className}_Admin_Menu {
    public static function init() {
        add_action('admin_menu', array(__CLASS__, 'register_admin_menus'));
    }

    public static function register_admin_menus() {
        $main_slug = '${config.pluginSlug}';
        $capability = '${config.capability || 'manage_options'}';

        // Main Menu Item
        add_menu_page(
            __('${config.pluginName}', '${config.textDomain || 'dbs-plugin'}'),
            __('${config.menuTitle || config.pluginName}', '${config.textDomain || 'dbs-plugin'}'),
            $capability,
            $main_slug,
            array(__CLASS__, 'render_dashboard_page'),
            '${config.menuIcon || 'dashicons-database'}',
            ${config.menuPosition || 30}
        );

        // Submenu: Dashboard
        add_submenu_page(
            $main_slug,
            __('Übersicht & Hub', '${config.textDomain || 'dbs-plugin'}'),
            __('Dashboard', '${config.textDomain || 'dbs-plugin'}'),
            $capability,
            $main_slug,
            array(__CLASS__, 'render_dashboard_page')
        );

        // Submenu: Tabellen & Daten
        add_submenu_page(
            $main_slug,
            __('Tabellen & Datensätze', '${config.textDomain || 'dbs-plugin'}'),
            __('Tabellen & Daten', '${config.textDomain || 'dbs-plugin'}'),
            $capability,
            $main_slug . '-tables',
            array(__CLASS__, 'render_tables_page')
        );

        // Submenu: Formulare
        add_submenu_page(
            $main_slug,
            __('Formulare & Eingaben', '${config.textDomain || 'dbs-plugin'}'),
            __('Formulare', '${config.textDomain || 'dbs-plugin'}'),
            $capability,
            $main_slug . '-forms',
            array(__CLASS__, 'render_forms_page')
        );

        // Submenu: Berichte & Reports
        add_submenu_page(
            $main_slug,
            __('Berichte & Auswertungen', '${config.textDomain || 'dbs-plugin'}'),
            __('Berichte', '${config.textDomain || 'dbs-plugin'}'),
            $capability,
            $main_slug . '-reports',
            array(__CLASS__, 'render_reports_page')
        );

        // Submenu: Custom Pages
        add_submenu_page(
            $main_slug,
            __('Custom Pages & Views', '${config.textDomain || 'dbs-plugin'}'),
            __('Custom Pages', '${config.textDomain || 'dbs-plugin'}'),
            $capability,
            $main_slug . '-pages',
            array(__CLASS__, 'render_custom_pages_page')
        );

        // Submenu: Shortcodes & Docs
        add_submenu_page(
            $main_slug,
            __('Shortcodes & Einbettung', '${config.textDomain || 'dbs-plugin'}'),
            __('Shortcodes & Hilfe', '${config.textDomain || 'dbs-plugin'}'),
            $capability,
            $main_slug . '-shortcodes',
            array(__CLASS__, 'render_shortcodes_page')
        );
    }

    public static function render_dashboard_page() {
        ?>
        <div class="wrap dbs-wp-admin-wrap">
            <h1 class="dbs-title"><span class="dashicons dashicons-database"></span> ${config.pluginName} &mdash; Dashboard</h1>
            <p class="dbs-subtitle">Enterprise WordPress Plugin generiert mit DB Studio Pro.</p>

            <div class="dbs-admin-grid">
                <div class="dbs-admin-card">
                    <h3><span class="dashicons dashicons-editor-table"></span> Tabellen (${selectedTables.length})</h3>
                    <p>Verwalten Sie Datensätze in benutzerdefinierten WordPress-Tabellen.</p>
                    <a href="<?php echo esc_url(admin_url('admin.php?page=${config.pluginSlug}-tables')); ?>" class="button button-primary">Tabellen öffnen</a>
                </div>

                <div class="dbs-admin-card">
                    <h3><span class="dashicons dashicons-feedback"></span> Formulare (${selectedForms.length})</h3>
                    <p>Eingabeformulare mit Validierung und Datenbindung.</p>
                    <a href="<?php echo esc_url(admin_url('admin.php?page=${config.pluginSlug}-forms')); ?>" class="button button-secondary">Formulare ansehen</a>
                </div>

                <div class="dbs-admin-card">
                    <h3><span class="dashicons dashicons-chart-bar"></span> Berichte (${selectedReports.length})</h3>
                    <p>Druckbare und interaktive Auswertungen und Summen.</p>
                    <a href="<?php echo esc_url(admin_url('admin.php?page=${config.pluginSlug}-reports')); ?>" class="button button-secondary">Berichte anzeigen</a>
                </div>

                <div class="dbs-admin-card">
                    <h3><span class="dashicons dashicons-layout"></span> Custom Pages (${selectedPages.length})</h3>
                    <p>Modulare Page-Layouts und Dashboards direkt im WP Admin.</p>
                    <a href="<?php echo esc_url(admin_url('admin.php?page=${config.pluginSlug}-pages')); ?>" class="button button-secondary">Custom Pages öffnen</a>
                </div>
            </div>

            <div class="dbs-card-full mt-4">
                <h3><span class="dashicons dashicons-shortcode"></span> Schnelleinbettung via Shortcodes</h3>
                <p>Verwenden Sie die folgenden Shortcodes auf beliebigen WordPress-Seiten oder Beiträgen:</p>
                <table class="widefat fixed striped">
                    <thead>
                        <tr><th>Typ</th><th>Name / Ziel</th><th>Shortcode</th><th>Aktion</th></tr>
                    </thead>
                    <tbody>
                        ${selectedForms.map(f => `<tr><td><strong>Formular</strong></td><td>${f.name}</td><td><code>[dbs_form id="${f.id}"]</code></td><td><button class="button button-small" onclick="navigator.clipboard.writeText('[dbs_form id=\\\"${f.id}\\\"]')">Kopieren</button></td></tr>`).join('')}
                        ${selectedTables.map(t => `<tr><td><strong>Tabelle</strong></td><td>${t.name}</td><td><code>[dbs_table name="${t.name.toLowerCase()}"]</code></td><td><button class="button button-small" onclick="navigator.clipboard.writeText('[dbs_table name=\\\"${t.name.toLowerCase()}\\\"]')">Kopieren</button></td></tr>`).join('')}
                        ${selectedReports.map(r => `<tr><td><strong>Bericht</strong></td><td>${r.name}</td><td><code>[dbs_report id="${r.id}"]</code></td><td><button class="button button-small" onclick="navigator.clipboard.writeText('[dbs_report id=\\\"${r.id}\\\"]')">Kopieren</button></td></tr>`).join('')}
                        ${selectedPages.map(p => `<tr><td><strong>Page</strong></td><td>${p.name}</td><td><code>[dbs_page id="${p.id}"]</code></td><td><button class="button button-small" onclick="navigator.clipboard.writeText('[dbs_page id=\\\"${p.id}\\\"]')">Kopieren</button></td></tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        <?php
    }

    public static function render_tables_page() {
        ?>
        <div class="wrap dbs-wp-admin-wrap">
            <h1><span class="dashicons dashicons-editor-table"></span> Tabellen & Datensätze</h1>
            <div class="dbs-tab-container">
                <div id="dbs-tables-app-container" data-plugin-slug="${config.pluginSlug}">
                    <p>Lade Tabellenkomponenten...</p>
                </div>
            </div>
        </div>
        <?php
    }

    public static function render_forms_page() {
        ?>
        <div class="wrap dbs-wp-admin-wrap">
            <h1><span class="dashicons dashicons-feedback"></span> Formulare</h1>
            <div id="dbs-forms-app-container" data-plugin-slug="${config.pluginSlug}">
                <p>Lade Formular-Vorschau...</p>
            </div>
        </div>
        <?php
    }

    public static function render_reports_page() {
        ?>
        <div class="wrap dbs-wp-admin-wrap">
            <h1><span class="dashicons dashicons-chart-bar"></span> Berichte & Analysen</h1>
            <div id="dbs-reports-app-container" data-plugin-slug="${config.pluginSlug}">
                <p>Lade Berichts-Engine...</p>
            </div>
        </div>
        <?php
    }

    public static function render_custom_pages_page() {
        ?>
        <div class="wrap dbs-wp-admin-wrap">
            <h1><span class="dashicons dashicons-layout"></span> Custom Pages & Layouts</h1>
            <div id="dbs-pages-app-container" data-plugin-slug="${config.pluginSlug}">
                <p>Lade Custom Pages...</p>
            </div>
        </div>
        <?php
    }

    public static function render_shortcodes_page() {
        ?>
        <div class="wrap dbs-wp-admin-wrap">
            <h1><span class="dashicons dashicons-shortcode"></span> Shortcode & Gutenberg Dokumentation</h1>
            <div class="dbs-card-full">
                <h3>Verfügbare Shortcode Tags:</h3>
                <ul>
                    <li><code>[dbs_form id="UUID" title="1"]</code> &mdash; Rendert ein vollständiges, validiertes Formular.</li>
                    <li><code>[dbs_table name="tabellenname" limit="25"]</code> &mdash; Rendert eine interaktive Datentabelle mit Pagination und Suche.</li>
                    <li><code>[dbs_report id="UUID"]</code> &mdash; Rendert einen aggregierten Bericht mit Druckoption.</li>
                    <li><code>[dbs_page id="UUID"]</code> &mdash; Rendert eine Custom Page mit modernem Layout.</li>
                    <li><code>[dbs_app]</code> &mdash; Rendert das gesamte verknüpfte DB Studio Frontend.</li>
                </ul>
            </div>
        </div>
        <?php
    }
}
`;
};
