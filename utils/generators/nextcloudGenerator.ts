import { Table, Query, Form, Report, CustomPage, VirtualFile, BackendConfig } from '../../types/index';
import { NextcloudAppConfig } from '../../types/nextcloud';
import { generateInfoXml } from './nextcloud/infoXml';
import { generateRoutesPhp } from './nextcloud/routesPhp';
import { generateApiController, generateTableController } from './nextcloud/apiController';
import { generatePageController } from './nextcloud/pageController';
import { generateTableService } from './nextcloud/services';
import { generateMigrationFile } from './nextcloud/migrations';
import { generateVueMainTs, generateVueApp, generateVueTableView, generateVueApiService } from './nextcloud/vueFrontend';
import { generatePackageJson, generateComposerJson } from './nextcloud/composerJson';
import { generateNextcloudApiMarkdown } from './nextcloud/markdownApiDoc';

export const getDefaultNextcloudConfig = (backendConfig?: BackendConfig): NextcloudAppConfig => {
  const baseName = backendConfig?.projectName || 'CustomApp';
  const slug = baseName.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/(^_|_$)/g, '') || 'dbs_custom_app';

  return {
    appId: slug,
    appName: `${baseName} Nextcloud App`,
    description: `Enterprise Nextcloud App für ${baseName} mit Tabellen, Formularen, OCP REST API und Vue.js Frontend.`,
    version: '1.0.0',
    author: 'DB Studio Pro',
    authorEmail: 'info@edv-knowhow.at',
    authorWebsite: 'https://dbstudiopro.edv-knowhow.at',
    license: 'AGPL-3.0-or-later',
    minNextcloudVersion: '27',
    maxNextcloudVersion: '31',
    category: 'organization',
    enableRestApi: true,
    enableVueFrontend: true,
    enableNavigationMenu: true,
    enableGroupPermissions: true,
    enableMigrations: true,
    enableCronBackgroundJobs: false,
    enableActivityStream: false,
    enableWebhookDispatcher: false,
    enablePublicNoCSRF: false,
    includedTableIds: [],
    includedFormIds: [],
    includedReportIds: [],
    includedQueryIds: [],
    supportedDbEngines: ['sqlite', 'mysql', 'postgres'],
    tablePrefix: 'dbs_'
  };
};

export const generateNextcloudApp = (
  tables: Table[],
  forms: Form[] = [],
  reports: Report[] = [],
  pages: CustomPage[] = [],
  queries: Query[] = [],
  customConfig?: Partial<NextcloudAppConfig>,
  backendConfig?: BackendConfig
): VirtualFile[] => {
  const config: NextcloudAppConfig = {
    ...getDefaultNextcloudConfig(backendConfig),
    ...(backendConfig?.nextcloudApp || {}),
    ...(customConfig || {})
  };

  const files: VirtualFile[] = [];

  // Filter included tables
  const selectedTables = config.includedTableIds && config.includedTableIds.length > 0
    ? tables.filter(t => config.includedTableIds.includes(t.id))
    : tables;

  const selectedForms = config.includedFormIds && config.includedFormIds.length > 0
    ? forms.filter(f => config.includedFormIds.includes(f.id))
    : forms;

  const selectedReports = config.includedReportIds && config.includedReportIds.length > 0
    ? reports.filter(r => config.includedReportIds.includes(r.id))
    : reports;

  const selectedQueries = config.includedQueryIds && config.includedQueryIds.length > 0
    ? queries.filter(q => config.includedQueryIds.includes(q.id))
    : queries;

  // 1. appinfo/info.xml
  files.push({
    name: 'info.xml',
    path: 'appinfo/info.xml',
    language: 'xml',
    content: generateInfoXml(config, selectedTables, selectedForms, selectedReports, pages, selectedQueries)
  });

  // 2. appinfo/routes.php
  files.push({
    name: 'routes.php',
    path: 'appinfo/routes.php',
    language: 'php',
    content: generateRoutesPhp(config, selectedTables, selectedQueries)
  });

  // 3. composer.json & package.json
  files.push({
    name: 'composer.json',
    path: 'composer.json',
    language: 'json',
    content: generateComposerJson(config)
  });

  files.push({
    name: 'package.json',
    path: 'package.json',
    language: 'json',
    content: generatePackageJson(config)
  });

  // 4. NEXTCLOUD_API.md (User instruction requirement: Markdown API file)
  files.push({
    name: 'NEXTCLOUD_API.md',
    path: 'NEXTCLOUD_API.md',
    language: 'markdown',
    content: generateNextcloudApiMarkdown(config, selectedTables, selectedQueries, selectedForms, selectedReports)
  });

  // 5. lib/Controller/ApiController.php & PageController.php
  files.push({
    name: 'ApiController.php',
    path: 'lib/Controller/ApiController.php',
    language: 'php',
    content: generateApiController(config, selectedTables)
  });

  files.push({
    name: 'PageController.php',
    path: 'lib/Controller/PageController.php',
    language: 'php',
    content: generatePageController(config)
  });

  // 6. Controllers & Services per Table
  selectedTables.forEach(table => {
    const tablePascal = toPascalCase(table.name);
    
    files.push({
      name: `${tablePascal}Controller.php`,
      path: `lib/Controller/${tablePascal}Controller.php`,
      language: 'php',
      content: generateTableController(table, config)
    });

    files.push({
      name: `${tablePascal}Service.php`,
      path: `lib/Service/${tablePascal}Service.php`,
      language: 'php',
      content: generateTableService(table, config)
    });
  });

  // 7. Migration
  if (config.enableMigrations && selectedTables.length > 0) {
    const migration = generateMigrationFile(selectedTables, config);
    const fileNameOnly = migration.filename.split('/').pop() || 'Migration.php';
    files.push({
      name: fileNameOnly,
      path: migration.filename,
      language: 'php',
      content: migration.content
    });
  }

  // 8. Vue Frontend
  if (config.enableVueFrontend) {
    files.push({
      name: 'main.ts',
      path: 'src/main.ts',
      language: 'typescript',
      content: generateVueMainTs(config)
    });

    files.push({
      name: 'App.vue',
      path: 'src/App.vue',
      language: 'typescript',
      content: generateVueApp(config, selectedTables, selectedForms)
    });

    files.push({
      name: 'TableView.vue',
      path: 'src/views/TableView.vue',
      language: 'typescript',
      content: generateVueTableView(config)
    });

    files.push({
      name: 'api.ts',
      path: 'src/services/api.ts',
      language: 'typescript',
      content: generateVueApiService(config)
    });

    files.push({
      name: 'main.php',
      path: 'templates/main.php',
      language: 'php',
      content: `<?php
script('${config.appId}', '${config.appId}-main');
style('${config.appId}', 'main');
?>
<div id="content" class="app-${config.appId}"></div>
`
    });
  }

  // 9. App Icon (SVG)
  files.push({
    name: 'app.svg',
    path: 'img/app.svg',
    language: 'xml',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
  <path d="M12 12v9" />
  <path d="m8 17 4 4 4-4" />
</svg>`
  });

  return files;
};

const toPascalCase = (str: string): string => {
  return str
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
};
