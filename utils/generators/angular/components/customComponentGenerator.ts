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

      const states: string[] = [];
      const initCalls: string[] = [];
      const methods: string[] = [];

      const context: NodeGeneratorContext = {
          isBootstrap,
          tables,
          queries,
          forms,
          customComponents,
          states,
          initCalls,
          methods
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
