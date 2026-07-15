import { NodeGeneratorContext } from './types';
import { toKebabCase } from '../../../common';

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
    return `<div class="${defaultClass} ${classNameStr}" ${styleAttr}>${node.props?.text || ''}</div>`;
};

export const generateButtonNode = (node: any, context: NodeGeneratorContext): string => {
    let classNameStr = node.props?.className || '';
    let styleAttr = node.props?.style ? `style="${Object.entries(node.props.style).map(([k,v]) => `${toKebabCase(k)}:${v}`).join(';')}"` : '';
    const defaultClass = context.isBootstrap ? 'btn btn-primary' : 'px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition';
    return `<button class="${defaultClass} ${classNameStr}" ${styleAttr}>${node.props?.label || 'Button'}</button>`;
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
