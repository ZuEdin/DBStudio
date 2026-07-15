import { generateAngular } from './utils/generators/angularGenerator';
const files = generateAngular([{id: '1', name: 'status', fields: [{id: 'f1', name: 'status', type: 'string', isPrimaryKey: false}]}], [], [], [], {projectName: 'my_app', language: 'dotnet'}, [], [], []);
const file = files.find(f => f.name === 'status.interface.ts');
if (file) console.log(file.content);
