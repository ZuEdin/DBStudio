
import { VirtualFile, BackendConfig } from '../../../types/index';

export const generateAngularConfigs = (config: BackendConfig, root: string): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const useAuth = config.authConfig?.useUserLogin;
  
  // Defaults
  const devApiUrl = `http://localhost:${config.port}/api`;
  let prodApiUrl = devApiUrl;
  let stagingApiUrl = devApiUrl;
  
  // Extract Environment Configs
  if (config.environments) {
      const prodEnv = config.environments.find(e => e.name === 'Production');
      const stagingEnv = config.environments.find(e => e.name === 'Staging');
      
      if (prodEnv && prodEnv.apiUrl) prodApiUrl = prodEnv.apiUrl;
      if (stagingEnv && stagingEnv.apiUrl) stagingApiUrl = stagingEnv.apiUrl;
  }

  files.push({ name: 'package.json', path: `${root}/package.json`, content: `{"name":"angular-client","version":"0.0.0","scripts":{"start":"ng serve","build":"ng build","build:staging":"ng build --configuration staging","build:prod":"ng build --configuration production"},"dependencies":{"@angular/common":"^18.0.0","@angular/core":"^18.0.0","@angular/forms":"^18.0.0","@angular/platform-browser":"^18.0.0", "@angular/platform-browser-dynamic":"^18.0.0","@angular/router":"^18.0.0","rxjs":"~7.8.0","tslib":"^2.3.0","zone.js":"~0.14.0"},"devDependencies":{"@angular-devkit/build-angular":"^18.0.0","@angular/cli":"^18.0.0","@angular/compiler-cli":"^18.0.0","typescript":"~5.4.2","tailwindcss":"^3.4.4","postcss":"^8.4.38","autoprefixer":"^10.4.19"}}`, language: 'json' });
  
  const angularJson = {
    "version": 1,
    "projects": {
      "angular-client": {
        "projectType": "application",
        "root": "",
        "sourceRoot": "src",
        "prefix": "app",
        "architect": {
          "build": {
            "builder": "@angular-devkit/build-angular:browser",
            "options": {
              "outputPath": "dist/angular-client",
              "index": "src/index.html",
              "main": "src/main.ts",
              "polyfills": ["src/polyfills.ts"],
              "tsConfig": "tsconfig.app.json",
              "assets": ["src/favicon.ico", "src/assets"],
              "styles": ["src/styles.css"],
              "scripts": []
            },
            "configurations": {
              "production": {
                "budgets": [{ "type": "initial", "maximumWarning": "500kb", "maximumError": "1mb" }],
                "outputHashing": "all",
                "fileReplacements": [
                  {
                    "replace": "src/environments/environment.ts",
                    "with": "src/environments/environment.prod.ts"
                  }
                ]
              },
              "staging": {
                "budgets": [{ "type": "initial", "maximumWarning": "500kb", "maximumError": "1mb" }],
                "outputHashing": "all",
                "fileReplacements": [
                  {
                    "replace": "src/environments/environment.ts",
                    "with": "src/environments/environment.staging.ts"
                  }
                ]
              },
              "development": {
                "buildOptimizer": false,
                "optimization": false,
                "vendorChunk": true,
                "extractLicenses": false,
                "sourceMap": true,
                "namedChunks": true
              }
            },
            "defaultConfiguration": "production"
          },
          "serve": {
            "builder": "@angular-devkit/build-angular:dev-server",
            "configurations": {
              "production": { "browserTarget": "angular-client:build:production" },
              "staging": { "browserTarget": "angular-client:build:staging" },
              "development": { "browserTarget": "angular-client:build:development" }
            },
            "defaultConfiguration": "development"
          }
        }
      }
    }
  };
  files.push({ name: 'angular.json', path: `${root}/angular.json`, content: JSON.stringify(angularJson, null, 2), language: 'json' });
  
  // Environments
  files.push({
      name: 'environment.ts',
      path: `${root}/src/environments/environment.ts`,
      content: `export const environment = {\n  production: false,\n  apiUrl: '${devApiUrl}'\n};`,
      language: 'typescript'
  });
  files.push({
      name: 'environment.prod.ts',
      path: `${root}/src/environments/environment.prod.ts`,
      content: `export const environment = {\n  production: true,\n  apiUrl: '${prodApiUrl}'\n};`,
      language: 'typescript'
  });
  files.push({
      name: 'environment.staging.ts',
      path: `${root}/src/environments/environment.staging.ts`,
      content: `export const environment = {\n  production: false,\n  apiUrl: '${stagingApiUrl}'\n};`,
      language: 'typescript'
  });

  files.push({ name: 'tsconfig.json', path: `${root}/tsconfig.json`, content: JSON.stringify({ "compileOnSave": false, "compilerOptions": { "baseUrl": "./", "outDir": "./dist/out-tsc", "forceConsistentCasingInFileNames": true, "strict": true, "noImplicitOverride": true, "noPropertyAccessFromIndexSignature": true, "noImplicitReturns": true, "noFallthroughCasesInSwitch": true, "sourceMap": true, "declaration": false, "downlevelIteration": true, "experimentalDecorators": true, "moduleResolution": "node", "importHelpers": true, "target": "ES2022", "module": "ES2022", "useDefineForClassFields": false, "lib": ["ES2022", "dom"] }, "angularCompilerOptions": { "enableI18nLegacyMessageIdFormat": false, "strictInjectionParameters": true, "strictInputAccessModifiers": true, "strictTemplates": true } }, null, 2), language: 'json' });
  files.push({ name: 'tsconfig.app.json', path: `${root}/tsconfig.app.json`, content: JSON.stringify({ "extends": "./tsconfig.json", "compilerOptions": { "outDir": "./dist/out-tsc/app", "types": [] }, "files": ["src/main.ts", "src/polyfills.ts"], "include": ["src/**/*.d.ts"] }, null, 2), language: 'json' });
  
  files.push({ name: 'tailwind.config.js', path: `${root}/tailwind.config.js`, content: `/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  content: ["./src/**/*.{html,ts}"],\n  theme: { extend: {} },\n  plugins: [],\n}`, language: 'javascript' });
  files.push({ name: 'postcss.config.js', path: `${root}/postcss.config.js`, content: `module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }`, language: 'javascript' });
  files.push({ name: 'styles.css', path: `${root}/src/styles.css`, content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;`, language: 'css' });
  files.push({ name: 'polyfills.ts', path: `${root}/src/polyfills.ts`, content: `import 'zone.js';`, language: 'typescript' });
  
  const mainTsContent = `import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient${useAuth ? ', withInterceptors' : ''} } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
${useAuth ? "import { authInterceptor } from './app/interceptors/auth.interceptor';" : ""}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(${useAuth ? 'withInterceptors([authInterceptor])' : ''})
  ]
}).catch(err => console.error(err));
`;
  files.push({ name: 'main.ts', path: `${root}/src/main.ts`, content: mainTsContent, language: 'typescript' });
  
  const appComponentTs = `import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: '<router-outlet></router-outlet>'
})
export class AppComponent {
  title = '${config.projectName}';
}
`;
  files.push({ name: 'app.component.ts', path: `${root}/src/app/app.component.ts`, content: appComponentTs, language: 'typescript' });

  files.push({ name: 'index.html', path: `${root}/src/index.html`, content: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${config.projectName}</title><base href="/"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><app-root></app-root></body></html>`, language: 'html' });

  return files;
};
