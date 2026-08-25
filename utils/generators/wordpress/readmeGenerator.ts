import { Table, Query, Form, Report, CustomPage } from '../../../types/index';
import { WordPressPluginConfig } from '../../../types/wordpress';

export const generateReadmeTxt = (
  config: WordPressPluginConfig,
  tables: Table[],
  forms: Form[],
  reports: Report[],
  pages: CustomPage[]
): string => {
  return `=== ${config.pluginName} ===
Contributors: ${config.author || 'DB Studio Pro'}
Tags: forms, database, reports, custom-pages, rest-api
Requires at least: ${config.requiresWp || '5.8'}
Tested up to: 6.7
Requires PHP: ${config.requiresPhp || '7.4'}
Stable tag: ${config.version || '1.0.0'}
License: ${config.license || 'GPLv2 or later'}

${config.description || 'Enterprise WordPress Plugin generiert mit DB Studio Pro.'}

== Description ==

Dieses WordPress-Plugin wurde automatisch mit DB Studio Pro generiert. Es integriert Formulare, Ansichten, Berichte und Custom Pages nahtlos in Ihre WordPress-Installation.

== Features ==
* Eigene MySQL-Tabellen mit automatischer dbDelta-Migration
* REST API Endpunkte für vollständige CRUD-Operationen (/wp-json/${config.pluginSlug}/v1/)
* WordPress Dashboard Admin-Menüs für Tabellen, Formulare, Berichte und Pages
* Shortcodes zur einfachen Einbettung in Seiten, Beiträge und Page-Builder (Elementor, Divi)
* Gutenberg Block Editor Unterstützung

== Shortcodes ==
${forms.map(f => `* [dbs_form id="${f.id}"] - Rendert das Formular "${f.name}"`).join('\n')}
${tables.map(t => `* [dbs_table name="${t.name.toLowerCase()}"] - Rendert die Tabelle "${t.name}"`).join('\n')}
${reports.map(r => `* [dbs_report id="${r.id}"] - Rendert den Bericht "${r.name}"`).join('\n')}
${pages.map(p => `* [dbs_page id="${p.id}"] - Rendert die Custom Page "${p.name}"`).join('\n')}
* [dbs_app] - Rendert die vollständige Anwendung

== Installation ==
1. Laden Sie das Plugin als .zip Datei im WordPress Admin-Bereich unter Plugins > Installieren > Plugin hochladen hoch.
2. Aktivieren Sie das Plugin.
3. Öffnen Sie das neue Menü "${config.menuTitle || config.pluginName}" in Ihrer WordPress-Seitenleiste.
`;
};
