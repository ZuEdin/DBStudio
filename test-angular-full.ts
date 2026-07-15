import { generateBackendCode } from './utils/backendGenerators';
const files = generateBackendCode(
  [{id: 't1', name: 'order', fields: [{id: 'f1', name: 'status_id', type: 'number', isPrimaryKey: false}]}, {id: 't2', name: 'status', fields: [{id: 'f2', name: 'id', type: 'number', isPrimaryKey: true}, {id: 'f3', name: 'name', type: 'string', isPrimaryKey: false}]}], 
  [{id: 'r1', fromTableId: 't1', fromFieldId: 'f1', toTableId: 't2', toFieldId: 'f2', type: 'many-to-one'}], 
  [], 
  {projectName: 'my_app', language: 'nodejs', dbType: 'postgres', frontendFramework: 'angular', dbConnection: 'host=localhost;port=5432;database=my_db'}, 
  [], 
  [], 
  [], 
  []
);
const angularFile = files.find(f => f.name === 'order-form.component.html')?.content;
console.log(angularFile);
