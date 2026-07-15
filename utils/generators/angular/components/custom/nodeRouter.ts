import { NodeGeneratorContext } from './types';
import { generateContainerNode, generateTextNode, generateButtonNode, generateDividerNode, generateImageNode, generateHtmlNode } from './basicNodes';
import { generateDropdownNode } from './dropdownNode';
import { generateTableViewNode } from './tableViewNode';
import { generateCustomComponentNode } from './customComponentNode';

export const generateNode = (node: any, context: NodeGeneratorContext, pages: any[]): string => {
    if (!node) return '';
    
    switch(node.type) {
        case 'container':
            return generateContainerNode(node, context, (n, ctx) => generateNode(n, ctx, pages));
        case 'text':
            return generateTextNode(node, context);
        case 'button':
            return generateButtonNode(node, context);
        case 'divider':
            return generateDividerNode(node, context);
        case 'image':
            return generateImageNode(node, context);
        case 'html':
            return generateHtmlNode(node, context);
        case 'dropdown':
            return generateDropdownNode(node, context);
        case 'table_view':
            return generateTableViewNode(node, context, pages);
        case 'custom_component':
            return generateCustomComponentNode(node, context);
        default:
            return `<div class="p-3 bg-light border rounded text-secondary small">${node.type} Component</div>`;
    }
};
