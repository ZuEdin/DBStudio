import React from 'react';
import { 
  BaseEdge, 
  EdgeLabelRenderer, 
  getSmoothStepPath, 
  EdgeProps 
} from '@xyflow/react';
import { NotationStyle } from '../types/erDesignerTypes';
import { Trash2, Edit2, ShieldAlert } from 'lucide-react';

export interface ERCustomEdgeData {
  relationship: any;
  notationStyle: NotationStyle;
  onEdit?: (rel: any) => void;
  onDelete?: (relId: string) => void;
  sourceTable?: string;
  targetTable?: string;
  sourceField?: string;
  targetField?: string;
}

export const ERCustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetPosition,
    targetX,
    targetY,
    borderRadius: 8
  });

  const edgeData = data as unknown as ERCustomEdgeData | undefined;
  const rel = edgeData?.relationship;
  const notationStyle: NotationStyle = edgeData?.notationStyle || 'crows_foot';

  const relType = rel?.type || '1:n';
  const onDelete = rel?.onDelete || 'NO ACTION';

  // Compute Source and Target Notation Badges based on selected style
  let sourceSymbol = '1';
  let targetSymbol = '∞';

  if (notationStyle === 'crows_foot') {
    sourceSymbol = '|| (1)';
    targetSymbol = relType === '1:1' ? '|| (1)' : '>0 (n)';
  } else if (notationStyle === 'uml') {
    sourceSymbol = '1';
    targetSymbol = relType === '1:1' ? '0..1' : '0..*';
  } else if (notationStyle === 'chen') {
    sourceSymbol = '(1,1)';
    targetSymbol = relType === '1:1' ? '(0,1)' : '(0,N)';
  }

  const isCascade = onDelete === 'CASCADE';

  return (
    <>
      <BaseEdge 
        id={id} 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{
          ...style,
          strokeWidth: selected ? 2.5 : 1.75,
          stroke: selected ? '#3b82f6' : (isCascade ? '#f59e0b' : '#64748b'),
        }} 
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan group"
        >
          {/* Main Central Interactive Pill */}
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border shadow-sm transition-all cursor-pointer ${
            selected 
              ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300' 
              : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:border-blue-400 hover:shadow-md'
          }`}>
            <span>{relType}</span>
            {isCascade && (
              <span className="text-amber-500 flex items-center gap-0.5 text-[9px]" title="ON DELETE CASCADE aktiv">
                <ShieldAlert size={10} />
              </span>
            )}

            {/* Quick action buttons on hover */}
            <div className="hidden group-hover:flex items-center gap-1 ml-1 border-l border-neutral-300 dark:border-neutral-600 pl-1">
              {edgeData?.onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    edgeData.onEdit?.(rel);
                  }}
                  className="p-0.5 hover:text-blue-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                  title="Beziehung bearbeiten"
                >
                  <Edit2 size={10} />
                </button>
              )}
              {edgeData?.onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    edgeData.onDelete?.(rel.id);
                  }}
                  className="p-0.5 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                  title="Beziehung trennen"
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Source Cardinality Symbol at line start */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${sourceX + (targetX > sourceX ? 18 : -18)}px, ${sourceY + (targetY > sourceY ? 14 : -14)}px)`,
            pointerEvents: 'none',
          }}
          className="text-[9px] font-mono font-bold bg-white/90 dark:bg-neutral-900/90 text-neutral-600 dark:text-neutral-400 px-1 py-0.2 rounded border border-neutral-200 dark:border-neutral-800 shadow-xs"
        >
          {sourceSymbol}
        </div>

        {/* Target Cardinality Symbol at line end */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${targetX + (sourceX > targetX ? 18 : -18)}px, ${targetY + (sourceY > targetY ? 14 : -14)}px)`,
            pointerEvents: 'none',
          }}
          className="text-[9px] font-mono font-bold bg-white/90 dark:bg-neutral-900/90 text-blue-600 dark:text-blue-400 px-1 py-0.2 rounded border border-blue-200 dark:border-blue-900 shadow-xs"
        >
          {targetSymbol}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
