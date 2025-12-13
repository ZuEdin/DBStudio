
import React from 'react';
import { Network } from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';

interface ToolsTabProps {
  onAction: (action: string) => void;
}

export const ToolsTab: React.FC<ToolsTabProps> = ({ onAction }) => {
  return (
    <div className="flex gap-4 h-full">
      <RibbonGroup label="Beziehungen" isLast>
        <RibbonButton icon={<Network />} label="Beziehungen" onClick={() => onAction('relationships')} size="large" />
      </RibbonGroup>
    </div>
  );
};
