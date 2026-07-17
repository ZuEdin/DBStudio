import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Edit3, 
  Info, 
  Database, 
  X, 
  Clock, 
  CalendarDays,
  FileText,
  CheckCircle2,
  ListFilter
} from 'lucide-react';
import { useProjectStore } from '../../../../stores/useProjectStore';
import { getNestedValueCaseInsensitive } from '../../utils/pageViewUtils';
import { executeSelectQuery } from '../../../queries/utils/queryExecution';

interface CalendarRunnerProps {
  comp: any;
  node?: any;
  fetchedData: any[];
  loading: boolean;
  setParam?: (k: string, v: any) => void;
}

export const CalendarRunner: React.FC<CalendarRunnerProps> = ({
  comp,
  node,
  fetchedData = [],
  loading,
  setParam
}) => {
  const { tables, queries, relationships, updateTable } = useProjectStore();
  const conf = comp.configuration || {};

  // Find linked table if applicable (override config with node props if provided)
  const nodeProps = node?.props || {};
  const dsId = nodeProps.dataSourceId || conf.dataSourceId || conf.tableId;
  const dsType = nodeProps.dataSourceType || conf.dataSourceType || (conf.tableId ? 'table' : '');
  const linkedTable = dsType === 'table' ? tables.find(t => t.id === dsId) : null;
  const linkedQuery = dsType === 'query' ? queries.find(q => q.id === dsId) : null;

  const activeData = useMemo(() => {
    if (fetchedData && fetchedData.length > 0) {
      return fetchedData;
    }
    if (linkedTable) {
      return linkedTable.data || [];
    }
    if (linkedQuery && linkedQuery.type === 'SELECT') {
      try {
        return executeSelectQuery(linkedQuery as any, tables, relationships || []);
      } catch (err) {
        console.error("Error executing query for calendar:", err);
      }
    }
    return [];
  }, [fetchedData, linkedTable, linkedQuery, tables, relationships]);

  // Calendar State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day' | 'agenda'>(
    (conf.defaultView as any) || 'month'
  );

  // Modals State
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Helper: parse date and time safely
  const parseDateWithTime = (dateVal: any, timeVal: any): Date | null => {
    if (!dateVal) return null;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return null;

    if (timeVal) {
      if (typeof timeVal === 'string') {
        const match = timeVal.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
        if (match) {
          const hrs = parseInt(match[1], 10);
          const mins = parseInt(match[2], 10);
          const secs = match[3] ? parseInt(match[3], 10) : 0;
          d.setHours(hrs, mins, secs, 0);
        }
      } else if (timeVal instanceof Date) {
        d.setHours(timeVal.getHours(), timeVal.getMinutes(), timeVal.getSeconds(), 0);
      }
    }
    return d;
  };

  // Process data from table/query to standardized event format
  const events = useMemo(() => {
    return activeData.map((row, idx) => {
      const id = row.id || row.ID || `row-${idx}`;
      const title = getNestedValueCaseInsensitive(row, conf.titleField || 'name') || 
                    getNestedValueCaseInsensitive(row, 'title') || 
                    getNestedValueCaseInsensitive(row, 'name') || 
                    getNestedValueCaseInsensitive(row, 'betreff') || 
                    getNestedValueCaseInsensitive(row, 'subject') || 
                    getNestedValueCaseInsensitive(row, 'thema') || 
                    getNestedValueCaseInsensitive(row, 'titel') || 
                    `Eintrag #${idx + 1}`;
      
      const startVal = getNestedValueCaseInsensitive(row, conf.startDateField || 'date') || 
                       getNestedValueCaseInsensitive(row, 'datum') ||
                       getNestedValueCaseInsensitive(row, 'vondatum') ||
                       getNestedValueCaseInsensitive(row, 'von_datum') ||
                       getNestedValueCaseInsensitive(row, 'startdatum') ||
                       getNestedValueCaseInsensitive(row, 'start_datum') ||
                       getNestedValueCaseInsensitive(row, 'erstellt_am') ||
                       getNestedValueCaseInsensitive(row, 'created_at');
                        
      const endVal = (conf.endDateField ? getNestedValueCaseInsensitive(row, conf.endDateField) : null) || 
                     getNestedValueCaseInsensitive(row, 'bisdatum') ||
                     getNestedValueCaseInsensitive(row, 'bis_datum') ||
                     getNestedValueCaseInsensitive(row, 'enddatum') ||
                     getNestedValueCaseInsensitive(row, 'end_datum') ||
                     getNestedValueCaseInsensitive(row, 'endDate') ||
                     startVal;
      
      const startTimeVal = conf.startTimeField ? getNestedValueCaseInsensitive(row, conf.startTimeField) : 
                           (getNestedValueCaseInsensitive(row, 'uhrzeit') || 
                            getNestedValueCaseInsensitive(row, 'vonuhrzeit') ||
                            getNestedValueCaseInsensitive(row, 'von_uhrzeit') ||
                            getNestedValueCaseInsensitive(row, 'startuhrzeit') ||
                            getNestedValueCaseInsensitive(row, 'start_uhrzeit') ||
                            getNestedValueCaseInsensitive(row, 'zeit') || 
                            getNestedValueCaseInsensitive(row, 'startzeit') || 
                            getNestedValueCaseInsensitive(row, 'time') ||
                            getNestedValueCaseInsensitive(row, 'start_time'));
                            
      const endTimeVal = conf.endTimeField ? getNestedValueCaseInsensitive(row, conf.endTimeField) : 
                         (getNestedValueCaseInsensitive(row, 'endzeit') || 
                          getNestedValueCaseInsensitive(row, 'bisuhrzeit') ||
                          getNestedValueCaseInsensitive(row, 'bis_uhrzeit') ||
                          getNestedValueCaseInsensitive(row, 'enduhrzeit') ||
                          getNestedValueCaseInsensitive(row, 'end_uhrzeit') ||
                          getNestedValueCaseInsensitive(row, 'end_time'));

      const start = parseDateWithTime(startVal, startTimeVal);
      const end = parseDateWithTime(endVal || startVal, endTimeVal || startTimeVal);
      const color = getNestedValueCaseInsensitive(row, conf.colorField || 'color') || '#4f46e5';

      // An event has a specific time if a custom time field is provided OR if the parsed start/end date-times contain a non-zero hour/minute.
      const hasSpecificTime = !!startTimeVal || (start !== null && (start.getHours() !== 0 || start.getMinutes() !== 0));

      return {
        id,
        title,
        start,
        end,
        color,
        hasSpecificTime,
        raw: row
      };
    }).filter(e => e.start !== null);
  }, [activeData, conf]);

  // Handle month/year changes
  const prevPeriod = () => {
    const d = new Date(currentDate);
    if (currentView === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else if (currentView === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 1);
    }
    setCurrentDate(d);
  };

  const nextPeriod = () => {
    const d = new Date(currentDate);
    if (currentView === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else if (currentView === 'week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() + 1);
    }
    setCurrentDate(d);
  };

  const setToday = () => {
    setCurrentDate(new Date());
  };

  const formatMonthYear = (date: Date) => {
    const months = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Monday-start of week helper
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  };

  // Check if dates match
  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  // Generate Month Grid Days
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    // adjust first day index (0 = Sunday, 1 = Monday...) to start at Monday (0)
    let startOffset = (firstDay.getDay() + 6) % 7;
    
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    
    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    
    // Previous month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthTotalDays - i),
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Next month padding to make complete rows of 7
    const remaining = 42 - days.length; // 6 rows of 7 = 42
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  }, [currentDate]);

  // Generate Week Days (Mon - Sun)
  const weekDays = useMemo(() => {
    const start = getStartOfWeek(currentDate);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  // Filter events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(e => e.start && isSameDay(e.start, day));
  };

  // Handle Event Clicks
  const handleEventClick = (event: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
  };

  // Add Record handler
  const handleOpenAddModal = (day?: Date, timeString?: string) => {
    if (!linkedTable) return;
    const initialForm: Record<string, any> = {};
    linkedTable.fields.forEach(f => {
      if (f.isAutoIncrement || f.isPrimaryKey) return;
      const fieldNameLower = f.name.toLowerCase();

      if (f.type === 'DATE' || f.type === 'DATETIME' || f.type === 'TIMESTAMP') {
        const d = day || new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const date = String(d.getDate()).padStart(2, '0');
        if (f.type === 'DATE') {
          initialForm[f.name] = `${year}-${month}-${date}`;
        } else {
          const time = timeString || "09:00";
          initialForm[f.name] = `${year}-${month}-${date}T${time}:00`;
        }
      } else if (f.type === 'BOOLEAN') {
        initialForm[f.name] = false;
      } else if (fieldNameLower.includes('uhrzeit') || fieldNameLower.includes('zeit') || fieldNameLower.includes('time') || fieldNameLower.includes('startzeit')) {
        initialForm[f.name] = timeString || '09:00';
      } else if (fieldNameLower.includes('farbe') || fieldNameLower.includes('color')) {
        initialForm[f.name] = '#4f46e5';
      } else {
        initialForm[f.name] = f.defaultValue || '';
      }
    });
    setFormData(initialForm);
    setShowAddModal(true);
  };

  const handleSaveNewRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedTable) return;

    // Generate unique ID
    const primaryKeyField = linkedTable.fields.find(f => f.isPrimaryKey) || { name: 'id' };
    const recordId = Math.random().toString(36).substr(2, 9);
    
    const newRecord = {
      ...formData,
      [primaryKeyField.name]: recordId
    };

    const updatedData = [...(linkedTable.data || []), newRecord];
    updateTable({
      ...linkedTable,
      data: updatedData
    });

    setShowAddModal(false);
    setFormData({});
  };

  // Edit/Update Event handler
  const handleOpenEditModal = () => {
    if (!linkedTable || !selectedEvent) return;
    setFormData({ ...selectedEvent.raw });
    setShowEditModal(true);
  };

  const handleSaveEditRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedTable || !selectedEvent) return;

    const primaryKeyField = linkedTable.fields.find(f => f.isPrimaryKey) || { name: 'id' };
    const pKeyValue = selectedEvent.raw[primaryKeyField.name];

    const updatedData = (linkedTable.data || []).map(row => {
      if (row[primaryKeyField.name] === pKeyValue) {
        return { ...row, ...formData };
      }
      return row;
    });

    updateTable({
      ...linkedTable,
      data: updatedData
    });

    setShowEditModal(false);
    setSelectedEvent(null);
    setFormData({});
  };

  // Delete Record handler
  const handleDeleteRecord = () => {
    if (!linkedTable || !selectedEvent) return;
    if (!confirm('Möchten Sie diesen Eintrag wirklich löschen?')) return;

    const primaryKeyField = linkedTable.fields.find(f => f.isPrimaryKey) || { name: 'id' };
    const pKeyValue = selectedEvent.raw[primaryKeyField.name];

    const updatedData = (linkedTable.data || []).filter(row => row[primaryKeyField.name] !== pKeyValue);

    updateTable({
      ...linkedTable,
      data: updatedData
    });

    setSelectedEvent(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[650px] w-full text-slate-800 dark:text-slate-100 font-sans transition-all">
      {/* Upper Information Bar: Shows Connection & Actions */}
      <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2">
          <Database size={14} className="text-indigo-500 shrink-0" />
          <span className="font-semibold text-slate-500 dark:text-slate-400">Verbindung:</span>
          {linkedTable ? (
            <span className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded font-medium flex items-center gap-1">
              💾 Tabelle <span className="font-mono font-bold">"{linkedTable.name}"</span>
            </span>
          ) : linkedQuery ? (
            <span className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-medium flex items-center gap-1">
              🔍 Abfrage <span className="font-mono font-bold">"{linkedQuery.name}"</span>
            </span>
          ) : (
            <span className="text-rose-500 italic flex items-center gap-1">
              ⚠️ Keine Datenquelle verknüpft (Lokal-Modus)
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {linkedTable && (
            <button 
              onClick={() => handleOpenAddModal()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-3 py-1 rounded-lg flex items-center gap-1 transition-colors shadow-xs"
            >
              <Plus size={13} />
              Eintrag hinzufügen
            </button>
          )}
          <span className="text-slate-400 dark:text-slate-600 font-mono text-[10px]">
            {events.length} {events.length === 1 ? 'Eintrag' : 'Einträge'}
          </span>
        </div>
      </div>

      {/* Main Calendar Navigation */}
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
        {/* Left Side: Period selector */}
        <div className="flex items-center gap-1.5">
          <button 
            onClick={prevPeriod}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Zurück"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={setToday}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Heute
          </button>
          <button 
            onClick={nextPeriod}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Vor"
          >
            <ChevronRight size={16} />
          </button>
          
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 ml-2">
            {currentView === 'month' && formatMonthYear(currentDate)}
            {currentView === 'week' && `Woche vom ${getStartOfWeek(currentDate).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}`}
            {currentView === 'day' && currentDate.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {currentView === 'agenda' && 'Terminübersicht (Agenda)'}
          </h2>
        </div>

        {/* Right Side: View selector switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
          {(['month', 'week', 'day', 'agenda'] as const).map((v) => {
            const isSelected = currentView === v;
            return (
              <button
                key={v}
                onClick={() => setCurrentView(v)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all uppercase tracking-wide text-[10px] ${
                  isSelected 
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {v === 'month' ? 'Monat' : v === 'week' ? 'Woche' : v === 'day' ? 'Tag' : 'Agenda'}
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW GRID CONTENT */}
      <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-950/20 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 z-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {/* 1. MONTH VIEW */}
        {currentView === 'month' && (
          <div className="h-full min-w-[650px] flex flex-col">
            {/* Weekdays header */}
            <div className="grid grid-cols-7 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-center text-xs font-bold text-slate-500 py-2 shrink-0">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 grid-rows-6 flex-1 bg-slate-200/40 dark:bg-slate-800/20 gap-[1px]">
              {monthDays.map(({ date, isCurrentMonth }, idx) => {
                const dayEvents = getEventsForDay(date);
                const isToday = isSameDay(date, new Date());
                
                return (
                  <div 
                    key={idx} 
                    onClick={() => linkedTable && handleOpenAddModal(date)}
                    className={`bg-white dark:bg-slate-900 p-1.5 flex flex-col h-full min-h-[70px] group transition-colors hover:bg-slate-50/75 dark:hover:bg-slate-800/40 cursor-pointer ${
                      !isCurrentMonth ? 'text-slate-400 dark:text-slate-600 bg-slate-50/30 dark:bg-slate-950/10' : ''
                    }`}
                  >
                    {/* Day number */}
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                        isToday 
                          ? 'bg-indigo-600 text-white font-black' 
                          : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {date.getDate()}
                      </span>
                      {linkedTable && (
                        <span className="opacity-0 group-hover:opacity-100 text-[10px] text-indigo-500 font-bold hover:scale-115 transition-all">
                          +
                        </span>
                      )}
                    </div>

                    {/* Day events */}
                    <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                      {dayEvents.map((ev) => (
                        <div
                          key={ev.id}
                          onClick={(e) => handleEventClick(ev, e)}
                          style={{ borderLeftColor: ev.color }}
                          className="text-[10px] px-1.5 py-0.5 border-l-2 bg-slate-100/80 dark:bg-slate-850/80 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium truncate flex items-center gap-1 select-none cursor-pointer transition-colors"
                          title={ev.title}
                        >
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ev.color }}></span>
                          <span className="truncate">{ev.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. WEEK VIEW */}
        {currentView === 'week' && (
          <div className="h-full min-w-[750px] flex flex-col bg-white dark:bg-slate-900 select-none">
            {/* Week Headers */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 shrink-0 pl-16">
              {weekDays.map((day, idx) => {
                const isToday = isSameDay(day, new Date());
                return (
                  <div 
                    key={idx} 
                    className={`p-2.5 text-center border-r border-slate-200 dark:border-slate-800/50 flex flex-col items-center justify-center ${
                      isToday ? 'bg-indigo-50/30 dark:bg-indigo-950/15' : ''
                    }`}
                  >
                    <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">
                      {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][idx]}
                    </span>
                    <span className={`text-xs font-extrabold mt-0.5 px-2 py-0.5 rounded-full ${
                      isToday ? 'bg-indigo-600 text-white shadow-sm font-black' : 'text-slate-750 dark:text-slate-300'
                    }`}>
                      {day.getDate()}.{day.getMonth() + 1}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* All-Day Row */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/10 shrink-0">
              <div className="w-16 border-r border-slate-200 dark:border-slate-800 flex items-center justify-center text-[9px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0">
                Ganztägig
              </div>
              <div className="flex-1 grid grid-cols-7">
                {weekDays.map((day, idx) => {
                  const dayEvents = getEventsForDay(day);
                  const allDayEvents = dayEvents.filter(ev => !ev.hasSpecificTime);

                  return (
                    <div key={idx} className="p-1 border-r border-slate-200/50 dark:border-slate-800/30 min-h-[38px] space-y-1">
                      {allDayEvents.map(ev => (
                        <div
                          key={ev.id}
                          onClick={(e) => handleEventClick(ev, e)}
                          style={{ borderLeftColor: ev.color }}
                          className="text-[10px] px-1.5 py-0.5 border-l-2 bg-slate-100/70 dark:bg-slate-800/60 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold truncate cursor-pointer transition-colors"
                          title={ev.title}
                        >
                          {ev.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Hourly Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex min-h-[400px]">
              {/* Hour Labels */}
              <div className="w-16 border-r border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/15 text-center text-[10px] font-bold text-slate-400 shrink-0">
                {[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map((hour) => (
                  <div key={hour} className="h-[60px] flex items-center justify-center border-b border-slate-150 dark:border-slate-800/20 font-mono">
                    {String(hour).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              <div className="flex-1 grid grid-cols-7 relative">
                {weekDays.map((day, idx) => {
                  const dayEvents = getEventsForDay(day);
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <div 
                      key={idx}
                      className={`relative border-r border-slate-150 dark:border-slate-800/30 h-[960px] ${
                        isToday ? 'bg-indigo-50/10 dark:bg-indigo-950/5' : ''
                      }`}
                    >
                      {/* Interactive Hour slots */}
                      {[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map((hour) => (
                        <div
                          key={hour}
                          onClick={() => linkedTable && handleOpenAddModal(day, `${String(hour).padStart(2, '0')}:00`)}
                          className="h-[60px] border-b border-slate-100 dark:border-slate-850/20 hover:bg-indigo-500/5 dark:hover:bg-indigo-400/5 cursor-pointer transition-colors group relative flex items-start p-1"
                        >
                          <span className="opacity-0 group-hover:opacity-100 text-[9px] text-indigo-500 font-bold transition-opacity">
                            + {hour}:00
                          </span>
                        </div>
                      ))}

                      {/* Today indicator line */}
                      {isToday && (
                        <div 
                          className="absolute left-0 right-0 border-t-2 border-red-500 z-10 pointer-events-none flex items-center"
                          style={{ 
                            top: `${Math.max(0, ((new Date().getHours() + new Date().getMinutes() / 60) - 7) * 60)}px` 
                          }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 -ml-[4px]"></div>
                        </div>
                      )}

                      {/* Absolute Event Overlays */}
                      <div className="absolute inset-0 pointer-events-none">
                        {dayEvents.map((ev) => {
                          if (!ev.hasSpecificTime) return null;

                          const startHour = ev.start.getHours() + ev.start.getMinutes() / 60;
                          let endHour = ev.end ? (ev.end.getHours() + ev.end.getMinutes() / 60) : (startHour + 1);
                          if (endHour <= startHour) endHour = startHour + 1;

                          const gridStart = 7;
                          const gridEnd = 23;
                          if (startHour >= gridEnd || endHour <= gridStart) return null;

                          const top = Math.max(0, (startHour - gridStart) * 60);
                          const height = Math.max(26, (Math.min(gridEnd, endHour) - Math.max(gridStart, startHour)) * 60);

                          return (
                            <div
                              key={ev.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEventClick(ev, e);
                              }}
                              style={{ 
                                top: `${top}px`, 
                                height: `${height}px`,
                                borderLeftColor: ev.color,
                              }}
                              className="absolute left-1 right-1 p-1 px-1.5 border-l-3 bg-white/95 dark:bg-slate-900/95 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg shadow-sm hover:shadow-md hover:scale-[1.01] text-[11px] text-slate-800 dark:text-slate-200 font-semibold cursor-pointer transition-all pointer-events-auto overflow-hidden flex flex-col justify-between hover:z-10"
                            >
                              <div className="min-w-0">
                                <div className="truncate text-[11px] font-bold flex items-center gap-1" style={{ color: ev.color }}>
                                  {ev.title}
                                </div>
                                {ev.raw.ort && (
                                  <div className="text-[9px] text-slate-400 dark:text-slate-500 truncate">
                                    📍 {ev.raw.ort}
                                  </div>
                                )}
                              </div>
                              <div className="text-[9px] text-slate-450 dark:text-slate-550 font-mono flex items-center gap-0.5 select-none shrink-0">
                                <Clock size={9} />
                                {String(ev.start.getHours()).padStart(2, '0')}:{String(ev.start.getMinutes()).padStart(2, '0')}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* 3. DAY VIEW */}
        {currentView === 'day' && (
          <div className="h-full flex flex-col bg-white dark:bg-slate-900 select-none">
            {/* Day Header */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <CalendarDays className="text-indigo-600" size={18} />
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Tagesansicht</span>
              </div>
              {linkedTable && (
                <button 
                  onClick={() => handleOpenAddModal(currentDate)}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus size={13} /> Neuer Termin
                </button>
              )}
            </div>

            {/* All-Day Row */}
            {(() => {
              const dayEvents = getEventsForDay(currentDate);
              const allDayEvents = dayEvents.filter(ev => !ev.hasSpecificTime);

              if (allDayEvents.length === 0) return null;

              return (
                <div className="flex border-b border-slate-200 dark:border-slate-800 bg-amber-50/10 dark:bg-amber-950/10 shrink-0 p-2">
                  <div className="w-16 flex items-center justify-center text-[9px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider shrink-0">
                    Ganztägig
                  </div>
                  <div className="flex-1 flex flex-wrap gap-2 px-2">
                    {allDayEvents.map(ev => (
                      <div
                        key={ev.id}
                        onClick={(e) => handleEventClick(ev, e)}
                        style={{ borderLeftColor: ev.color, backgroundColor: `${ev.color}15` }}
                        className="text-xs px-2.5 py-1 border-l-3 rounded-lg text-slate-850 dark:text-slate-200 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                        title={ev.title}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ev.color }}></span>
                        {ev.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Scrollable Hourly Day Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex min-h-[400px]">
              {/* Hour Labels */}
              <div className="w-16 border-r border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/15 text-center text-[10px] font-bold text-slate-400 shrink-0">
                {[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map((hour) => (
                  <div key={hour} className="h-[60px] flex items-center justify-center border-b border-slate-150 dark:border-slate-800/20 font-mono">
                    {String(hour).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Day column container (Single wide) */}
              <div className="flex-1 relative h-[960px]">
                {/* Interactive Hour Slots */}
                {[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map((hour) => (
                  <div
                    key={hour}
                    onClick={() => linkedTable && handleOpenAddModal(currentDate, `${String(hour).padStart(2, '0')}:00`)}
                    className="h-[60px] border-b border-slate-100 dark:border-slate-850/20 hover:bg-indigo-500/5 dark:hover:bg-indigo-400/5 cursor-pointer transition-colors group relative flex items-center px-4"
                  >
                    <span className="opacity-0 group-hover:opacity-100 text-[10px] text-indigo-500 font-bold transition-opacity">
                      + Neuer Termin für {hour}:00 Uhr eintragen
                    </span>
                  </div>
                ))}

                {/* Today red line */}
                {isSameDay(currentDate, new Date()) && (
                  <div 
                    className="absolute left-0 right-0 border-t-2 border-red-500 z-10 pointer-events-none flex items-center"
                    style={{ 
                      top: `${Math.max(0, ((new Date().getHours() + new Date().getMinutes() / 60) - 7) * 60)}px` 
                    }}
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 -ml-1"></div>
                  </div>
                )}

                {/* Event Overlays */}
                <div className="absolute inset-0 pointer-events-none">
                  {(() => {
                    const dayEvents = getEventsForDay(currentDate);
                    return dayEvents.map((ev) => {
                      if (!ev.hasSpecificTime) return null;

                      const startHour = ev.start.getHours() + ev.start.getMinutes() / 60;
                      let endHour = ev.end ? (ev.end.getHours() + ev.end.getMinutes() / 60) : (startHour + 1);
                      if (endHour <= startHour) endHour = startHour + 1;

                      const gridStart = 7;
                      const gridEnd = 23;
                      if (startHour >= gridEnd || endHour <= gridStart) return null;

                      const top = Math.max(0, (startHour - gridStart) * 60);
                      const height = Math.max(32, (Math.min(gridEnd, endHour) - Math.max(gridStart, startHour)) * 60);

                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(ev, e);
                          }}
                          style={{ 
                            top: `${top}px`, 
                            height: `${height}px`,
                            borderLeftColor: ev.color,
                          }}
                          className="absolute left-2 right-2 p-2.5 px-4 border-l-4 bg-white/95 dark:bg-slate-900/95 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.005] cursor-pointer transition-all pointer-events-auto overflow-hidden flex flex-col justify-between hover:z-10 border border-slate-100 dark:border-slate-800"
                        >
                          <div className="flex items-start justify-between gap-4 min-w-0">
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-sm truncate flex items-center gap-1.5" style={{ color: ev.color }}>
                                {ev.title}
                              </h4>
                              {ev.raw.ort && (
                                <p className="text-xs text-slate-450 dark:text-slate-550 truncate mt-0.5">
                                  📍 {ev.raw.ort}
                                </p>
                              )}
                              {ev.raw.beschreibung && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                  {ev.raw.beschreibung}
                                </p>
                              )}
                            </div>
                            
                            <div className="text-right shrink-0">
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 text-[10px] font-bold px-2 py-0.5 rounded-lg font-mono">
                                {String(ev.start.getHours()).padStart(2, '0')}:{String(ev.start.getMinutes()).padStart(2, '0')} - {ev.end ? `${String(ev.end.getHours()).padStart(2, '0')}:${String(ev.end.getMinutes()).padStart(2, '0')}` : ''}
                              </span>
                            </div>
                          </div>

                          {/* Render custom metadata fields if available */}
                          <div className="flex flex-wrap gap-2 mt-2 select-none">
                            {Object.keys(ev.raw).map((k) => {
                              if (['id', 'ID', 'name', 'title', 'date', 'datum', 'color', 'farbe', 'uhrzeit', 'erstellt_am', 'ort', 'beschreibung'].includes(k.toLowerCase())) return null;
                              const val = ev.raw[k];
                              if (!val || typeof val === 'object') return null;
                              return (
                                <span key={k} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                                  <span className="font-semibold text-slate-400">{k}:</span> {String(val)}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

              </div>
            </div>

          </div>
        )}

        {/* 4. AGENDA VIEW */}
        {currentView === 'agenda' && (
          <div className="p-4 bg-white dark:bg-slate-900 h-full overflow-y-auto">
            <div className="max-w-2xl mx-auto space-y-6">
              {events.length === 0 ? (
                <div className="p-16 text-center border-2 border-dashed dark:border-slate-800 rounded-xl space-y-2">
                  <Info size={32} className="mx-auto text-slate-300 dark:text-slate-700" />
                  <p className="text-slate-500 dark:text-slate-400 italic text-sm">Keine zukünftigen oder vergangenen Termine gefunden.</p>
                </div>
              ) : (
                <div className="relative border-l border-slate-200 dark:border-slate-800 pl-4 ml-2 space-y-6">
                  {events
                    .sort((a, b) => (a.start?.getTime() || 0) - (b.start?.getTime() || 0))
                    .map((ev) => {
                      const dateStr = ev.start?.toLocaleDateString('de-DE', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      });
                      return (
                        <div key={ev.id} className="relative group">
                          {/* Dot marker */}
                          <div 
                            className="absolute -left-[24px] top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 group-hover:scale-125 transition-transform"
                            style={{ backgroundColor: ev.color }}
                          ></div>
                          
                          <div 
                            onClick={(e) => handleEventClick(ev, e)}
                            className="p-3 border dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850/50 cursor-pointer transition-all"
                          >
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono tracking-wide">{dateStr}</span>
                            <h4 className="font-bold text-sm text-slate-800 dark:text-white mt-0.5">{ev.title}</h4>
                            
                            {/* Detailed Info pills */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {ev.hasSpecificTime && ev.start && (
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 text-[10px] px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                                  <Clock size={10} /> 
                                  {String(ev.start.getHours()).padStart(2, '0')}:{String(ev.start.getMinutes()).padStart(2, '0')} 
                                  {ev.end ? ` - ${String(ev.end.getHours()).padStart(2, '0')}:${String(ev.end.getMinutes()).padStart(2, '0')}` : ''}
                                </span>
                              )}
                              {Object.keys(ev.raw).map((k) => {
                                if (['id', 'ID', 'name', 'title', 'date', 'datum', 'vondatum', 'von_datum', 'bisdatum', 'bis_datum', 'enddatum', 'end_datum', 'color', 'farbe', 'uhrzeit', 'vonuhrzeit', 'von_uhrzeit', 'bisuhrzeit', 'bis_uhrzeit', 'erstellt_am', 'created_at'].includes(k.toLowerCase())) return null;
                                const val = ev.raw[k];
                                if (!val || typeof val === 'object') return null;
                                return (
                                  <span key={k} className="bg-slate-55/60 dark:bg-slate-800/40 text-slate-500 text-[9px] px-1.5 py-0.5 rounded">
                                    <span className="font-semibold text-slate-400">{k}:</span> {String(val)}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* EVENT DETAIL POPUP MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp">
            
            {/* Header banner with color */}
            <div className="p-4 text-white flex items-center justify-between" style={{ backgroundColor: selectedEvent.color }}>
              <div className="flex items-center gap-2">
                <CalendarIcon size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Termindetails</span>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="text-white/80 hover:text-white hover:scale-110 transition-transform"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider font-bold">TITEL / BEZEICHNUNG</span>
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">{selectedEvent.title}</h3>
              </div>

              {/* Date & Time pill */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-350">
                  <CalendarDays size={14} className="text-indigo-500" />
                  <span className="font-semibold">Datum:</span>
                  <span>{selectedEvent.start?.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                {selectedEvent.hasSpecificTime && selectedEvent.start && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-350 font-semibold">
                    <Clock size={14} className="text-indigo-500" />
                    <span>Uhrzeit:</span>
                    <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {String(selectedEvent.start.getHours()).padStart(2, '0')}:{String(selectedEvent.start.getMinutes()).padStart(2, '0')} 
                      {selectedEvent.end ? ` - ${String(selectedEvent.end.getHours()).padStart(2, '0')}:${String(selectedEvent.end.getMinutes()).padStart(2, '0')}` : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* List of other parameters inside row */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] text-slate-400 font-mono tracking-wider font-bold border-b dark:border-slate-800 pb-1 uppercase">Zusatzdatenfelder</h4>
                <div className="grid grid-cols-1 gap-2">
                  {Object.keys(selectedEvent.raw).map((key) => {
                    // Skip technical or already-rendered fields
                    if (['id', 'ID', 'name', 'title', 'date', 'datum', 'vondatum', 'von_datum', 'bisdatum', 'bis_datum', 'enddatum', 'end_datum', 'color', 'farbe', 'uhrzeit', 'vonuhrzeit', 'von_uhrzeit', 'bisuhrzeit', 'bis_uhrzeit', 'erstellt_am', 'created_at'].includes(key.toLowerCase())) return null;
                    const val = selectedEvent.raw[key];
                    if (val === undefined || val === null || val === '') return null;
                    
                    return (
                      <div key={key} className="flex justify-between items-start text-xs border-b border-slate-50 dark:border-slate-850/50 pb-1.5">
                        <span className="text-slate-450 dark:text-slate-500 font-semibold">{key}:</span>
                        <span className="text-slate-800 dark:text-slate-200 font-mono break-all text-right max-w-[200px]">
                          {typeof val === 'boolean' ? (val ? '✔️ Ja' : '❌ Nein') : String(val)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex gap-2 shrink-0">
              {linkedTable ? (
                <>
                  <button 
                    onClick={handleOpenEditModal}
                    className="flex-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                  >
                    <Edit3 size={13} />
                    Bearbeiten
                  </button>
                  <button 
                    onClick={handleDeleteRecord}
                    className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                    title="Eintrag löschen"
                  >
                    <Trash2 size={13} />
                    Löschen
                  </button>
                </>
              ) : (
                <div className="text-[11px] text-slate-400 italic flex items-center gap-1 w-full justify-center">
                  <Info size={12} /> Datenquellen im SQL Query-Modus sind schreibgeschützt
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* DYNAMIC FORM MODAL: ADD RECORD */}
      {showAddModal && linkedTable && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp">
            <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <Plus className="text-indigo-600" size={16} />
                <h3 className="font-bold text-sm text-slate-800 dark:text-white">Neuer Eintrag in "{linkedTable.name}"</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewRecord} className="flex-1 overflow-y-auto p-5 space-y-4">
              {linkedTable.fields.map((field) => {
                // Skip Primary Keys and AutoIncrement
                if (field.isPrimaryKey || field.isAutoIncrement) return null;

                const isDate = ['DATE', 'DATETIME', 'TIMESTAMP'].includes(field.type);
                const isBoolean = field.type === 'BOOLEAN';
                const isNumber = ['INTEGER', 'DECIMAL', 'DOUBLE'].includes(field.type);

                return (
                  <div key={field.id} className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {field.name} {field.allowNull === false && <span className="text-red-500">*</span>}
                    </label>
                    
                    {isBoolean ? (
                      <div className="flex items-center gap-2 py-1">
                        <input
                          id={`checkbox-${field.id}`}
                          type="checkbox"
                          checked={!!formData[field.name]}
                          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.checked })}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <label htmlFor={`checkbox-${field.id}`} className="text-xs text-slate-600 dark:text-slate-350">Aktivieren / Ja</label>
                      </div>
                    ) : isDate ? (
                      <input
                        type="date"
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        required={field.allowNull === false}
                        className="w-full bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                      />
                    ) : isNumber ? (
                      <input
                        type="number"
                        value={formData[field.name] ?? ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value === '' ? '' : Number(e.target.value) })}
                        required={field.allowNull === false}
                        className="w-full bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                        placeholder="Zahl eingeben..."
                      />
                    ) : field.type === 'TEXT' ? (
                      <textarea
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        required={field.allowNull === false}
                        rows={3}
                        className="w-full bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                        placeholder="Text eingeben..."
                      />
                    ) : (
                      <input
                        type="text"
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        required={field.allowNull === false}
                        className="w-full bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                        placeholder={`${field.name} eingeben...`}
                      />
                    )}
                  </div>
                );
              })}

              <div className="pt-4 flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl py-2 px-4 text-xs font-bold text-slate-500"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 px-4 text-xs font-bold flex items-center justify-center gap-1 shadow-xs"
                >
                  <CheckCircle2 size={13} /> Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DYNAMIC FORM MODAL: EDIT RECORD */}
      {showEditModal && linkedTable && selectedEvent && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp">
            <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <Edit3 className="text-indigo-600" size={16} />
                <h3 className="font-bold text-sm text-slate-800 dark:text-white">Eintrag bearbeiten</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditRecord} className="flex-1 overflow-y-auto p-5 space-y-4">
              {linkedTable.fields.map((field) => {
                if (field.isPrimaryKey || field.isAutoIncrement) return null;

                const isDate = ['DATE', 'DATETIME', 'TIMESTAMP'].includes(field.type);
                const isBoolean = field.type === 'BOOLEAN';
                const isNumber = ['INTEGER', 'DECIMAL', 'DOUBLE'].includes(field.type);

                return (
                  <div key={field.id} className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {field.name} {field.allowNull === false && <span className="text-red-500">*</span>}
                    </label>
                    
                    {isBoolean ? (
                      <div className="flex items-center gap-2 py-1">
                        <input
                          id={`edit-checkbox-${field.id}`}
                          type="checkbox"
                          checked={!!formData[field.name]}
                          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.checked })}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <label htmlFor={`edit-checkbox-${field.id}`} className="text-xs text-slate-600 dark:text-slate-350">Aktivieren / Ja</label>
                      </div>
                    ) : isDate ? (
                      <input
                        type="date"
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        required={field.allowNull === false}
                        className="w-full bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                      />
                    ) : isNumber ? (
                      <input
                        type="number"
                        value={formData[field.name] ?? ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value === '' ? '' : Number(e.target.value) })}
                        required={field.allowNull === false}
                        className="w-full bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                        placeholder="Zahl..."
                      />
                    ) : field.type === 'TEXT' ? (
                      <textarea
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        required={field.allowNull === false}
                        rows={3}
                        className="w-full bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                      />
                    ) : (
                      <input
                        type="text"
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        required={field.allowNull === false}
                        className="w-full bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                      />
                    )}
                  </div>
                );
              })}

              <div className="pt-4 flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl py-2 px-4 text-xs font-bold text-slate-500"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 px-4 text-xs font-bold flex items-center justify-center gap-1 shadow-xs"
                >
                  Änderungen speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
