import React from 'react';
import { Play, Save, Settings, Plus, TerminalSquare } from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';
import { useTranslation } from 'react-i18next';

interface WorkflowDesignTabProps {
  onAction: (action: string) => void;
}

export const WorkflowDesignTab: React.FC<WorkflowDesignTabProps> = ({ onAction }) => {
  const { t } = useTranslation();

  return (
    <div className="flex gap-1 h-full">
      <RibbonGroup label="Aktionen">
        <RibbonButton icon={<Save className="text-emerald-600" />} label="Workflow Speichern" onClick={() => onAction('save_workflow')} />
        <RibbonButton icon={<Play className="text-green-600" />} label="Testlauf" onClick={() => onAction('test_workflow')} />
      </RibbonGroup>

      <RibbonGroup label="Nodes">
        <RibbonButton icon={<Plus />} label="Trigger" onClick={() => onAction('add_trigger_node')} />
        <RibbonButton icon={<Settings />} label="Condition" onClick={() => onAction('add_condition_node')} />
        <RibbonButton icon={<TerminalSquare />} label="Action" onClick={() => onAction('add_action_node')} />
      </RibbonGroup>

      <RibbonGroup label="Einstellungen" isLast>
        <RibbonButton icon={<Settings />} label="Eigenschaften" onClick={() => onAction('workflow_properties')} />
      </RibbonGroup>
    </div>
  );
};
