
import React from 'react';

interface RibbonButtonProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  size?: 'normal' | 'large';
  className?: string;
  disabled?: boolean;
  active?: boolean;
  title?: string;
}

export const RibbonButton: React.FC<RibbonButtonProps> = ({ 
  icon, 
  label, 
  sublabel, 
  onClick, 
  size = 'normal', 
  className = '', 
  disabled = false,
  active = false,
  title
}) => (
  <button 
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    title={title}
    className={`flex flex-col items-center justify-center p-2 rounded transition-colors cursor-pointer ${size === 'large' ? 'w-20' : 'w-16'} ${
      disabled 
        ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-500 hover:bg-transparent' 
        : active
          ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 font-semibold ring-1 ring-blue-400 dark:ring-blue-600 shadow-2xs'
          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white'
    } ${className}`}
  >
    <div className={`${size === 'large' ? 'scale-150 mb-2' : 'mb-1'} flex items-center justify-center shrink-0`}>
      {icon}
    </div>
    <span className="text-xs text-center leading-tight">{label}</span>
    {sublabel && <span className="text-[9px] text-slate-500 dark:text-slate-400 text-center leading-tight mt-0.5">{sublabel}</span>}
  </button>
);
