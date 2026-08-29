import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

interface PropertyInspectorProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({
  title = 'Eigenschaften',
  children,
  className = '',
  id = 'property_inspector_panel',
}) => {
  return (
    <aside
      id={id}
      className={`w-72 bg-white border-l border-slate-200 flex flex-col h-full shadow-sm ${className}`}
    >
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">{children}</div>
    </aside>
  );
};
