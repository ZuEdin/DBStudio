import { CustomPage, Table, Query, Form, VirtualFile } from '../../../../types/index';
import { toCamelCase, toPascalCase } from '../../common';
import { GeneratorContext } from './custom/types';
import { generateSimpleNode } from './custom/simpleNodeGenerator';
import { generateDropdownNode } from './custom/dropdownNodeGenerator';
import { generateTableViewNode } from './custom/tableViewNodeGenerator';
import { generateCustomComponentNode } from './custom/customComponentNodeGenerator';

export const generateCustomPage = (
  page: CustomPage,
  tables: Table[],
  queries: Query[],
  forms: Form[],
  root: string,
  pages: CustomPage[],
  customComponents: any[] = []
): VirtualFile => {
  const compName = `${toPascalCase(page.name)}Page`;
  
  const states: string[] = [];
  const effects: string[] = [];
  const imports = new Set<string>(['React', 'useEffect', 'useState']);

  const generateNode = (node: any, ctx: GeneratorContext): string => {
      if (!node) return '';
      
      switch(node.type) {
          case 'container':
          case 'text':
          case 'button':
          case 'divider':
          case 'image':
          case 'html':
              return generateSimpleNode(node, ctx);
              
          case 'dropdown':
              return generateDropdownNode(node, ctx);
              
          case 'table_view':
              return generateTableViewNode(node, ctx);
              
          case 'custom_component':
              return generateCustomComponentNode(node, ctx);
              
          case 'row': {
              const childrenStr = (node.children || []).map((c: any) => generateNode(c, ctx)).join('\n');
              return `<div className="w-full flex flex-row gap-4 items-start justify-start flex-wrap">${childrenStr}</div>`;
          }
          case 'column': {
              const childrenStr = (node.children || []).map((c: any) => generateNode(c, ctx)).join('\n');
              return `<div className="flex flex-col gap-4 items-stretch justify-start flex-1">${childrenStr}</div>`;
          }
          case 'card': {
              const childrenStr = (node.children || []).map((c: any) => generateNode(c, ctx)).join('\n');
              return `
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  ${node.props?.title ? `<div className="px-4 py-3 border-b border-slate-200 bg-slate-50 font-medium text-slate-800">${node.props.title}</div>` : ''}
                  <div className="p-4">
                      ${childrenStr}
                  </div>
              </div>`;
          }
          case 'list_repeater': {
              const childrenStr = (node.children || []).map((c: any) => generateNode(c, ctx)).join('\n');
              return `
              <div className="space-y-4">
                  {/* List Repeater Placeholder */}
                  ${childrenStr}
              </div>`;
          }
          case 'subpage_container': {
              return `<div className="p-4 border border-dashed border-slate-200 rounded text-slate-400 italic">Subpage Container [${node.props?.subPageId || ''}]</div>`;
          }
          case 'form_view': {
              return `<div className="p-4 border border-dashed border-slate-200 rounded text-slate-400 italic">Form View Component</div>`;
          }
          default:
              return `<div className="p-4 bg-slate-50 rounded border text-sm text-slate-400">${node.type} Component</div>`;
      }
  };

  const context: GeneratorContext = {
      states,
      effects,
      imports,
      tables,
      queries,
      forms,
      pages,
      customComponents,
      generateNode
  };

  const layoutHtml = generateNode(page.layout, context);
  
  const importsStr = Array.from(imports).map(imp => {
      if (imp === 'React' || imp === 'useEffect' || imp === 'useState') return '';
      if (imp === 'get') return "import { get } from '../../services/api';";
      if (imp === 'post') return "import { post } from '../../services/api';";
      if (imp === 'put') return "import { put } from '../../services/api';";
      if (imp === 'Loader2') return "";
      return '';
  }).filter(Boolean).join('\n');
  
  const content = `import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Filter, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
${importsStr}

export const ${compName} = () => {
  const navigate = useNavigate();
  ${states.join('\n  ')}

  ${effects.join('\n  ')}

  return (
    <div className="p-8 max-w-[95%] mx-auto">
        <h1 className="text-3xl font-bold dark:text-white mb-6">${page.name}</h1>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700 p-6">
            ${layoutHtml}
        </div>
    </div>
  );
};`;

  return { name: `${compName}.tsx`, path: `${root}/src/pages/custom/${compName}.tsx`, content, language: 'typescript' };
};
