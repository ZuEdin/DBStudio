
import React from 'react';
import { Type, Box, Columns, Download } from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';
import { useTranslation } from 'react-i18next';

interface FormDesignTabProps {
  onAction: (action: string) => void;
}

export const FormDesignTab: React.FC<FormDesignTabProps> = ({ onAction }) => {
  const { t } = useTranslation();
  return (
    <div className="flex gap-4 h-full">
      {/* Controls Group */}
      <RibbonGroup label={t('ribbon.groups.controls')}>
        <RibbonButton icon={<Type />} label={t('ribbon.actions.label')} onClick={() => onAction('form_add_label')} />
        <RibbonButton icon={<Box />} label={t('ribbon.actions.container')} onClick={() => onAction('form_add_container')} />
        <RibbonButton icon={<Columns />} label={t('ribbon.actions.columns_2')} onClick={() => onAction('form_add_2col')} />
      </RibbonGroup>
      
      {/* Tools */}
      <RibbonGroup label={t('ribbon.groups.export')} isLast>
        <RibbonButton icon={<Download />} label={t('ribbon.actions.export')} onClick={() => onAction('export_form')} />
      </RibbonGroup>
    </div>
  );
};
