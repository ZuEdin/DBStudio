import { generateBackendCode } from './utils/backendGenerators';
const files = generateBackendCode(
  [{id: 't1', name: 'order', fields: [{id: 'f1', name: 'status_id', type: 'number', isPrimaryKey: false}]}, {id: 't2', name: 'status', fields: [{id: 'f2', name: 'id', type: 'number', isPrimaryKey: true}, {id: 'f3', name: 'name', type: 'string', isPrimaryKey: false}]}], 
  [], 
  [], 
  {projectName: 'my_app', language: 'nodejs', dbType: 'postgres', frontendFramework: 'angular', dbConnection: 'host=localhost;port=5432;database=my_db'}, 
  [{
      id: 'form1', name: 'OrderForm', sourceId: 't1', sourceType: 'table', layout: {
          type: 'container',
          children: [
              {type: 'field', fieldId: 'f1', lookup: {tableId: 't2', allowQuickCreate: true, displayField: 'name', valueField: 'id'}}
          ]
      }
  }], 
  [], 
  [], 
  []
);
const angularFile = files.find(f => f.name === 'order-form.component.html')?.content;
console.log(angularFile);
