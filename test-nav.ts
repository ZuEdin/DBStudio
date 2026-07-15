import { generateSidebar } from './utils/generators/react/structure/navigationGenerator';
console.log(generateSidebar([{id: '1', name: 'my_table', fields: []}], [], [], {}, '/', [], [], false, { appName: 'App', primaryColor: '#000' }).content);
