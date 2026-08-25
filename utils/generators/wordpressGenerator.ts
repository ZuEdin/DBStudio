import { Table, Query, Form, Report, CustomPage, VirtualFile, BackendConfig } from '../../types/index';
import { WordPressPluginConfig } from '../../types/wordpress';
import { generateMainPluginFile } from './wordpress/mainPlugin';
import { generateActivatorFile, generateDeactivatorFile } from './wordpress/activator';
import { generateRestApiFile } from './wordpress/restApi';
import { generateAdminMenuFile } from './wordpress/adminMenu';
import { generateShortcodesFile, generateGutenbergFile } from './wordpress/shortcodes';
import { generatePublicJs, generatePublicCss, generateAdminCss } from './wordpress/frontendAssets';
import { generateReadmeTxt } from './wordpress/readmeGenerator';

export const getDefaultWordPressConfig = (backendConfig?: BackendConfig): WordPressPluginConfig => {
  const baseName = backendConfig?.projectName || 'CustomApp';
  const slug = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'dbs-custom-plugin';

  return {
    pluginName: `${baseName} WP Plugin`,
    pluginSlug: slug,
    pluginUri: 'https://dbstudiopro.edv-knowhow.at',
    description: `Enterprise WordPress Plugin für ${baseName} mit Formularen, Views, Berichten und REST API.`,
    version: '1.0.0',
    author: 'DB Studio Pro',
    authorUri: 'https://dbstudiopro.edv-knowhow.at',
    textDomain: slug,
    license: 'GPL-2.0+',
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
  tables: Table[],
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
    ...(customConfig || {})
  };

  const slug = config.pluginSlug || 'dbs-plugin';
  const root = `${slug}`;

  const files: VirtualFile[] = [
    {
      name: `${slug}.php`,
      path: `${root}/${slug}.php`,
      language: 'php',
      content: generateMainPluginFile(config, tables, forms, reports, pages, queries)
    },
    {
      name: 'class-activator.php',
      path: `${root}/includes/class-activator.php`,
      language: 'php',
      content: generateActivatorFile(config, tables)
    },
    {
      name: 'class-deactivator.php',
      path: `${root}/includes/class-deactivator.php`,
      language: 'php',
      content: generateDeactivatorFile(config)
    },
    {
      name: 'class-rest-api.php',
      path: `${root}/includes/class-rest-api.php`,
      language: 'php',
      content: generateRestApiFile(config, tables, forms, reports, pages, queries)
    },
    {
      name: 'class-admin-menu.php',
      path: `${root}/includes/class-admin-menu.php`,
      language: 'php',
      content: generateAdminMenuFile(config, tables, forms, reports, pages, queries)
    },
    {
      name: 'class-shortcodes.php',
      path: `${root}/includes/class-shortcodes.php`,
      language: 'php',
      content: generateShortcodesFile(config, tables, forms, reports, pages)
    },
    {
      name: 'class-gutenberg.php',
      path: `${root}/includes/class-gutenberg.php`,
      language: 'php',
      content: generateGutenbergFile(config)
    },
    {
      name: 'dbs-public.js',
      path: `${root}/public/js/dbs-public.js`,
      language: 'javascript',
      content: generatePublicJs(config, tables, forms, reports, pages)
    },
    {
      name: 'dbs-public.css',
      path: `${root}/public/css/dbs-public.css`,
      language: 'css',
      content: generatePublicCss()
    },
    {
      name: 'dbs-admin.css',
      path: `${root}/admin/css/dbs-admin.css`,
      language: 'css',
      content: generateAdminCss()
    },
    {
      name: 'dbs-admin.js',
      path: `${root}/admin/js/dbs-admin.js`,
      language: 'javascript',
      content: `// DB Studio Admin Script\njQuery(document).ready(function($) {\n    console.log("DB Studio WordPress Admin Ready");\n});`
    },
    {
      name: 'readme.txt',
      path: `${root}/readme.txt`,
      language: 'text',
      content: generateReadmeTxt(config, tables, forms, reports, pages)
    }
  ];

  return files;
};
