import { WordPressPluginConfig, WordPressShortcodeDef } from '../../types/wordpress';

export type WpTab = 'metadata' | 'entities' | 'shortcodes' | 'security' | 'preview';

export interface WpModalTabProps {
  config: WordPressPluginConfig;
  onChange: (updates: Partial<WordPressPluginConfig>) => void;
}
