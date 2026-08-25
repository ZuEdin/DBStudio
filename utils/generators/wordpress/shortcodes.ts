import { Table, Query, Form, Report, CustomPage } from '../../../types/index';
import { WordPressPluginConfig } from '../../../types/wordpress';

export const generateShortcodesFile = (
  config: WordPressPluginConfig,
  tables: Table[],
  forms: Form[],
  reports: Report[],
  pages: CustomPage[]
): string => {
  const className = config.pluginSlug
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('_');

  const formsJson = JSON.stringify(forms, null, 2);
  const tablesJson = JSON.stringify(tables, null, 2);
  const reportsJson = JSON.stringify(reports, null, 2);
  const pagesJson = JSON.stringify(pages, null, 2);

  return `<?php
/**
 * Shortcodes for Embedding DB Studio Entities in WordPress
 */
class ${className}_Shortcodes {
    public static function init() {
        add_shortcode('dbs_form', array(__CLASS__, 'render_form_shortcode'));
        add_shortcode('dbs_table', array(__CLASS__, 'render_table_shortcode'));
        add_shortcode('dbs_report', array(__CLASS__, 'render_report_shortcode'));
        add_shortcode('dbs_page', array(__CLASS__, 'render_page_shortcode'));
        add_shortcode('dbs_app', array(__CLASS__, 'render_app_shortcode'));
    }

    public static function get_schema_data() {
        return array(
            'forms'   => json_decode('${formsJson.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}', true),
            'tables'  => json_decode('${tablesJson.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}', true),
            'reports' => json_decode('${reportsJson.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}', true),
            'pages'   => json_decode('${pagesJson.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}', true)
        );
    }

    public static function render_form_shortcode($atts) {
        $a = shortcode_atts(array(
            'id'    => '',
            'name'  => '',
            'title' => '1',
        ), $atts);

        $id = esc_attr($a['id']);
        $schema = self::get_schema_data();
        $target_form = null;

        if (!empty($id)) {
            foreach ($schema['forms'] as $f) {
                if ($f['id'] === $id) { $target_form = $f; break; }
            }
        }

        ob_start();
        ?>
        <div class="dbs-wp-embed dbs-form-embed" data-entity-type="form" data-form-id="<?php echo esc_attr($id); ?>" data-plugin-slug="${config.pluginSlug}">
            <?php if ($a['title'] === '1' && $target_form): ?>
                <h3 class="dbs-embed-title"><?php echo esc_html($target_form['name']); ?></h3>
            <?php endif; ?>
            <div class="dbs-form-render-target" id="dbs-form-<?php echo esc_attr($id ?: 'default'); ?>">
                <form class="dbs-wp-form" onsubmit="return window.dbsHandleFormSubmit(event, '<?php echo esc_attr($id); ?>');">
                    <div class="dbs-form-fields-container">
                        <!-- Dynamically populated or static fallback fields -->
                        <?php if ($target_form && !empty($target_form['layout'])): ?>
                            <?php foreach ($target_form['layout'] as $field): ?>
                                <div class="dbs-form-group">
                                    <label class="dbs-label"><?php echo esc_html($field['label'] ?? $field['fieldName'] ?? 'Feld'); ?></label>
                                    <input type="<?php echo esc_attr($field['type'] === 'number' ? 'number' : 'text'); ?>" 
                                           name="<?php echo esc_attr($field['fieldName'] ?? 'field'); ?>" 
                                           class="dbs-input" 
                                           <?php echo !empty($field['required']) ? 'required' : ''; ?> />
                                </div>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <p class="dbs-loading-hint">Lade interaktives DB Studio Formular...</p>
                        <?php endif; ?>
                    </div>
                    <div class="dbs-form-actions">
                        <button type="submit" class="dbs-btn dbs-btn-primary">Absenden</button>
                    </div>
                    <div class="dbs-form-alert" style="display:none;"></div>
                </form>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    public static function render_table_shortcode($atts) {
        $a = shortcode_atts(array(
            'name'  => '',
            'id'    => '',
            'limit' => '20'
        ), $atts);

        $tableName = esc_attr($a['name'] ?: $a['id']);

        ob_start();
        ?>
        <div class="dbs-wp-embed dbs-table-embed" data-entity-type="table" data-table-name="<?php echo esc_attr($tableName); ?>" data-plugin-slug="${config.pluginSlug}">
            <div class="dbs-table-header">
                <input type="search" placeholder="Suche in <?php echo esc_html($tableName); ?>..." class="dbs-search-input" onkeyup="window.dbsFilterTable(this, '<?php echo esc_attr($tableName); ?>')" />
            </div>
            <div class="dbs-table-render-target" id="dbs-table-<?php echo esc_attr($tableName); ?>">
                <p class="dbs-loading-hint">Lade Datensätze...</p>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    public static function render_report_shortcode($atts) {
        $a = shortcode_atts(array('id' => ''), $atts);
        $id = esc_attr($a['id']);

        ob_start();
        ?>
        <div class="dbs-wp-embed dbs-report-embed" data-entity-type="report" data-report-id="<?php echo esc_attr($id); ?>" data-plugin-slug="${config.pluginSlug}">
            <div class="dbs-report-render-target" id="dbs-report-<?php echo esc_attr($id); ?>">
                <p class="dbs-loading-hint">Lade Berichtsauswertung...</p>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    public static function render_page_shortcode($atts) {
        $a = shortcode_atts(array('id' => ''), $atts);
        $id = esc_attr($a['id']);

        ob_start();
        ?>
        <div class="dbs-wp-embed dbs-page-embed" data-entity-type="page" data-page-id="<?php echo esc_attr($id); ?>" data-plugin-slug="${config.pluginSlug}">
            <div class="dbs-page-render-target" id="dbs-page-<?php echo esc_attr($id); ?>">
                <p class="dbs-loading-hint">Lade Custom Page Layout...</p>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    public static function render_app_shortcode($atts) {
        ob_start();
        ?>
        <div class="dbs-wp-embed dbs-app-embed" data-plugin-slug="${config.pluginSlug}">
            <div id="dbs-full-app-root">
                <p class="dbs-loading-hint">Lade DB Studio Enterprise MFE App...</p>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}
`;
};

export const generateGutenbergFile = (
  config: WordPressPluginConfig
): string => {
  const className = config.pluginSlug
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('_');

  return `<?php
/**
 * Gutenberg Block Support for DB Studio Entities
 */
class ${className}_Gutenberg {
    public static function init() {
        add_action('init', array(__CLASS__, 'register_blocks'));
    }

    public static function register_blocks() {
        if (!function_exists('register_block_type')) {
            return;
        }

        // Register Dynamic Blocks
        register_block_type('${config.pluginSlug}/form-block', array(
            'render_callback' => array('${className}_Shortcodes', 'render_form_shortcode'),
            'attributes'      => array(
                'id'    => array('type' => 'string', 'default' => ''),
                'title' => array('type' => 'string', 'default' => '1')
            )
        ));

        register_block_type('${config.pluginSlug}/table-block', array(
            'render_callback' => array('${className}_Shortcodes', 'render_table_shortcode'),
            'attributes'      => array(
                'name'  => array('type' => 'string', 'default' => ''),
                'limit' => array('type' => 'string', 'default' => '20')
            )
        ));

        register_block_type('${config.pluginSlug}/report-block', array(
            'render_callback' => array('${className}_Shortcodes', 'render_report_shortcode'),
            'attributes'      => array(
                'id' => array('type' => 'string', 'default' => '')
            )
        ));

        register_block_type('${config.pluginSlug}/page-block', array(
            'render_callback' => array('${className}_Shortcodes', 'render_page_shortcode'),
            'attributes'      => array(
                'id' => array('type' => 'string', 'default' => '')
            )
        ));
    }
}
`;
};
