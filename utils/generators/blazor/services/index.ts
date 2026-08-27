import { BackendConfig, VirtualFile } from '../../../../types/index';
import { generateIStorageService } from './iStorageServiceGenerator';
import { generateIndexedDbService } from './indexedDbServiceGenerator';
import { generateApiService } from './apiServiceGenerator';
import { generateStorageServiceManager } from './storageServiceManagerGenerator';
import { generateAuthServices } from './authServiceGenerator';

export const generateBlazorServices = (
  config: BackendConfig,
  namespace: string,
  root: string,
  useAuth: boolean = false
): VirtualFile[] => {
  const files: VirtualFile[] = [];

  // 1. IStorageService.cs
  files.push(generateIStorageService(namespace, root));

  // 2. IndexedDbService.cs
  files.push(generateIndexedDbService(namespace, root));

  // 3. ApiService.cs
  files.push(generateApiService(namespace, root));

  // 4. StorageServiceManager.cs
  files.push(generateStorageServiceManager(namespace, root));

  // 5. AuthService & CustomAuthStateProvider
  if (useAuth) {
    files.push(...generateAuthServices(namespace, root));
  }

  return files;
};

export {
  generateIStorageService,
  generateIndexedDbService,
  generateApiService,
  generateStorageServiceManager,
  generateAuthServices
};
