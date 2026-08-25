import { Table, Query, Form, Report, CustomPage } from '../../../types/index';
import { WordPressPluginConfig } from '../../../types/wordpress';

export const generateMainPluginFile = (
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

  return `<?php
/**
 * Plugin Name:       ${config.pluginName}
 * Plugin URI:        ${config.pluginUri || 'https://dbstudiopro.edv-knowhow.at'}
 * Description:       ${config.description || 'Custom WordPress Plugin generiert mit DB Studio Pro.'}
 * Version:           ${config.version || '1.0.0'}
 * Author:            ${config.author || 'DB Studio Pro'}
 * Author URI:        ${config.authorUri || 'https://dbstudiopro.edv-knowhow.at'}
 * License:           ${config.license || 'GPL-2.0+'}
 * Text Domain:       ${config.textDomain || 'dbs-plugin'}
 * Requires at least: ${config.requiresWp || '5.8'}
 * Requires PHP:      ${config.requiresPhp || '7.4'}
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

define('${className.toUpperCase()}_VERSION', '${config.version || '1.0.0'}');
define('${className.toUpperCase()}_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('${className.toUpperCase()}_PLUGIN_URL', plugin_dir_url(__FILE__));
define('${className.toUpperCase()}_SLUG', '${config.pluginSlug}');

// Require core classes
require_once ${className.toUpperCase()}_PLUGIN_DIR . 'includes/class-activator.php';
require_once ${className.toUpperCase()}_PLUGIN_DIR . 'includes/class-deactivator.php';
require_once ${className.toUpperCase()}_PLUGIN_DIR . 'includes/class-rest-api.php';
require_once ${className.toUpperCase()}_PLUGIN_DIR . 'includes/class-admin-menu.php';
require_once ${className.toUpperCase()}_PLUGIN_DIR . 'includes/class-shortcodes.php';
require_once ${className.toUpperCase()}_PLUGIN_DIR . 'includes/class-gutenberg.php';

/**
 * Activation & Deactivation Hooks
 */
function activate_${config.pluginSlug.replace(/-/g, '_')}() {
    ${className}_Activator::activate();
}
register_activation_hook(__FILE__, 'activate_${config.pluginSlug.replace(/-/g, '_')}');

function deactivate_${config.pluginSlug.replace(/-/g, '_')}() {
    ${className}_Deactivator::deactivate();
}
register_deactivation_hook(__FILE__, 'deactivate_${config.pluginSlug.replace(/-/g, '_')}');

/**
 * Main Plugin Orchestrator
 */
class ${className}_Plugin {
    private static $instance = null;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->init_hooks();
    }

    private function init_hooks() {
        add_action('init', array($this, 'register_assets'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_frontend_scripts'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));

        // Initialize modules
        ${config.enableRestApi ? `${className}_Rest_Api::init();` : ''}
        ${config.enableAdminMenu ? `${className}_Admin_Menu::init();` : ''}
        ${config.enableShortcodes ? `${className}_Shortcodes::init();` : ''}
        ${config.enableGutenberg ? `${className}_Gutenberg::init();` : ''}
    }

    public function register_assets() {
        wp_register_style(
            '${config.pluginSlug}-public-css',
            ${className.toUpperCase()}_PLUGIN_URL . 'public/css/dbs-public.css',
            array(),
            ${className.toUpperCase()}_VERSION
        );

        wp_register_script(
            '${config.pluginSlug}-public-js',
            ${className.toUpperCase()}_PLUGIN_URL . 'public/js/dbs-public.js',
            array('jquery'),
            ${className.toUpperCase()}_VERSION,
            true
        );

        wp_localize_script('${config.pluginSlug}-public-js', 'dbsWpSettings', array(
            'root'      => esc_url_raw(rest_url('${config.pluginSlug}/v1/')),
            'nonce'     => wp_create_nonce('wp_rest'),
            'pluginUrl' => ${className.toUpperCase()}_PLUGIN_URL,
            'ajaxUrl'   => admin_url('admin-ajax.php')
        ));
    }

    public function enqueue_frontend_scripts() {
        wp_enqueue_style('${config.pluginSlug}-public-css');
        wp_enqueue_script('${config.pluginSlug}-public-js');
    }

    public function enqueue_admin_scripts($hook) {
        if (strpos($hook, '${config.pluginSlug}') !== false) {
            wp_enqueue_style(
                '${config.pluginSlug}-admin-css',
                ${className.toUpperCase()}_PLUGIN_URL . 'admin/css/dbs-admin.css',
                array(),
                ${className.toUpperCase()}_VERSION
            );
            wp_enqueue_script(
                '${config.pluginSlug}-admin-js',
                ${className.toUpperCase()}_PLUGIN_URL . 'admin/js/dbs-admin.js',
                array('jquery'),
                ${className.toUpperCase()}_VERSION,
                true
            );
            wp_localize_script('${config.pluginSlug}-admin-js', 'dbsWpAdminSettings', array(
                'root'  => esc_url_raw(rest_url('${config.pluginSlug}/v1/')),
                'nonce' => wp_create_nonce('wp_rest')
            ));
        }
    }
}

// Instantiate plugin
add_action('plugins_loaded', array('${className}_Plugin', 'get_instance'));
`;
};
