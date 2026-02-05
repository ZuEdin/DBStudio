
import React, { useRef, useState, useEffect } from 'react';

interface VirtualTableProps {
  data: any[];
  headers: string[];
  rowHeight?: number;
  renderRow: (row: any, index: number) => React.ReactNode;
  className?: string;
}

export const VirtualTable: React.FC<VirtualTableProps> = ({ 
  data, headers, rowHeight = 35, renderRow, className = '' 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);

  useEffect(() => {
    if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
        
        const handleScroll = () => {
            if (containerRef.current) {
                setScrollTop(containerRef.current.scrollTop);
                // Sync horizontal scroll to header
                if (headerRef.current) {
                    headerRef.current.scrollLeft = containerRef.current.scrollLeft;
                }
            }
        };

        const container = containerRef.current;
        container.addEventListener('scroll', handleScroll);
        
        const observer = new ResizeObserver(entries => {
            if(entries[0]) setContainerHeight(entries[0].contentRect.height);
        });
        observer.observe(container);
        
        return () => {
            container.removeEventListener('scroll', handleScroll);
            observer.disconnect();
        }
    }
  }, []);

  const totalHeight = data.length * rowHeight;
  const startIndex = Math.floor(scrollTop / rowHeight);
  // Render a buffer of 10 rows
  const visibleCount = Math.ceil(containerHeight / rowHeight) + 10; 
  const endIndex = Math.min(data.length, startIndex + visibleCount);
  const startBuffer = Math.max(0, startIndex - 5);

  const visibleRows = data.slice(startBuffer, endIndex).map((row, i) => ({
      data: row,
      index: startBuffer + i,
      offset: (startBuffer + i) * rowHeight
  }));

  return (
    <div className={`flex flex-col h-full bg-white border border-slate-200 rounded overflow-hidden ${className}`}>
      {/* Header - overflow-hidden to hide scrollbar but allow programmatic scroll */}
      <div 
        ref={headerRef}
        className="flex bg-slate-100 border-b border-slate-300 font-bold text-xs text-slate-600 uppercase tracking-wider shrink-0 shadow-sm z-10 overflow-hidden"
      >
         {headers.map(h => (
             <div key={h} className="p-3 w-40 shrink-0 border-r border-slate-200 last:border-0 truncate">{h}</div>
         ))}
         {/* Spacer to match scrollbar width roughly if needed, or just let content flow */}
         <div className="w-4 shrink-0"></div>
      </div>
      
      {/* Virtual Body */}
      <div ref={containerRef} className="flex-1 overflow-auto relative">
         <div style={{ height: totalHeight, position: 'relative' }}>
            {visibleRows.map((row) => (
                <div 
                    key={row.index}
                    style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', // Ensure row takes full width for horizontal scrolling
                        height: rowHeight, 
                        transform: `translateY(${row.offset}px)` 
                    }}
                >
                    {renderRow(row.data, row.index)}
                </div>
            ))}
         </div>
         {data.length === 0 && <div className="p-10 text-center text-slate-400">Keine Daten.</div>}
      </div>
    </div>
  );
};
