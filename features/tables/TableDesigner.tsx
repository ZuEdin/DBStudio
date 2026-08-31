import React, { useState, useEffect } from 'react';
import { Table, Field, LockInfo, Relationship, ValidationRule } from '../../types';
import { DATA_TYPES } from '../../config/dataTypes';
import { TableDesignerToolbar } from './components/TableDesignerToolbar';
import { TableFieldsList } from './components/TableFieldsList';
import { FieldPropertiesPanel } from './components/FieldProperties/FieldPropertiesPanel';
import { AuditFieldsModal } from './components/AuditFieldsModal';
import { ComputedColumnModal } from './components/ComputedColumnModal';
import { IndustryTemplatesModal } from './components/IndustryTemplatesModal';
import { TableDdlViewer } from './components/TableDdlViewer';
import { SequenceConfigModal } from './components/SequenceConfigModal';
import { MockDataGeneratorModal } from './MockDataGeneratorModal';
import { GaebDatanormImportModal } from './components/GaebDatanormImportModal';
import { ValidationRulesModal } from './components/ValidationRulesModal';
import { UserCheck } from 'lucide-react';

interface TableDesignerProps {
  table: Table;
  onTableChange: (table: Table) => void;
  lockedBy?: LockInfo | null;
  currentUserId?: string;
  relationships?: Relationship[];
  showConfirmation?: (title: string, message: string, onConfirm: () => void, confirmText?: string, confirmClass?: string) => void;
  onClose?: () => void;
}

export const TableDesigner: React.FC<TableDesignerProps> = ({
  table,
  onTableChange,
  lockedBy,
  currentUserId,
  relationships = [],
  showConfirmation,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'fields' | 'sql' | 'indexes'>('fields');
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showImportBridge, setShowImportBridge] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [computedModalField, setComputedModalField] = useState<Field | null>(null);
  const [sequenceModalField, setSequenceModalField] = useState<Field | null>(null);
  const [showMockData, setShowMockData] = useState(false);
  const [draggedFieldIndex, setDraggedFieldIndex] = useState<number | null>(null);

  const { name: tableName, description: tableDescription, fields = [] } = table;

  const activeSelectedFieldId = selectedFieldId || fields[0]?.id || null;
  const selectedField = fields.find((f) => f.id === activeSelectedFieldId) || fields[0] || null;

  useEffect(() => {
    const handleDesignerAction = (e: Event) => {
      const customEvent = e as CustomEvent<{ action: string }>;
      const action = customEvent.detail?.action;
      if (!action) return;

      switch (action) {
        case 'table_open_ddl':
          setActiveTab('sql');
          break;
        case 'table_open_templates_modal':
          setShowTemplatesModal(true);
          break;
        case 'table_open_computed_modal':
          setComputedModalField(selectedField || fields[0] || null);
          break;
        case 'table_open_sequence_modal':
          setSequenceModalField(selectedField || fields[0] || null);
          break;
        case 'table_open_validation_modal':
          setShowValidationModal(true);
          break;
        case 'table_open_gaeb_import':
          setShowImportBridge(true);
          break;
        case 'table_open_mock_generator':
          setShowMockData(true);
          break;
        default:
          break;
      }
    };

    window.addEventListener('table-designer-action', handleDesignerAction);
    return () => {
      window.removeEventListener('table-designer-action', handleDesignerAction);
    };
  }, [selectedField, fields]);

  const isLockedByMe = lockedBy?.userId === currentUserId;
  const isLockedByOther = lockedBy && !isLockedByMe;
  const isReadOnly = isLockedByOther;

  const setTableName = (name: string) => {
    if (isReadOnly) return;
    onTableChange({ ...table, name });
  };

  const setTableDescription = (description: string) => {
    if (isReadOnly) return;
    onTableChange({ ...table, description });
  };

  const setFields = (nextFields: Field[]) => {
    if (isReadOnly) return;
    onTableChange({ ...table, fields: nextFields });
  };

  const addField = () => {
    if (isReadOnly) return;
    const newField: Field = {
      id: crypto.randomUUID(),
      name: `Feld${fields.length + 1}`,
      type: 'VARCHAR',
      length: 255,
      allowNull: true,
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const updateField = (id: string, updates: Partial<Field>) => {
    if (isReadOnly) return;

    let updatedData = table.data;
    if (updates.name !== undefined) {
      const oldField = fields.find((f) => f.id === id);
      const oldName = oldField?.name;
      const newName = updates.name;
      if (oldName && newName && oldName !== newName && Array.isArray(updatedData)) {
        updatedData = updatedData.map((row) => {
          const newRow = { ...row };
          if (oldName in newRow) {
            newRow[newName] = newRow[oldName];
            delete newRow[oldName];
          }
          return newRow;
        });
      }
    }

    const nextFields = fields.map((f) => {
      if (f.id !== id) return f;
      if (updates.type && updates.type !== f.type) {
        const config = DATA_TYPES[updates.type];
        return {
          ...f,
          ...updates,
          length: config?.hasLength ? (config.defaultLength || 255) : undefined,
          precision: config?.hasPrecision ? config.defaultPrecision : undefined,
          scale: config?.hasPrecision ? config.defaultScale : undefined,
          enumValues: updates.type === 'ENUM' ? (f.enumValues && f.enumValues.length > 0 ? f.enumValues : ['Option 1', 'Option 2']) : f.enumValues,
          defaultValue: undefined,
        };
      }
      return { ...f, ...updates };
    });

    onTableChange({ ...table, fields: nextFields, data: updatedData });
  };

  const removeField = (id: string) => {
    if (isReadOnly) return;
    const fieldObj = fields.find((f) => f.id === id);
    const fieldName = fieldObj?.name || 'Unbekanntes Feld';

    const isUsedInRelationship = relationships.some(
      (rel) =>
        (rel.fromTableId === table.id && rel.fromFieldId === id) ||
        (rel.toTableId === table.id && rel.toFieldId === id)
    );

    const performDelete = () => setFields(fields.filter((f) => f.id !== id));

    if (isUsedInRelationship) {
      if (showConfirmation) {
        showConfirmation(
          'Feld löschen?',
          `Das Feld "${fieldName}" wird in Tabellenverknüpfungen verwendet. Möchten Sie es wirklich löschen?`,
          performDelete
        );
      } else if (window.confirm(`Das Feld "${fieldName}" wird in einer Beziehung verwendet. Wirklich löschen?`)) {
        performDelete();
      }
    } else {
      performDelete();
    }
  };

  const handleApplyAuditFields = (auditFields: Field[]) => {
    if (isReadOnly) return;
    const existingNames = new Set(fields.map((f) => f.name.toLowerCase()));
    const newUniqueFields = auditFields.filter((f) => !existingNames.has(f.name.toLowerCase()));
    setFields([...fields, ...newUniqueFields]);
  };

  const handleApplyTemplate = (tpl: Table) => {
    if (isReadOnly) return;
    onTableChange({
      ...table,
      name: tpl.name,
      description: tpl.description,
      fields: tpl.fields.map((f) => ({ ...f, id: crypto.randomUUID() })),
    });
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isReadOnly) return;
    setDraggedFieldIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isReadOnly) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    if (isReadOnly || draggedFieldIndex === null || draggedFieldIndex === dropIndex) return;
    e.preventDefault();
    const newFields = [...fields];
    const [movedField] = newFields.splice(draggedFieldIndex, 1);
    newFields.splice(dropIndex, 0, movedField);
    setFields(newFields);
    setDraggedFieldIndex(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden font-sans">
      {/* Top Action Toolbar */}
      <TableDesignerToolbar
        tableName={tableName}
        fieldsCount={fields.length}
        isReadOnly={isReadOnly}
        onAddField={addField}
        onOpenAuditModal={() => setShowAuditModal(true)}
        onOpenTemplatesModal={() => setShowTemplatesModal(true)}
        onOpenImportBridge={() => setShowImportBridge(true)}
        onOpenValidationModal={() => setShowValidationModal(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onClose={onClose}
      />

      {isLockedByMe && (
        <div className="bg-emerald-50 text-emerald-800 px-6 py-2 text-xs font-semibold flex items-center gap-2 border-b border-emerald-100 shrink-0">
          <UserCheck size={14} />
          Bearbeitungsmodus: Für andere Benutzer gesperrt.
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="p-6 flex-1 overflow-auto space-y-6">
        {/* Table Name & Description Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Tabellenname
            </label>
            <input
              type="text"
              value={tableName}
              disabled={isReadOnly}
              onChange={(e) => setTableName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 font-mono text-sm disabled:bg-slate-100 disabled:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Beschreibung (Optional)
            </label>
            <input
              type="text"
              value={tableDescription || ''}
              disabled={isReadOnly}
              onChange={(e) => setTableDescription(e.target.value)}
              placeholder="Zweck und Kontext dieser Tabelle..."
              className="w-full border border-slate-300 rounded-lg p-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Tab Views */}
        {activeTab === 'fields' ? (
          <div className="space-y-6">
            <TableFieldsList
              fields={fields}
              selectedFieldId={activeSelectedFieldId}
              onSelectField={(id) => setSelectedFieldId(id)}
              onUpdateField={updateField}
              onRemoveField={removeField}
              onAddField={addField}
              onOpenSequenceModal={(f) => setSequenceModalField(f)}
              onOpenComputedModal={(f) => setComputedModalField(f)}
              isReadOnly={isReadOnly}
              draggedFieldIndex={draggedFieldIndex}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />

            {selectedField && (
              <FieldPropertiesPanel
                field={selectedField}
                availableFields={fields}
                isReadOnly={isReadOnly}
                onUpdate={(updates) => updateField(selectedField.id, updates)}
              />
            )}
          </div>
        ) : (
          <TableDdlViewer table={table} />
        )}
      </div>

      {/* Modals */}
      {showAuditModal && (
        <AuditFieldsModal
          isOpen={showAuditModal}
          onClose={() => setShowAuditModal(false)}
          onApply={handleApplyAuditFields}
          existingFieldNames={fields.map((f) => f.name)}
        />
      )}

      {showTemplatesModal && (
        <IndustryTemplatesModal
          isOpen={showTemplatesModal}
          onClose={() => setShowTemplatesModal(false)}
          onApplyTemplate={handleApplyTemplate}
        />
      )}

      {computedModalField && (
        <ComputedColumnModal
          isOpen={Boolean(computedModalField)}
          onClose={() => setComputedModalField(null)}
          field={computedModalField}
          availableFields={fields}
          onSave={(updates) => {
            updateField(computedModalField.id, updates);
            setComputedModalField(null);
          }}
        />
      )}

      {sequenceModalField && (
        <SequenceConfigModal
          isOpen={Boolean(sequenceModalField)}
          field={sequenceModalField}
          onClose={() => setSequenceModalField(null)}
          onSave={(cfg) => {
            updateField(sequenceModalField.id, { sequenceConfig: cfg });
            setSequenceModalField(null);
          }}
        />
      )}

      {showMockData && (
        <MockDataGeneratorModal table={table} onClose={() => setShowMockData(false)} />
      )}

      {showImportBridge && (
        <GaebDatanormImportModal
          isOpen={showImportBridge}
          onClose={() => setShowImportBridge(false)}
          currentTable={table}
          onImportAsNewTable={(newTable) => onTableChange(newTable)}
          onAppendToCurrentTable={(rows) => {
            onTableChange({
              ...table,
              data: [...(table.data || []), ...rows],
            });
          }}
        />
      )}

      {showValidationModal && (
        <ValidationRulesModal
          isOpen={showValidationModal}
          onClose={() => setShowValidationModal(false)}
          table={table}
          onUpdateRules={(rules) => onTableChange({ ...table, validationRules: rules })}
        />
      )}
    </div>
  );
};
