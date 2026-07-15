import React from 'react';
import { PageComponent } from '../../../../types/index';
import { resolvePlaceholders, getNestedValueCaseInsensitive } from '../../utils/pageViewUtils';
import { LiveForm } from '../LiveForm';
import { CustomTableViewRunner } from '../CustomTableViewRunner';
import { MetricCardRunner } from './MetricCardRunner';
import { KanbanBoardRunner } from './kanban/KanbanBoardRunner';

interface CustomComponentRunnerProps {
    comp: any;
    node: PageComponent;
    context: any;
    params: any;
    setParam: (k: string, v: any) => void;
    navigate: (pageId: string, initialParams?: Record<string, any>) => void;
    fetchedData: any[];
    loading: boolean;
}

export const CustomComponentRunner: React.FC<CustomComponentRunnerProps> = ({ 
    comp, node, context, params, setParam, navigate, fetchedData, loading 
}) => {
    const conf = comp.configuration || {};

    switch (comp.type) {
        case 'table_view': {
            return (
                <CustomTableViewRunner
                    comp={comp}
                    node={node}
                    context={context}
                    params={params}
                    setParam={setParam}
                    navigate={navigate}
                    fetchedData={fetchedData}
                    loading={loading}
                />
            );
        }

        case 'form_view': {
            const formNode = {
                id: node.id + '_form',
                type: 'form_view' as const,
                props: {
                    formId: conf.formId,
                    hideHeader: conf.hideHeader,
                    hideActions: conf.hideActions
                }
            };
            return <LiveForm node={formNode} context={context} />;
        }

        case 'text': {
            const txtSize = conf.fontSize || 'text-base';
            const txtWeight = conf.fontWeight || 'font-normal';
            const txtColor = conf.colorClass || 'text-slate-700';
            const txtAlign = conf.alignment || 'text-left';
            return (
                <div className={`w-full ${txtSize} ${txtWeight} ${txtColor} ${txtAlign} p-2 text-left`}>
                    {resolvePlaceholders(conf.text || '', context, params)}
                </div>
            );
        }

        case 'button': {
            const handleButtonClick = () => {
                if (conf.actionType === 'navigate' && conf.targetPageId) {
                    navigate(conf.targetPageId);
                } else if (conf.actionType === 'setParam' && conf.targetParamKey) {
                    setParam(conf.targetParamKey, conf.targetParamVal);
                }
            };
            return (
                <div className="text-left">
                    <button 
                        onClick={handleButtonClick}
                        className={`px-4 py-2 bg-indigo-600 text-white rounded font-medium shadow-sm hover:bg-indigo-700 transition-colors m-2 ${
                            conf.variant === 'secondary' ? 'bg-slate-100 text-slate-700 border hover:bg-slate-200' :
                            conf.variant === 'danger' ? 'bg-red-600 hover:bg-red-700' :
                            conf.variant === 'outline' ? 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50' : ''
                        }`}
                    >
                        {conf.label || 'Aktions-Button'}
                    </button>
                </div>
            );
        }

        case 'dropdown': {
            return (
                <div className="p-2 w-full text-left">
                    {conf.label && <label className="block text-xs font-semibold text-slate-600 mb-1">{conf.label}</label>}
                    <select 
                        className="border border-slate-300 rounded px-3 py-2 bg-white w-full max-w-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800"
                        onChange={(e) => {
                            if (conf.valueField) {
                                setParam('selectedId', e.target.value);
                            }
                        }}
                    >
                        <option value="">{conf.placeholder || '-- Bitte wählen --'}</option>
                        {fetchedData.map((row, idx) => {
                            const val = getNestedValueCaseInsensitive(row, conf.valueField || 'id');
                            const lbl = getNestedValueCaseInsensitive(row, conf.displayField || 'Name');
                            return <option key={idx} value={val}>{lbl}</option>;
                        })}
                    </select>
                </div>
            );
        }

        case 'metric_card': {
            return (
                <MetricCardRunner
                    conf={conf}
                    fetchedData={fetchedData}
                    loading={loading}
                />
            );
        }

        case 'kanban_board': {
            return (
                <KanbanBoardRunner
                    conf={conf}
                    fetchedData={fetchedData}
                    loading={loading}
                    setParam={setParam}
                />
            );
        }

        default:
            return (
                <div className="p-3 bg-slate-50 text-slate-500 text-xs italic border rounded text-center">
                    [Custom Component {comp.name} ({comp.type}) geladen]
                </div>
            );
    }
};
export default CustomComponentRunner;
