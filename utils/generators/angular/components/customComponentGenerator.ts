import { Table, Form, VirtualFile, Query } from '../../../../types/index';
import { toCamelCase, toKebabCase, toPascalCase } from '../../common';

interface RouteInfo {
  path: string;
  component: string;
  folder: string;
  file: string;
}

export const generateCustomPageComponents = (
  pages: any[],
  tables: Table[],
  queries: Query[],
  forms: Form[],
  appRoot: string,
  isBootstrap: boolean = false
): { files: VirtualFile[]; routes: RouteInfo[] } => {
  const files: VirtualFile[] = [];
  const routes: RouteInfo[] = [];

  pages.forEach(page => {
      const pascalName = toPascalCase(page.name);
      const kebabName = toKebabCase(page.name);
      const folder = 'custom';
      const compName = `${pascalName}CustomComponent`;

      const states: string[] = [];
      const initCalls: string[] = [];
      const methods: string[] = [];

      const generateNode = (node: any): string => {
          if (!node) return '';
          
          let classNameStr = node.props?.className || '';
          let styleAttr = node.props?.style ? `style="${Object.entries(node.props.style).map(([k,v]) => `${toKebabCase(k)}:${v}`).join(';')}"` : '';
          
          switch(node.type) {
              case 'container': {
                  const childrenStr = (node.children || []).map((c: any) => generateNode(c)).join('\n');
                  const defaultClass = isBootstrap ? 'p-3 border rounded bg-white' : 'p-4 border rounded';
                  return `<div class="${classNameStr || defaultClass}" ${styleAttr}>${childrenStr}</div>`;
              }
              case 'text': {
                  const defaultClass = isBootstrap ? 'text-break' : 'break-words';
                  return `<div class="${defaultClass} ${classNameStr}" ${styleAttr}>${node.props?.text || ''}</div>`;
              }
              case 'button': {
                  const defaultClass = isBootstrap ? 'btn btn-primary' : 'px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition';
                  return `<button class="${defaultClass} ${classNameStr}" ${styleAttr}>${node.props?.label || 'Button'}</button>`;
              }
              case 'divider': {
                  const defaultClass = isBootstrap ? 'my-4' : 'border-slate-200 my-4';
                  return `<hr class="${defaultClass} ${classNameStr}" ${styleAttr} />`;
              }
              case 'image': {
                  return `<img referrerPolicy="no-referrer" src="${node.props?.src || ''}" class="max-w-full h-auto rounded ${classNameStr}" ${styleAttr} alt="${node.props?.alt || ''}" />`;
              }
              case 'html': {
                  const escapedHtml = (node.props?.html || '').replace(/'/g, "\\'");
                  return `<div [innerHTML]="'${escapedHtml}'" class="${classNameStr}" ${styleAttr}></div>`;
              }
              case 'dropdown': {
                  const stateName = `dropdownData_${node.id.replace(/-/g, '_')}`;
                  const loadingState = `dropdownLoading_${node.id.replace(/-/g, '_')}`;
                  states.push(`${stateName}: any[] = [];`);
                  states.push(`${loadingState} = false;`);
                  
                  let fetchUrl = '';
                  if (node.props?.queryId) {
                      const qObj = queries.find(q => q.id === node.props.queryId);
                      if (qObj) fetchUrl = `queries/${toCamelCase(qObj.name)}`;
                  } else if (node.props?.dataSourceId) {
                      const tObj = tables.find(t => t.id === node.props.dataSourceId);
                      if (tObj) fetchUrl = `${toCamelCase(tObj.name)}`;
                  }
                  
                  if (fetchUrl) {
                      initCalls.push(`this.loadDropdown_${node.id.replace(/-/g, '_')}();`);
                      methods.push(`
  loadDropdown_${node.id.replace(/-/g, '_')}() {
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
                  
                  const valueField = node.props?.valueField || 'id';
                  const labelField = node.props?.labelField || 'name';
                  
                  if (isBootstrap) {
                      return `
                      <div class="p-2 ${classNameStr}" ${styleAttr}>
                          <select class="form-select max-w-xs" style="max-width: 280px;">
                              <option value="">${node.props?.placeholder || 'Bitte wählen...'}</option>
                              <option *ngIf="${loadingState}" disabled>Lade Daten...</option>
                              <ng-container *ngIf="!${loadingState}">
                                  <option *ngFor="let row of ${stateName}; let idx = index" [value]="row['${toCamelCase(valueField)}'] || row['${valueField}'] || row.id || idx">
                                      {{ row['${toCamelCase(labelField)}'] || row['${labelField}'] || row.id || idx }}
                                  </option>
                              </ng-container>
                          </select>
                      </div>`;
                  } else {
                      return `
                      <div class="p-2 ${classNameStr}" ${styleAttr}>
                          <select class="border border-slate-300 rounded px-3 py-2 bg-white w-full max-w-xs">
                              <option value="">${node.props?.placeholder || 'Bitte wählen...'}</option>
                              <option *ngIf="${loadingState}" disabled>Lade Daten...</option>
                              <ng-container *ngIf="!${loadingState}">
                                  <option *ngFor="let row of ${stateName}; let idx = index" [value]="row['${toCamelCase(valueField)}'] || row['${valueField}'] || row.id || idx">
                                      {{ row['${toCamelCase(labelField)}'] || row['${labelField}'] || row.id || idx }}
                                  </option>
                              </ng-container>
                          </select>
                      </div>`;
                  }
              }
              case 'table_view': {
                  const suffix = node.id.replace(/-/g, '_');
                  const stateName = `tableData_${suffix}`;
                  const loadingState = `tableLoading_${suffix}`;
                  const searchState = `search_${suffix}`;
                  const columnFiltersState = `columnFilters_${suffix}`;
                  const showFiltersState = `showFilters_${suffix}`;
                  const sortFieldState = `sortField_${suffix}`;
                  const sortDirState = `sortDir_${suffix}`;
                  const pageState = `currentPage_${suffix}`;
                  const selectedRowState = `selectedRow_${suffix}`;

                  states.push(`${stateName}: any[] = [];`);
                  states.push(`${loadingState} = false;`);
                  states.push(`${searchState} = '';`);
                  states.push(`${columnFiltersState}: Record<string, string> = {};`);
                  states.push(`${showFiltersState} = false;`);
                  states.push(`${sortFieldState}: string | null = null;`);
                  states.push(`${sortDirState}: 'asc' | 'desc' | null = null;`);
                  states.push(`${pageState} = 1;`);
                  states.push(`${selectedRowState}: any = null;`);
                  
                  let fetchUrl = '';
                  const tObj = node.props?.dataSourceType === 'table' && node.props?.dataSourceId
                      ? tables.find(t => t.id === node.props.dataSourceId)
                      : null;
                  const pkFieldName = tObj ? (tObj.fields.find(c => c.isPrimaryKey)?.name || 'id') : 'id';

                  if (tObj) {
                      fetchUrl = `${toCamelCase(tObj.name)}`;
                  } else if (node.props?.dataSourceType === 'query' && node.props?.dataSourceId) {
                      const qObj = queries.find(q => q.id === node.props.dataSourceId);
                      if (qObj) fetchUrl = `queries/${toCamelCase(qObj.name)}`;
                  }
                  
                  if (fetchUrl) {
                      initCalls.push(`this.loadTable_${suffix}();`);
                      methods.push(`
  loadTable_${suffix}() {
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
                  
                  // Helper methods for generic objects
                  if (!methods.some(m => m.includes('getObjKeys'))) {
                      methods.push(`
  getObjKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  getObjValues(obj: any): any[] {
    return obj ? Object.values(obj) : [];
  }`);
                  }

                  const processedName = `processedTableData_${suffix}`;
                  const paginatedName = `paginatedTableData_${suffix}`;

                  methods.push(`
  get ${processedName}(): any[] {
    let items = [...this.${stateName}];
    const globalSearch = this.${searchState}.toLowerCase().trim();
    if (globalSearch) {
      const searchTerms = globalSearch.split(/\\s+/).filter(Boolean);
      items = items.filter(row => {
        return searchTerms.every(term => {
          return Object.values(row).some(val => 
            val !== undefined && val !== null && String(val).toLowerCase().includes(term)
          );
        });
      });
    }

    Object.keys(this.${columnFiltersState}).forEach(key => {
      const filterVal = this.${columnFiltersState}[key]?.toLowerCase().trim();
      if (filterVal) {
        const searchTerms = filterVal.split(/\\s+/).filter(Boolean);
        items = items.filter(row => {
          const val = row[key];
          if (val === undefined || val === null) return false;
          const cellStr = String(val).toLowerCase();
          return searchTerms.every(term => cellStr.includes(term));
        });
      }
    });

    if (this.${sortFieldState} && this.${sortDirState}) {
      items.sort((a, b) => {
        const valA = a[this.${sortFieldState}!];
        const valB = b[this.${sortFieldState}!];
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        
        let comparison = 0;
        if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        } else if (typeof valA === 'boolean' && typeof valB === 'boolean') {
          comparison = (valA ? 1 : 0) - (valB ? 1 : 0);
        } else {
          comparison = String(valA).localeCompare(String(valB));
        }
        return this.${sortDirState} === 'asc' ? comparison : -comparison;
      });
    }

    return items;
  }

  get ${paginatedName}(): any[] {
    const startIndex = (this.${pageState} - 1) * 10;
    return this.${processedName}.slice(startIndex, startIndex + 10);
  }

  get totalItems_${suffix}(): number {
    return this.${processedName}.length;
  }

  get totalPages_${suffix}(): number {
    return Math.ceil(this.totalItems_${suffix} / 10) || 1;
  }

  get startIndex_${suffix}(): number {
    return (this.${pageState} - 1) * 10;
  }

  get endIndex_${suffix}(): number {
    return Math.min(this.startIndex_${suffix} + 10, this.totalItems_${suffix});
  }

  toggleSort_${suffix}(field: string) {
    if (this.${sortFieldState} === field) {
      if (this.${sortDirState} === 'asc') {
        this.${sortDirState} = 'desc';
      } else if (this.${sortDirState} === 'desc') {
        this.${sortFieldState} = null;
        this.${sortDirState} = null;
      } else {
        this.${sortDirState} = 'asc';
      }
    } else {
      this.${sortFieldState} = field;
      this.${sortDirState} = 'asc';
    }
  }`);

                  const detailsPage = node.props?.detailsPageId 
                      ? pages.find(p => p.id === node.props.detailsPageId) 
                      : null;
                  const detailsPageRoute = detailsPage ? `/custom/${toKebabCase(detailsPage.name)}` : '';

                  const editForm = node.props?.editFormId 
                      ? forms.find(f => f.id === node.props.editFormId) 
                      : null;
                  const targetFormTable = editForm 
                      ? tables.find(t => t.id === editForm.sourceId) 
                      : null;
                  const formRoute = (editForm && targetFormTable) ? `/${toCamelCase(targetFormTable.name)}` : '';

                  const paramKey = node.props?.selectionParamName || 'selectedId';
                  const clickTrigger = node.props?.rowClickTrigger || 'click';
                  const dblclickTrigger = node.props?.rowDoubleClickTrigger || 'dblclick';

                  let clickActionCode = '';
                  let dblclickActionCode = '';

                  if (detailsPageRoute) {
                      const code = `this.router.navigate(['${detailsPageRoute}'], { queryParams: { '${paramKey}': idVal } });`;
                      if (clickTrigger === 'click') clickActionCode = code;
                      if (dblclickTrigger === 'dblclick') dblclickActionCode = code;
                  } else if (formRoute) {
                      const code = `this.router.navigate(['${formRoute}', idVal]);`;
                      if (clickTrigger === 'click') clickActionCode = code;
                      if (dblclickTrigger === 'dblclick') dblclickActionCode = code;
                  }

                  methods.push(`
  onRowClick_${suffix}(row: any, idx: number) {
    const idVal = row['${pkFieldName}'] || row.id || row.ID || idx;
    this.${selectedRowState} = idVal;
    ${clickActionCode ? `this.router.navigate(['${detailsPageRoute || formRoute}'], { queryParams: { '${paramKey}': idVal } });` : ''}
  }`);

                  if (dblclickActionCode) {
                      methods.push(`
  onRowDoubleClick_${suffix}(row: any, idx: number) {
    const idVal = row['${pkFieldName}'] || row.id || row.ID || idx;
    ${dblclickActionCode}
  }`);
                  }
                  
                  const columnsStr = node.props?.columns || '';
                  const columns = columnsStr ? columnsStr.split(',').map((c: string) => c.trim()) : [];
                  
                  if (isBootstrap) {
                      return `
                      <div class="p-3 w-100 d-flex flex-column gap-3 ${classNameStr}" style="${styleAttr}">
                          <div class="d-flex justify-content-between align-items-center gap-3">
                              <button 
                                  (click)="${showFiltersState} = !${showFiltersState}" 
                                  class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2"
                                  [class.active]="${showFiltersState}"
                                  title="Spaltenfilter anzeigen/ausblenden"
                              >
                                  <span>Filter</span>
                              </button>
                              
                              <div class="position-relative flex-grow-1" style="max-width: 250px;">
                                  <input 
                                      type="text" 
                                      placeholder="Suchen..." 
                                      class="form-control form-control-sm bg-white"
                                      [(ngModel)]="${searchState}"
                                      (ngModelChange)="${pageState} = 1"
                                  />
                              </div>
                          </div>

                          <div *ngIf="${loadingState}" class="d-flex items-center justify-content-center p-4">
                              <div class="spinner-border spinner-border-sm text-secondary me-2"></div>
                              <span class="text-secondary small">Lade Daten...</span>
                          </div>

                          <div *ngIf="!${loadingState}" class="d-flex flex-column gap-2">
                              <div class="table-responsive border rounded bg-white">
                                  <table class="table table-hover align-middle mb-0 text-nowrap">
                                      <thead class="table-light">
                                          <tr>
                                              ${columns.length > 0 ? columns.map((col: string) => `
                                              <th 
                                                  class="px-3 py-2 text-start text-xs font-semibold text-secondary text-uppercase cursor-pointer hover:bg-light select-none"
                                                  (click)="toggleSort_${suffix}('${toCamelCase(col)}')"
                                              >
                                                  <div class="d-flex align-items-center gap-1">
                                                      <span>${col}</span>
                                                      <span *ngIf="${sortFieldState} === '${toCamelCase(col)}'">
                                                          <span *ngIf="${sortDirState} === 'asc'">▲</span>
                                                          <span *ngIf="${sortDirState} === 'desc'">▼</span>
                                                      </span>
                                                  </div>
                                              </th>`).join('\n') : `
                                              <ng-container *ngIf="${stateName}.length > 0">
                                                  <th 
                                                      *ngFor="let k of getObjKeys(${stateName}[0])" 
                                                      class="px-3 py-2 text-start text-xs font-semibold text-secondary text-uppercase cursor-pointer hover:bg-light select-none"
                                                      (click)="toggleSort_${suffix}(k)"
                                                  >
                                                      <div class="d-flex align-items-center gap-1">
                                                          <span>{{k}}</span>
                                                          <span *ngIf="${sortFieldState} === k">
                                                              <span *ngIf="${sortDirState} === 'asc'">▲</span>
                                                              <span *ngIf="${sortDirState} === 'desc'">▼</span>
                                                          </span>
                                                      </div>
                                                  </th>
                                              </ng-container>
                                              <th *ngIf="${stateName}.length === 0" class="px-3 py-2 text-start text-xs font-semibold text-secondary">Daten</th>`}
                                          </tr>
                                          
                                          <tr *ngIf="${showFiltersState}" class="bg-light">
                                              ${columns.length > 0 ? columns.map((col: string) => `
                                              <th class="p-1">
                                                  <input 
                                                      type="text"
                                                      placeholder="Filtern..."
                                                      class="form-control form-control-sm bg-white"
                                                      [(ngModel)]="${columnFiltersState}['${toCamelCase(col)}']"
                                                      (ngModelChange)="${pageState} = 1"
                                                  />
                                              </th>`).join('\n') : `
                                              <ng-container *ngIf="${stateName}.length > 0">
                                                  <th *ngFor="let k of getObjKeys(${stateName}[0])" class="p-1">
                                                      <input 
                                                          type="text"
                                                          placeholder="Filtern..."
                                                          class="form-control form-control-sm bg-white"
                                                          [(ngModel)]="${columnFiltersState}[k]"
                                                          (ngModelChange)="${pageState} = 1"
                                                      />
                                                  </th>
                                              </ng-container>`}
                                          </tr>
                                      </thead>
                                      <tbody>
                                          <tr 
                                              *ngFor="let row of ${paginatedName}; let idx = index" 
                                              class="cursor-pointer"
                                              [class.table-primary]="row['${pkFieldName}'] === ${selectedRowState} || row.id === ${selectedRowState} || row.ID === ${selectedRowState}"
                                              (click)="onRowClick_${suffix}(row, idx)"
                                              ${dblclickActionCode ? `(dblclick)="onRowDoubleClick_${suffix}(row, idx)"` : ''}
                                          >
                                              ${columns.length > 0 ? columns.map((col: string) => `<td class="px-3 py-2 text-secondary">${ '{{ row[\'' + toCamelCase(col) + '\'] || row[\'' + col + '\'] || \'\' }}' }</td>`).join('\n') : `
                                              <td *ngFor="let val of getObjValues(row)" class="px-3 py-2 text-secondary">{{ val }}</td>`}
                                          </tr>
                                          <tr *ngIf="${stateName}.length === 0">
                                              <td class="p-3 text-center text-secondary fst-italic" colspan="100">Keine Einträge.</td>
                                          </tr>
                                      </tbody>
                                  </table>
                              </div>

                              <div *ngIf="totalItems_${suffix} > 0" class="d-flex flex-column flex-sm-row items-center justify-content-between pt-2 px-1 text-secondary small select-none">
                                  <div class="mb-2 mb-sm-0">
                                      Zeige <strong>{{startIndex_${suffix} + 1}}</strong> bis <strong>{{endIndex_${suffix}}}</strong> von <strong>{{totalItems_${suffix}}}</strong> Einträgen
                                  </div>
                                  <div class="btn-group">
                                      <button 
                                          (click)="${pageState} = 1" 
                                          [disabled]="${pageState} <= 1"
                                          class="btn btn-sm btn-outline-secondary"
                                      >
                                          Erste
                                      </button>
                                      <button 
                                          (click)="${pageState} = ${pageState} - 1" 
                                          [disabled]="${pageState} <= 1"
                                          class="btn btn-sm btn-outline-secondary"
                                      >
                                          Zurück
                                      </button>
                                      <span class="btn btn-sm btn-light border disabled">
                                          Seite {{${pageState}}} von {{totalPages_${suffix}}}
                                      </span>
                                      <button 
                                          (click)="${pageState} = ${pageState} + 1" 
                                          [disabled]="${pageState} >= totalPages_${suffix}"
                                          class="btn btn-sm btn-outline-secondary"
                                      >
                                          Weiter
                                      </button>
                                      <button 
                                          (click)="${pageState} = totalPages_${suffix}" 
                                          [disabled]="${pageState} >= totalPages_${suffix}"
                                          class="btn btn-sm btn-outline-secondary"
                                      >
                                          Letzte
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </div>`;
                  } else {
                      return `
                      <div class="p-4 w-full flex flex-col gap-4 ${classNameStr}" style="${styleAttr}">
                          <div class="flex justify-between items-center gap-4">
                              <button 
                                  (click)="${showFiltersState} = !${showFiltersState}" 
                                  class="p-1.5 border rounded-lg flex items-center gap-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                  [class.bg-blue-50]="${showFiltersState}"
                                  [class.border-blue-300]="${showFiltersState}"
                                  [class.text-blue-600]="${showFiltersState}"
                                  title="Spaltenfilter anzeigen/ausblenden"
                              >
                                  <span>Filter</span>
                              </button>
                              
                              <div class="relative flex-1 max-w-xs">
                                  <input 
                                      type="text" 
                                      placeholder="Suchen..." 
                                      class="pl-3 pr-3 py-1.5 border rounded-lg text-xs w-full bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                      [(ngModel)]="${searchState}"
                                      (ngModelChange)="${pageState} = 1"
                                  />
                              </div>
                          </div>

                          <div *ngIf="${loadingState}" class="flex items-center justify-center p-8">
                              <div class="animate-spin text-slate-400">Lade Daten...</div>
                          </div>

                          <div *ngIf="!${loadingState}" class="flex flex-col gap-3">
                              <div class="overflow-x-auto border rounded-lg dark:border-slate-700">
                                  <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                                      <thead class="bg-slate-50 dark:bg-slate-900">
                                          <tr>
                                              ${columns.length > 0 ? columns.map((col: string) => `
                                              <th 
                                                  class="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none"
                                                  (click)="toggleSort_${suffix}('${toCamelCase(col)}')"
                                              >
                                                  <div class="flex items-center gap-1.5">
                                                      <span>${col}</span>
                                                      <span *ngIf="${sortFieldState} === '${toCamelCase(col)}'">
                                                          <span *ngIf="${sortDirState} === 'asc'">▲</span>
                                                          <span *ngIf="${sortDirState} === 'desc'">▼</span>
                                                      </span>
                                                  </div>
                                              </th>`).join('\n') : `
                                              <ng-container *ngIf="${stateName}.length > 0">
                                                  <th 
                                                      *ngFor="let k of getObjKeys(${stateName}[0])" 
                                                      class="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none"
                                                      (click)="toggleSort_${suffix}(k)"
                                                  >
                                                      <div class="flex items-center gap-1.5">
                                                          <span>{{k}}</span>
                                                          <span *ngIf="${sortFieldState} === k">
                                                              <span *ngIf="${sortDirState} === 'asc'">▲</span>
                                                              <span *ngIf="${sortDirState} === 'desc'">▼</span>
                                                          </span>
                                                      </div>
                                                  </th>
                                              </ng-container>
                                              <th *ngIf="${stateName}.length === 0" class="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Daten</th>`}
                                          </tr>
                                          
                                          <tr *ngIf="${showFiltersState}" class="bg-slate-100/50">
                                              ${columns.length > 0 ? columns.map((col: string) => `
                                              <th class="p-2">
                                                  <input 
                                                      type="text"
                                                      placeholder="Filtern..."
                                                      class="w-full px-2 py-1 text-xs font-normal border rounded bg-white text-slate-800"
                                                      [(ngModel)]="${columnFiltersState}['${toCamelCase(col)}']"
                                                      (ngModelChange)="${pageState} = 1"
                                                  />
                                              </th>`).join('\n') : `
                                              <ng-container *ngIf="${stateName}.length > 0">
                                                  <th *ngFor="let k of getObjKeys(${stateName}[0])" class="p-2">
                                                      <input 
                                                          type="text"
                                                          placeholder="Filtern..."
                                                          class="w-full px-2 py-1 text-xs font-normal border rounded bg-white text-slate-800"
                                                          [(ngModel)]="${columnFiltersState}[k]"
                                                          (ngModelChange)="${pageState} = 1"
                                                      />
                                                  </th>
                                              </ng-container>`}
                                          </tr>
                                      </thead>
                                      <tbody class="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                                          <tr 
                                              *ngFor="let row of ${paginatedName}; let idx = index" 
                                              class="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition select-none"
                                              [class.bg-blue-50]="row['${pkFieldName}'] === ${selectedRowState} || row.id === ${selectedRowState} || row.ID === ${selectedRowState}"
                                              (click)="onRowClick_${suffix}(row, idx)"
                                              ${dblclickActionCode ? `(dblclick)="onRowDoubleClick_${suffix}(row, idx)"` : ''}
                                          >
                                              ${columns.length > 0 ? columns.map((col: string) => `<td class="px-3 py-2 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{{ row['${toCamelCase(col)}'] || row['${col}'] || '' }}</td>`).join('\n') : `
                                              <td *ngFor="let val of getObjValues(row)" class="px-3 py-2 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{{ val }}</td>`}
                                          </tr>
                                          <tr *ngIf="${stateName}.length === 0">
                                              <td class="p-4 text-center text-slate-400 italic" colspan="100">Keine Einträge.</td>
                                          </tr>
                                      </tbody>
                                  </table>
                              </div>

                              <div *ngIf="totalItems_${suffix} > 0" class="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-3 px-1 gap-2 text-xs text-slate-500 select-none">
                                  <div>
                                      Zeige <span class="font-semibold text-slate-700 dark:text-white">{{startIndex_${suffix} + 1}}</span> bis <span class="font-semibold text-slate-700 dark:text-white">{{endIndex_${suffix}}}</span> von <span class="font-semibold text-slate-700 dark:text-white">{{totalItems_${suffix}}}</span> Einträgen
                                  </div>
                                  <div class="flex items-center gap-1.5">
                                      <button 
                                          (click)="${pageState} = 1" 
                                          [disabled]="${pageState} <= 1"
                                          class="px-2 py-1 border rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition"
                                      >
                                          Erste
                                      </button>
                                      <button 
                                          (click)="${pageState} = ${pageState} - 1" 
                                          [disabled]="${pageState} <= 1"
                                          class="px-2 py-1 border rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition"
                                      >
                                          Zurück
                                      </button>
                                      <span class="px-3 py-1 font-medium text-slate-700 dark:text-white bg-slate-50 dark:bg-slate-900 border rounded">
                                          Seite {{${pageState}}} von {{totalPages_${suffix}}}
                                      </span>
                                      <button 
                                          (click)="${pageState} = ${pageState} + 1" 
                                          [disabled]="${pageState} >= totalPages_${suffix}"
                                          class="px-2 py-1 border rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition"
                                      >
                                          Weiter
                                      </button>
                                      <button 
                                          (click)="${pageState} = totalPages_${suffix}" 
                                          [disabled]="${pageState} >= totalPages_${suffix}"
                                          class="px-2 py-1 border rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition"
                                      >
                                          Letzte
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </div>`;
                  }
              }
              default:
                  return `<div class="p-3 bg-light border rounded text-secondary small">${node.type} Component</div>`;
          }
      };

      let customHtml = '';
      if (isBootstrap) {
          customHtml = `
          <div class="container py-4">
              <div class="mb-4">
                  <h1 class="h2 text-dark">${page.name}</h1>
              </div>
              <div class="card shadow-sm border p-4">
                  ${generateNode(page.layout)}
              </div>
          </div>`;
      } else {
          customHtml = `
          <div class="p-8">
              <div class="mb-6 flex justify-between items-center">
                  <h1 class="text-3xl font-bold text-slate-800">${page.name}</h1>
              </div>
              <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  ${generateNode(page.layout)}
              </div>
          </div>`;
      }

      const customTs = `import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-${kebabName}-custom',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './${kebabName}-custom.component.html'
})
export class ${pascalName}CustomComponent implements OnInit {
  ${states.join('\n  ')}

  constructor(private api: ApiService) {}

  ngOnInit() {
    ${initCalls.join('\n    ')}
  }

  ${methods.join('\n\n  ')}
}`;

      files.push({ name: `${kebabName}-custom.component.html`, path: `${appRoot}/pages/${folder}/${kebabName}-custom.component.html`, content: customHtml, language: 'html' });
      files.push({ name: `${kebabName}-custom.component.ts`, path: `${appRoot}/pages/${folder}/${kebabName}-custom.component.ts`, content: customTs, language: 'typescript' });
      routes.push({ path: `custom/${kebabName}`, component: compName, folder: folder, file: `${kebabName}-custom.component` });
  });

  return { files, routes };
};
