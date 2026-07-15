import { generateBackendCode } from './utils/backendGenerators';
const files = generateBackendCode([{id: '1', name: 'status', fields: [{id: 'f1', name: 'status', type: 'string', isPrimaryKey: false}]}], [], [], {projectName: 'my_app', language: 'nodejs', dbType: 'postgres', frontendFramework: 'angular', dbConnection: 'host=localhost;port=5432;database=my_db'}, [], [], [], []);

console.log("NodeJS model:", files.find(f => f.name === 'status.ts')?.content?.includes('statusValue'));
console.log("Angular Component:", files.find(f => f.name === 'status-list.component.ts')?.content?.includes('statusValue'));

