import React, { useState } from 'react';
import { SelectQuery } from '../../../types';
import { Code2, Copy, Check, FileJson, Globe, Terminal, X, ShieldCheck } from 'lucide-react';
import { toPascalCase } from '../../../utils/generators/common';

interface QueryExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: SelectQuery;
  sql: string;
}

export const QueryExportModal: React.FC<QueryExportModalProps> = ({
  isOpen,
  onClose,
  query,
  sql,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'REACT_HOOK' | 'REST_API' | 'OPENAPI'>('REACT_HOOK');
  const [copied, setCopied] = useState(false);

  const queryNamePascal = toPascalCase(query.name || 'CustomQuery');
  const queryEndpointName = (query.name || 'custom-query').toLowerCase().replace(/\s+/g, '-');

  const reactHookCode = `// Generated TypeScript Data Hook for ${query.name}
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface ${queryNamePascal}Result {
${query.columns
  .filter((c) => c.show)
  .map((c) => `  ${c.alias || c.fieldName}: any;`)
  .join('\n')}
}

export interface ${queryNamePascal}Params {
${(query.parameters || [])
  .map((p) => `  ${p.name}${p.required ? '' : '?'}: ${p.type === 'NUMBER' ? 'number' : p.type === 'BOOLEAN' ? 'boolean' : 'string'};`)
  .join('\n')}
}

export const use${queryNamePascal} = (params?: ${queryNamePascal}Params) => {
  return useQuery<${queryNamePascal}Result[]>({
    queryKey: ['${queryEndpointName}', params],
    queryFn: async () => {
      const response = await axios.get<${queryNamePascal}Result[]>(\`/api/queries/${queryEndpointName}\`, {
        params,
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 Minuten Cache
  });
};
`;

  const restApiCode = `// Express.js Backend Endpoint
// File: server/routes/queries/${queryEndpointName}.ts
import { Router, Request, Response } from 'express';
import { db } from '../../db';

const router = Router();

const SQL_QUERY = \`
${sql}
\`;

router.get('/api/queries/${queryEndpointName}', async (req: Request, res: Response) => {
  try {
    const params = req.query;
    // Prepared parameters execution
    const results = await db.query(SQL_QUERY, Object.values(params));
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
`;

  const openApiSpec = {
    openapi: '3.0.3',
    info: {
      title: `${query.name} Query Endpoint`,
      version: '1.0.0',
    },
    paths: {
      [`/api/queries/${queryEndpointName}`]: {
        get: {
          summary: `Execute ${query.name}`,
          parameters: (query.parameters || []).map((p) => ({
            name: p.name,
            in: 'query',
            required: p.required || false,
            description: p.description || '',
            schema: {
              type: p.type.toLowerCase(),
            },
          })),
          responses: {
            '200': {
              description: 'Erfolgreiche Datenabfrage',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: Object.fromEntries(
                        query.columns.filter((c) => c.show).map((c) => [c.alias || c.fieldName, { type: 'string' }])
                      ),
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-base">API- & Hook-Export Generator</h3>
              <p className="text-xs text-slate-400">1-Klick Schnittstellencode für Micro Frontends und Services</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('REACT_HOOK')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-t border-x ${
              activeTab === 'REACT_HOOK'
                ? 'bg-white text-indigo-600 border-slate-200 -mb-px'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Terminal size={14} /> React Data Hook
          </button>
          <button
            onClick={() => setActiveTab('REST_API')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-t border-x ${
              activeTab === 'REST_API'
                ? 'bg-white text-indigo-600 border-slate-200 -mb-px'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Globe size={14} /> Express REST Route
          </button>
          <button
            onClick={() => setActiveTab('OPENAPI')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-t border-x ${
              activeTab === 'OPENAPI'
                ? 'bg-white text-indigo-600 border-slate-200 -mb-px'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <FileJson size={14} /> OpenAPI 3.0 / Swagger
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-950 text-slate-200 font-mono text-xs relative">
          <button
            onClick={() => {
              if (activeTab === 'REACT_HOOK') handleCopy(reactHookCode);
              else if (activeTab === 'REST_API') handleCopy(restApiCode);
              else handleCopy(JSON.stringify(openApiSpec, null, 2));
            }}
            className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-md border border-slate-700 text-xs shadow-xs transition-colors"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? 'Kopiert!' : 'Code kopieren'}</span>
          </button>

          <pre className="overflow-x-auto p-2 leading-relaxed">
            {activeTab === 'REACT_HOOK' && reactHookCode}
            {activeTab === 'REST_API' && restApiCode}
            {activeTab === 'OPENAPI' && JSON.stringify(openApiSpec, null, 2)}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Automatisch typisiert und bereit für TanStack React Query.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
