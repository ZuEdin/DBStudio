
import { VirtualFile, BackendConfig } from '../../../types/index';

export const generateReactConfigs = (config: BackendConfig, root: string): VirtualFile[] => {
  const files: VirtualFile[] = [];
  
  const packageJson = {
    "name": "react-client",
    "private": true,
    "version": "0.0.0",
    "type": "module",
    "scripts": { "dev": "vite", "build": "tsc && vite build", "preview": "vite preview" },
    "dependencies": { "axios": "^1.6.2", "react": "^18.2.0", "react-dom": "^18.2.0", "react-router-dom": "^6.20.0", "lucide-react": "^0.294.0" },
    "devDependencies": { "@types/react": "^18.2.37", "@types/react-dom": "^18.2.15", "@vitejs/plugin-react": "^4.2.0", "autoprefixer": "^10.4.16", "postcss": "^8.4.31", "tailwindcss": "^3.3.5", "typescript": "^5.2.2", "vite": "^5.0.0" }
  };
  files.push({ name: 'package.json', path: `${root}/package.json`, content: JSON.stringify(packageJson, null, 2), language: 'json' });

  const tsConfig = {
    "compilerOptions": { "target": "ES2020", "useDefineForClassFields": true, "lib": ["ES2020", "DOM", "DOM.Iterable"], "module": "ESNext", "skipLibCheck": true, "moduleResolution": "bundler", "allowImportingTsExtensions": true, "resolveJsonModule": true, "isolatedModules": true, "noEmit": true, "jsx": "react-jsx", "strict": true, "noUnusedLocals": true, "noUnusedParameters": true, "noFallthroughCasesInSwitch": true },
    "include": ["src"], "references": [{ "path": "./tsconfig.node.json" }]
  };
  files.push({ name: 'tsconfig.json', path: `${root}/tsconfig.json`, content: JSON.stringify(tsConfig, null, 2), language: 'json' });

  // Missing tsconfig.node.json (Critical for Vite build)
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

  // Missing index.css (Critical for Tailwind)
  files.push({ name: 'index.css', path: `${root}/src/index.css`, content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;`, language: 'css' });

  // Missing vite-env.d.ts (Nice to have)
  files.push({ name: 'vite-env.d.ts', path: `${root}/src/vite-env.d.ts`, content: `/// <reference types="vite/client" />`, language: 'typescript' });

  files.push({ name: 'vite.config.ts', path: `${root}/vite.config.ts`, content: `import { defineConfig } from 'vite'; import react from '@vitejs/plugin-react'; export default defineConfig({ plugins: [react()], server: { port: 3000 } });`, language: 'typescript' });
  files.push({ name: 'tailwind.config.js', path: `${root}/tailwind.config.js`, content: `export default { content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"], theme: { extend: {} }, plugins: [] }`, language: 'javascript' });
  files.push({ name: 'postcss.config.js', path: `${root}/postcss.config.js`, content: `export default { plugins: { tailwindcss: {}, autoprefixer: {} } }`, language: 'javascript' });
  
  return files;
};
