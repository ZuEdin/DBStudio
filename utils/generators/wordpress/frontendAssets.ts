import { Table, Query, Form, Report, CustomPage } from '../../../types/index';
import { WordPressPluginConfig } from '../../../types/wordpress';

export const generatePublicJs = (
  config: WordPressPluginConfig,
  tables: Table[],
  forms: Form[],
  reports: Report[],
  pages: CustomPage[]
): string => {
  return `/**
 * DB Studio Pro - WordPress Public Frontend Client
 */
(function($) {
    'use strict';

    window.dbsHandleFormSubmit = function(event, formId) {
        event.preventDefault();
        var $form = $(event.target);
        var $btn = $form.find('button[type="submit"]');
        var $alert = $form.find('.dbs-form-alert');
        
        var formData = {};
        $form.serializeArray().forEach(function(item) {
            formData[item.name] = item.value;
        });

        $btn.prop('disabled', true).text('Wird gesendet...');
        $alert.hide().removeClass('dbs-alert-success dbs-alert-error');

        $.ajax({
            url: (window.dbsWpSettings ? window.dbsWpSettings.root : '/wp-json/${config.pluginSlug}/v1/') + 'forms/' + formId + '/submit',
            method: 'POST',
            beforeSend: function(xhr) {
                if (window.dbsWpSettings && window.dbsWpSettings.nonce) {
                    xhr.setRequestHeader('X-WP-Nonce', window.dbsWpSettings.nonce);
                }
            },
            data: JSON.stringify(formData),
            contentType: 'application/json',
            success: function(res) {
                $alert.addClass('dbs-alert-success').text(res.message || 'Erfolgreich gespeichert!').fadeIn();
                $form[0].reset();
            },
            error: function(err) {
                var msg = err.responseJSON && err.responseJSON.message ? err.responseJSON.message : 'Fehler beim Übertragen.';
                $alert.addClass('dbs-alert-error').text(msg).fadeIn();
            },
            complete: function() {
                $btn.prop('disabled', false).text('Absenden');
            }
        });

        return false;
    };

    window.dbsFilterTable = function(input, tableName) {
        var term = $(input).val().toLowerCase();
        $('#dbs-table-' + tableName + ' tbody tr').each(function() {
            var text = $(this).text().toLowerCase();
            $(this).toggle(text.indexOf(term) > -1);
        });
    };

    function loadTableData($container) {
        var tableName = $container.data('table-name');
        if (!tableName) return;

        var $target = $container.find('.dbs-table-render-target');
        
        $.ajax({
            url: (window.dbsWpSettings ? window.dbsWpSettings.root : '/wp-json/${config.pluginSlug}/v1/') + 'tables/' + tableName,
            method: 'GET',
            beforeSend: function(xhr) {
                if (window.dbsWpSettings && window.dbsWpSettings.nonce) {
                    xhr.setRequestHeader('X-WP-Nonce', window.dbsWpSettings.nonce);
                }
            },
            success: function(res) {
                if (!res.data || res.data.length === 0) {
                    $target.html('<p class="dbs-empty-hint">Keine Datensätze in <strong>' + tableName + '</strong> vorhanden.</p>');
                    return;
                }

                var columns = Object.keys(res.data[0]);
                var html = '<div class="dbs-table-responsive"><table class="dbs-data-table"><thead><tr>';
                columns.forEach(function(col) {
                    html += '<th>' + col + '</th>';
                });
                html += '</tr></thead><tbody>';

                res.data.forEach(function(row) {
                    html += '<tr>';
                    columns.forEach(function(col) {
                        html += '<td>' + (row[col] !== null ? row[col] : '') + '</td>';
                    });
                    html += '</tr>';
                });

                html += '</tbody></table></div>';
                $target.html(html);
            },
            error: function() {
                $target.html('<p class="dbs-error-hint">Fehler beim Laden der Tabellendaten.</p>');
            }
        });
    }

    $(document).ready(function() {
        $('.dbs-table-embed').each(function() {
            loadTableData($(this));
        });
    });

})(jQuery);
`;
};

export const generatePublicCss = (): string => {
  return `/**
 * DB Studio Pro - Public Stylesheet
 */
.dbs-wp-embed {
    margin: 1.5rem 0;
    padding: 1.25rem;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    font-family: system-ui, -apple-system, sans-serif;
    color: #1e293b;
}

.dbs-embed-title {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.25rem;
    font-weight: 700;
    color: #0f172a;
    border-bottom: 2px solid #3b82f6;
    padding-bottom: 0.5rem;
}

.dbs-form-group {
    margin-bottom: 1rem;
}

.dbs-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 0.35rem;
    color: #334155;
}

.dbs-input, .dbs-search-input {
    width: 100%;
    padding: 0.6rem 0.85rem;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 0.95rem;
    background: #ffffff;
    color: #1e293b;
    box-sizing: border-box;
}

.dbs-input:focus, .dbs-search-input:focus {
    border-color: #3b82f6;
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.dbs-btn {
    display: inline-block;
    padding: 0.65rem 1.25rem;
    font-size: 0.95rem;
    font-weight: 600;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    background: #2563eb;
    color: #ffffff;
}

.dbs-btn:hover {
    background: #1d4ed8;
}

.dbs-form-alert {
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    font-size: 0.9rem;
}

.dbs-alert-success {
    background: #ecfdf5;
    color: #065f46;
    border: 1px solid #a7f3d0;
}

.dbs-alert-error {
    background: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
}

.dbs-table-responsive {
    overflow-x: auto;
    margin-top: 0.75rem;
}

.dbs-data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
}

.dbs-data-table th, .dbs-data-table td {
    padding: 0.65rem 0.85rem;
    border-bottom: 1px solid #e2e8f0;
    text-align: left;
}

.dbs-data-table th {
    background: #f8fafc;
    font-weight: 700;
    color: #475569;
}

.dbs-data-table tr:hover {
    background: #f1f5f9;
}
`;
};

export const generateAdminCss = (): string => {
  return `/**
 * DB Studio Pro - WP Admin Styles
 */
.dbs-wp-admin-wrap {
    margin: 20px 20px 0 0;
    font-family: system-ui, -apple-system, sans-serif;
}

.dbs-title {
    font-size: 1.6rem;
    font-weight: 700;
    color: #1e293b;
}

.dbs-subtitle {
    font-size: 0.95rem;
    color: #64748b;
    margin-top: -5px;
    margin-bottom: 20px;
}

.dbs-admin-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
}

.dbs-admin-card {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.dbs-admin-card h3 {
    margin-top: 0;
    font-size: 1.1rem;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 8px;
}

.dbs-card-full {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
`;
};
