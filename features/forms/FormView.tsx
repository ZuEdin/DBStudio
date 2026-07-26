
import React, { useState, useEffect, useRef } from 'react';
import { Form, Table, FormElement, Query, FormValidationRule } from '../../types/index';
import { ChevronLeft, ChevronRight, Plus, Trash2, Save, X, ChevronsLeft, ChevronsRight, Minimize2, ExternalLink, CheckCircle, XCircle, Layout, AlertCircle, ShieldAlert, Filter, ArrowUp, ArrowDown, RotateCcw, Search, PlusCircle, SlidersHorizontal, Zap, ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';
import { FormWidget } from './renderer/FormWidget';
import { evaluateFormFormula } from '../../utils/formulaEvaluator';
import { logAuditTrail } from '../../utils/auditTrail';
import { executeMacro, getSavedMacros } from '../logic/MacroEngine';
import { useProjectStore } from '../../stores/useProjectStore';

interface FormViewProps {
  form: Form;
  allForms: Form[];
  allTables: Table[];
  queries?: Query[];
  executeQuery?: (q: Query) => Record<string, any>[];
  onTableChange: (table: Table) => void;
  showConfirmation: (title: string, message: string, onConfirm: () => void, confirmText?: string, confirmClass?: string) => void;
  isSubform?: boolean;
  filteredData?: Record<string, any>[];
  parentRecord?: Record<string, any>;
  linkConfig?: { masterFieldId: string, childFieldId: string };
  onClose?: () => void;
  initialMode?: 'create' | 'edit' | 'view';
  hideNavigation?: boolean;
  hideActions?: boolean;
  hideHeader?: boolean;
  embedded?: boolean;
  defaultValues?: Record<string, any>;
  formActionTrigger?: { action: string, timestamp: number };
}

const DropdownButtonWidget: React.FC<{
  el: FormElement;
  allForms: Form[];
  allTables: Table[];
  queries?: Query[];
  currentRecord?: Record<string, any>;
  onTableChange?: (table: Table) => void;
  setSubformModal: React.Dispatch<React.SetStateAction<any>>;
}> = ({ el, allForms, allTables, queries, currentRecord, onTableChange, setSubformModal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubItemClick = async (item: any) => {
    setIsOpen(false);
    if (!item.actions || item.actions.length === 0) return;

    for (const act of item.actions) {
      if (act.actionType === 'RunMacro' && act.macroId) {
        const macros = getSavedMacros();
        const macro = macros.find(m => m.id === act.macroId);
        if (macro) {
          const store = (useProjectStore as any)?.getState ? (useProjectStore as any).getState() : {};
          executeMacro(macro, {
            tables: allTables,
            queries: queries && queries.length > 0 ? queries : (store.queries || []),
            reports: store.reports || [],
            relationships: store.relationships || [],
            currentRecord,
            onTableChange,
            onShowToast: (msg, type) => {
              alert(`[${type?.toUpperCase() || 'INFO'}] ${msg}`);
            }
          });
        } else {
          alert(`Makro mit ID "${act.macroId}" nicht gefunden.`);
        }
      } else if (act.actionType === 'ShowToast') {
        alert(act.toastMessage || 'Aktion ausgeführt!');
      } else if (act.actionType === 'OpenModal' && act.modalId) {
        const targetForm = allForms.find(f => f.id === act.modalId);
        if (targetForm) {
          setSubformModal({
            isOpen: true,
            formId: targetForm.id,
            parentField: '',
            childField: '',
            linkValue: null
          });
        }
      } else if (act.actionType === 'Navigate' && act.routeUrl) {
        window.location.hash = act.routeUrl;
      }
    }
  };

  const items = el.dropdownItems || [];

  return (
    <div ref={dropdownRef} className="relative inline-block my-2 text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={el.className || "bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center gap-2"}
      >
        <span>{el.label || 'Aktionen'}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 sm:left-0 mt-1.5 w-56 rounded-lg bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-[150] animate-in fade-in zoom-in-95 duration-100">
          {items.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400 italic">Keine Optionen vorhanden</div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSubItemClick(item)}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center justify-between transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-none"
              >
                <span className="flex items-center gap-2">
                  <Zap size={13} className="text-indigo-500 fill-indigo-400 shrink-0" />
                  {item.label}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export const FormView: React.FC<FormViewProps> = ({ 
  form, allForms, allTables, queries, executeQuery, onTableChange, showConfirmation, isSubform, filteredData, parentRecord, linkConfig, onClose, initialMode, hideNavigation, hideActions, hideHeader, embedded, defaultValues, formActionTrigger 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [tempRecord, setTempRecord] = useState<Record<string, any>>({});
  
  // MS Access Filter & Sorting States
  const [activeSort, setActiveSort] = useState<{ fieldName: string; direction: 'asc' | 'desc' } | null>(null);
  const [activeFilters, setActiveFilters] = useState<{ fieldName: string; value: any; operator: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than' | 'between' }[]>([]);
  const [filterEnabled, setFilterEnabled] = useState<boolean>(true);
  const [globalSearchText, setGlobalSearchText] = useState<string>('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fieldName: string; value: any } | null>(null);
  const [focusedFieldName, setFocusedFieldName] = useState<string | null>(null);

  // Advanced Filter Modal state
  const [filterModalOpen, setFilterModalOpen] = useState<boolean>(false);
  const [newFilterField, setNewFilterField] = useState<string>('');
  const [newFilterOperator, setNewFilterOperator] = useState<'equals' | 'not_equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than' | 'between'>('equals');
  const [newFilterValue, setNewFilterValue] = useState<string>('');
  const [newFilterValueMax, setNewFilterValueMax] = useState<string>('');

  // Modals state
  const [lookupModal, setLookupModal] = useState<{ isOpen: boolean; targetTableId: string; sourceFieldName: string; formId?: string } | null>(null);
  const [subformModal, setSubformModal] = useState<{ isOpen: boolean; formId: string; parentField: string; childField: string; linkValue: any } | null>(null);

  const sourceTable = allTables.find(t => t.id === form.sourceId);
  const isUnbound = !form.sourceId || form.sourceId === '';
  const isReadOnly = form.mode === 'readonly' || initialMode === 'readonly' || form.sourceType === 'query' || (!sourceTable && !isUnbound);
  const finalHideNavigation = hideNavigation || form.settings?.hideNavigation;
  
  const data = isSubform ? (filteredData || []) : (sourceTable?.data || []);

  // Compute processed data (applying filter, global search, and sorting)
  let processedData = [...data];

  if (filterEnabled && activeFilters.length > 0) {
      activeFilters.forEach(filter => {
          processedData = processedData.filter(row => {
              const val = row[filter.fieldName];
              const strVal = String(val ?? '').toLowerCase();
              const strTarget = String(filter.value ?? '').toLowerCase();

              if (filter.operator === 'equals') {
                  return String(val ?? '') === String(filter.value ?? '');
              } else if (filter.operator === 'not_equals') {
                  return String(val ?? '') !== String(filter.value ?? '');
              } else if (filter.operator === 'contains') {
                  return strVal.includes(strTarget);
              } else if (filter.operator === 'starts_with') {
                  return strVal.startsWith(strTarget);
              } else if (filter.operator === 'greater_than') {
                  const numVal = Number(val);
                  const numTarget = Number(filter.value);
                  if (!isNaN(numVal) && !isNaN(numTarget)) return numVal > numTarget;
                  return strVal > strTarget;
              } else if (filter.operator === 'less_than') {
                  const numVal = Number(val);
                  const numTarget = Number(filter.value);
                  if (!isNaN(numVal) && !isNaN(numTarget)) return numVal < numTarget;
                  return strVal < strTarget;
              } else if (filter.operator === 'between') {
                  const minVal = typeof filter.value === 'object' ? filter.value?.min : filter.value;
                  const maxVal = typeof filter.value === 'object' ? filter.value?.max : '';
                  const numVal = Number(val);
                  const numMin = Number(minVal);
                  const numMax = Number(maxVal);
                  if (!isNaN(numVal) && !isNaN(numMin) && !isNaN(numMax)) {
                      return numVal >= numMin && numVal <= numMax;
                  }
                  return strVal >= String(minVal ?? '').toLowerCase() && strVal <= String(maxVal ?? '').toLowerCase();
              }
              return true;
          });
      });
  }

  if (globalSearchText.trim() !== '') {
      const searchLower = globalSearchText.toLowerCase();
      processedData = processedData.filter(row => {
          return Object.values(row).some(val => 
              String(val ?? '').toLowerCase().includes(searchLower)
          );
      });
  }

  if (activeSort) {
      processedData.sort((a, b) => {
          const valA = a[activeSort.fieldName];
          const valB = b[activeSort.fieldName];
          if (valA === valB) return 0;
          if (valA === null || valA === undefined) return 1;
          if (valB === null || valB === undefined) return -1;
          
          const numA = Number(valA);
          const numB = Number(valB);
          if (!isNaN(numA) && !isNaN(numB)) {
              return activeSort.direction === 'asc' ? numA - numB : numB - numA;
          }

          const strA = String(valA).toLowerCase();
          const strB = String(valB).toLowerCase();
          const order = activeSort.direction === 'asc' ? 1 : -1;
          return strA > strB ? order : -order;
      });
  }
  
  const currentRecord = (isCreating || isUnbound) ? tempRecord : (processedData[currentIndex] || {});

  useEffect(() => {
    if (!isCreating && !isUnbound) {
        if (currentIndex >= processedData.length && processedData.length > 0) {
            setCurrentIndex(processedData.length - 1);
        } else if (processedData.length === 0) {
            setCurrentIndex(0);
        }
    }
  }, [processedData.length, isCreating, isUnbound, currentIndex]);

  useEffect(() => {
    if (!formActionTrigger || isUnbound) return;
    const { action } = formActionTrigger;
    switch (action) {
      case 'form_new_record':
        if (!isReadOnly) {
          startCreate();
        }
        break;
      case 'form_save_record':
        if (!isReadOnly) {
          if (isCreating) {
            saveNewRecord();
          } else {
            if (sourceTable) onTableChange(sourceTable);
          }
        }
        break;
      case 'form_delete_record':
        if (!isReadOnly && !isCreating) {
          deleteCurrentRecord();
        }
        break;
      case 'form_sort_asc': {
        const targetField = focusedFieldName 
          ? sourceTable?.fields.find(f => f.name === focusedFieldName)
          : (sourceTable?.fields.find(f => f.type === 'VARCHAR') || sourceTable?.fields[0]);
        if (targetField) {
          setActiveSort({ fieldName: targetField.name, direction: 'asc' });
        }
        break;
      }
      case 'form_sort_desc': {
        const targetField = focusedFieldName 
          ? sourceTable?.fields.find(f => f.name === focusedFieldName)
          : (sourceTable?.fields.find(f => f.type === 'VARCHAR') || sourceTable?.fields[0]);
        if (targetField) {
          setActiveSort({ fieldName: targetField.name, direction: 'desc' });
        }
        break;
      }
      case 'form_clear_sort':
        setActiveSort(null);
        break;
      case 'form_toggle_filter':
        if (activeFilters.length > 0) {
          setFilterEnabled(prev => !prev);
        } else {
          setFilterModalOpen(true);
        }
        break;
      case 'form_filter_selection': {
        const targetName = focusedFieldName || sourceTable?.fields[0]?.name;
        if (targetName && currentRecord && currentRecord[targetName] !== undefined && currentRecord[targetName] !== null) {
          const val = currentRecord[targetName];
          setActiveFilters(prev => [
            ...prev.filter(f => f.fieldName !== targetName),
            { fieldName: targetName, value: val, operator: 'equals' }
          ]);
          setFilterEnabled(true);
        } else {
          setFilterModalOpen(true);
        }
        break;
      }
      case 'form_filter_advanced':
        setFilterModalOpen(true);
        break;
      case 'form_refresh':
        setGlobalSearchText('');
        setActiveSort(null);
        setActiveFilters([]);
        setFilterEnabled(true);
        setCurrentIndex(0);
        break;
    }
  }, [formActionTrigger]);

  // Handle right click on input fields
  const handleContextMenu = (e: React.MouseEvent, fieldName: string, val: any) => {
      e.preventDefault();
      setFocusedFieldName(fieldName);
      setContextMenu({
          x: e.clientX,
          y: e.clientY,
          fieldName,
          value: val
      });
  };

  // Close context menu on document click
  useEffect(() => {
      const closeMenu = () => setContextMenu(null);
      window.addEventListener('click', closeMenu);
      return () => window.removeEventListener('click', closeMenu);
  }, []);

  const recalculateCalculatedFields = (record: Record<string, any>): Record<string, any> => {
      if (!form.layout) return record;

      const updatedRecord = { ...record };

      const walkAndCalculate = (el: FormElement) => {
          if (!el) return;
          if ((el.widgetType === 'calculated' || el.isCalculated) && el.calculationFormula && el.fieldId) {
              const targetName = getFieldName(el.fieldId);
              if (targetName) {
                  const calculatedVal = evaluateFormFormula(el.calculationFormula, updatedRecord);
                  updatedRecord[targetName] = calculatedVal;
              }
          }
          if (Array.isArray(el.children)) {
              el.children.forEach(walkAndCalculate);
          }
      };

      walkAndCalculate(form.layout);
      return updatedRecord;
  };

  const handleInputChange = (fieldName: string, value: any) => {
      if (isReadOnly) return;

      if (isCreating || isUnbound) {
          setTempRecord(prev => {
              const nextRec = { ...prev, [fieldName]: value };
              return recalculateCalculatedFields(nextRec);
          });
          return;
      }

      if (!sourceTable) return;

      const originalIndex = isSubform 
        ? sourceTable.data?.findIndex(row => JSON.stringify(row) === JSON.stringify(currentRecord)) 
        : currentIndex;
        
      if (originalIndex === undefined || originalIndex === -1) return;
      
      const newData = [...sourceTable.data!];
      const nextRec = recalculateCalculatedFields({ ...newData[originalIndex], [fieldName]: value });
      newData[originalIndex] = nextRec;
      onTableChange({ ...sourceTable, data: newData });
  };

  const getFieldName = (fieldId: string) => {
      for (const t of allTables) {
          const f = t.fields.find(field => field.id === fieldId);
          if (f) return f.name;
      }
      return '';
  };

  // Generic Create Logic (Used by Inline New and Modal New)
  const prepareNewRecord = (table: Table, masterFieldId?: string, childFieldId?: string, parentVal?: any) => {
      let initialData = table.fields.reduce((acc, field) => {
        if (field.defaultValue !== undefined && field.defaultValue !== '') {
            if (field.type === 'BOOLEAN') {
                acc[field.name] = field.defaultValue === 'true';
            } else if ((field.type === 'DATE' || field.type === 'TIME' || field.type === 'DATETIME' || field.type === 'TIMESTAMP') && 
                       (field.defaultValue.toUpperCase() === 'NOW' || 
                        field.defaultValue.toLowerCase() === 'now()' || 
                        field.defaultValue.toUpperCase() === 'CURRENT_TIMESTAMP' || 
                        field.defaultValue.toLowerCase() === 'current_timestamp()')) {
                acc[field.name] = new Date().toISOString();
            } else {
                acc[field.name] = field.defaultValue;
            }
        } else {
            acc[field.name] = '';
        }
        return acc;
      }, {} as Record<string, any>);

      if(masterFieldId && childFieldId && parentVal !== undefined) {
          const childFieldName = table.fields.find(f => f.id === childFieldId)?.name;
          if (childFieldName) {
              initialData[childFieldName] = parentVal;
          }
      }
      return initialData;
  };

  const startCreate = () => {
      if (isReadOnly || !sourceTable) return;
      
      let initialData = prepareNewRecord(sourceTable);

      // Pre-fill Foreign Keys if Subform
      if(isSubform && parentRecord && linkConfig) {
          const masterFieldName = getFieldName(linkConfig.masterFieldId);
          if (masterFieldName && parentRecord[masterFieldName] !== undefined) {
              // Re-run prepare with link info
              initialData = prepareNewRecord(sourceTable, linkConfig.masterFieldId, linkConfig.childFieldId, parentRecord[masterFieldName]);
          }
      } 
      
      if (defaultValues) {
          initialData = { ...initialData, ...defaultValues };
      }
      
      setTempRecord(initialData);
      setIsCreating(true);
  };

  const [validationError, setValidationError] = useState<string | null>(null);

  // Validate record before save
  const validateRecord = (record: Record<string, any>): boolean => {
    setValidationError(null);
    if (!sourceTable) return true;

    // 1. Check required fields
    for (const field of sourceTable.fields) {
      if (!field.allowNull && !field.isAutoIncrement && field.type !== 'BOOLEAN') {
        const val = record[field.name];
        if (val === undefined || val === null || String(val).trim() === '') {
          setValidationError(`Pflichtfeld-Fehler: '${field.name}' darf nicht leer sein.`);
          return false;
        }
      }
    }

    // 2. Check Form Validation Rules
    if (form.validationRules) {
      for (const rule of form.validationRules) {
        const fieldName = getFieldName(rule.fieldId);
        const val = record[fieldName];

        if (rule.type === 'required' && (!val || String(val).trim() === '')) {
          setValidationError(rule.errorMessage || `Feld '${fieldName}' ist erforderlich.`);
          return false;
        }

        if (rule.type === 'regex' && rule.regexPattern && val) {
          try {
            const re = new RegExp(rule.regexPattern);
            if (!re.test(String(val))) {
              setValidationError(rule.errorMessage || `Feld '${fieldName}' entspricht nicht dem erforderlichen Muster.`);
              return false;
            }
          } catch (e) {
            console.error('Invalid Regex in validation rule', e);
          }
        }

        if (rule.type === 'min' && rule.minValue !== undefined && val !== undefined) {
          if (Number(val) < rule.minValue) {
            setValidationError(rule.errorMessage || `Feld '${fieldName}' muss mindestens ${rule.minValue} sein.`);
            return false;
          }
        }

        if (rule.type === 'max' && rule.maxValue !== undefined && val !== undefined) {
          if (Number(val) > rule.maxValue) {
            setValidationError(rule.errorMessage || `Feld '${fieldName}' darf höchstens ${rule.maxValue} sein.`);
            return false;
          }
        }
      }
    }

    return true;
  };

  const saveNewRecord = () => {
      if (!sourceTable) return;
      const recordToSave = { ...tempRecord };

      if (!validateRecord(recordToSave)) return;

      // Auto Increment ID
      sourceTable.fields.forEach(f => {
          if (f.isAutoIncrement && f.type === 'INTEGER' && !recordToSave[f.name]) {
               const maxVal = (sourceTable.data || []).reduce((max, row) => {
                  const val = parseInt(row[f.name], 10);
                  return !isNaN(val) && val > max ? val : max;
              }, 0);
              recordToSave[f.name] = maxVal + 1;
          }
      });

      const newData = [...(sourceTable.data || []), recordToSave];
      onTableChange({ ...sourceTable, data: newData });

      // Audit Log
      logAuditTrail({
        tableName: sourceTable.name,
        recordId: recordToSave.id || recordToSave.ID || 'NEW',
        action: 'INSERT',
        user: 'admin',
        details: `Datensatz in Formular '${form.name}' neu angelegt.`
      });

      // Stay in create mode, clear temp record
      let initialData: Record<string, any> = {};
      if (defaultValues) {
          initialData = { ...initialData, ...defaultValues };
      }
      setTempRecord(initialData);
  };

  const cancelCreate = () => {
      setIsCreating(false);
      setTempRecord({});
  };

  const deleteCurrentRecord = () => {
     if (isReadOnly || data.length === 0 || !sourceTable || isCreating) return;
     showConfirmation(
      'Datensatz löschen',
      'Möchten Sie diesen Datensatz wirklich löschen?',
      () => {
        const originalIndex = isSubform 
            ? sourceTable.data?.findIndex(row => JSON.stringify(row) === JSON.stringify(currentRecord)) 
            : currentIndex;
            
        if (originalIndex === undefined || originalIndex === -1) return;

        const deletedRec = sourceTable.data![originalIndex];
        const newFullData = (sourceTable.data || []).filter((_, i) => i !== originalIndex);
        onTableChange({...sourceTable, data: newFullData});

        // Audit Log
        logAuditTrail({
          tableName: sourceTable.name,
          recordId: deletedRec?.id || deletedRec?.ID || originalIndex,
          action: 'DELETE',
          user: 'admin',
          details: `Datensatz in Formular '${form.name}' gelöscht.`
        });
      }
     );
  };

  const getLookupOptions = (config: any) => {
      let rows: any[] = [];
      let fields: any[] = [];
      
      const table = allTables.find(t => t.id === config.tableId);
      if (table) {
          rows = [...(table.data || [])];
          fields = table.fields.map(f => ({ id: f.id, name: f.name, isPrimaryKey: f.isPrimaryKey }));
      } else if (queries && executeQuery) {
          const query = queries.find(q => q.id === config.tableId);
          if (query && query.type === 'SELECT') {
              const context: Record<string, any> = {};
              if (form.name && currentRecord) {
                  for (const key in currentRecord) {
                      context[`forms.${form.name.toLowerCase()}.${key.toLowerCase()}`] = currentRecord[key];
                  }
              }
              rows = [...executeQuery(query, context)];
              fields = query.columns.map(c => ({ id: c.id, name: c.alias || c.fieldName, isPrimaryKey: false }));
          }
      }

      if (rows.length === 0) return [];
      
      if (config.sort && config.sort.fieldId) {
          const sortField = fields.find(f => f.id === config.sort.fieldId);
          if (sortField) {
              const fieldName = sortField.name;
              const direction = config.sort.direction || 'ASC';
              rows.sort((a, b) => {
                  const valA = a[fieldName];
                  const valB = b[fieldName];
                  if (valA === undefined || valA === null) return 1;
                  if (valB === undefined || valB === null) return -1;
                  
                  let comparison = 0;
                  if (typeof valA === 'number' && typeof valB === 'number') {
                      comparison = valA - valB;
                  } else {
                      comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
                  }
                  return direction === 'ASC' ? comparison : -comparison;
              });
          }
      }
      
      if (config.displayFormat && config.displayFormat.length > 0) {
          return rows.map(row => {
              const label = config.displayFormat.map((item: any) => {
                  const f = fields.find(field => field.id === item.fieldId);
                  return `${item.prefix || ''}${f ? row[f.name] : ''}${item.suffix || ''}`;
              }).join('');
              const valField = fields.find(f => f.id === config.valueFieldId) || fields.find(f => f.isPrimaryKey);
              return { value: valField ? row[valField.name] : '', label: label };
          });
      }
      return rows.map(row => ({ value: row.id || Object.values(row)[0], label: Object.values(row).slice(0, 2).join(' ') }));
  };

  // --- Subform Modal Logic ---
  const handleOpenSubformModal = (formId: string, masterFieldId: string, childFieldId: string) => {
      if (!sourceTable || !currentRecord) return;
      const masterFieldName = getFieldName(masterFieldId);
      const linkValue = currentRecord[masterFieldName];
      
      setSubformModal({
          isOpen: true,
          formId,
          parentField: masterFieldId,
          childField: childFieldId,
          linkValue
      });
  };

  const handleSubformSaveFromModal = (updatedTable: Table) => {
      onTableChange(updatedTable);
      // Close modal
      setSubformModal(null);
  };

  const evalVisibility = (el: FormElement) => {
      // Role check (mocked for now, assuming current user has 'admin' or no restrictions)
      if (el.allowedRoles && el.allowedRoles.length > 0) {
          // If we had a real user context, we'd check roles here. 
          // For now, we allow it if we're in designer or assume 'admin' is always granted.
          // In a real app, this would be: if (!el.allowedRoles.includes(currentUser.role)) return false;
      }

      if (!el.visibilityCondition || !el.visibilityCondition.fieldId) return true;
      const targetField = sourceTable?.fields.find(f => f.id === el.visibilityCondition!.fieldId);
      if (!targetField) return true;
      
      const val = currentRecord[targetField.name];
      const checkVal = el.visibilityCondition.value;
      
      if (el.visibilityCondition.operator === 'eq') return String(val || '') === String(checkVal || '');
      if (el.visibilityCondition.operator === 'neq') return String(val || '') !== String(checkVal || '');
      
      return true;
  };

  const renderElement = (el: FormElement) => {
      if (!evalVisibility(el)) return null;

      if (el.type === 'container') return <div key={el.id} className={el.className}>{el.children?.map(renderElement)}</div>;
      if (el.type === 'label') return <div key={el.id} className={el.className}>{el.label}</div>;
      if (el.type === 'button') {
          const handleButtonClick = (e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();

              if (!el.actions || el.actions.length === 0) {
                  alert(`Schaltfläche "${el.label || 'Button'}": Keine Aktion konfiguriert.`);
                  return;
              }

              el.actions.forEach(act => {
                  if (act.actionType === 'RunMacro') {
                      const savedMacros = getSavedMacros();
                      const macro = savedMacros.find(m => m.id === act.macroId);
                      if (macro) {
                          const store = (useProjectStore as any)?.getState ? (useProjectStore as any).getState() : {};
                          executeMacro(macro, {
                              tables: allTables,
                              queries: queries && queries.length > 0 ? queries : (store.queries || []),
                              reports: store.reports || [],
                              relationships: store.relationships || [],
                              currentRecord,
                              onTableChange,
                              onShowToast: (msg, type) => {
                                  alert(`[${type?.toUpperCase() || 'INFO'}] ${msg}`);
                              }
                          });
                      } else if (!act.macroId) {
                          alert(`Schaltfläche "${el.label || 'Makro'}": Bitte wählen Sie im Formularentwurf in den Eigenschaften ein Makro aus.`);
                      } else {
                          alert(`Makro mit ID "${act.macroId}" nicht gefunden.`);
                      }
                  } else if (act.actionType === 'ShowToast') {
                      alert(act.toastMessage || 'Aktion ausgeführt!');
                  } else if (act.actionType === 'OpenModal' && act.modalId) {
                      const targetForm = allForms.find(f => f.id === act.modalId);
                      if (targetForm) {
                          setSubformModal({
                              isOpen: true,
                              formId: targetForm.id,
                              parentField: '',
                              childField: '',
                              linkValue: null
                          });
                      }
                  } else if (act.actionType === 'Navigate' && act.routeUrl) {
                      window.location.hash = act.routeUrl;
                  }
              });
          };

          return (
              <div key={el.id} className={`my-2 inline-block ${el.className || ''}`}>
                  <button
                      type="button"
                      onClick={handleButtonClick}
                      className={el.className || "bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center gap-2"}
                  >
                      <Zap size={16} className="text-amber-300 fill-amber-200" />
                      <span>{el.label || 'Makro ausführen'}</span>
                  </button>
              </div>
          );
      }
      if (el.type === 'dropdown_button') {
          return (
              <DropdownButtonWidget 
                  key={el.id} 
                  el={el} 
                  allForms={allForms} 
                  allTables={allTables}
                  queries={queries}
                  currentRecord={currentRecord}
                  onTableChange={onTableChange}
                  setSubformModal={setSubformModal} 
              />
          );
      }
      if (el.type === 'field') {
          return <FormWidget 
            key={el.id} element={el} value={currentRecord[allTables.find(t=>t.id===form.sourceId)?.fields.find(f=>f.id===el.fieldId)?.name || ''] ?? ''}
            sourceTable={sourceTable} isReadOnly={isReadOnly} onChange={handleInputChange} getLookupOptions={getLookupOptions}
            onOpenLookupModal={(tid, fname, fid) => setLookupModal({ isOpen: true, targetTableId: tid, sourceFieldName: fname, formId: fid })}
            onContextMenu={handleContextMenu}
            onFocusField={(fname) => setFocusedFieldName(fname)}
          />;
      }
      if (el.type === 'subform' && el.subform) {
          // --- LOGIC CHANGE: BLOCK SUBFORM IF PARENT IS CREATING ---
          if (isCreating) {
              return (
                  <div key={el.id} className={`border-2 border-dashed border-slate-300 rounded-lg p-6 bg-slate-50 mt-4 text-center ${el.className || ''}`}>
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                          <AlertCircle size={24} />
                          <p className="font-semibold text-sm">Unterformular "{el.label}" nicht verfügbar</p>
                          <p className="text-xs">Bitte speichern Sie den Hauptdatensatz, bevor Sie Einträge hinzufügen.</p>
                      </div>
                  </div>
              );
          }

          const subDef = allForms.find(f => f.id === el.subform!.formId);
          if (!subDef) return <div key={el.id} className="text-red-500">Subform nicht gefunden.</div>;
          
          const subTable = allTables.find(t => t.id === subDef.sourceId);
          let subformData: Record<string, any>[] = [];
          
          if (sourceTable && subTable && currentRecord) {
             const masterLinkField = sourceTable.fields.find(f => f.id === el.subform!.masterLinkFieldId);
             const childLinkField = subTable.fields.find(f => f.id === el.subform!.childLinkFieldId);
             if (masterLinkField && childLinkField) {
                 const linkValue = currentRecord[masterLinkField.name];
                 subformData = (subTable.data || []).filter(row => row[childLinkField.name] == linkValue);
             }
          }

          return (
            <div key={el.id} className={`border border-slate-300 rounded-md overflow-hidden mt-4 ${el.className || ''}`}>
                <div className="bg-slate-100 p-2 flex justify-between items-center border-b border-slate-200">
                    <span className="font-bold text-sm text-slate-700 flex items-center gap-2">
                        <Layout size={14}/> {el.label || subDef.name} ({subformData.length})
                    </span>
                    {!isReadOnly && el.subform.canAdd && (
                        <button 
                            onClick={() => handleOpenSubformModal(el.subform!.formId, el.subform!.masterLinkFieldId, el.subform!.childLinkFieldId)}
                            className="bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 rounded px-2 py-1 text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
                        >
                            <Plus size={12} strokeWidth={3}/> Eintrag hinzufügen
                        </button>
                    )}
                </div>
                <div className="p-2 bg-slate-50/50">
                    {subformData.length > 0 ? (
                        <FormView 
                            form={subDef}
                            allForms={allForms}
                            allTables={allTables}
                            queries={queries}
                            executeQuery={executeQuery}
                            onTableChange={onTableChange}
                            showConfirmation={showConfirmation}
                            isSubform={true}
                            filteredData={subformData}
                            parentRecord={currentRecord}
                            linkConfig={{ masterFieldId: el.subform!.masterLinkFieldId, childFieldId: el.subform!.childLinkFieldId }}
                        />
                    ) : (
                        <div className="p-6 text-center">
                            <p className="text-slate-400 text-sm mb-3">Keine Einträge vorhanden.</p>
                            {!isReadOnly && el.subform.canAdd && (
                                <button 
                                    onClick={() => handleOpenSubformModal(el.subform!.formId, el.subform!.masterLinkFieldId, el.subform!.childLinkFieldId)}
                                    className="bg-blue-50 text-blue-600 px-4 py-2 rounded text-sm font-medium hover:bg-blue-100 transition-colors mx-auto flex items-center gap-2"
                                >
                                    <Plus size={14}/> Ersten Eintrag erstellen
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
          );
      }
      return null;
  };

  const handleQuickCreateSave = (updatedTable: Table) => {
      onTableChange(updatedTable);
      const lastRow = updatedTable.data?.[updatedTable.data.length - 1];
      if (lastRow && lookupModal) {
          const targetTable = allTables.find(t => t.id === lookupModal.targetTableId);
          const pkField = updatedTable.fields.find(f => f.isPrimaryKey);
          if (pkField) {
              handleInputChange(lookupModal.sourceFieldName, lastRow[pkField.name]);
          }
      }
      setLookupModal(null);
  };

  // --- Context Menu Render (MS Access) ---
  const renderContextMenu = () => {
      if (!contextMenu) return null;

      return createPortal(
          <div 
              style={{ top: contextMenu.y, left: contextMenu.x }}
              className="fixed z-[1000] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-xl rounded-md py-1 min-w-[220px] text-xs text-slate-700 dark:text-slate-200 font-sans"
              onClick={(e) => e.stopPropagation()}
          >
              <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  Filter & Sortieren
              </div>
              <button 
                  onClick={() => {
                      setActiveFilters(prev => [
                          ...prev.filter(f => f.fieldName !== contextMenu.fieldName),
                          { fieldName: contextMenu.fieldName, value: contextMenu.value, operator: 'equals' }
                      ]);
                      setFilterEnabled(true);
                      setContextMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 font-medium"
              >
                  <Filter size={14} className="text-indigo-600" />
                  <span>Filtern nach Auswahl (="{contextMenu.value !== null && contextMenu.value !== undefined ? String(contextMenu.value) : ''}")</span>
              </button>
              <button 
                  onClick={() => {
                      setActiveFilters(prev => [
                          ...prev.filter(f => f.fieldName !== contextMenu.fieldName),
                          { fieldName: contextMenu.fieldName, value: contextMenu.value, operator: 'not_equals' }
                      ]);
                      setFilterEnabled(true);
                      setContextMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 font-medium"
              >
                  <Filter size={14} className="text-rose-600" />
                  <span>Filter ausschließen (&ne; "{contextMenu.value !== null && contextMenu.value !== undefined ? String(contextMenu.value) : ''}")</span>
              </button>
              <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>
              <button 
                  onClick={() => {
                      setActiveSort({ fieldName: contextMenu.fieldName, direction: 'asc' });
                      setContextMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 font-medium"
              >
                  <ArrowUp size={14} className="text-emerald-600" />
                  <span>Aufsteigend sortieren ({contextMenu.fieldName})</span>
              </button>
              <button 
                  onClick={() => {
                      setActiveSort({ fieldName: contextMenu.fieldName, direction: 'desc' });
                      setContextMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 font-medium"
              >
                  <ArrowDown size={14} className="text-amber-600" />
                  <span>Absteigend sortieren ({contextMenu.fieldName})</span>
              </button>
              <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>
              <button 
                  onClick={() => {
                      setActiveFilters(prev => prev.filter(f => f.fieldName !== contextMenu.fieldName));
                      setContextMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 font-medium"
              >
                  <RotateCcw size={14} className="text-slate-500" />
                  <span>Filter für {contextMenu.fieldName} entfernen</span>
              </button>
              <button 
                  onClick={() => {
                      setActiveFilters([]);
                      setActiveSort(null);
                      setContextMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-rose-600 dark:text-rose-400 flex items-center gap-2 font-medium"
              >
                  <RotateCcw size={14} />
                  <span>Alle Filter & Sortierungen löschen</span>
              </button>
          </div>,
          document.body
      );
  };

  // --- Modals Render ---
  const renderLookupModal = () => {
      if (!lookupModal || !lookupModal.isOpen) return null;
      const targetTable = allTables.find(t => t.id === lookupModal.targetTableId);
      if (!targetTable) return null;
      let targetForm = lookupModal.formId ? allForms.find(f => f.id === lookupModal.formId) : undefined;

      if (!targetForm) {
          targetForm = {
              id: 'temp_qc_' + crypto.randomUUID(),
              name: `Neu: ${targetTable.name}`,
              sourceType: 'table',
              sourceId: targetTable.id,
              layout: {
                  id: 'root', type: 'container', className: 'p-6 space-y-4',
                  children: targetTable.fields.filter(f => !f.isAutoIncrement).map(f => ({
                      id: f.id, type: 'field', fieldId: f.id, label: f.name, className: 'mb-4'
                  }))
              },
              fields: []
          };
      }

      return (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-white w-full max-w-3xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden relative border border-slate-300">
                  <div className="flex justify-between items-center bg-slate-100 p-2 px-4 border-b border-slate-200 shrink-0">
                      <span className="text-sm font-bold text-slate-600 flex items-center gap-2"><ExternalLink size={14}/> Quick Create: {targetTable.name}</span>
                      <button onClick={() => setLookupModal(null)} className="p-1 hover:bg-slate-200 rounded text-slate-500"><X size={18}/></button>
                  </div>
                  <div className="flex-1 overflow-hidden relative">
                    <FormView 
                        form={targetForm}
                        allForms={allForms}
                        allTables={allTables}
                        queries={queries}
                        executeQuery={executeQuery}
                        onTableChange={handleQuickCreateSave}
                        showConfirmation={showConfirmation}
                        isSubform={false}
                        onClose={() => setLookupModal(null)}
                        linkConfig={undefined} // Quick Create usually doesn't cascade yet
                    />
                  </div>
              </div>
          </div>
      );
  };

  const renderSubformModal = () => {
      if (!subformModal || !subformModal.isOpen) return null;
      const targetForm = allForms.find(f => f.id === subformModal.formId);
      if (!targetForm) return null;
      const targetTable = allTables.find(t => t.id === targetForm.sourceId);
      if (!targetTable) return null;

      return (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-white w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden relative border border-slate-300">
                  <div className="flex justify-between items-center bg-indigo-50 p-3 px-4 border-b border-indigo-100 shrink-0">
                      <span className="text-sm font-bold text-indigo-800 flex items-center gap-2"><Layout size={14}/> Eintrag hinzufügen: {targetForm.name}</span>
                      <button onClick={() => setSubformModal(null)} className="p-1 hover:bg-indigo-100 rounded text-indigo-400"><X size={18}/></button>
                  </div>
                  <div className="flex-1 overflow-hidden relative">
                    {/* We pass a parentRecord prop so the child form knows how to link */}
                    <FormView 
                        form={targetForm}
                        allForms={allForms}
                        allTables={allTables}
                        queries={queries}
                        executeQuery={executeQuery}
                        onTableChange={handleSubformSaveFromModal}
                        showConfirmation={showConfirmation}
                        isSubform={false} // It's a modal top-level view now
                        parentRecord={currentRecord} // Pass current parent record
                        linkConfig={{ masterFieldId: subformModal.parentField, childFieldId: subformModal.childField }}
                        onClose={() => setSubformModal(null)}
                    />
                  </div>
              </div>
          </div>
      );
  };

  const renderAdvancedFilterModal = () => {
      if (!filterModalOpen) return null;
      const fields = sourceTable?.fields || [];

      const addFilter = () => {
          if (!newFilterField) return;
          const filterVal = newFilterOperator === 'between' 
              ? { min: newFilterValue, max: newFilterValueMax }
              : newFilterValue;
          setActiveFilters(prev => [
              ...prev.filter(f => f.fieldName !== newFilterField),
              { fieldName: newFilterField, value: filterVal, operator: newFilterOperator }
          ]);
          setFilterEnabled(true);
          setNewFilterValue('');
          setNewFilterValueMax('');
      };

      return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[200] p-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full overflow-hidden animate-in zoom-in-95">
                  <div className="p-4 bg-slate-800 text-white flex justify-between items-center font-bold">
                      <div className="flex items-center gap-2 text-sm">
                          <SlidersHorizontal size={16} className="text-indigo-400" />
                          <span>Filter verwalten ({form.name})</span>
                      </div>
                      <button onClick={() => setFilterModalOpen(false)} className="text-slate-400 hover:text-white">
                          <X size={18} />
                      </button>
                  </div>

                  <div className="p-5 space-y-4">
                      {/* Form to add a new filter */}
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Neuen Filter hinzufügen</label>
                          <div className="grid grid-cols-12 gap-2 items-center">
                              <select 
                                  value={newFilterField} 
                                  onChange={e => setNewFilterField(e.target.value)}
                                  className="col-span-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                              >
                                  <option value="">Feld wählen...</option>
                                  {fields.map(f => (
                                      <option key={f.id} value={f.name}>{f.name}</option>
                                  ))}
                              </select>
                              <select 
                                  value={newFilterOperator} 
                                  onChange={e => setNewFilterOperator(e.target.value as any)}
                                  className="col-span-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                              >
                                  <option value="equals">Gleich (=)</option>
                                  <option value="not_equals">Ungleich (≠)</option>
                                  <option value="contains">Enthält</option>
                                  <option value="starts_with">Beginnt mit</option>
                                  <option value="greater_than">Größer (&gt;)</option>
                                  <option value="less_than">Kleiner (&lt;)</option>
                                  <option value="between">Zwischen</option>
                              </select>

                              {newFilterOperator === 'between' ? (
                                  <div className="col-span-3 flex gap-1">
                                      <input 
                                          type="text" 
                                          value={newFilterValue} 
                                          onChange={e => setNewFilterValue(e.target.value)}
                                          placeholder="Von..."
                                          className="w-1/2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                                      />
                                      <input 
                                          type="text" 
                                          value={newFilterValueMax} 
                                          onChange={e => setNewFilterValueMax(e.target.value)}
                                          placeholder="Bis..."
                                          className="w-1/2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                                      />
                                  </div>
                              ) : (
                                  <input 
                                      type="text" 
                                      value={newFilterValue} 
                                      onChange={e => setNewFilterValue(e.target.value)}
                                      placeholder="Wert..."
                                      className="col-span-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                                  />
                              )}

                              <button 
                                  onClick={addFilter}
                                  disabled={!newFilterField}
                                  className="col-span-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold rounded text-xs py-1.5 transition-colors flex items-center justify-center gap-1"
                              >
                                  <Plus size={14} /> Add
                              </button>
                          </div>
                      </div>

                      {/* List of active filters */}
                      <div>
                          <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Aktive Filter ({activeFilters.length})</span>
                              {activeFilters.length > 0 && (
                                  <button onClick={() => setActiveFilters([])} className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline">
                                      Alle löschen
                                  </button>
                              )}
                          </div>
                          {activeFilters.length === 0 ? (
                              <p className="text-xs text-slate-400 italic py-2 text-center border border-dashed border-slate-200 rounded">Keine aktiven Filter gesetzt.</p>
                          ) : (
                              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                  {activeFilters.map((f, i) => (
                                      <div key={i} className="flex justify-between items-center p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs">
                                          <div className="flex items-center gap-2">
                                              <span className="font-bold text-slate-800 dark:text-white">{f.fieldName}</span>
                                              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                                                  {f.operator === 'equals' ? '=' : f.operator === 'not_equals' ? '≠' : f.operator === 'contains' ? 'enthält' : f.operator === 'starts_with' ? 'beginnt mit' : f.operator === 'greater_than' ? '>' : f.operator === 'less_than' ? '<' : 'zwischen'}
                                              </span>
                                              <span className="font-mono text-emerald-700 dark:text-emerald-300 font-semibold">
                                                  {f.operator === 'between' && typeof f.value === 'object'
                                                      ? `"${f.value.min}" und "${f.value.max}"`
                                                      : `"${String(f.value)}"`}
                                              </span>
                                          </div>
                                          <button onClick={() => setActiveFilters(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-rose-600 p-1">
                                              <Trash2 size={13} />
                                          </button>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="p-3 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input 
                              type="checkbox" 
                              checked={filterEnabled} 
                              onChange={e => setFilterEnabled(e.target.checked)} 
                              className="rounded text-indigo-600"
                          />
                          Filter anwenden
                      </label>
                      <button 
                          onClick={() => setFilterModalOpen(false)} 
                          className="px-4 py-1.5 bg-slate-800 text-white rounded text-xs font-semibold hover:bg-slate-900 transition-colors"
                      >
                          Schließen
                      </button>
                  </div>
              </div>
          </div>
      );
  };

  const headerColorClass = isSubform ? 'bg-indigo-100 text-indigo-900 border-b border-indigo-200' : 'bg-slate-800 text-white';

  // Trigger Auto-Create for Modal instances if needed
  useEffect(() => {
      if (linkConfig && parentRecord && !isSubform && !isCreating && data.length === 0 && !isReadOnly) {
          // If opened in modal with link config and empty, auto-start create
          startCreate();
      }
  }, [linkConfig]);

  // Auto-start creation mode if requested via initialMode prop
  useEffect(() => {
      if (initialMode === 'create' && !isCreating && sourceTable && !isReadOnly) {
          startCreate();
      }
  }, [initialMode, sourceTable, isReadOnly]);

  return (
    <div className={`relative h-full flex flex-col ${isSubform || embedded || (form.settings?.isFullScreen && !embedded) ? '' : 'p-4 bg-slate-100'}`}>
        <div className={`bg-white shadow border border-slate-200 rounded-lg flex flex-col h-full ${(form.settings?.isFullScreen && !embedded) ? 'absolute inset-0 z-[50] m-0 rounded-none' : 'max-w-4xl mx-auto w-full'}`}>
            
            {/* Header */}
            {!hideHeader && (
                <div className={`${headerColorClass} p-3 font-bold flex justify-between items-center shrink-0 transition-colors duration-300`}>
                    <div className="flex items-center gap-2">
                        <span>{form.name}</span>
                        {isCreating && (
                            <span className="bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                                <Plus size={12} strokeWidth={3} /> Neuer Datensatz
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {!isCreating && <span className="text-xs bg-white/20 px-2 py-0.5 rounded">{data.length > 0 ? `${currentIndex + 1} / ${data.length}` : '0 / 0'}</span>}
                        {!!onClose && (
                            <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded transition-colors" title="Schließen"><X size={18} /></button>
                        )}
                    </div>
                </div>
            )}

            {/* Body */}
            {form.settings?.showTableSplitView && !isSubform && !isUnbound ? (
                <div className="flex-1 flex overflow-hidden">
                    <div className="w-1/3 border-r border-slate-200 overflow-y-auto bg-slate-50/50">
                        {isCreating && (
                            <div className="p-3 border-b border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-l-emerald-600">
                                <div className="font-bold text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                                    <Plus size={14} className="text-emerald-600" /> [Neuer Datensatz]
                                </div>
                                <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 font-medium">Wird jetzt eingegeben...</div>
                            </div>
                        )}
                        {data.map((row, idx) => {
                            let mainField = null;
                            if (form.settings?.splitViewDisplayFieldId) {
                                mainField = sourceTable?.fields.find(f => f.id === form.settings.splitViewDisplayFieldId);
                            }
                            if (!mainField) {
                                mainField = sourceTable?.fields.find(f => !f.isAutoIncrement && f.type === 'VARCHAR') || sourceTable?.fields.find(f => !f.isAutoIncrement) || sourceTable?.fields[0];
                            }

                            let subField = null;
                            if (form.settings?.splitViewSubtitleFieldId) {
                                subField = sourceTable?.fields.find(f => f.id === form.settings.splitViewSubtitleFieldId);
                            }
                            if (!subField) {
                                subField = sourceTable?.fields.find(f => f.isPrimaryKey) || sourceTable?.fields[0];
                            }
                            return (
                                <div 
                                    key={idx} 
                                    onClick={() => !isCreating && setCurrentIndex(idx)}
                                    className={`p-3 border-b border-slate-200 cursor-pointer hover:bg-white transition-colors ${currentIndex === idx && !isCreating ? 'bg-white border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                                >
                                    <div className="font-semibold text-sm text-slate-700 truncate">
                                        {mainField ? (String(row[mainField.name] ?? '') || `Datensatz #${idx+1}`) : `Datensatz #${idx+1}`}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        {subField ? `${subField.name}: ${row[subField.name] ?? ''}` : `Index: ${idx}`}
                                    </div>
                                </div>
                            );
                        })}
                        {data.length === 0 && !isCreating && (
                            <div className="p-4 text-center text-xs text-slate-400">Keine Daten</div>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 relative">
                        {isCreating && (
                            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-lg text-xs font-medium flex items-center justify-between shadow-2xs animate-in fade-in">
                                <div className="flex items-center gap-2">
                                    <PlusCircle size={16} className="text-emerald-600 shrink-0" />
                                    <span><strong>Neuer Datensatz:</strong> Bitte die Felder ausfüllen und unten auf <strong>Datensatz Speichern</strong> klicken.</span>
                                </div>
                                <button onClick={cancelCreate} className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-white font-bold underline text-xs shrink-0">
                                    Abbrechen
                                </button>
                            </div>
                        )}
                        {activeFilters.length > 0 && (
                            <div className="mb-4 px-3 py-2 bg-blue-50/90 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-lg text-xs flex flex-wrap items-center gap-2 shadow-2xs">
                                <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-300 shrink-0">
                                    <Filter size={13} className="text-blue-600 dark:text-blue-400" />
                                    <span>{filterEnabled ? 'Aktive Filter:' : 'Filter (deaktiviert):'}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 flex-1">
                                    {activeFilters.map((f, idx) => (
                                        <span key={idx} className="inline-flex items-center gap-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-md border border-blue-200 dark:border-slate-600 text-xs shadow-2xs">
                                            <span className="font-semibold text-slate-900 dark:text-white">{f.fieldName}</span>
                                            <span className="text-blue-600 font-bold">
                                                {f.operator === 'equals' ? '=' : f.operator === 'not_equals' ? '≠' : f.operator === 'contains' ? 'enthält' : f.operator === 'starts_with' ? 'beginnt mit' : f.operator === 'greater_than' ? '>' : f.operator === 'less_than' ? '<' : 'zwischen'}
                                            </span>
                                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold font-mono">
                                                {f.operator === 'between' && typeof f.value === 'object'
                                                    ? `"${f.value?.min}" und "${f.value?.max}"`
                                                    : `"${String(f.value)}"`}
                                            </span>
                                            <button 
                                                onClick={() => setActiveFilters(prev => prev.filter((_, i) => i !== idx))}
                                                className="ml-1 text-slate-400 hover:text-rose-600 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-600"
                                                title="Filter entfernen"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button 
                                        onClick={() => setFilterEnabled(!filterEnabled)}
                                        className="text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline"
                                    >
                                        {filterEnabled ? 'Deaktivieren' : 'Aktivieren'}
                                    </button>
                                    <button 
                                        onClick={() => setActiveFilters([])}
                                        className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                                    >
                                        Alle löschen
                                    </button>
                                </div>
                            </div>
                        )}
                        {(isUnbound || data.length > 0 || isCreating) ? (form.layout ? renderElement(form.layout) : <div>Kein Layout definiert.</div>) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <p className="mb-4">Keine Daten vorhanden.</p>
                                {!isReadOnly && !isCreating && (
                                    <button onClick={startCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-sm transition-all">
                                        <Plus size={16}/> Ersten Datensatz anlegen
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto p-6">
                    {validationError && (
                        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
                            <div className="flex items-center gap-2">
                                <ShieldAlert size={16} className="text-rose-600 shrink-0" />
                                <span>{validationError}</span>
                            </div>
                            <button onClick={() => setValidationError(null)} className="text-rose-400 hover:text-rose-700">
                                <X size={14} />
                            </button>
                        </div>
                    )}
                    {isCreating && (
                        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-lg text-xs font-medium flex items-center justify-between shadow-2xs animate-in fade-in">
                            <div className="flex items-center gap-2">
                                <PlusCircle size={16} className="text-emerald-600 shrink-0" />
                                <span><strong>Neuer Datensatz:</strong> Bitte die Felder ausfüllen und unten auf <strong>Datensatz Speichern</strong> klicken.</span>
                            </div>
                            <button onClick={cancelCreate} className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-white font-bold underline text-xs shrink-0">
                                Abbrechen
                            </button>
                        </div>
                    )}
                    {activeFilters.length > 0 && (
                        <div className="mb-4 px-3 py-2 bg-blue-50/90 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-lg text-xs flex flex-wrap items-center gap-2 shadow-2xs">
                            <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-300 shrink-0">
                                <Filter size={13} className="text-blue-600 dark:text-blue-400" />
                                <span>{filterEnabled ? 'Aktive Filter:' : 'Filter (deaktiviert):'}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 flex-1">
                                {activeFilters.map((f, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-md border border-blue-200 dark:border-slate-600 text-xs shadow-2xs">
                                        <span className="font-semibold text-slate-900 dark:text-white">{f.fieldName}</span>
                                        <span className="text-blue-600 font-bold">
                                            {f.operator === 'equals' ? '=' : f.operator === 'not_equals' ? '≠' : f.operator === 'contains' ? 'enthält' : f.operator === 'starts_with' ? 'beginnt mit' : f.operator === 'greater_than' ? '>' : f.operator === 'less_than' ? '<' : 'zwischen'}
                                        </span>
                                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold font-mono">
                                            {f.operator === 'between' && typeof f.value === 'object'
                                                ? `"${f.value?.min}" und "${f.value?.max}"`
                                                : `"${String(f.value)}"`}
                                        </span>
                                        <button 
                                            onClick={() => setActiveFilters(prev => prev.filter((_, i) => i !== idx))}
                                            className="ml-1 text-slate-400 hover:text-rose-600 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-600"
                                            title="Filter entfernen"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button 
                                    onClick={() => setFilterEnabled(!filterEnabled)}
                                    className="text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline"
                                >
                                    {filterEnabled ? 'Deaktivieren' : 'Aktivieren'}
                                </button>
                                <button 
                                    onClick={() => setActiveFilters([])}
                                    className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                                >
                                    Alle löschen
                                </button>
                            </div>
                        </div>
                    )}
                    {(isUnbound || data.length > 0 || isCreating) ? (form.layout ? renderElement(form.layout) : <div>Kein Layout definiert.</div>) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <p className="mb-4">Keine Daten vorhanden.</p>
                            {!isReadOnly && !isCreating && (
                                <button onClick={startCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-sm transition-all">
                                    <Plus size={16}/> Ersten Datensatz anlegen
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Footer / MS Access Bottom Navigation and Status Bar */}
            {(!isUnbound && (isCreating || !finalHideNavigation || !hideActions || !!onClose)) && (
                <div className={`p-2 border-t border-slate-300 flex flex-wrap gap-y-2 justify-between shrink-0 rounded-b-lg items-center ${isCreating ? 'bg-emerald-50/80' : 'bg-[#f1f5fa] dark:bg-slate-800'} text-xs font-sans border-slate-300 dark:border-slate-700 select-none`}>
                    {isCreating ? (
                        <div className="flex justify-end gap-2 w-full">
                            <button onClick={cancelCreate} className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-1.5 text-xs font-semibold shadow-xs">
                                <XCircle size={14} /> Abbrechen
                            </button>
                            <button onClick={saveNewRecord} className="px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 flex items-center gap-1.5 text-xs font-semibold shadow-sm">
                                <CheckCircle size={14} /> Speichern
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Left: Navigation Buttons (Classic Access Layout) */}
                            {!finalHideNavigation ? (
                                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1 py-0.5 shadow-xs">
                                    <button 
                                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 rounded transition-colors" 
                                        onClick={() => setCurrentIndex(0)} 
                                        disabled={currentIndex === 0 || processedData.length === 0}
                                        title="Erster Datensatz"
                                    >
                                        <ChevronsLeft size={14} strokeWidth={2.5}/>
                                    </button>
                                    <button 
                                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 rounded transition-colors" 
                                        onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} 
                                        disabled={currentIndex === 0 || processedData.length === 0}
                                        title="Vorheriger Datensatz"
                                    >
                                        <ChevronLeft size={14} strokeWidth={2.5}/>
                                    </button>
                                    
                                    <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium px-1.5 flex items-center gap-1">
                                        Datensatz: 
                                        <input 
                                            type="text" 
                                            value={processedData.length > 0 ? currentIndex + 1 : 0}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value, 10);
                                                if (!isNaN(val) && val >= 1 && val <= processedData.length) {
                                                    setCurrentIndex(val - 1);
                                                }
                                            }}
                                            className="w-10 text-center border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 py-0.5 text-[11px]"
                                        />
                                        von <span className="font-bold">{processedData.length}</span>
                                        {processedData.length < data.length && (
                                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/40 px-1 rounded">
                                                (Gefiltert aus {data.length})
                                            </span>
                                        )}
                                    </span>

                                    <button 
                                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 rounded transition-colors" 
                                        onClick={() => setCurrentIndex(Math.min(processedData.length - 1, currentIndex + 1))} 
                                        disabled={currentIndex >= processedData.length - 1 || processedData.length === 0}
                                        title="Nächster Datensatz"
                                    >
                                        <ChevronRight size={14} strokeWidth={2.5}/>
                                    </button>
                                    <button 
                                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 rounded transition-colors" 
                                        onClick={() => setCurrentIndex(processedData.length - 1)} 
                                        disabled={currentIndex >= processedData.length - 1 || processedData.length === 0}
                                        title="Letzter Datensatz"
                                    >
                                        <ChevronsRight size={14} strokeWidth={2.5}/>
                                    </button>

                                    {(!isReadOnly && !hideActions) && (
                                        <button 
                                            className="p-1 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded transition-colors border-l border-slate-200 dark:border-slate-700 pl-1.5 ml-0.5" 
                                            onClick={startCreate} 
                                            title="Neuer leerer Datensatz"
                                        >
                                            <Plus size={14} strokeWidth={3}/>
                                        </button>
                                    )}
                                </div>
                            ) : <div />}

                            {/* Middle: Live Search Bar */}
                            {!finalHideNavigation && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-slate-500 font-medium">Suchen:</span>
                                    <div className="relative">
                                        <input 
                                            type="text"
                                            value={globalSearchText}
                                            onChange={(e) => setGlobalSearchText(e.target.value)}
                                            placeholder="Ganzen Datensatz durchsuchen..."
                                            className="w-48 pl-7 pr-2 py-1 text-[11px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                        <Search size={12} className="absolute left-2.5 top-2 text-slate-400" />
                                        {globalSearchText && (
                                            <button 
                                                onClick={() => setGlobalSearchText('')}
                                                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-[9px] font-bold"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Right: Filter Status and Record Controls */}
                            <div className="flex items-center gap-2">
                                {/* Filter Toggle Button */}
                                {!finalHideNavigation && (
                                    <button 
                                        onClick={() => setFilterEnabled(prev => !prev)}
                                        disabled={activeFilters.length === 0}
                                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
                                            activeFilters.length === 0 
                                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                                                : filterEnabled 
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100'
                                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:bg-slate-300'
                                        }`}
                                        title={activeFilters.length === 0 ? "Keine aktiven Filter" : "Filter umschalten"}
                                    >
                                        <Filter size={11} />
                                        <span>{activeFilters.length === 0 ? "Kein Filter" : filterEnabled ? "Gefiltert" : "Ungefiltert"}</span>
                                    </button>
                                )}

                                {(!isReadOnly && !hideActions) && (
                                    <button 
                                        className="p-1.5 bg-white hover:bg-rose-50 dark:bg-slate-900 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-slate-300 dark:border-slate-700 rounded transition-colors flex items-center justify-center" 
                                        onClick={deleteCurrentRecord} 
                                        disabled={processedData.length === 0} 
                                        title="Datensatz löschen"
                                    >
                                        <Trash2 size={13}/>
                                    </button>
                                )}

                                {!!onClose && (
                                    <button onClick={onClose} className="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-600 text-xs font-semibold shadow-xs">
                                        Schließen
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
        {renderLookupModal()}
        {renderSubformModal()}
        {renderContextMenu()}
        {renderAdvancedFilterModal()}
    </div>
  );
};
