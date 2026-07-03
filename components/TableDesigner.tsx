import React, { useState } from 'react';
import { Table, Field, FieldType } from '../types/index';
import { Plus, Trash2, Key, Wand2, Zap, Info } from 'lucide-react';
import { generateTableSchema } from '../services/geminiService';
import { useTranslation, Trans } from 'react-i18next';

interface TableDesignerProps {
  table: Table;
  onTableChange: (table: Table) => void;
}

export const TableDesigner: React.FC<TableDesignerProps> = ({ table, onTableChange }) => {
  const { t } = useTranslation();
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAi, setShowAi] = useState(false);
  
  const { name: tableName, description: tableDescription, fields } = table;

  const setTableName = (name: string) => {
    onTableChange({ ...table, name });
  }

  const setTableDescription = (description: string) => {
    onTableChange({ ...table, description });
  }

  const setFields = (fields: Field[]) => {
    onTableChange({ ...table, fields });
  }

  const addField = () => {
    setFields([...fields, { id: crypto.randomUUID(), name: `Feld${fields.length + 1}`, type: 'VARCHAR' }]);
  };

  const updateField = (id: string, updates: Partial<Field>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setIsAiLoading(true);
    const schema = await generateTableSchema(aiPrompt);
    if (schema) {
      const newTable = { ...table };
      newTable.name = schema.tableName || tableName;
      if (schema.fields && Array.isArray(schema.fields)) {
        const newFields: Field[] = schema.fields.map((f: any) => ({
          id: crypto.randomUUID(),
          name: f.name,
          type: (['INTEGER', 'VARCHAR', 'TEXT', 'DATE', 'BOOLEAN'].includes(f.type) ? f.type : 'VARCHAR') as FieldType,
          isPrimaryKey: f.name.toLowerCase() === 'id'
        }));
        newTable.fields = newFields;
      }
      onTableChange(newTable);
    }
    setIsAiLoading(false);
    setShowAi(false);
  };

  return (
    <div className="p-8 h-full bg-slate-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto bg-white shadow-lg border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">{t('table_designer.title')}</h2>
          <button onClick={() => setShowAi(!showAi)} className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded text-sm">
            <Wand2 size={14} /> {t('table_designer.ai_design')}
          </button>
        </div>

        {showAi && (
          <div className="p-4 bg-purple-50 border-b border-purple-100 animate-in slide-in-from-top-2">
            <label className="block text-sm font-medium text-purple-900 mb-1">{t('table_designer.ai_desc')}</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                className="flex-1 border border-purple-200 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder={t('table_designer.ai_placeholder')}
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAiGenerate()}
              />
              <button 
                onClick={handleAiGenerate}
                disabled={isAiLoading}
                className="bg-purple-600 text-white px-4 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {isAiLoading ? t('table_designer.ai_thinking') : t('table_designer.ai_generate')}
              </button>
            </div>
          </div>
        )}

        <div className="p-6">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">{t('table_designer.table_name')}</label>
              <input 
                type="text" 
                value={tableName} 
                onChange={(e) => setTableName(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">{t('table_designer.table_description')}</label>
              <input 
                type="text" 
                value={tableDescription || ''} 
                onChange={(e) => setTableDescription(e.target.value)}
                placeholder={t('table_designer.comment_placeholder')}
                className="w-full border border-slate-300 rounded p-2 text-sm"
              />
            </div>
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                <th className="p-2 w-10 text-center">{t('table_designer.field_pk')}</th>
                <th className="p-2 w-10 text-center">{t('table_designer.field_idx')}</th>
                <th className="p-2 w-1/4">{t('table_designer.field_name')}</th>
                <th className="p-2 w-1/4">{t('table_designer.field_type')}</th>
                <th className="p-2 w-1/4">{t('table_designer.field_comment')}</th>
                <th className="p-2 w-16 text-center">{t('table_designer.field_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {fields.map((field) => (
                <tr key={field.id} className="hover:bg-slate-50">
                  <td className="p-2 text-center">
                    <button 
                      onClick={() => updateField(field.id, { isPrimaryKey: !field.isPrimaryKey })}
                      className={`hover:bg-slate-200 p-1 rounded ${field.isPrimaryKey ? 'text-yellow-600' : 'text-slate-300'}`}
                      title={t('table_designer.pk_tooltip')}
                    >
                      <Key size={16} />
                    </button>
                  </td>
                  <td className="p-2 text-center">
                    <button 
                      onClick={() => updateField(field.id, { isIndexed: !field.isIndexed })}
                      className={`hover:bg-slate-200 p-1 rounded ${field.isIndexed || field.name.toLowerCase().endsWith('_id') ? 'text-blue-600' : 'text-slate-300'}`}
                      title={field.name.toLowerCase().endsWith('_id') ? t('table_designer.idx_auto_tooltip') : t('table_designer.idx_tooltip')}
                      disabled={field.name.toLowerCase().endsWith('_id')}
                    >
                      <Zap size={16} />
                    </button>
                  </td>
                  <td className="p-2">
                    <input 
                      type="text" 
                      value={field.name}
                      onChange={(e) => updateField(field.id, { name: e.target.value })}
                      className="w-full border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 bg-transparent text-sm"
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex flex-col gap-1">
                      <select 
                        value={field.type}
                        onChange={(e) => updateField(field.id, { type: e.target.value as FieldType })}
                        className="w-full border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 bg-transparent text-sm"
                      >
                        <option value="INTEGER">{t('table_designer.type_integer')}</option>
                        <option value="VARCHAR">{t('table_designer.type_varchar')}</option>
                        <option value="TEXT">{t('table_designer.type_text')}</option>
                        <option value="DATE">{t('table_designer.type_date')}</option>
                        <option value="BOOLEAN">{t('table_designer.type_boolean')}</option>
                        <option value="ENUM">{t('table_designer.type_enum')}</option>
                      </select>
                      {field.type === 'ENUM' && (
                        <input
                          type="text"
                          placeholder={t('table_designer.enum_placeholder')}
                          value={field.enumValues?.join(', ') || ''}
                          onChange={(e) => updateField(field.id, { enumValues: e.target.value.split(',').map(v => v.trim()).filter(v => v) })}
                          title={t('table_designer.enum_title')}
                          className="w-full border border-slate-300 focus:border-blue-500 rounded px-2 py-1 text-xs"
                        />
                      )}
                    </div>
                  </td>
                  <td className="p-2">
                    <input 
                      type="text" 
                      value={field.comment || ''}
                      onChange={(e) => updateField(field.id, { comment: e.target.value })}
                      placeholder={t('table_designer.optional')}
                      className="w-full border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 bg-transparent text-sm"
                    />
                  </td>
                  <td className="p-2 text-center text-slate-400">
                    <button 
                      onClick={() => removeField(field.id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                      title={t('table_designer.delete_field')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button 
            onClick={addField}
            className="mt-4 flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-semibold"
          >
            <Plus size={16} /> {t('table_designer.add_field')}
          </button>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3">
            <Info size={20} className="text-blue-500 shrink-0" />
            <div className="text-xs text-blue-800 space-y-1">
              <p className="font-bold">{t('table_designer.performance_title')}</p>
              <Trans i18nKey="table_designer.auto_hint">
                <p>Das System indiziert automatisch alle Felder, die auf <code className="bg-blue-100 px-1">_id</code> enden (Fremdschlüssel) sowie <code className="bg-blue-100 px-1">club_id</code>, <code className="bg-blue-100 px-1">user_id</code> und <code className="bg-blue-100 px-1">conversation_id</code>.</p>
              </Trans>
              <Trans i18nKey="table_designer.manual_hint">
                <p>Verwenden Sie das <Zap size={10} className="inline" /> Icon, um zusätzliche Felder manuell zu indizieren (z.B. Suchfelder oder Filter-Kriterien).</p>
              </Trans>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};