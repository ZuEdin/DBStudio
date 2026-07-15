import { generateAngular } from './utils/generators/angularGenerator';
const files = generateAngular([{id: '1', name: 'status', fields: [{id: 'f1', name: 'status', type: 'string', isPrimaryKey: false}]}], [], [], [], {projectName: 'my_app'}, [], [], []);
console.log(files.find(f => f.name === 'status-list.component.ts')?.content);
