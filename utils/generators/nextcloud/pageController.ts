import { NextcloudAppConfig } from '../../../types/nextcloud';

export const generatePageController = (config: NextcloudAppConfig): string => {
  const appPascal = toPascalCase(config.appId || 'dbs_custom_app');
  const namespace = `OCA\\${appPascal}\\Controller`;

  return `<?php
declare(strict_types=1);

namespace ${namespace};

use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\IRequest;
use OCP\Util;

/**
 * Frontend Page Controller
 * Lädt das Vue 3 / @nextcloud/vue Frontend in das Nextcloud App-Layout
 */
class PageController extends Controller {

    public function __construct(string $AppName, IRequest $request) {
        parent::__construct($AppName, $request);
    }

    #[NoAdminRequired]
    public function index(): TemplateResponse {
        Util::addScript('${config.appId}', '${config.appId}-main');
        Util::addStyle('${config.appId}', 'main');

        return new TemplateResponse('${config.appId}', 'main', [
            'appId' => '${config.appId}',
            'appName' => '${config.appName}'
        ]);
    }

    #[NoAdminRequired]
    public function viewTable(string $tableName): TemplateResponse {
        return $this->index();
    }

    #[NoAdminRequired]
    public function viewForm(string $formId): TemplateResponse {
        return $this->index();
    }
}
`;
};

const toPascalCase = (str: string): string => {
  return str
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
};
