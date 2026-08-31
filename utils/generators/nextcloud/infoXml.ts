import { NextcloudAppConfig } from '../../../types/nextcloud';
import { Table, Form, Report, CustomPage, Query } from '../../../types/index';

export const generateInfoXml = (
  config: NextcloudAppConfig,
  tables: Table[] = [],
  forms: Form[] = [],
  reports: Report[] = [],
  pages: CustomPage[] = [],
  queries: Query[] = []
): string => {
  const appId = config.appId || 'dbs_custom_app';
  const appName = config.appName || 'DB Studio App';
  const description = config.description || 'Enterprise Nextcloud Low-Code Applikation generiert mit DB Studio Pro';
  const version = config.version || '1.0.0';
  const license = config.license || 'AGPL-3.0-or-later';
  const author = config.author || 'DB Studio Pro';
  const authorEmail = config.authorEmail || 'info@edv-knowhow.at';
  const minNc = config.minNextcloudVersion || '27';
  const maxNc = config.maxNextcloudVersion || '31';
  const category = config.category || 'organization';

  return `<?xml version="1.0" encoding="UTF-8"?>
<info xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="https://apps.nextcloud.com/schema/apps/info.xsd">
    <id>${appId}</id>
    <name>${escapeXml(appName)}</name>
    <summary>${escapeXml(description)}</summary>
    <description><![CDATA[
${description}

Generierte Module & Entitäten:
- Tabellen: ${tables.map(t => t.name).join(', ') || 'Keine'}
- Formulare: ${forms.map(f => f.name).join(', ') || 'Keine'}
- Berichte: ${reports.map(r => r.name).join(', ') || 'Keine'}
- Abfragen / Views: ${queries.map(q => q.name).join(', ') || 'Keine'}
    ]]></description>
    <version>${version}</version>
    <licence>${license}</licence>
    <author mail="${escapeXml(authorEmail)}">${escapeXml(author)}</author>
    <namespace>OCA\\${toPascalCase(appId)}</namespace>
    <category>${category}</category>
    
    <dependencies>
        <nextcloud min-version="${minNc}" max-version="${maxNc}" />
        <php min-version="8.1" max-version="8.4" />
    </dependencies>

    <navigation>
        <name>${escapeXml(appName)}</name>
        <route>${appId}.page.index</route>
        <icon>app.svg</icon>
        <order>10</order>
        <role>admin</role>
    </navigation>

    <routes>
        <http>
            <root>/</root>
        </http>
    </routes>

    ${config.enableCronBackgroundJobs ? `
    <background-jobs>
        <job>OCA\\${toPascalCase(appId)}\\Cron\\SyncCleanupJob</job>
    </background-jobs>
    ` : ''}

    ${config.enableActivityStream ? `
    <activity>
        <settings>
            <setting>OCA\\${toPascalCase(appId)}\\Activity\\EntityActivitySetting</setting>
        </settings>
        <providers>
            <provider>OCA\\${toPascalCase(appId)}\\Activity\\EntityActivityProvider</provider>
        </providers>
    </activity>
    ` : ''}
</info>
`;
};

const escapeXml = (unsafe: string): string => {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};

const toPascalCase = (str: string): string => {
  return str
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
};
