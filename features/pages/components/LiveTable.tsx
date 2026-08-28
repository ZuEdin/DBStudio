import React, { useState, useEffect, useContext, useMemo } from 'react';
import { PageComponent, ColumnDisplayConfig, QuickFilterPreset } from '../../../types/index';
import { useProjectStore } from '../../../stores/useProjectStore';
import { 
    PageParamsContext, 
    PageViewContext, 
    getNestedValueCaseInsensitive 
} from '../utils/pageViewUtils';
import { 
    applyFilterRules, 
    formatColumnValue, 
    evaluateCondition 
} from '../utils/filterAndDisplayUtils';
import { 
    Loader2, Plus, X, Search, Filter, ChevronLeft, ChevronRight, 
    Eye, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Tag 
} from 'lucide-react';

interface LiveTableProps {
    node: PageComponent;
    context?: Record<string, any>;
    fetchedData: any[];
    loading: boolean;
}

export const LiveTable: React.FC<LiveTableProps> = ({ node, context, fetchedData, loading }) => {
    const { queries, tables, updateTable } = useProjectStore();
    const { params, setParam } = useContext(PageParamsContext);
    const { openFormModal, showConfirm, navigate } = useContext(PageViewContext);

    // Search, filter, and pagination states
    const [globalSearch, setGlobalSearch] = useState('');
    const [activeQuickFilterId, setActiveQuickFilterId] = useState<string | null>(null);
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [sortField, setSortField] = useState<string>(node.props.defaultSortField || '');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(node.props.defaultSortDirection || 'asc');

    // Quick filters from props
    const quickFilters: QuickFilterPreset[] = node.props.quickFilters || [];
    const columnsConfig: ColumnDisplayConfig[] = node.props.columnsConfig || [];
    const enableSearchBar = node.props.enableSearchBar !== false;
    const searchPlaceholder = node.props.searchPlaceholder || 'Suchen...';

    // Columns parsing
    const columns = node.props.columns ? node.props.columns.split(',').map((c: string) => c.trim()).filter(Boolean) : [];

    // 1. Apply Filter Rules Engine (with legacy fallback)
    const filteredByRules = useMemo(() => {
        return applyFilterRules(
            fetchedData,
            node.props.filterRules,
            node.props.filterLogic || 'AND',
            params,
            context,
            node.props.filterParamField,
            node.props.filterParamName
        );
    }, [fetchedData, node.props.filterRules, node.props.filterLogic, params, context, node.props.filterParamField, node.props.filterParamName]);

    // 2. Apply Quick Filter Preset
    const filteredByPreset = useMemo(() => {
        if (!activeQuickFilterId) return filteredByRules;
        const activePreset = quickFilters.find(qf => qf.id === activeQuickFilterId);
        if (!activePreset) return filteredByRules;
        return filteredByRules.filter(row => {
            const val = getNestedValueCaseInsensitive(row, activePreset.field);
            return evaluateCondition(val, activePreset.operator || 'equals', activePreset.value);
        });
    }, [filteredByRules, activeQuickFilterId, quickFilters]);

    const displayData = columns.length > 0 ? filteredByPreset.map(row => {
        const newRow: any = {};
        columns.forEach((c: string) => newRow[c] = getNestedValueCaseInsensitive(row, c));
        return { ...newRow, _raw: row };
    }) : filteredByPreset.map(row => ({ ...row, _raw: row }));

    const tableId = node.props.dataSourceId;
    const targetTable = tables.find(t => t.id === tableId);
    const query = queries.find(q => q.id === tableId);
    const displayName = targetTable?.name || query?.name || 'Tabelle';
    const pkField = targetTable?.fields.find(f => f.isPrimaryKey) || targetTable?.fields[0];
    const pkFieldName = pkField?.name || 'Id';

    const queryColumns = query && query.type === 'SELECT' ? query.columns.filter(c => c.show).map(c => c.alias || c.fieldName) : [];
    const allColumns = columns.length > 0 ? columns : (targetTable ? targetTable.fields.map(f => f.name) : (queryColumns.length > 0 ? queryColumns : []));

    // --- Search and Filtering Logic ---
    let processedRows = displayData;

    // Global Search
    if (globalSearch.trim()) {
        const qLower = globalSearch.toLowerCase().trim();
        processedRows = processedRows.filter(row => {
            return allColumns.some(colName => {
                const val = getNestedValueCaseInsensitive(row, colName);
                return val !== undefined && val !== null && String(val).toLowerCase().includes(qLower);
            });
        });
    }

    // Column-specific filter
    Object.keys(columnFilters).forEach(colName => {
        const filterVal = columnFilters[colName].toLowerCase().trim();
        if (filterVal) {
            processedRows = processedRows.filter(row => {
                const val = getNestedValueCaseInsensitive(row, colName);
                return val !== undefined && val !== null && String(val).toLowerCase().includes(filterVal);
            });
        }
    });

    // Sorting Logic
    if (sortField) {
        processedRows = [...processedRows].sort((a, b) => {
            const valA = getNestedValueCaseInsensitive(a, sortField);
            const valB = getNestedValueCaseInsensitive(b, sortField);
            if (valA === valB) return 0;
            if (valA === undefined || valA === null) return 1;
            if (valB === undefined || valB === null) return -1;
            const numA = Number(valA);
            const numB = Number(valB);
            let cmp = 0;
            if (!isNaN(numA) && !isNaN(numB)) {
                cmp = numA - numB;
            } else {
                cmp = String(valA).localeCompare(String(valB));
            }
            return sortDirection === 'desc' ? -cmp : cmp;
        });
    }

    // --- Pagination Logic ---
    const itemsPerPage = node.props.pageSize || 10;
    const totalItems = processedRows.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    const paginatedRows = processedRows.slice(startIndex, startIndex + itemsPerPage);

    const triggerMode = node.props.rowClickTrigger || 'click';
    const [localSelectedId, setLocalSelectedId] = useState<any>(null);

    const handleSort = (colName: string) => {
        if (sortField === colName) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(colName);
            setSortDirection('asc');
        }
    };

    const handleRowClick = (row: any) => {
        if (node.props.enableSelection !== false) {
            const paramKey = node.props.selectionParamName || 'selectedId';
            const idVal = getNestedValueCaseInsensitive(row._raw, pkFieldName)
                ?? row._raw?.id
                ?? row._raw?.Id
                ?? row._raw?.ID
                ?? row._raw?.[pkFieldName];

            if (idVal !== undefined && idVal !== null) {
                setLocalSelectedId(idVal);
                if (triggerMode === 'click') {
                    if (node.props.detailsPageId) {
                        navigate(node.props.detailsPageId, { [paramKey]: idVal, selectedId: idVal });
                    } else {
                        setParam(paramKey, idVal);
                        if (paramKey !== 'selectedId') {
                            setParam('selectedId', idVal);
                        }
                    }
                }
            }
        }
    };

    const handleRowDoubleClick = (row: any) => {
        if (node.props.enableSelection !== false && triggerMode === 'dblclick') {
            const paramKey = node.props.selectionParamName || 'selectedId';
            const idVal = getNestedValueCaseInsensitive(row._raw, pkFieldName)
                ?? row._raw?.id
                ?? row._raw?.Id
                ?? row._raw?.ID
                ?? row._raw?.[pkFieldName];

            if (idVal !== undefined && idVal !== null) {
                setLocalSelectedId(idVal);
                if (node.props.detailsPageId) {
                    navigate(node.props.detailsPageId, { [paramKey]: idVal, selectedId: idVal });
                } else {
                    setParam(paramKey, idVal);
                    if (paramKey !== 'selectedId') {
                        setParam('selectedId', idVal);
                    }
                }
            }
        }
    };

    return (
        <div className={`p-4 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-lg overflow-hidden ${node.props.className || ''}`} style={node.props.style}>
            {/* Table Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span>{displayName}</span>
                    {node.props.filterRules && node.props.filterRules.length > 0 && (
                        <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                            {node.props.filterRules.length} Filter aktiv
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 animate-fadeIn flex-wrap sm:flex-nowrap">
                    <button 
                        onClick={() => setShowFilters(!showFilters)} 
                        className={`p-1.5 border rounded-md flex items-center justify-center transition ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'}`}
                        title="Spaltenfilter umschalten"
                    >
                        <Filter size={15} />
                    </button>

                    {enableSearchBar && (
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
                            <input 
                                type="text" 
                                placeholder={searchPlaceholder} 
                                className="pl-8 pr-7 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 w-40 sm:w-56 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                value={globalSearch}
                                onChange={e => {
                                    setGlobalSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                            {globalSearch && (
                                <button 
                                    onClick={() => { setGlobalSearch(''); setCurrentPage(1); }}
                                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    )}

                    {node.props.enableCrudActions && node.props.createFormId && (
                        <button 
                            onClick={() => openFormModal(node.props.createFormId, 'create')}
                            className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 px-3 rounded shadow-sm transition"
                        >
                            <Plus size={13} /> Neu hinzufügen
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Filter Chips */}
            {quickFilters.length > 0 && (
                <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
                    <button
                        type="button"
                        onClick={() => { setActiveQuickFilterId(null); setCurrentPage(1); }}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition ${
                            activeQuickFilterId === null
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        Alle ({fetchedData.length})
                    </button>
                    {quickFilters.map(qf => {
                        const isActive = activeQuickFilterId === qf.id;
                        return (
                            <button
                                key={qf.id}
                                type="button"
                                onClick={() => {
                                    setActiveQuickFilterId(isActive ? null : qf.id);
                                    setCurrentPage(1);
                                }}
                                className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition flex items-center gap-1 ${
                                    isActive
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <Tag size={11} />
                                <span>{qf.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>
            ) : (
                <div className="flex flex-col gap-3">
                    <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-lg">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                            <thead className="bg-slate-50 dark:bg-slate-800/60">
                                <tr>
                                    {allColumns.length > 0 ? allColumns.map(k => {
                                        const isSorted = sortField === k;
                                        const colCfg = columnsConfig.find(c => c.field === k);
                                        const colLabel = colCfg?.label || k;
                                        return (
                                            <th 
                                                key={k} 
                                                onClick={() => handleSort(k)}
                                                className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100/60 transition select-none"
                                            >
                                                <div className="flex items-center gap-1">
                                                    <span>{colLabel}</span>
                                                    {isSorted ? (
                                                        sortDirection === 'asc' ? <ArrowUp size={12} className="text-indigo-600" /> : <ArrowDown size={12} className="text-indigo-600" />
                                                    ) : (
                                                        <ArrowUpDown size={11} className="text-slate-300 hover:text-slate-500" />
                                                    )}
                                                </div>
                                            </th>
                                        );
                                    }) : <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Keine Einträge</th>}
                                    {node.props.enableCrudActions && <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Aktionen</th>}
                                </tr>
                                {showFilters && allColumns.length > 0 && (
                                    <tr className="bg-slate-100/40 dark:bg-slate-800/40">
                                        {allColumns.map(k => (
                                            <th key={k} className="px-2 py-1">
                                                <input 
                                                    type="text"
                                                    placeholder="Filtern..."
                                                    className="w-full px-2 py-1 text-[11px] font-normal border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                                                    value={columnFilters[k] || ''}
                                                    onChange={e => {
                                                        setColumnFilters({
                                                            ...columnFilters,
                                                            [k]: e.target.value
                                                        });
                                                        setCurrentPage(1);
                                                    }}
                                                />
                                            </th>
                                        ))}
                                        {node.props.enableCrudActions && <th className="px-2 py-1 text-right font-normal">
                                            {Object.keys(columnFilters).length > 0 && (
                                                <button 
                                                    onClick={() => { setColumnFilters({}); setCurrentPage(1); }} 
                                                    className="text-red-500 hover:text-red-700 text-[10px] font-semibold"
                                                >
                                                    Zurücksetzen
                                                </button>
                                            )}
                                        </th>}
                                    </tr>
                                )}
                            </thead>
                            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                                {paginatedRows.length > 0 ? paginatedRows.map((row, idx) => {
                                    const rowPk = getNestedValueCaseInsensitive(row._raw, pkFieldName) ?? row._raw?.id ?? row._raw?.Id ?? row._raw?.ID;
                                    const selParamVal = params[node.props.selectionParamName || 'selectedId'] ?? params['selectedId'] ?? params['id'];
                                    const isSelected = (selParamVal !== undefined && selParamVal !== null && String(rowPk) === String(selParamVal)) || (localSelectedId !== null && localSelectedId !== undefined && String(rowPk) === String(localSelectedId));
                                    return (
                                        <tr 
                                            key={idx} 
                                            onClick={() => handleRowClick(row)}
                                            onDoubleClick={() => handleRowDoubleClick(row)}
                                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer select-none ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''}`}
                                        >
                                            {allColumns.map((colName, vIdx) => {
                                                const rawVal = getNestedValueCaseInsensitive(row, colName);
                                                const colCfg = columnsConfig.find(c => c.field === colName);
                                                const { formatted } = formatColumnValue(rawVal, colCfg);
                                                return (
                                                    <td key={vIdx} className="px-3 py-2 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300 font-medium">
                                                        {formatted}
                                                    </td>
                                                );
                                            })}
                                            
                                            {node.props.enableCrudActions && (
                                                <td className="px-3 py-1.5 whitespace-nowrap text-xs text-right font-medium space-x-1.5" onClick={e => e.stopPropagation()}>
                                                    <button 
                                                        onClick={() => {
                                                            const rowId = row._raw[pkFieldName];
                                                            const selectionKey = node.props.selectionParamName || 'selectedId';
                                                            if (node.props.detailsPageId) {
                                                                navigate(node.props.detailsPageId, { [selectionKey]: rowId });
                                                            } else {
                                                                setParam(selectionKey, rowId);
                                                            }
                                                        }}
                                                        className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 px-2.5 py-1 rounded-md bg-indigo-50/50 hover:bg-indigo-100/60 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/40 border border-indigo-100/30 dark:border-indigo-900/30 transition shadow-xs"
                                                        title="Details anzeigen"
                                                    >
                                                        <Eye size={13} />
                                                        <span className="hidden sm:inline">Details</span>
                                                    </button>
                                                    {node.props.editFormId && (
                                                        <button 
                                                            onClick={() => {
                                                                const rowId = row._raw[pkFieldName];
                                                                openFormModal(node.props.editFormId, 'edit', rowId);
                                                            }}
                                                            className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 px-2.5 py-1 rounded-md bg-amber-50/50 hover:bg-amber-100/60 dark:bg-amber-950/20 dark:hover:bg-amber-900/40 border border-amber-100/30 dark:border-amber-900/30 transition shadow-xs"
                                                            title="Datensatz bearbeiten"
                                                        >
                                                            <Pencil size={13} />
                                                            <span className="hidden sm:inline">Bearbeiten</span>
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => {
                                                            const rowId = row._raw[pkFieldName];
                                                            showConfirm(
                                                                'Datensatz löschen',
                                                                'Möchten Sie diesen Datensatz wirklich löschen?',
                                                                () => {
                                                                    if (targetTable && targetTable.data) {
                                                                        const filtered = targetTable.data.filter(r => String(r[pkFieldName]) !== String(rowId));
                                                                        updateTable({ ...targetTable, data: filtered });
                                                                    }
                                                                }
                                                            );
                                                        }}
                                                        className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 px-2.5 py-1 rounded-md bg-red-50/50 hover:bg-red-100/60 dark:bg-red-950/20 dark:hover:bg-red-900/40 border border-red-100/30 dark:border-red-900/30 transition shadow-xs"
                                                        title="Löschen"
                                                    >
                                                        <Trash2 size={13} />
                                                        <span className="hidden sm:inline">Löschen</span>
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={allColumns.length + (node.props.enableCrudActions ? 1 : 0) || 1} className="px-3 py-8 text-center text-xs text-slate-400 italic">
                                            Keine Daten verfügbar
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls Footer */}
                    {totalItems > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 px-1 gap-2 text-xs text-slate-500 select-none">
                            <div>
                                Zeige <span className="font-semibold text-slate-700 dark:text-slate-300">{startIndex + 1}</span> bis <span className="font-semibold text-slate-700 dark:text-slate-300">{Math.min(startIndex + itemsPerPage, totalItems)}</span> von <span className="font-semibold text-slate-700 dark:text-slate-300">{totalItems}</span> Einträgen
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button 
                                    onClick={() => setCurrentPage(1)} 
                                    disabled={safeCurrentPage <= 1}
                                    className="px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition"
                                >
                                    Erste
                                </button>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                    disabled={safeCurrentPage <= 1}
                                    className="p-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition flex items-center justify-center"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <span className="px-3 py-1 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded">
                                    Seite {safeCurrentPage} von {totalPages}
                                </span>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                                    disabled={safeCurrentPage >= totalPages}
                                    className="p-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition flex items-center justify-center"
                                >
                                    <ChevronRight size={14} />
                                </button>
                                <button 
                                    onClick={() => setCurrentPage(totalPages)} 
                                    disabled={safeCurrentPage >= totalPages}
                                    className="px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition"
                                >
                                    Letzte
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

