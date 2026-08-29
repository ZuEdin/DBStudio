import React from 'react';

interface CanvasGridProps {
  gridSize?: number;
  showGrid?: boolean;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const CanvasGrid: React.FC<CanvasGridProps> = ({
  gridSize = 16,
  showGrid = true,
  children,
  className = '',
  id = 'canvas_grid_container',
}) => {
  const gridStyle: React.CSSProperties = showGrid
    ? {
        backgroundImage: `radial-gradient(circle, #cbd5e1 1px, transparent 1px)`,
        backgroundSize: `${gridSize}px ${gridSize}px`,
      }
    : {};

  return (
    <div
      id={id}
      style={gridStyle}
      className={`relative w-full h-full min-h-[500px] bg-slate-50 overflow-auto select-none ${className}`}
    >
      {children}
    </div>
  );
};
