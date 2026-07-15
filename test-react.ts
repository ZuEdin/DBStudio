import { generateReact } from './utils/generators/reactGenerator';
const files1 = generateReact([{id: '1', name: 'status', fields: [{id: 'f1', name: 'status', type: 'string', isPrimaryKey: false}]}], [], [], {projectName: 'my_app', language: 'dotnet'}, [], [], [], []);
console.log("DotNet:", files1.find(f => f.name === 'StatusList.tsx')?.content.includes('statusValue'));

const files2 = generateReact([{id: '1', name: 'status', fields: [{id: 'f1', name: 'status', type: 'string', isPrimaryKey: false}]}], [], [], {projectName: 'my_app', language: 'nodejs'}, [], [], [], []);
console.log("Nodejs:", files2.find(f => f.name === 'StatusList.tsx')?.content.includes('statusValue'));
