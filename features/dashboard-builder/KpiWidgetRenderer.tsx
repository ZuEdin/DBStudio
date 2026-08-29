import React from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { DashboardWidgetConfig } from './dashboardBuilderTypes';

interface KpiWidgetProps {
  widget: DashboardWidgetConfig;
  value?: number;
  id?: string;
}

export const KpiWidgetRenderer: React.FC<KpiWidgetProps> = ({
  widget,
  value = 148250.0,
  id = `kpi_widget_${widget.id}`,
}) => {
  const formatValue = (val: number) => {
    if (widget.kpiSettings?.format === 'currency') {
      return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);
    }
    if (widget.kpiSettings?.format === 'percent') {
      return `${val.toFixed(1)} %`;
    }
    return new Intl.NumberFormat('de-DE').format(val);
  };

  const trend = widget.kpiSettings?.trendPercentage ?? 4.8;
  const isPositive = trend >= 0;

  return (
    <div
      id={id}
      className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between"
    >
      <div className="flex items-center justify-between text-slate-500 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider">{widget.title}</span>
        <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
          <DollarSign className="w-4 h-4" />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-800">{formatValue(value)}</div>
        <div className="flex items-center gap-1 mt-2 text-xs font-medium">
          {isPositive ? (
            <span className="text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +{trend}%
            </span>
          ) : (
            <span className="text-rose-600 flex items-center gap-0.5">
              <TrendingDown className="w-3.5 h-3.5" /> {trend}%
            </span>
          )}
          <span className="text-slate-400">ggü. Vormonat</span>
        </div>
      </div>
    </div>
  );
};
