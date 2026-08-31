import { NextcloudAppConfig, NcTab } from '../../types/nextcloud';

export type { NcTab };

export interface NextcloudGeneratorState {
  activeTab: NcTab;
  config: NextcloudAppConfig;
  selectedFileIndex: number;
}
