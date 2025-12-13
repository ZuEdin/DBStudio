
import { VirtualFile, BackendConfig } from '../../../types/index';

export const generateAngularConfigs = (config: BackendConfig, root: string): VirtualFile[] => {
  const files: VirtualFile[] = [];
  
  files.push({ name: 'package.json', path: `${root}/package.json`, content: `{"name":"angular-client","version":"0.0.0","scripts":{"start":"ng serve","build":"ng build"},"dependencies":{"@angular/common":"^16.0.0","@angular/core":"^16.0.0","@angular/forms":"^16.0.0","@angular/router":"^16.0.0","rxjs":"~7.8.0","tslib":"^2.3.0","zone.js":"~0.13.0"},"devDependencies":{"@angular-devkit/build-angular":"^16.0.0","@angular/cli":"~16.0.0","@angular/compiler-cli":"^16.0.0","typescript":"~5.0.2","tailwindcss":"^3.3.0","postcss":"^8.4.31","autoprefixer":"^10.4.16"}}`, language: 'json' });
  files.push({ name: 'angular.json', path: `${root}/angular.json`, content: JSON.stringify({"version":1,"projects":{"angular-client":{"projectType":"application","root":"","sourceRoot":"src","prefix":"app","architect":{"build":{"builder":"@angular-devkit/build-angular:browser","options":{"outputPath":"dist/angular-client","index":"src/index.html","main":"src/main.ts","polyfills":["src/polyfills.ts"],"tsConfig":"tsconfig.app.json","assets":["src/favicon.ico","src/assets"],"styles":["src/styles.css"],"scripts":[]}},"serve":{"builder":"@angular-devkit/build-angular:dev-server","configurations":{"production":{"browserTarget":"angular-client:build:production"},"development":{"browserTarget":"angular-client:build:development"}},"defaultConfiguration":"development"}}}}}, null, 2), language: 'json' });
  
  files.push({ name: 'tsconfig.json', path: `${root}/tsconfig.json`, content: JSON.stringify({ "compileOnSave": false, "compilerOptions": { "baseUrl": "./", "outDir": "./dist/out-tsc", "forceConsistentCasingInFileNames": true, "strict": true, "noImplicitOverride": true, "noPropertyAccessFromIndexSignature": true, "noImplicitReturns": true, "noFallthroughCasesInSwitch": true, "sourceMap": true, "declaration": false, "downlevelIteration": true, "experimentalDecorators": true, "moduleResolution": "node", "importHelpers": true, "target": "ES2022", "module": "ES2022", "useDefineForClassFields": false, "lib": ["ES2022", "dom"] }, "angularCompilerOptions": { "enableI18nLegacyMessageIdFormat": false, "strictInjectionParameters": true, "strictInputAccessModifiers": true, "strictTemplates": true } }, null, 2), language: 'json' });
  files.push({ name: 'tsconfig.app.json', path: `${root}/tsconfig.app.json`, content: JSON.stringify({ "extends": "./tsconfig.json", "compilerOptions": { "outDir": "./dist/out-tsc/app", "types": [] }, "files": ["src/main.ts", "src/polyfills.ts"], "include": ["src/**/*.d.ts"] }, null, 2), language: 'json' });
  
  files.push({ name: 'tailwind.config.js', path: `${root}/tailwind.config.js`, content: `/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  content: [\n    "./src/**/*.{html,ts}",\n  ],\n  theme: {\n    extend: {},\n  },\n  plugins: [],\n}`, language: 'javascript' });
  files.push({ name: 'postcss.config.js', path: `${root}/postcss.config.js`, content: `module.exports = {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}`, language: 'javascript' });

  files.push({ name: 'styles.css', path: `${root}/src/styles.css`, content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;`, language: 'css' });
  files.push({ name: 'favicon.ico', path: `${root}/src/favicon.ico`, content: '', language: 'text' });
  files.push({ name: '.gitkeep', path: `${root}/src/assets/.gitkeep`, content: '', language: 'text' });
  files.push({ name: 'polyfills.ts', path: `${root}/src/polyfills.ts`, content: `import 'zone.js';`, language: 'typescript' });
  
  files.push({ name: 'main.ts', path: `${root}/src/main.ts`, content: `import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'; import { AppModule } from './app/app.module'; platformBrowserDynamic().bootstrapModule(AppModule).catch(err => console.error(err));`, language: 'typescript' });
  files.push({ name: 'index.html', path: `${root}/src/index.html`, content: `<!doctype html><html lang="en"><head><title>${config.projectName}</title><base href="/"><script src="https://cdn.tailwindcss.com"></script></head><body><app-root></app-root></body></html>`, language: 'html' });

  return files;
};
