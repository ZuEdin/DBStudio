
import { useState, useMemo } from 'react';

export interface FilterState {
  [columnName: string]: string;
}

export const useDataFilter = (data: Record<string, any>[]) => {
  const [filters, setFilters] = useState<FilterState>({});
  const [showFilters, setShowFilters] = useState(false);

  // 1. Analyze Data to find unique values for Dropdowns
  const columnStats = useMemo(() => {
    if (!data.length) return {};
    
    const stats: Record<string, { uniqueValues: string[], isLowCardinality: boolean }> = {};
    const columns = Object.keys(data[0]);
    const MAX_DROPDOWN_ITEMS = 50; // Threshold: if more unique values, show text input

    columns.forEach(col => {
      const values = new Set<string>();
      data.forEach(row => {
        const val = row[col];
        if (val !== undefined && val !== null && val !== '') {
          values.add(String(val));
        }
      });
      
      const uniqueValues = Array.from(values).sort();
      stats[col] = {
        uniqueValues,
        isLowCardinality: uniqueValues.length > 0 && uniqueValues.length <= MAX_DROPDOWN_ITEMS
      };
    });

    return stats;
  }, [data]);

  // 2. Filter Logic
  const filteredData = useMemo(() => {
    if (Object.keys(filters).length === 0) return data;

    return data.filter(row => {
      return Object.entries(filters).every(([col, filterVal]) => {
        if (!filterVal) return true;
        
        const cellValue = String(row[col] ?? '').toLowerCase();
        const search = String(filterVal).toLowerCase();

        // Exact match for Dropdowns (unless it's a partial search intended)
        // We assume dropdowns want exact match, text inputs want 'contains'
        if (columnStats[col]?.isLowCardinality) {
            return cellValue === search;
        }
        
        return cellValue.includes(search);
      });
    });
  }, [data, filters, columnStats]);

  const setFilter = (col: string, val: string) => {
    setFilters(prev => {
      const next = { ...prev, [col]: val };
      if (!val) delete next[col];
      return next;
    });
  };

  const clearFilters = () => setFilters({});

  return {
    filters,
    setFilter,
    clearFilters,
    filteredData,
    showFilters,
    setShowFilters,
    columnStats
  };
};