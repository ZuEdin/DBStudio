import { generateBackendCode } from './utils/backendGenerators';
const files = generateBackendCode([{id: '1', name: 'status', fields: [{id: 'f1', name: 'status', type: 'string', isPrimaryKey: false}]}], [], [], {projectName: 'my_app', language: 'nodejs', dbType: 'postgres', frontendFramework: 'angular', dbConnection: 'host=localhost;port=5432;database=my_db'}, [], [], [], []);
const ormFile = files.find(f => f.name === 'schema.ts')?.content;
console.log(ormFile?.includes('statusValue'));
