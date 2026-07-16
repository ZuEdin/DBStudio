import { NodeGeneratorContext } from './types';
import { generateContainerNode, generateTextNode, generateButtonNode, generateDividerNode, generateImageNode, generateHtmlNode } from './basicNodes';
import { generateDropdownNode } from './dropdownNode';
import { generateTableViewNode } from './tableViewNode';
import { generateCustomComponentNode } from './customComponentNode';

export const generateNode = (node: any, context: NodeGeneratorContext, pages: any[]): string => {
    if (!node) return '';
    
    switch(node.type) {
                case 'row':
            return generateContainerNode({ ...node, props: { ...node.props, className: (node.props?.className || '') + ' row' } }, context, (n, ctx) => generateNode(n, ctx, pages));
        case 'column':
            return generateContainerNode({ ...node, props: { ...node.props, className: (node.props?.className || '') + ' col' } }, context, (n, ctx) => generateNode(n, ctx, pages));
        case 'card':
            return generateContainerNode({ ...node, props: { ...node.props, className: (node.props?.className || '') + ' card p-3 shadow-sm border' } }, context, (n, ctx) => generateNode(n, ctx, pages));
        case 'sub_page':
        case 'form_view':
            return generateContainerNode(node, context, (n, ctx) => generateNode(n, ctx, pages));
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

        case 'navbar': {
            return `
              <div class="w-100 d-flex align-items-center justify-content-between p-3 bg-white border-bottom shadow-sm ${node.props?.className || ''}">
                   <div class="fw-bold fs-5">${node.props?.brandName || 'BrandLogo'}</div>
                   <div class="d-flex gap-3 text-secondary fw-medium">
                       <a href="#" class="text-decoration-none">Home</a>
                       <a href="#" class="text-decoration-none">Features</a>
                       <a href="#" class="text-decoration-none">Pricing</a>
                       <a href="#" class="text-decoration-none">Contact</a>
                   </div>
               </div>
            `;
        }
        case 'hero_section': {
            return `
               <div class="w-100 p-5 text-center bg-light ${node.props?.className || ''}">
                   <h1 class="display-4 fw-bold mb-4">${node.props?.headline || 'Catchy Headline Here'}</h1>
                   <p class="lead text-secondary mx-auto mb-5" style="max-width: 600px;">${node.props?.subheadline || 'A compelling subheadline that explains the value proposition of your product or service.'}</p>
                   <div class="d-flex justify-content-center gap-3">
                       <button class="btn btn-primary btn-lg fw-bold px-4 shadow-sm">${node.props?.primaryButtonText || 'Get Started'}</button>
                       <button class="btn btn-light btn-lg fw-bold px-4 border shadow-sm">${node.props?.secondaryButtonText || 'Learn More'}</button>
                   </div>
               </div>
            `;
        }
        case 'feature_grid': {
            return `
               <div class="w-100 p-5 bg-white ${node.props?.className || ''}">
                   <div class="text-center mb-5">
                       <h2 class="fw-bold">${node.props?.title || 'Amazing Features'}</h2>
                       <p class="text-secondary">${node.props?.subtitle || 'Everything you need to succeed.'}</p>
                   </div>
                   <div class="row g-4">
                       <div class="col-md-4">
                           <div class="card h-100 text-center p-4 border-0 bg-light">
                               <div class="card-body">
                                   <div class="mb-3 fs-2">✨</div>
                                   <h5 class="card-title fw-bold">Feature 1</h5>
                                   <p class="card-text text-secondary small">Description for this amazing feature.</p>
                               </div>
                           </div>
                       </div>
                       <div class="col-md-4">
                           <div class="card h-100 text-center p-4 border-0 bg-light">
                               <div class="card-body">
                                   <div class="mb-3 fs-2">✨</div>
                                   <h5 class="card-title fw-bold">Feature 2</h5>
                                   <p class="card-text text-secondary small">Description for this amazing feature.</p>
                               </div>
                           </div>
                       </div>
                       <div class="col-md-4">
                           <div class="card h-100 text-center p-4 border-0 bg-light">
                               <div class="card-body">
                                   <div class="mb-3 fs-2">✨</div>
                                   <h5 class="card-title fw-bold">Feature 3</h5>
                                   <p class="card-text text-secondary small">Description for this amazing feature.</p>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
            `;
        }
        case 'pricing_table': {
            return `
               <div class="w-100 p-5 bg-light ${node.props?.className || ''}">
                   <div class="text-center mb-5">
                       <h2 class="fw-bold">Simple Pricing</h2>
                   </div>
                   <div class="row g-4 justify-content-center">
                       <div class="col-md-4">
                           <div class="card h-100 p-4 border-0 shadow-sm">
                               <div class="card-body">
                                   <h4 class="card-title fw-bold mb-3">Basic</h4>
                                   <h2 class="card-text fw-bold mb-4">$19<span class="fs-6 fw-normal text-secondary">/mo</span></h2>
                                   <ul class="list-unstyled mb-4">
                                       <li class="mb-2">✓ Feature A</li>
                                       <li class="mb-2">✓ Feature B</li>
                                       <li class="mb-2">✓ Feature C</li>
                                   </ul>
                                   <button class="btn btn-light w-100 fw-bold">Choose Plan</button>
                               </div>
                           </div>
                       </div>
                       <div class="col-md-4">
                           <div class="card h-100 p-4 border-primary shadow bg-white position-relative" style="transform: scale(1.05); z-index: 1;">
                               <div class="position-absolute top-0 start-50 translate-middle badge bg-primary rounded-pill px-3 py-2">MOST POPULAR</div>
                               <div class="card-body">
                                   <h4 class="card-title fw-bold mb-3">Pro</h4>
                                   <h2 class="card-text fw-bold mb-4">$38<span class="fs-6 fw-normal text-secondary">/mo</span></h2>
                                   <ul class="list-unstyled mb-4">
                                       <li class="mb-2">✓ Feature A</li>
                                       <li class="mb-2">✓ Feature B</li>
                                       <li class="mb-2">✓ Feature C</li>
                                   </ul>
                                   <button class="btn btn-primary w-100 fw-bold">Choose Plan</button>
                               </div>
                           </div>
                       </div>
                       <div class="col-md-4">
                           <div class="card h-100 p-4 border-0 shadow-sm">
                               <div class="card-body">
                                   <h4 class="card-title fw-bold mb-3">Enterprise</h4>
                                   <h2 class="card-text fw-bold mb-4">$57<span class="fs-6 fw-normal text-secondary">/mo</span></h2>
                                   <ul class="list-unstyled mb-4">
                                       <li class="mb-2">✓ Feature A</li>
                                       <li class="mb-2">✓ Feature B</li>
                                       <li class="mb-2">✓ Feature C</li>
                                   </ul>
                                   <button class="btn btn-light w-100 fw-bold">Choose Plan</button>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
            `;
        }
        case 'testimonial': {
            return `
               <div class="w-100 p-5 bg-white text-center ${node.props?.className || ''}">
                   <div class="mx-auto" style="max-width: 800px;">
                       <div class="display-4 text-primary mb-3">"</div>
                       <p class="fs-4 fst-italic mb-5">${node.props?.quote || 'This product completely transformed how we work. Highly recommended!'}</p>
                       <div class="d-flex align-items-center justify-content-center gap-3">
                           <div class="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 40px; height: 40px;">${(node.props?.author || 'Jane Doe').charAt(0)}</div>
                           <div class="text-start">
                               <div class="fw-bold">${node.props?.author || 'Jane Doe'}</div>
                               <div class="small text-secondary">${node.props?.role || 'CEO, Company Inc'}</div>
                           </div>
                       </div>
                   </div>
               </div>
            `;
        }
        case 'footer': {
            return `
               <div class="w-100 p-5 bg-dark text-light ${node.props?.className || ''}">
                   <div class="row mb-4 border-bottom border-secondary pb-4">
                       <div class="col-md-6 mb-4 mb-md-0">
                           <h4 class="fw-bold text-white mb-3">${node.props?.brandName || 'BrandLogo'}</h4>
                           <p class="text-secondary small" style="max-width: 300px;">Making the world a better place through constructing elegant hierarchies and building amazing products.</p>
                       </div>
                       <div class="col-md-3 mb-4 mb-md-0">
                           <h5 class="text-white fw-bold mb-3">Product</h5>
                           <ul class="list-unstyled small text-secondary">
                               <li class="mb-2"><a href="#" class="text-decoration-none text-secondary">Features</a></li>
                               <li class="mb-2"><a href="#" class="text-decoration-none text-secondary">Pricing</a></li>
                               <li><a href="#" class="text-decoration-none text-secondary">Docs</a></li>
                           </ul>
                       </div>
                       <div class="col-md-3">
                           <h5 class="text-white fw-bold mb-3">Company</h5>
                           <ul class="list-unstyled small text-secondary">
                               <li class="mb-2"><a href="#" class="text-decoration-none text-secondary">About</a></li>
                               <li class="mb-2"><a href="#" class="text-decoration-none text-secondary">Blog</a></li>
                               <li><a href="#" class="text-decoration-none text-secondary">Contact</a></li>
                           </ul>
                       </div>
                   </div>
                   <div class="d-flex justify-content-between align-items-center small text-secondary">
                       <p class="mb-0">© 2024 Your Company. All rights reserved.</p>
                       <div class="d-flex gap-3">
                           <a href="#" class="text-secondary text-decoration-none">Twitter</a>
                           <a href="#" class="text-secondary text-decoration-none">GitHub</a>
                       </div>
                   </div>
               </div>
            `;
        }

        default:
            return `<div class="p-3 bg-light border rounded text-secondary small">${node.type} Component</div>`;
    }
};
