
import { VirtualFile, BackendConfig } from '../../../types/index';

export const generateReactConfigs = (config: BackendConfig, root: string): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const fePort = config.frontendPort || 3000;
  
  // Build Scripts based on Environments
  const scripts: Record<string, string> = { 
      "dev": "vite", 
      "build": "tsc && vite build", 
      "preview": "vite preview" 
  };

  if (config.environments) {
      config.environments.forEach(env => {
          const suffix = env.name === 'Production' ? 'prod' : env.name === 'Staging' ? 'staging' : 'dev';
          const outDir = env.buildPath || `dist/${suffix}`;
          // Add specific build command for this environment
          scripts[`build:${suffix}`] = `tsc && vite build --outDir "${outDir}" --mode ${suffix}`;
      });
  }

  const packageJson = {
    "name": "react-client",
    "private": true,
    "version": "0.0.0",
    "type": "module",
    "scripts": scripts,
    "dependencies": { 
        "axios": "^1.7.9", 
        "react": "^18.3.1", 
        "react-dom": "^18.3.1", 
        "react-router-dom": "^6.28.0", 
        "lucide-react": "^0.460.0", 
        "clsx": "^2.1.1", 
        "tailwind-merge": "^2.3.0" 
    },
    "devDependencies": { 
        "@types/react": "^18.3.3", 
        "@types/react-dom": "^18.3.0", 
        "@vitejs/plugin-react": "^4.3.4", 
        "autoprefixer": "^10.4.19", 
        "postcss": "^8.4.38", 
        "tailwindcss": "^3.4.4", 
        "typescript": "^5.4.5", 
        "vite": "^5.4.14" 
    }
  };
  files.push({ name: 'package.json', path: `${root}/package.json`, content: JSON.stringify(packageJson, null, 2), language: 'json' });

  const tsConfig = {
    "compilerOptions": { "target": "ES2020", "useDefineForClassFields": true, "lib": ["ES2020", "DOM", "DOM.Iterable"], "module": "ESNext", "skipLibCheck": true, "moduleResolution": "bundler", "allowImportingTsExtensions": true, "resolveJsonModule": true, "isolatedModules": true, "noEmit": true, "jsx": "react-jsx", "strict": true, "noUnusedLocals": true, "noUnusedParameters": true, "noFallthroughCasesInSwitch": true },
    "include": ["src"], "references": [{ "path": "./tsconfig.node.json" }]
  };
  files.push({ name: 'tsconfig.json', path: `${root}/tsconfig.json`, content: JSON.stringify(tsConfig, null, 2), language: 'json' });

  const tsConfigNode = {
    "compilerOptions": {
      "composite": true,
      "skipLibCheck": true,
      "module": "ESNext",
      "moduleResolution": "bundler",
      "allowSyntheticDefaultImports": true
    },
    "include": ["vite.config.ts"]
  };
  files.push({ name: 'tsconfig.node.json', path: `${root}/tsconfig.node.json`, content: JSON.stringify(tsConfigNode, null, 2), language: 'json' });

  files.push({ name: 'index.css', path: `${root}/src/index.css`, content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nbody {\n  @apply bg-gray-50 text-slate-900 dark:bg-gray-900 dark:text-slate-100;\n}`, language: 'css' });

  files.push({ name: 'vite.config.ts', path: `${root}/vite.config.ts`, content: `import { defineConfig } from 'vite'; import react from '@vitejs/plugin-react'; export default defineConfig({ plugins: [react()], server: { port: ${fePort} } });`, language: 'typescript' });
  
  files.push({ name: 'tailwind.config.js', path: `${root}/tailwind.config.js`, content: `export default { 
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"], 
  theme: { 
    extend: {
      colors: {
        primary: { 50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' },
        dark: { 800: '#1f2937', 900: '#111827', 950: '#030712' }
      }
    } 
  }, 
  plugins: [] 
}`, language: 'javascript' });
  
  files.push({ name: 'postcss.config.js', path: `${root}/postcss.config.js`, content: `export default { plugins: { tailwindcss: {}, autoprefixer: {} } }`, language: 'javascript' });
  
  return files;
};
