
import React from 'react';

interface RibbonGroupProps {
  label: string;
  children: React.ReactNode;
  isLast?: boolean;
}

export const RibbonGroup: React.FC<RibbonGroupProps> = ({ label, children, isLast = false }) => {
  return (
    <div className={`flex flex-col items-center px-2 ${!isLast ? 'border-r border-slate-300 dark:border-slate-700/80 pr-4' : ''} h-full justify-between py-1 shrink-0`}>
      <div className="flex gap-2 items-start h-full">
        {children}
      </div>
      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-auto uppercase tracking-wider select-none font-semibold">{label}</span>
    </div>
  );
};
