import { BackendConfig, VirtualFile } from '../../types/index';
import { generateDockerFiles } from './deployment/docker';
import { generateFtpFiles } from './deployment/ftp';
import { generateGithubWorkflow } from './deployment/github';
import { generateElectronFiles } from './deployment/electron';
import { generateTauriFiles } from './deployment/tauri';
import { generateInfrastructureFiles } from './deployment/infrastructure';
import { generateEnvironmentBuildScripts } from './deployment/environments';

export const generateDeploymentScripts = (config: BackendConfig, root: string): VirtualFile[] => {
    const target = config.deploymentConfig?.target || 'docker';

    const files: VirtualFile[] = [
        ...generateDockerFiles(config, root, target),
        ...generateFtpFiles(config, root, target),
        ...generateGithubWorkflow(config, root, target),
        ...generateElectronFiles(config, root, target),
        ...generateTauriFiles(config, root, target),
        ...generateInfrastructureFiles(config, root, target),
        ...generateEnvironmentBuildScripts(config, target),
    ];

    return files;
};
