import { Table, Form, VirtualFile, Query } from '../../../../types/index';
import { toCamelCase, toKebabCase, toPascalCase } from '../../common';
import { NodeGeneratorContext, RouteInfo } from './custom/types';
import { generateNode } from './custom/nodeRouter';

export const generateCustomPageComponents = (
  pages: any[],
  tables: Table[],
  queries: Query[],
  forms: Form[],
  appRoot: string,
  isBootstrap: boolean = false,
  customComponents: any[] = []
): { files: VirtualFile[]; routes: RouteInfo[] } => {
  const files: VirtualFile[] = [];
  const routes: RouteInfo[] = [];

  pages.forEach(page => {
      const pascalName = toPascalCase(page.name);
      const kebabName = toKebabCase(page.name);
      const folder = 'custom';
      const compName = `${pascalName}CustomComponent`;

      const states: string[] = ['queryParams: any = {};'];
      const initCalls: string[] = ['this.route.queryParams.subscribe(params => { this.queryParams = params; });'];
      const methods: string[] = [];

      const context: NodeGeneratorContext = {
          isBootstrap,
          tables,
          queries,
          forms,
          customComponents,
          states,
          initCalls,
          methods,
          nodeNameCache: new Map<string, string>(),
          usedSuffixes: new Set<string>()
      };

      const nodesHtml = generateNode(page.layout, context, pages);

      let customHtml = '';
      if (isBootstrap) {
          customHtml = `
          <div class="container py-4">
              <div class="mb-4">
                  <h1 class="h2 text-dark">${page.name}</h1>
              </div>
              <div class="card shadow-sm border p-4">
                  ${nodesHtml}
              </div>
          </div>`;
      } else {
          customHtml = `
          <div class="p-8">
              <div class="mb-6 flex justify-between items-center">
                  <h1 class="text-3xl font-bold text-slate-800">${page.name}</h1>
              </div>
              <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  ${nodesHtml}
              </div>
          </div>`;
      }

      
      const checkHasCalendar = (node: any): boolean => {
          if (!node) return false;
          if (node.type === 'calendar_view') return true;
          if (node.type === 'custom_component' && node.props?.customComponentId) {
              const comp = (customComponents || []).find(c => c.id === node.props.customComponentId);
              if (comp && comp.type === 'calendar_view') {
                  return true;
              }
          }
          if (node.children && Array.isArray(node.children)) {
              return node.children.some(checkHasCalendar);
          }
          return false;
      };
      const hasCalendar = checkHasCalendar(page.layout) || JSON.stringify(page.layout).includes('calendar_view');
      const calendarImports = hasCalendar ? 
        "import { FullCalendarModule } from '@fullcalendar/angular';\n" +
        "import { CalendarOptions } from '@fullcalendar/core';\n" +
        "import dayGridPlugin from '@fullcalendar/daygrid';\n" +
        "import timeGridPlugin from '@fullcalendar/timegrid';\n" +
        "import interactionPlugin from '@fullcalendar/interaction';\n" +
        "import listPlugin from '@fullcalendar/list';" : '';
      const moduleImports = hasCalendar ? ', FullCalendarModule' : '';

      const customTs = `
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { MacroService } from '../../services/macro.service';
${calendarImports}

@Component({
  selector: 'app-${kebabName}-custom',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule${moduleImports}],
  templateUrl: './${kebabName}-custom.component.html'
})
export class ${pascalName}CustomComponent implements OnInit {
  ${states.join('\n  ')}

  constructor(private api: ApiService, private router: Router, private route: ActivatedRoute, private macroService: MacroService) {}

  ngOnInit() {
    ${initCalls.join('\n    ')}
  }

  executeMacro(macroId: string, contextData?: any) {
    this.macroService.executeMacro(macroId, contextData);
  }

  ${methods.join('\n\n  ')}
}`;


      files.push({ name: `${kebabName}-custom.component.html`, path: `${appRoot}/pages/${folder}/${kebabName}-custom.component.html`, content: customHtml, language: 'html' });
      files.push({ name: `${kebabName}-custom.component.ts`, path: `${appRoot}/pages/${folder}/${kebabName}-custom.component.ts`, content: customTs, language: 'typescript' });
      routes.push({ path: `custom/${kebabName}`, component: compName, folder: folder, file: `${kebabName}-custom.component` });
  });

  return { files, routes };
};
