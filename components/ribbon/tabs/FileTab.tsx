
import React from 'react';
import { Database, Save } from 'lucide-react';

interface FileTabProps {
  onAction: (action: string) => void;
  currentDbType: string;
}

export const FileTab: React.FC<FileTabProps> = ({ onAction, currentDbType }) => {
  return (
    <div className="flex gap-4 h-full items-center">
      <div className="flex flex-col items-center group cursor-pointer p-2 hover:bg-slate-200 rounded" onClick={() => onAction('new_db')}>
        <Database className="w-8 h-8 text-blue-600 mb-1" />
        <span className="text-xs">Neue DB</span>
      </div>
      <div className="flex flex-col items-center group cursor-pointer p-2 hover:bg-slate-200 rounded" onClick={() => onAction('save')}>
        <Save className="w-8 h-8 text-green-600 mb-1" />
        <span className="text-xs">Speichern</span>
      </div>
      <div className="border-l border-slate-300 mx-2 h-16"></div>
      <div className="flex flex-col justify-center text-sm text-slate-600">
        <span className="font-bold">Aktuelle DB:</span>
        <span>{currentDbType}</span>
      </div>
    </div>
  );
};
