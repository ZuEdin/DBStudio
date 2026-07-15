import { GeneratorContext } from './types';

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
          return `<div className="break-words ${classNameStr}" style={${styleStr}}>${node.props?.text || ''}</div>`;
      }
      case 'button': {
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
