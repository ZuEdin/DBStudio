import { NextcloudAppConfig } from '../../../types/nextcloud';

export const generatePackageJson = (config: NextcloudAppConfig): string => {
  return JSON.stringify({
    name: config.appId || 'dbs-nextcloud-app',
    version: config.version || '1.0.0',
    description: config.description || 'Nextcloud App powered by DB Studio Pro',
    private: true,
    scripts: {
      build: 'vite build',
      dev: 'vite build --watch',
      lint: 'eslint --ext .js,.ts,.vue src'
    },
    dependencies: {
      '@nextcloud/axios': '^2.5.0',
      '@nextcloud/router': '^3.0.1',
      '@nextcloud/vue': '^8.19.0',
      'vue': '^3.4.0'
    },
    devDependencies: {
      '@vitejs/plugin-vue': '^5.0.0',
      'typescript': '^5.3.3',
      'vite': '^5.1.0'
    }
  }, null, 2);
};

export const generateComposerJson = (config: NextcloudAppConfig): string => {
  const appId = config.appId || 'dbs_custom_app';
  const appPascal = appId
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');

  return JSON.stringify({
    name: `nextcloud/${appId.replace(/_/g, '-')}`,
    description: config.description || 'Nextcloud App',
    license: config.license || 'AGPL-3.0-or-later',
    authors: [
      {
        name: config.author || 'DB Studio Pro',
        email: config.authorEmail || 'info@edv-knowhow.at'
      }
    ],
    require: {
      'php': '^8.1 || ^8.2 || ^8.3 || ^8.4'
    },
    autoload: {
      'psr-4': {
        [`OCA\\\\${appPascal}\\\\`]: 'lib/'
      }
    }
  }, null, 2);
};
