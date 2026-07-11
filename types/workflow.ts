import React from 'react';

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    triggerConfig?: {
      event: 'onCreate' | 'onUpdate' | 'onDelete' | 'schedule';
      tableId?: string;
      cronExpression?: string;
    };
    conditionConfig?: {
      fieldId?: string;
      operator?: string;
      value?: string;
    };
    actionConfig?: {
      actionType: 'sendEmail' | 'updateRecord' | 'createRecord';
      emailTo?: string;
      emailSubject?: string;
    };
    apiConfig?: {
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      url: string;
      headers?: string;
      body?: string;
    };
    fileUploadConfig?: {
      tableId?: string;
      fileTypes?: string;
      maxSizeBytes?: number;
    };
    loopConfig?: {
      tableId?: string;
      sourceName?: string;
      variableName?: string;
    };
  };
  parentId?: string;
  extent?: 'parent';
  style?: React.CSSProperties;
  width?: number;
  height?: number;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  type?: string;
}

export interface Workflow {
  id: string;
  name: string;
  active: boolean;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}
