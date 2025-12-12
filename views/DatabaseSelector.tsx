import React from 'react';
import { Database } from 'lucide-react';
import { DbType } from '../types/index';

interface DbOption {
  type: DbType;
  name: string;
  description: string;
}

const options: DbOption[] = [
  {
    type: DbType.SQLite,
    name: 'SQLite',
    description: 'Lokal, serverlos und ideal für kleine bis mittlere Projekte und Prototyping.'
  },
  {
    type: DbType.SQL,
    name: 'SQL Server',
    description: 'Robustes, unternehmensweites System von Microsoft für anspruchsvolle Anwendungen.'
  },
  {
    type: DbType.MySQL,
    name: 'MySQL',
    description: 'Das weltweit beliebteste Open-Source-System, perfekt für Web-Anwendungen.'
  },
  {
    type: DbType.NoSQL,
    name: 'NoSQL',
    description: 'Flexibel und skalierbar, optimiert für unstrukturierte Daten und Big-Data-Szenarien.'
  }
];

interface DatabaseSelectorProps {
  onSelectDbType: (dbType: DbType) => void;
}

export const DatabaseSelector: React.FC<DatabaseSelectorProps> = ({ onSelectDbType }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-100 font-sans">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-800">Willkommen bei DB Studio Pro</h1>
        <p className="text-lg text-slate-500 mt-2">Wählen Sie zunächst einen Datenbanktyp aus, um zu beginnen.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl w-full px-8">
        {options.map((opt) => (
          <div
            key={opt.type}
            onClick={() => onSelectDbType(opt.type)}
            className="group bg-white p-8 rounded-lg border border-slate-200 shadow-md hover:shadow-xl hover:border-sky-500 transform hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col items-center text-center"
          >
            <Database className="w-16 h-16 text-slate-400 group-hover:text-sky-500 transition-colors duration-300 mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{opt.name}</h2>
            <p className="text-slate-600 text-sm leading-relaxed">{opt.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};