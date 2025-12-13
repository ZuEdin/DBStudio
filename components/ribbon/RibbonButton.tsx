
import React from 'react';

interface RibbonButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  size?: 'normal' | 'large';
  className?: string;
}

export const RibbonButton: React.FC<RibbonButtonProps> = ({ icon, label, onClick, size = 'normal', className = '' }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2 rounded hover:bg-sky-100 hover:text-sky-900 transition-colors ${size === 'large' ? 'w-20' : 'w-16'} ${className}`}
  >
    <div className={`${size === 'large' ? 'scale-150 mb-2' : 'mb-1'}`}>
      {icon}
    </div>
    <span className="text-xs text-center leading-tight">{label}</span>
  </button>
);
