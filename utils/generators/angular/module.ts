
import { VirtualFile } from '../../../types/index';
import { toKebabCase } from '../common';

export const generateAngularModule = (declarations: string[], routes: string[], appRoot: string): VirtualFile => {
  const declarationImports = declarations.filter(d => d !== 'AppComponent' && d !== 'SidebarComponent').map(d => {
      let path = '';
      if (d.includes('ListComponent')) {
          const entityName = d.replace('ListComponent', '');
          const folder = toKebabCase(entityName);
          const file = toKebabCase(entityName) + '-list.component';
          path = `./pages/${folder}/${file}`;
      } else if (d.includes('FormComponent')) {
          const formName = d.replace('FormComponent', '');
          const folder = toKebabCase(formName) + '-form';
          const file = toKebabCase(formName) + '-form.component';
          path = `./pages/forms/${folder}/${file}`;
      } else if (d.includes('ReportComponent')) {
          const reportName = d.replace('ReportComponent', '');
          const folder = toKebabCase(reportName) + '-report';
          const file = toKebabCase(reportName) + '-report.component';
          path = `./pages/reports/${folder}/${file}`;
      }
      return `import { ${d} } from '${path}';`;
  }).join('\n');

  return { 
    name: 'app.module.ts', 
    path: `${appRoot}/app.module.ts`, 
    content: `import { NgModule } from '@angular/core'; import { BrowserModule } from '@angular/platform-browser'; import { HttpClientModule } from '@angular/common/http'; import { RouterModule } from '@angular/router'; import { FormsModule } from '@angular/forms'; import { AppComponent } from './app.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
// Declarations
${declarationImports}

@NgModule({ 
  declarations: [${declarations.join(', ')}], 
  imports: [BrowserModule, HttpClientModule, FormsModule, RouterModule.forRoot([${routes.join(',')}])], 
  bootstrap: [AppComponent] 
}) export class AppModule { }`, 
    language: 'typescript' 
  };
};
