import { NodeGeneratorContext } from './types';
import { generateContainerNode, generateTextNode, generateButtonNode, generateDividerNode, generateImageNode, generateHtmlNode, compileAngularPlaceholders } from './basicNodes';
import { generateDropdownNode } from './dropdownNode';
import { generateTableViewNode } from './tableViewNode';
import { generateCustomComponentNode } from './customComponentNode';
import { toCamelCase, toPascalCase, toKebabCase } from '../../../common';

const getCleanSuffix = (node: any, context: NodeGeneratorContext, defaultPrefix = 'node'): string => {
    const nodeId = node.id || 'unknown';
    const cache = context.nodeNameCache;
    const used = context.usedSuffixes;

    if (cache && cache.has(nodeId)) {
        return cache.get(nodeId)!;
    }

    let cleanName = defaultPrefix;
    if (node.props?.dataSourceType === 'table' && node.props?.dataSourceId) {
        const tObj = context.tables.find(t => t.id === node.props.dataSourceId);
        if (tObj) cleanName = tObj.name;
    } else if (node.props?.dataSourceType === 'query' && node.props?.dataSourceId) {
        const qObj = context.queries.find(q => q.id === node.props.dataSourceId);
        if (qObj) cleanName = qObj.name;
    }
    cleanName = cleanName.replace(/[^a-zA-Z0-9]/g, '_');
    
    let baseName = toCamelCase(cleanName);
    if (!baseName) {
        baseName = defaultPrefix;
    }
    
    let finalSuffix = baseName;
    let counter = 2;
    if (used) {
        while (used.has(finalSuffix)) {
            finalSuffix = `${baseName}_${counter}`;
            counter++;
        }
        used.add(finalSuffix);
    }
    
    if (cache) {
        cache.set(nodeId, finalSuffix);
    }
    return finalSuffix;
};

export const generateNode = (node: any, context: NodeGeneratorContext, pages: any[]): string => {
    if (!node) return '';
    
    switch(node.type) {
        case 'row':
            return generateContainerNode({ ...node, props: { ...node.props, className: (node.props?.className || '') + ' row' } }, context, (n, ctx) => generateNode(n, ctx, pages));
        case 'column':
            return generateContainerNode({ ...node, props: { ...node.props, className: (node.props?.className || '') + ' col' } }, context, (n, ctx) => generateNode(n, ctx, pages));
        case 'card': {
            const childrenStr = (node.children || []).map((c: any) => generateNode(c, context, pages)).join('\n');
            const titleText = node.props?.title ? compileAngularPlaceholders(node.props.title, context.currentContextVar) : '';
            const titleHtml = titleText 
                ? `<div class="card-header bg-light border-bottom font-weight-bold px-3 py-2 text-dark">${titleText}</div>`
                : '';
            return `
            <div class="card shadow-sm border overflow-hidden ${node.props?.className || ''}">
                ${titleHtml}
                <div class="card-body p-3">
                    ${childrenStr}
                </div>
            </div>`;
        }
        case 'sub_page':
            return generateContainerNode(node, context, (n, ctx) => generateNode(n, ctx, pages));
        case 'form_view': {
            const formId = node.props?.formId;
            const fObj = context.forms.find(f => f.id === formId);
            if (!fObj) {
                return `<div class="p-3 text-muted text-center border border-dashed rounded">Kein Formular ausgewählt</div>`;
            }
            const tObj = context.tables.find(t => t.id === fObj.sourceId);
            if (!tObj) {
                return `<div class="p-3 text-danger text-center border border-dashed rounded">Tabelle für Formular nicht gefunden</div>`;
            }

            const suffix = getCleanSuffix(node, context, 'form');
            const stateName = `formData_${suffix}`;
            const loadingState = `formLoading_${suffix}`;
            const savingState = `formSaving_${suffix}`;
            const statusState = `formStatus_${suffix}`; // { type: 'success' | 'error' | null, message: string }

            context.states.push(`${stateName}: any = {};`);
            context.states.push(`${loadingState}: boolean = false;`);
            context.states.push(`${savingState}: boolean = false;`);
            context.states.push(`${statusState}: { type: 'success' | 'error' | null, message: string } = { type: null, message: '' };`);

            // Fields to render
            const formFields = tObj.fields.filter(f => !f.isPrimaryKey && !f.isAutoIncrement);
            
            // Mode: 'create' or 'edit'
            const formMode = node.props?.formMode || 'create';
            const filterField = node.props?.filterParamField;
            const filterParam = node.props?.filterParamName;

            // Initial defaults & loading logic
            const defaultFields: string[] = [];
            tObj.fields.forEach(f => {
                const fCamel = toCamelCase(f.name);
                if (f.defaultValue !== undefined && f.defaultValue !== null && f.defaultValue !== '') {
                    if (f.type === 'BOOLEAN') {
                        defaultFields.push(`${fCamel}: ${f.defaultValue.toLowerCase() === 'true' || f.defaultValue === '1'}`);
                    } else if (f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'DOUBLE') {
                        defaultFields.push(`${fCamel}: ${f.defaultValue}`);
                    } else {
                        defaultFields.push(`'${fCamel}': "${f.defaultValue.replace(/"/g, '\\"')}"`);
                    }
                }
            });

            // Init call for loading
            context.initCalls.push(`this.initForm_${suffix}();`);

            context.methods.push(`
  initForm_${suffix}() {
    this.${statusState} = { type: null, message: '' };
    let initialData: any = { ${defaultFields.join(', ')} };
    
    // Filter parameter pre-filling
    ${filterField && filterParam ? `
    const filterVal = this.queryParams['${filterParam}'];
    if (filterVal) {
      initialData['${toCamelCase(filterField)}'] = isNaN(Number(filterVal)) ? filterVal : Number(filterVal);
    }
    ` : ''}

    // If in edit mode, fetch record
    ${formMode === 'edit' ? `
    const editId = this.queryParams['selectedId'] || this.queryParams['${filterParam || 'id'}'];
    if (editId && editId !== 'new') {
      this.${loadingState} = true;
      this.api.getById('${toPascalCase(tObj.name)}', editId).subscribe({
        next: (res: any) => {
          this.${stateName} = { ...initialData, ...(res.data || res) };
          this.${loadingState} = false;
        },
        error: (err: any) => {
          console.error(err);
          this.${statusState} = { type: 'error', message: 'Fehler beim Laden des Datensatzes' };
          this.${loadingState} = false;
        }
      });
      return;
    }
    ` : ''}

    this.${stateName} = initialData;
  }`);

            // Submit logic
            const tblPascal = toPascalCase(tObj.name);
            context.methods.push(`
  submitForm_${suffix}() {
    this.${savingState} = true;
    this.${statusState} = { type: null, message: '' };
    const editId = this.queryParams['selectedId'] || this.queryParams['${filterParam || 'id'}'];
    const isEdit = ${formMode === 'edit'} && editId && editId !== 'new';
    
    const payload = { ...this.${stateName} };
    
    if (isEdit) {
      this.api.update('${tblPascal}', editId, payload).subscribe({
        next: () => {
          this.${statusState} = { type: 'success', message: 'Datensatz erfolgreich aktualisiert!' };
          this.${savingState} = false;
        },
        error: (err: any) => {
          console.error(err);
          this.${statusState} = { type: 'error', message: 'Fehler beim Speichern' };
          this.${savingState} = false;
        }
      });
    } else {
      this.api.create('${tblPascal}', payload).subscribe({
        next: () => {
          this.${statusState} = { type: 'success', message: 'Datensatz erfolgreich erstellt!' };
          this.${stateName} = { ${defaultFields.join(', ')} };
          this.${savingState} = false;
        },
        error: (err: any) => {
          console.error(err);
          this.${statusState} = { type: 'error', message: 'Fehler beim Erstellen' };
          this.${savingState} = false;
        }
      });
    }
  }`);

            // Fields HTML
            let fieldsHtml = '';
            // Generate simple template-driven inputs
            fieldsHtml = formFields.map(f => {
                const fCamel = toCamelCase(f.name);
                const label = f.comment || f.name;
                let input = '';
                if (f.type === 'BOOLEAN') {
                    input = `
                    <div class="form-check mt-2">
                        <input 
                            type="checkbox" 
                            id="${fCamel}_${suffix}"
                            [(ngModel)]="${stateName}['${fCamel}']"
                            name="${fCamel}_${suffix}"
                            class="form-check-input" 
                        />
                        <label for="${fCamel}_${suffix}" class="form-check-label fw-semibold">${label}</label>
                    </div>`;
                } else if (f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'DOUBLE') {
                    input = `
                    <label class="form-label fw-bold small text-muted text-uppercase mb-1">${label}</label>
                    <input 
                        type="number" 
                        [(ngModel)]="${stateName}['${fCamel}']"
                        name="${fCamel}_${suffix}"
                        class="form-control" 
                        step="${f.type === 'INTEGER' ? '1' : 'any'}"
                    />`;
                } else if (f.type === 'DATE') {
                    input = `
                    <label class="form-label fw-bold small text-muted text-uppercase mb-1">${label}</label>
                    <input 
                        type="date" 
                        [(ngModel)]="${stateName}['${fCamel}']"
                        name="${fCamel}_${suffix}"
                        class="form-control" 
                    />`;
                } else {
                    input = `
                    <label class="form-label fw-bold small text-muted text-uppercase mb-1">${label}</label>
                    <input 
                        type="text" 
                        [(ngModel)]="${stateName}['${fCamel}']"
                        name="${fCamel}_${suffix}"
                        class="form-control" 
                    />`;
                }
                return `<div class="col-md-6 text-start mb-3">${input}</div>`;
            }).join('\n');

            return `
            <div class="card p-4 mb-4 bg-white shadow-sm border rounded-3">
                <div *ngIf="!${node.props?.hideHeader ? 'true' : 'false'}" class="border-bottom pb-2 mb-4 text-start">
                    <h4 class="h5 mb-1 text-dark fw-bold">${fObj.name}</h4>
                    <p class="text-muted small mb-0">${formMode === 'edit' ? 'Eintrag bearbeiten' : 'Neuen Eintrag erstellen'}</p>
                </div>

                <div *ngIf="${statusState}.type" class="alert mb-4 text-start" [ngClass]="{'alert-success': ${statusState}.type === 'success', 'alert-danger': ${statusState}.type === 'error'}">
                    {{ ${statusState}.message }}
                </div>

                <div *ngIf="${loadingState}" class="text-center p-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Lade...</span>
                    </div>
                </div>

                <form *ngIf="!${loadingState}" (ngSubmit)="submitForm_${suffix}()" class="row">
                    ${fieldsHtml}
                    
                    <div *ngIf="!${node.props?.hideActions ? 'true' : 'false'}" class="col-12 d-flex justify-content-end mt-4 pt-3 border-top">
                        <button type="submit" [disabled]="${savingState}" class="btn btn-primary px-4 fw-bold cursor-pointer">
                            <span *ngIf="${savingState}" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Speichern
                        </button>
                    </div>
                </form>
            </div>
            `;
        }
        case 'container': {
            const hasDataSource = !!node.props?.dataSourceId;
            if (hasDataSource) {
                const suffix = getCleanSuffix(node, context, 'container');
                const stateName = `data_${suffix}`;
                const loadingState = `loading_${suffix}`;
                const paginatedName = `finalData_${suffix}`;
                const containerContext = `containerContext_${suffix}`;

                context.states.push(`${stateName}: any[] = [];`);
                context.states.push(`${loadingState}: boolean = false;`);

                let fetchUrl = '';
                if (node.props?.dataSourceType === 'table' && node.props?.dataSourceId) {
                    const tObj = context.tables.find(t => t.id === node.props.dataSourceId);
                    if (tObj) fetchUrl = `${toPascalCase(tObj.name)}`;
                } else if (node.props?.dataSourceType === 'query' && node.props?.dataSourceId) {
                    const qObj = context.queries.find(q => q.id === node.props.dataSourceId);
                    if (qObj) fetchUrl = `queries/${toCamelCase(qObj.name)}`;
                }

                if (fetchUrl) {
                    context.initCalls.push(`this.loadData_${suffix}();`);
                    context.methods.push(`
  loadData_${suffix}() {
    this.${loadingState} = true;
    this.api.getAll('${fetchUrl}', 1, 10000).subscribe({
      next: (res: any) => {
        this.${stateName} = res.data || res || [];
        this.${loadingState} = false;
      },
      error: (err) => {
        console.error(err);
        this.${loadingState} = false;
      }
    });
  }`);
                }

                const filterParamField = node.props?.filterParamField;
                const filterParamName = node.props?.filterParamName;
                let filterSnippet = '';
                if (filterParamField && filterParamName) {
                    filterSnippet = `
    const filterVal = this.queryParams?.['${filterParamName}'];
    if (filterVal !== undefined && filterVal !== null && filterVal !== '') {
      items = items.filter(row => String(row['${toCamelCase(filterParamField)}'] || row['${filterParamField}'] || '') === String(filterVal));
    } else {
      items = [];
    }`;
                }

                context.methods.push(`
  get ${paginatedName}(): any[] {
    let items = this.${stateName} || [];
    ${filterSnippet}
    return items;
  }`);

                context.methods.push(`
  get ${containerContext}(): any {
    const items = this.${paginatedName};
    return items && items.length > 0 ? items[0] : null;
  }`);

                const innerCtx = { ...context, currentContextVar: containerContext };
                const childrenStr = (node.children || []).map((c: any) => generateNode(c, innerCtx, pages)).join('\n');
                const classNameStr = node.props?.className || '';
                const styleAttr = node.props?.style ? `style="${Object.entries(node.props.style).map(([k,v]) => `${toKebabCase(k)}:${v}`).join(';')}"` : '';

                return `
                <div class="${classNameStr || 'p-3 border rounded bg-white'}" ${styleAttr}>
                    <div *ngIf="${loadingState}" class="text-center p-3">Lade Daten...</div>
                    <ng-container *ngIf="!${loadingState}">
                        ${childrenStr}
                    </ng-container>
                </div>`;
            } else {
                return generateContainerNode(node, context, (n, ctx) => generateNode(n, ctx, pages));
            }
        }
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

        case 'list_repeater': {
            const suffix = getCleanSuffix(node, context, 'repeater');
            const stateName = `data_${suffix}`;
            const loadingState = `loading_${suffix}`;
            const paginatedName = `finalData_${suffix}`;

            context.states.push(`${stateName}: any[] = [];`);
            context.states.push(`${loadingState}: boolean = false;`);

            let fetchUrl = '';
            if (node.props?.dataSourceType === 'table' && node.props?.dataSourceId) {
                const tObj = context.tables.find(t => t.id === node.props.dataSourceId);
                if (tObj) fetchUrl = `${toPascalCase(tObj.name)}`;
            } else if (node.props?.dataSourceType === 'query' && node.props?.dataSourceId) {
                const qObj = context.queries.find(q => q.id === node.props.dataSourceId);
                if (qObj) fetchUrl = `queries/${toCamelCase(qObj.name)}`;
            }

            if (fetchUrl) {
                context.initCalls.push(`this.loadData_${suffix}();`);
                context.methods.push(`
  loadData_${suffix}() {
    this.${loadingState} = true;
    this.api.getAll('${fetchUrl}', 1, 10000).subscribe({
      next: (res: any) => {
        this.${stateName} = res.data || res || [];
        this.${loadingState} = false;
      },
      error: (err) => {
        console.error(err);
        this.${loadingState} = false;
      }
    });
  }`);
            }

            const filterParamField = node.props?.filterParamField;
            const filterParamName = node.props?.filterParamName;
            let filterSnippet = '';
            if (filterParamField && filterParamName) {
                filterSnippet = `
    const filterVal = this.queryParams?.['${filterParamName}'];
    if (filterVal !== undefined && filterVal !== null && filterVal !== '') {
      items = items.filter(row => String(row['${toCamelCase(filterParamField)}'] || row['${filterParamField}'] || '') === String(filterVal));
    } else {
      items = [];
    }`;
            }

            context.methods.push(`
  get ${paginatedName}(): any[] {
    let items = this.${stateName} || [];
    ${filterSnippet}
    return items;
  }`);

            const rowVar = `row_${suffix}`;
            const innerCtx = { ...context, currentContextVar: rowVar };
            const childrenStr = (node.children || []).map((c: any) => generateNode(c, innerCtx, pages)).join('\n');
            const classNameStr = node.props?.className || 'space-y-3';
            const styleAttr = node.props?.style ? `style="${Object.entries(node.props.style).map(([k,v]) => `${toKebabCase(k)}:${v}`).join(';')}"` : '';

            return `
            <div class="${classNameStr}" ${styleAttr}>
                <div *ngIf="${loadingState}" class="text-center p-3">Lade Daten...</div>
                <ng-container *ngIf="!${loadingState}">
                    <div *ngFor="let ${rowVar} of ${paginatedName}; let idx_${suffix} = index" class="bg-light p-3 border rounded mb-3 position-relative">
                        ${childrenStr}
                    </div>
                    <div *ngIf="${paginatedName}.length === 0" class="text-center p-3 text-muted italic">Keine Einträge für Repeater</div>
                </ng-container>
            </div>`;
        }

        case 'subpage_container': {
            const subPage = pages?.find(p => p.id === node.props?.subPageId);
            if (!subPage) {
                return `<div class="p-3 border border-dashed border-danger rounded text-danger italic">Subpage nicht gefunden</div>`;
            }
            const subpageLayoutHtml = generateNode(subPage.layout, context, pages);
            return `
            <div class="w-100 bg-light border border-dashed rounded p-3 position-relative">
                ${subpageLayoutHtml}
            </div>`;
        }

        default:
            return `<div class="p-3 bg-light border rounded text-secondary small">${node.type} Component</div>`;
    }
};
