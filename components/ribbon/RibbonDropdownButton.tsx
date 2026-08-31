import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface RibbonDropdownItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  badge?: string;
  badgeColor?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'blue' | 'purple' | 'slate' | 'teal' | 'sky';
  divider?: boolean;
}

interface RibbonDropdownButtonProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  items: RibbonDropdownItem[];
  size?: 'normal' | 'large';
  className?: string;
  disabled?: boolean;
  onMainClick?: () => void;
  menuWidth?: string;
  menuHeader?: string;
}

export const RibbonDropdownButton: React.FC<RibbonDropdownButtonProps> = ({
  icon,
  label,
  sublabel,
  items,
  size = 'large',
  className = '',
  disabled = false,
  onMainClick,
  menuWidth = 'w-72',
  menuHeader
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getBadgeClass = (color?: string) => {
    switch (color) {
      case 'emerald': return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300';
      case 'rose': return 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300';
      case 'amber': return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300';
      case 'blue': return 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300';
      case 'purple': return 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300';
      case 'indigo': return 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300';
      case 'teal': return 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300';
      case 'sky': return 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
    }
  };

  return (
    <div className="relative inline-flex" ref={containerRef}>
      {onMainClick ? (
        // Split-button mode: Top triggers primary action, bottom chevron triggers dropdown
        <div className={`flex flex-col items-center justify-between border rounded transition-all ${
          isOpen 
            ? 'bg-slate-200/90 dark:bg-slate-800 border-slate-300 dark:border-slate-700 shadow-inner' 
            : 'border-transparent hover:bg-slate-200/60 dark:hover:bg-slate-800/80 hover:border-slate-300/80 dark:hover:border-slate-700'
        } ${size === 'large' ? 'min-w-[80px]' : 'min-w-[64px]'} ${className}`}>
          <button
            type="button"
            onClick={disabled ? undefined : onMainClick}
            disabled={disabled}
            className="flex flex-col items-center justify-center pt-1.5 px-2 pb-0.5 w-full text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
          >
            <div className={`${size === 'large' ? 'scale-125 mb-1.5' : 'mb-1'} shrink-0`}>
              {icon}
            </div>
            <span className="text-xs font-semibold leading-tight text-center">{label}</span>
            {sublabel && <span className="text-[9px] text-slate-500 dark:text-slate-400 text-center leading-tight mt-0.5">{sublabel}</span>}
          </button>
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) setIsOpen(prev => !prev);
            }}
            disabled={disabled}
            className="w-full flex items-center justify-center py-0.5 hover:bg-slate-300/60 dark:hover:bg-slate-700 rounded-b text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
            title={`${label} Optionen anzeigen`}
          >
            <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''}`} />
          </button>
        </div>
      ) : (
        // Unified Dropdown Button: whole button clicks to toggle menu
        <button
          type="button"
          onClick={() => {
            if (!disabled) setIsOpen(prev => !prev);
          }}
          disabled={disabled}
          className={`flex flex-col items-center justify-between p-1.5 rounded border transition-all ${
            isOpen 
              ? 'bg-slate-200/90 dark:bg-slate-800 border-slate-300 dark:border-slate-700 shadow-inner' 
              : 'border-transparent hover:bg-slate-200/60 dark:hover:bg-slate-800/80 hover:border-slate-300/80 dark:hover:border-slate-700'
          } ${size === 'large' ? 'min-w-[80px] h-[72px]' : 'min-w-[64px] h-[64px]'} ${
            disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
          } ${className}`}
        >
          <div className={`${size === 'large' ? 'scale-125 mt-1 mb-1' : 'mt-0.5 mb-0.5'} shrink-0`}>
            {icon}
          </div>
          <div className="flex items-center justify-center gap-1 w-full text-center">
            <span className="text-xs font-semibold leading-tight text-slate-800 dark:text-slate-200 truncate max-w-[84px]">{label}</span>
            <ChevronDown size={11} className={`text-slate-500 dark:text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''}`} />
          </div>
          {sublabel && <span className="text-[9px] text-slate-500 dark:text-slate-400 text-center leading-tight">{sublabel}</span>}
        </button>
      )}

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className={`absolute top-full left-0 mt-1.5 ${menuWidth} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[120] overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100`}>
          {menuHeader && (
            <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {menuHeader}
              </span>
            </div>
          )}

          <div className="p-1.5 space-y-0.5 max-h-80 overflow-y-auto">
            {items.map((item) => (
              <React.Fragment key={item.id}>
                {item.divider && <div className="my-1 border-t border-slate-100 dark:border-slate-800" />}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    item.onClick();
                  }}
                  className="w-full flex items-start gap-2.5 p-2 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group cursor-pointer"
                >
                  {item.icon && (
                    <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0 transition-colors mt-0.5">
                      {item.icon}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold shrink-0 ${getBadgeClass(item.badgeColor)}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2 mt-0.5 font-normal">
                        {item.description}
                      </p>
                    )}
                  </div>
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
