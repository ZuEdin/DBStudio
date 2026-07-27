import React from 'react';

export const SupportedTechSection: React.FC = () => {
  const technologies = [
    '.NET 10 Enterprise API',
    'Node.js Express',
    'PHP Native',
    'Laravel',
    'React + Vite',
    'Angular',
    'Vue.js',
    'Blazor WASM',
    'Tauri Desktop (Rust)',
    'Electron Desktop',
    'Docker Containers',
    'Microsoft SQL Server',
    'MySQL & MariaDB',
    'PostgreSQL',
    'MongoDB',
    'SQLite'
  ];

  return (
    <div className="py-12 bg-slate-50 border-b border-slate-200" id="tech-stack-section">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
          Unterstützte Runtimes &amp; Technologien
        </h3>
        <div className="flex flex-wrap justify-center gap-2">
          {technologies.map(tech => (
            <span
              key={tech}
              className="bg-white border border-slate-200 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-600 transition-colors cursor-default"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
