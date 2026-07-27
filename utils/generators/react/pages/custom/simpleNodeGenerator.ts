import { GeneratorContext } from './types';

const toCamelCase = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, (chr) => chr.toLowerCase());
};

export const compilePlaceholders = (text: string, contextVar?: string): string => {
  if (!text) return '""';
  const normalized = text.replace(/\{\{/g, '{').replace(/\}\}/g, '}');
  if (!normalized.includes('{')) return JSON.stringify(normalized);
  
  const replaced = normalized.replace(/\{([^{}]+)\}/g, (match, key) => {
    const trimmedKey = key.trim();
    if (contextVar) {
      return `\${${contextVar}['${trimmedKey}'] || ${contextVar}['${toCamelCase(trimmedKey)}'] || searchParams.get('${trimmedKey}') || ''}`;
    } else {
      return `\${searchParams.get('${trimmedKey}') || ''}`;
    }
  });
  
  return `\`${replaced}\``;
};

export const generateSimpleNode = (node: any, ctx: GeneratorContext): string => {
  if (!node) return '';
  
  const classNameStr = node.props?.className || '';
  const styleStr = JSON.stringify(node.props?.style || {});
  
  switch (node.type) {
      case 'container': {
          const childrenStr = (node.children || []).map((c: any) => ctx.generateNode(c, ctx)).join('\n');
          return `<div className="${classNameStr || 'p-4 border rounded'}" style={${styleStr}}>${childrenStr}</div>`;
      }
      case 'text': {
          const compiledText = compilePlaceholders(node.props?.text || '', ctx.currentContextVar);
          return `<div className="break-words ${classNameStr}" style={${styleStr}}>{${compiledText}}</div>`;
      }
      case 'button': {
          const actType = node.props?.actionType;
          if (actType === 'export_report') {
            const fmt = node.props?.exportFormat || 'PDF';
            return `<button onClick={() => exportDataToFile({ title: '${node.props?.label || 'Bericht Export'}', data: [], format: '${fmt}' })} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition cursor-pointer font-bold ${classNameStr}" style={${styleStr}}>${node.props?.label || '📊 Bericht Exportieren'}</button>`;
          }
          if (actType === 'run_macro' || actType === 'smart_import') {
            const macroId = node.props?.macroId || node.props?.exportFormat || 'macro';
            return `<button onClick={() => executeMacro('${macroId}')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition cursor-pointer font-bold ${classNameStr}" style={${styleStr}}>${node.props?.label || '⚡ Makro / Import Starten'}</button>`;
          }
          return `<button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition ${classNameStr}" style={${styleStr}}>${node.props?.label || 'Button'}</button>`;
      }
      case 'divider': {
          return `<hr className="border-slate-200 my-4 ${classNameStr}" style={${styleStr}} />`;
      }
      case 'image': {
          return `<img referrerPolicy="no-referrer" src="${node.props?.src || ''}" className="max-w-full h-auto rounded ${classNameStr}" style={${styleStr}} alt="${node.props?.alt || ''}" />`;
      }
      case 'html': {
          return `<div dangerouslySetInnerHTML={{ __html: ${JSON.stringify(node.props?.html || '')} }} className="${classNameStr}" style={${styleStr}} />`;
      }
      default:
          return '';
  }
};
