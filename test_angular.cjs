const { generateAngularApp } = require('./dist/utils/generators/angular/index.js');
const fs = require('fs');

const appConfig = {
  name: 'Test App',
  colors: { primary: '#000000', secondary: '#ffffff' },
  auth: { type: 'none' }
};

const tables = [];
const queries = [];
const forms = [];
const customComponents = [
  {
    id: 'comp1',
    type: 'calendar_view',
    configuration: {
      title: 'My Calendar',
      tableId: 'table1'
    }
  }
];
const pages = [
  {
    name: 'Home',
    layout: {
      type: 'row',
      children: [
        {
          type: 'custom_component',
          props: { customComponentId: 'comp1' }
        }
      ]
    }
  }
];

const result = generateAngularApp(appConfig, tables, queries, forms, pages, customComponents);
fs.writeFileSync('test_angular.json', JSON.stringify(result, null, 2));
console.log('Done');
