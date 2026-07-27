import { NodeGeneratorContext } from './types';
import { toKebabCase } from '../../../common';

const toCamelCase = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, (chr) => chr.toLowerCase());
};

export const compileAngularPlaceholders = (text: string, contextVar?: string): string => {
  if (!text) return '';
  const normalized = text.replace(/\{\{/g, '{').replace(/\}\}/g, '}');
  if (!normalized.includes('{')) return normalized;
  
  return normalized.replace(/\{([^{}]+)\}/g, (match, key) => {
    const trimmedKey = key.trim();
    if (contextVar) {
      return `{{ ${contextVar}?.['${trimmedKey}'] || ${contextVar}?.['${toCamelCase(trimmedKey)}'] || ${contextVar}?.${trimmedKey} || ${contextVar}?.${toCamelCase(trimmedKey)} || queryParams?.['${trimmedKey}'] || '' }}`;
    } else {
      return `{{ queryParams?.['${trimmedKey}'] || '' }}`;
    }
  });
};

export const generateContainerNode = (node: any, context: NodeGeneratorContext, generateNode: (node: any, ctx: NodeGeneratorContext) => string): string => {
    let classNameStr = node.props?.className || '';
    let styleAttr = node.props?.style ? `style="${Object.entries(node.props.style).map(([k,v]) => `${toKebabCase(k)}:${v}`).join(';')}"` : '';
    const childrenStr = (node.children || []).map((c: any) => generateNode(c, context)).join('\n');
    const defaultClass = context.isBootstrap ? 'p-3 border rounded bg-white' : 'p-4 border rounded';
    return `<div class="${classNameStr || defaultClass}" ${styleAttr}>${childrenStr}</div>`;
};

export const generateTextNode = (node: any, context: NodeGeneratorContext): string => {
    let classNameStr = node.props?.className || '';
    let styleAttr = node.props?.style ? `style="${Object.entries(node.props.style).map(([k,v]) => `${toKebabCase(k)}:${v}`).join(';')}"` : '';
    const defaultClass = context.isBootstrap ? 'text-break' : 'break-words';
    const compiledText = compileAngularPlaceholders(node.props?.text || '', context.currentContextVar);
    return `<div class="${defaultClass} ${classNameStr}" ${styleAttr}>${compiledText}</div>`;
};

export const generateButtonNode = (node: any, context: NodeGeneratorContext): string => {
    let classNameStr = node.props?.className || '';
    let styleAttr = node.props?.style ? `style="${Object.entries(node.props.style).map(([k,v]) => `${toKebabCase(k)}:${v}`).join(';')}"` : '';
    const defaultClass = context.isBootstrap ? 'btn btn-primary' : 'px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition cursor-pointer font-bold';
    
    let clickAttr = '';
    const macroId = node.props?.macroId || node.props?.exportFormat;
    if (macroId) {
        clickAttr = `(click)="executeMacro('${macroId}')"`;
    } else if (node.props?.actionType === 'run_macro' || node.props?.actionType === 'smart_import') {
        clickAttr = `(click)="executeMacro('${node.props?.macroId || 'macro'}')"`;
    }
    return `<button type="button" ${clickAttr} class="${defaultClass} ${classNameStr}" ${styleAttr}>${node.props?.label || 'Button'}</button>`;
};

export const generateDividerNode = (node: any, context: NodeGeneratorContext): string => {
    let classNameStr = node.props?.className || '';
    let styleAttr = node.props?.style ? `style="${Object.entries(node.props.style).map(([k,v]) => `${toKebabCase(k)}:${v}`).join(';')}"` : '';
    const defaultClass = context.isBootstrap ? 'my-4' : 'border-slate-200 my-4';
    return `<hr class="${defaultClass} ${classNameStr}" ${styleAttr} />`;
};

export const generateImageNode = (node: any, context: NodeGeneratorContext): string => {
    let classNameStr = node.props?.className || '';
    let styleAttr = node.props?.style ? `style="${Object.entries(node.props.style).map(([k,v]) => `${toKebabCase(k)}:${v}`).join(';')}"` : '';
    return `<img referrerPolicy="no-referrer" src="${node.props?.src || ''}" class="max-w-full h-auto rounded ${classNameStr}" ${styleAttr} alt="${node.props?.alt || ''}" />`;
};

export const generateHtmlNode = (node: any, context: NodeGeneratorContext): string => {
    let classNameStr = node.props?.className || '';
    let styleAttr = node.props?.style ? `style="${Object.entries(node.props.style).map(([k,v]) => `${toKebabCase(k)}:${v}`).join(';')}"` : '';
    const escapedHtml = (node.props?.html || '').replace(/'/g, "\\'");
    return `<div [innerHTML]="'${escapedHtml}'" class="${classNameStr}" ${styleAttr}></div>`;
};
