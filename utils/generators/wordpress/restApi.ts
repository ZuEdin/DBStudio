import { Table, Query, Form, Report, CustomPage } from '../../../types/index';
import { WordPressPluginConfig } from '../../../types/wordpress';

export const generateRestApiFile = (
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
 * REST API Endpoints for DB Studio WordPress Plugin
 */
class ${className}_Rest_Api {
    private static $namespace = '${config.pluginSlug}/v1';

    public static function init() {
        add_action('rest_api_init', array(__CLASS__, 'register_routes'));
    }

    public static function register_routes() {
        // Table CRUD routes
        register_rest_route(self::$namespace, '/tables/(?P<table_name>[a-zA-Z0-9_-]+)', array(
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array(__CLASS__, 'get_table_rows'),
                'permission_callback' => array(__CLASS__, 'check_read_permission'),
            ),
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array(__CLASS__, 'create_table_row'),
                'permission_callback' => array(__CLASS__, 'check_write_permission'),
            ),
        ));

        register_rest_route(self::$namespace, '/tables/(?P<table_name>[a-zA-Z0-9_-]+)/(?P<id>[a-zA-Z0-9_-]+)', array(
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array(__CLASS__, 'get_table_row_by_id'),
                'permission_callback' => array(__CLASS__, 'check_read_permission'),
            ),
            array(
                'methods'             => WP_REST_Server::EDITABLE,
                'callback'            => array(__CLASS__, 'update_table_row'),
                'permission_callback' => array(__CLASS__, 'check_write_permission'),
            ),
            array(
                'methods'             => WP_REST_Server::DELETABLE,
                'callback'            => array(__CLASS__, 'delete_table_row'),
                'permission_callback' => array(__CLASS__, 'check_write_permission'),
            ),
        ));

        // Form Submission route
        register_rest_route(self::$namespace, '/forms/(?P<form_id>[a-zA-Z0-9_-]+)/submit', array(
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => array(__CLASS__, 'handle_form_submit'),
            'permission_callback' => array(__CLASS__, 'check_form_permission'),
        ));

        // Reports Data route
        register_rest_route(self::$namespace, '/reports/(?P<report_id>[a-zA-Z0-9_-]+)/data', array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => array(__CLASS__, 'get_report_data'),
            'permission_callback' => array(__CLASS__, 'check_read_permission'),
        ));

        // Custom Page Data route
        register_rest_route(self::$namespace, '/pages/(?P<page_id>[a-zA-Z0-9_-]+)/data', array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => array(__CLASS__, 'get_page_data'),
            'permission_callback' => array(__CLASS__, 'check_read_permission'),
        ));
    }

    public static function check_read_permission($request) {
        if (${config.publicSubmissions ? 'true' : 'false'}) {
            return true;
        }
        return current_user_can('${config.capability || 'read'}');
    }

    public static function check_write_permission($request) {
        if (${config.publicSubmissions ? 'true' : 'false'}) {
            return true;
        }
        return current_user_can('${config.capability || 'manage_options'}');
    }

    public static function check_form_permission($request) {
        return true; // Allow public or authenticated form submissions depending on settings
    }

    private static function get_full_table_name($raw_name) {
        global $wpdb;
        $clean_name = preg_replace('/[^a-zA-Z0-9_]/', '', strtolower($raw_name));
        return $wpdb->prefix . '${config.tablePrefix || 'dbs_'}' . $clean_name;
    }

    public static function get_table_rows($request) {
        global $wpdb;
        $table_name = self::get_full_table_name($request['table_name']);
        
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
        $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
        $search = isset($_GET['search']) ? sanitize_text_field($_GET['search']) : '';

        $query = "SELECT * FROM \`$table_name\`";
        if (!empty($search)) {
            $query .= " WHERE 1=1";
        }
        $query .= " LIMIT $limit OFFSET $offset";

        $results = $wpdb->get_results($query, ARRAY_A);
        return rest_ensure_response(array(
            'success' => true,
            'data'    => $results ?: array(),
            'count'   => count($results ?: array())
        ));
    }

    public static function create_table_row($request) {
        global $wpdb;
        $table_name = self::get_full_table_name($request['table_name']);
        $params = $request->get_json_params();

        if (empty($params)) {
            return new WP_Error('empty_data', 'Keine Daten empfangen', array('status' => 400));
        }

        $clean_data = array();
        foreach ($params as $key => $val) {
            $clean_key = sanitize_key($key);
            $clean_data[$clean_key] = is_array($val) ? json_encode($val) : sanitize_text_field($val);
        }

        $inserted = $wpdb->insert($table_name, $clean_data);
        if ($inserted === false) {
            return new WP_Error('db_insert_error', $wpdb->last_error, array('status' => 500));
        }

        return rest_ensure_response(array(
            'success' => true,
            'id'      => $wpdb->insert_id,
            'message' => 'Datensatz erfolgreich erstellt'
        ));
    }

    public static function update_table_row($request) {
        global $wpdb;
        $table_name = self::get_full_table_name($request['table_name']);
        $id = sanitize_text_field($request['id']);
        $params = $request->get_json_params();

        $clean_data = array();
        foreach ($params as $key => $val) {
            $clean_key = sanitize_key($key);
            $clean_data[$clean_key] = is_array($val) ? json_encode($val) : sanitize_text_field($val);
        }

        $updated = $wpdb->update($table_name, $clean_data, array('id' => $id));
        return rest_ensure_response(array(
            'success' => $updated !== false,
            'message' => 'Datensatz aktualisiert'
        ));
    }

    public static function delete_table_row($request) {
        global $wpdb;
        $table_name = self::get_full_table_name($request['table_name']);
        $id = sanitize_text_field($request['id']);

        $deleted = $wpdb->delete($table_name, array('id' => $id));
        return rest_ensure_response(array(
            'success' => $deleted !== false,
            'message' => 'Datensatz gelöscht'
        ));
    }

    public static function handle_form_submit($request) {
        global $wpdb;
        $form_id = sanitize_text_field($request['form_id']);
        $params = $request->get_json_params();

        // Optional log table for submissions
        $log_table = $wpdb->prefix . '${config.tablePrefix || 'dbs_'}form_submissions';
        $wpdb->insert($log_table, array(
            'form_id'    => $form_id,
            'payload'    => json_encode($params),
            'ip_address' => sanitize_text_field($_SERVER['REMOTE_ADDR'] ?? ''),
            'created_at' => current_time('mysql')
        ));

        // If target table specified in params
        if (!empty($params['_target_table'])) {
            $target_table = self::get_full_table_name($params['_target_table']);
            $record_data = $params;
            unset($record_data['_target_table']);
            unset($record_data['_wpnonce']);
            $wpdb->insert($target_table, $record_data);
        }

        return rest_ensure_response(array(
            'success' => true,
            'message' => 'Formular erfolgreich übertragen!'
        ));
    }

    public static function get_report_data($request) {
        $report_id = sanitize_text_field($request['report_id']);
        return rest_ensure_response(array(
            'success'   => true,
            'report_id' => $report_id,
            'generated' => current_time('mysql')
        ));
    }

    public static function get_page_data($request) {
        $page_id = sanitize_text_field($request['page_id']);
        return rest_ensure_response(array(
            'success' => true,
            'page_id' => $page_id,
            'status'  => 'active'
        ));
    }
}
`;
};
