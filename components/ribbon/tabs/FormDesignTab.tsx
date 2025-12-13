
import React from 'react';
import { Type, Box, Columns, Download } from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';

interface FormDesignTabProps {
  onAction: (action: string) => void;
}

export const FormDesignTab: React.FC<FormDesignTabProps> = ({ onAction }) => {
  return (
    <div className="flex gap-4 h-full">
      {/* Controls Group */}
      <RibbonGroup label="Steuerelemente">
        <RibbonButton icon={<Type />} label="Label" onClick={() => onAction('form_add_label')} />
        <RibbonButton icon={<Box />} label="Container" onClick={() => onAction('form_add_container')} />
        <RibbonButton icon={<Columns />} label="Spalten (2)" onClick={() => onAction('form_add_2col')} />
      </RibbonGroup>
      
      {/* Tools */}
      <RibbonGroup label="Daten" isLast>
        <RibbonButton icon={<Download />} label="Export" onClick={() => onAction('export_form')} />
      </RibbonGroup>
    </div>
  );
};
