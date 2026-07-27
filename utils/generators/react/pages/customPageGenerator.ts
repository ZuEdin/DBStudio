import { CustomPage, Table, Query, Form, VirtualFile } from '../../../../types/index';
import { toCamelCase, toPascalCase } from '../../common';
import { GeneratorContext } from './custom/types';
import { generateSimpleNode, compilePlaceholders } from './custom/simpleNodeGenerator';
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
  
  const nodeNameCache = new Map<string, string>();
  const usedSuffixes = new Set<string>();

  const getCleanSuffix = (node: any, defaultPrefix = 'node'): string => {
      const nodeId = node.id || 'unknown';
      if (nodeNameCache.has(nodeId)) {
          return nodeNameCache.get(nodeId)!;
      }

      let cleanName = defaultPrefix;
      if (node.props?.dataSourceType === 'table' && node.props?.dataSourceId) {
          const tObj = tables.find(t => t.id === node.props.dataSourceId);
          if (tObj) cleanName = tObj.name;
      } else if (node.props?.dataSourceType === 'query' && node.props?.dataSourceId) {
          const qObj = queries.find(q => q.id === node.props.dataSourceId);
          if (qObj) cleanName = qObj.name;
      }
      cleanName = cleanName.replace(/[^a-zA-Z0-9]/g, '_');
      
      let baseName = toCamelCase(cleanName);
      if (!baseName) {
          baseName = defaultPrefix;
      }
      
      let finalSuffix = baseName;
      let counter = 2;
      while (usedSuffixes.has(finalSuffix)) {
          finalSuffix = `${baseName}_${counter}`;
          counter++;
      }
      
      usedSuffixes.add(finalSuffix);
      nodeNameCache.set(nodeId, finalSuffix);
      return finalSuffix;
  };
  
  const states: string[] = [];
  const effects: string[] = [];
  const imports = new Set<string>(['React', 'useEffect', 'useState']);

  const generateNode = (node: any, ctx: GeneratorContext): string => {
      if (!node) return '';
      
      switch(node.type) {
          case 'container': {
              const hasDataSource = !!node.props?.dataSourceId;
              if (hasDataSource) {
                  const suffix = getCleanSuffix(node, 'container');
                  const stateName = `data_${suffix}`;
                  const loadingState = `loading_${suffix}`;
                  const paginatedName = `finalData_${suffix}`;
                  const containerContext = `containerContext_${suffix}`;

                  states.push(`const [${stateName}, set_${stateName}] = useState<any[]>([]);`);
                  states.push(`const [${loadingState}, set_${loadingState}] = useState(false);`);

                  let fetchUrl = '';
                  if (node.props?.dataSourceType === 'table' && node.props?.dataSourceId) {
                      const tObj = tables.find(t => t.id === node.props.dataSourceId);
                      if (tObj) fetchUrl = `${toPascalCase(tObj.name)}`;
                  } else if (node.props?.dataSourceType === 'query' && node.props?.dataSourceId) {
                      const qObj = queries.find(q => q.id === node.props.dataSourceId);
                      if (qObj) fetchUrl = `queries/${toCamelCase(qObj.name)}`;
                  }

                  if (fetchUrl) {
                      imports.add('get');
                      effects.push(`
  useEffect(() => {
    const fetchData = async () => {
      try {
        set_${loadingState}(true);
        const res = await get<any>('${fetchUrl}', { pageSize: 10000 });
        const items = Array.isArray(res) ? res : (res?.data || res?.Data || res?.items || res?.Items || []);
        set_${stateName}(items);
      } catch (err) {
        console.error(err);
      } finally {
        set_${loadingState}(false);
      }
    };
    fetchData();
  }, []);`);
                  }

                  const filterParamField = node.props?.filterParamField;
                  const filterParamName = node.props?.filterParamName;
                  let filterSnippet = '';
                  if (filterParamField && filterParamName) {
                      filterSnippet = `
    const filterVal = searchParams.get('${filterParamName}');
    if (filterVal !== undefined && filterVal !== null && filterVal !== '') {
      items = items.filter(row => String(row['${toCamelCase(filterParamField)}'] || row['${filterParamField}'] || '') === String(filterVal));
    } else {
      items = [];
    }`;
                  }

                  effects.push(`
  const ${paginatedName} = useMemo(() => {
    let items = ${stateName};
    ${filterSnippet}
    return items;
  }, [${stateName}, searchParams]);`);

                  effects.push(`
  const ${containerContext} = useMemo(() => {
    return ${paginatedName} && ${paginatedName}.length > 0 ? ${paginatedName}[0] : null;
  }, [${paginatedName}]);`);

                  const innerCtx = { ...ctx, currentContextVar: containerContext };
                  const childrenStr = (node.children || []).map((c: any) => generateNode(c, innerCtx)).join('\n');
                  const classNameStr = node.props?.className || '';
                  const styleStr = JSON.stringify(node.props?.style || {});

                  return `
                  <div className="${classNameStr || 'p-4 border rounded'}" style={${styleStr}}>
                      {${loadingState} ? (
                          <div className="flex items-center justify-center p-4"><Loader2 className="animate-spin text-indigo-500" /></div>
                      ) : (
                          ${childrenStr}
                      )}
                  </div>`;
              } else {
                  return generateSimpleNode(node, ctx);
              }
          }
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
              const titleHtml = node.props?.title 
                ? `<div className="px-4 py-3 border-b border-slate-200 bg-slate-50 font-medium text-slate-800">{${compilePlaceholders(node.props.title, ctx.currentContextVar)}}</div>` 
                : '';
              return `
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  ${titleHtml}
                  <div className="p-4">
                      ${childrenStr}
                  </div>
              </div>`;
          }
          case 'list_repeater': {
              const suffix = getCleanSuffix(node, 'repeater');
              const stateName = `data_${suffix}`;
              const loadingState = `loading_${suffix}`;
              const paginatedName = `finalData_${suffix}`;

              states.push(`const [${stateName}, set_${stateName}] = useState<any[]>([]);`);
              states.push(`const [${loadingState}, set_${loadingState}] = useState(false);`);

              let fetchUrl = '';
              if (node.props?.dataSourceType === 'table' && node.props?.dataSourceId) {
                  const tObj = tables.find(t => t.id === node.props.dataSourceId);
                  if (tObj) fetchUrl = `${toPascalCase(tObj.name)}`;
              } else if (node.props?.dataSourceType === 'query' && node.props?.dataSourceId) {
                  const qObj = queries.find(q => q.id === node.props.dataSourceId);
                  if (qObj) fetchUrl = `queries/${toCamelCase(qObj.name)}`;
              }

              if (fetchUrl) {
                  imports.add('get');
                  effects.push(`
  useEffect(() => {
    const fetchData = async () => {
      try {
        set_${loadingState}(true);
        const res = await get<any>('${fetchUrl}', { pageSize: 10000 });
        const items = Array.isArray(res) ? res : (res?.data || res?.Data || res?.items || res?.Items || []);
        set_${stateName}(items);
      } catch (err) {
        console.error(err);
      } finally {
        set_${loadingState}(false);
      }
    };
    fetchData();
  }, []);`);
              }

              const filterParamField = node.props?.filterParamField;
              const filterParamName = node.props?.filterParamName;
              let filterSnippet = '';
              if (filterParamField && filterParamName) {
                  filterSnippet = `
    const filterVal = searchParams.get('${filterParamName}');
    if (filterVal !== undefined && filterVal !== null && filterVal !== '') {
      items = items.filter(row => String(row['${toCamelCase(filterParamField)}'] || row['${filterParamField}'] || '') === String(filterVal));
    } else {
      items = [];
    }`;
              }

              effects.push(`
  const ${paginatedName} = useMemo(() => {
    let items = ${stateName};
    ${filterSnippet}
    return items;
  }, [${stateName}, searchParams]);`);

              const rowVar = `row_${suffix}`;
              const innerCtx = { ...ctx, currentContextVar: rowVar };
              const childrenStr = (node.children || []).map((c: any) => generateNode(c, innerCtx)).join('\n');
              const classNameStr = node.props?.className || 'space-y-4';
              const styleStr = JSON.stringify(node.props?.style || {});

              return `
              <div className="${classNameStr}" style={${styleStr}}>
                  {${loadingState} ? (
                      <div className="flex items-center justify-center p-4"><Loader2 className="animate-spin text-indigo-500" /></div>
                  ) : (
                      <>
                          {${paginatedName}.map((${rowVar}, idx_${suffix}) => (
                              <div key={idx_${suffix}} className="bg-slate-50/50 p-4 rounded-lg border border-slate-200 relative hover:border-slate-300 hover:bg-slate-50 transition">
                                  ${childrenStr}
                              </div>
                          ))}
                          {!${loadingState} && ${paginatedName}.length === 0 && (
                              <div className="text-center p-4 text-xs text-slate-400 italic">Keine Einträge für Repeater</div>
                          )}
                      </>
                  )}
              </div>`;
          }
          case 'form_view': {
              return `<div className="p-4 border border-dashed border-slate-200 rounded text-slate-400 italic">Form View Component</div>`;
          }
          case 'navbar': {
              return `
                <div className={"w-full flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm " + ("${node.props?.className || ''}")}>
                     <div className="font-bold text-slate-800 text-lg">${node.props?.brandName || 'BrandLogo'}</div>
                     <div className="flex gap-4 text-sm text-slate-600 font-medium">
                         <a href="#" className="hover:text-blue-600 transition-colors">Home</a>
                         <a href="#" className="hover:text-blue-600 transition-colors">Features</a>
                         <a href="#" className="hover:text-blue-600 transition-colors">Pricing</a>
                         <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
                     </div>
                 </div>
              `;
          }
          case 'hero_section': {
              return `
                 <div className={"w-full p-12 py-24 flex flex-col items-center text-center bg-gradient-to-b from-slate-50 to-white " + ("${node.props?.className || ''}")}>
                     <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">${node.props?.headline || 'Catchy Headline Here'}</h1>
                     <p className="text-lg text-slate-600 max-w-2xl mb-8">${node.props?.subheadline || 'A compelling subheadline that explains the value proposition of your product or service.'}</p>
                     <div className="flex gap-4">
                         <button className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors">${node.props?.primaryButtonText || 'Get Started'}</button>
                         <button className="px-6 py-3 bg-white text-slate-700 font-bold border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">${node.props?.secondaryButtonText || 'Learn More'}</button>
                     </div>
                 </div>
              `;
          }
          case 'feature_grid': {
              return `
                 <div className={"w-full p-12 bg-white " + ("${node.props?.className || ''}")}>
                     <div className="text-center mb-12">
                         <h2 className="text-3xl font-bold text-slate-900">${node.props?.title || 'Amazing Features'}</h2>
                         <p className="text-slate-500 mt-2">${node.props?.subtitle || 'Everything you need to succeed.'}</p>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         {[1, 2, 3].map(i => (
                             <div key={i} className="flex flex-col items-center text-center p-6 border border-slate-100 rounded-xl bg-slate-50 hover:shadow-md transition-shadow">
                                 <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">✨</div>
                                 <h3 className="font-bold text-lg mb-2">Feature {i}</h3>
                                 <p className="text-slate-500 text-sm">Description for this amazing feature that will help users.</p>
                             </div>
                         ))}
                     </div>
                 </div>
              `;
          }
          case 'pricing_table': {
              return `
                 <div className={"w-full p-12 bg-slate-50 " + ("${node.props?.className || ''}")}>
                     <div className="text-center mb-12">
                         <h2 className="text-3xl font-bold text-slate-900">Simple Pricing</h2>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                         {['Basic', 'Pro', 'Enterprise'].map((plan, i) => (
                             <div key={plan} className={"p-8 rounded-2xl border transition-all " + (i === 1 ? 'border-blue-500 shadow-xl bg-white relative scale-105' : 'border-slate-200 bg-white shadow-sm')}>
                                 {i === 1 && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-3 py-1 text-xs font-bold rounded-full">MOST POPULAR</div>}
                                 <h3 className="text-xl font-bold mb-2">{plan}</h3>
                                 <div className="text-4xl font-extrabold mb-6">$\{ (i + 1) * 19 }<span className="text-sm font-normal text-slate-500">/mo</span></div>
                                 <ul className="space-y-3 mb-8 text-sm text-slate-600">
                                     <li className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Feature A</li>
                                     <li className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Feature B</li>
                                     <li className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Feature C</li>
                                 </ul>
                                 <button className={"w-full py-2 rounded-lg font-bold transition-colors " + (i === 1 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}>Choose Plan</button>
                             </div>
                         ))}
                     </div>
                 </div>
              `;
          }
          case 'testimonial': {
              return `
                 <div className={"w-full p-12 bg-white " + ("${node.props?.className || ''}")}>
                     <div className="max-w-3xl mx-auto text-center">
                         <div className="text-4xl text-blue-500 mb-4 font-serif">"</div>
                         <p className="text-2xl font-medium text-slate-800 mb-8 italic">${node.props?.quote || 'This product completely transformed how we work. Highly recommended!'}</p>
                         <div className="flex items-center justify-center gap-3">
                             <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold">${(node.props?.author || 'Jane Doe').charAt(0)}</div>
                             <div className="text-left">
                                 <div className="font-bold text-slate-900">${node.props?.author || 'Jane Doe'}</div>
                                 <div className="text-sm text-slate-500">${node.props?.role || 'CEO, Company Inc'}</div>
                             </div>
                         </div>
                     </div>
                 </div>
              `;
          }
          case 'footer': {
              return `
                 <div className={"w-full p-12 bg-slate-900 text-slate-400 " + ("${node.props?.className || ''}")}>
                     <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-b border-slate-800 pb-8 mb-8">
                         <div className="max-w-xs">
                             <div className="font-bold text-white text-xl mb-4">${node.props?.brandName || 'BrandLogo'}</div>
                             <p className="text-sm leading-relaxed">Making the world a better place through constructing elegant hierarchies and building amazing products.</p>
                         </div>
                         <div className="flex gap-16">
                             <div>
                                 <h4 className="text-white font-bold mb-4">Product</h4>
                                 <ul className="space-y-3 text-sm">
                                     <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                                     <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                                     <li><a href="#" className="hover:text-white transition-colors">Docs</a></li>
                                 </ul>
                             </div>
                             <div>
                                 <h4 className="text-white font-bold mb-4">Company</h4>
                                 <ul className="space-y-3 text-sm">
                                     <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                                     <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                                     <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                                 </ul>
                             </div>
                         </div>
                     </div>
                     <div className="text-sm flex flex-col md:flex-row justify-between items-center gap-4">
                         <p>© {new Date().getFullYear()} Your Company. All rights reserved.</p>
                         <div className="flex gap-6">
                             <a href="#" className="hover:text-white transition-colors">Twitter</a>
                             <a href="#" className="hover:text-white transition-colors">GitHub</a>
                         </div>
                     </div>
                 </div>
              `;
          }
          case 'subpage_container': {
              const subPage = ctx.pages.find(p => p.id === node.props?.subPageId);
              if (!subPage) {
                  return `<div className="p-4 border border-dashed border-red-200 rounded text-red-500 italic">Subpage [${node.props?.subPageId || ''}] nicht gefunden</div>`;
              }
              const subpageLayoutHtml = ctx.generateNode(subPage.layout, ctx);
              return `
              <div className="w-full bg-slate-50/20 border border-dashed border-slate-200 hover:border-slate-300 rounded-lg p-3 transition relative">
                  ${subpageLayoutHtml}
              </div>`;
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
      if (imp === 'ResponsiveContainer' || imp === 'BarChart' || imp === 'Bar' || imp === 'LineChart' || imp === 'Line' || imp === 'AreaChart' || imp === 'Area' || imp === 'PieChart' || imp === 'Pie' || imp === 'XAxis' || imp === 'YAxis' || imp === 'CartesianGrid' || imp === 'Tooltip' || imp === 'Legend') {
        return ""; // Handled specially below
      }
      if (imp.includes('from') || imp.startsWith("'") || imp.startsWith('"')) {
        return `import ${imp};`;
      }
      return '';
  }).filter(Boolean).join('\n');

  // Add Recharts imports if needed
  const rechartsImports = Array.from(imports).filter(imp => 
    ['ResponsiveContainer', 'BarChart', 'Bar', 'LineChart', 'Line', 'AreaChart', 'Area', 'PieChart', 'Pie', 'XAxis', 'YAxis', 'CartesianGrid', 'Tooltip', 'Legend'].includes(imp)
  );
  
  let rechartsImportsStr = '';
  if (rechartsImports.length > 0) {
      rechartsImportsStr = `import { ${rechartsImports.join(', ')} } from 'recharts';`;
  }

  
  const content = `import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Filter, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { exportDataToFile } from '../../utils/exportHelper';
${importsStr}\n${rechartsImportsStr}

export const ${compName} = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
