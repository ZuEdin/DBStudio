
import { ProjectTemplate, DbType } from '../../../types/index';

export const crmSuite: ProjectTemplate = {
    id: 'crm_suite',
    name: 'Simple CRM',
    description: 'Kundenverwaltung mit Aufträgen und Produkten. Enthält Master-Detail Formulare und Umsatz-Berichte.',
    icon: 'Briefcase',
    category: 'Business',
    data: {
      backendConfig: {
        language: 'dotnet',
        dbType: DbType.SQL,
        projectName: 'MyCRM',
        port: 5000,
        dbConnection: 'Server=.;Database=MyCRM;Trusted_Connection=True;',
        useSwagger: true,
        frontendFramework: 'react',
        authConfig: { useUserLogin: false, useWindowsAuth: false, useAdGroups: false, devBypass: true }
      },
      tables: [
        {
          id: 't_cust', name: 'Customers',
          fields: [
            { id: 'c1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'c2', name: 'CompanyName', type: 'VARCHAR', length: 100 },
            { id: 'c3', name: 'ContactName', type: 'VARCHAR', length: 100 },
            { id: 'c4', name: 'Email', type: 'VARCHAR', length: 100 },
            { id: 'c5', name: 'Phone', type: 'VARCHAR', length: 20 },
            { id: 'c6', name: 'Status', type: 'VARCHAR', length: 20, defaultValue: 'Active' }
          ],
          data: [
            { Id: 1, CompanyName: 'TechCorp GmbH', ContactName: 'Hans Müller', Email: 'h.mueller@techcorp.de', Phone: '030-123456', Status: 'Active' },
            { Id: 2, CompanyName: 'Design Studio', ContactName: 'Lisa Schmidt', Email: 'lisa@design.com', Phone: '040-987654', Status: 'Lead' },
            { Id: 3, CompanyName: 'Global Logistics', ContactName: 'John Doe', Email: 'john@logistics.net', Phone: '069-555666', Status: 'Inactive' }
          ]
        },
        {
          id: 't_prod', name: 'Products',
          fields: [
            { id: 'p1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'p2', name: 'Name', type: 'VARCHAR', length: 100 },
            { id: 'p3', name: 'Price', type: 'DECIMAL', precision: 10, scale: 2 },
            { id: 'p4', name: 'Category', type: 'VARCHAR', length: 50 }
          ],
          data: [
            { Id: 1, Name: 'Consulting Day', Price: 1200.00, Category: 'Service' },
            { Id: 2, Name: 'Software License', Price: 499.00, Category: 'Product' },
            { Id: 3, Name: 'Support Contract', Price: 150.00, Category: 'Service' }
          ]
        },
        {
          id: 't_ord', name: 'Orders',
          fields: [
            { id: 'o1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'o2', name: 'CustomerId', type: 'INTEGER' },
            { id: 'o3', name: 'OrderDate', type: 'DATE' },
            { id: 'o4', name: 'TotalAmount', type: 'DECIMAL', precision: 12, scale: 2 }
          ],
          data: [
            { Id: 1001, CustomerId: 1, OrderDate: '2023-10-01', TotalAmount: 1699.00 },
            { Id: 1002, CustomerId: 2, OrderDate: '2023-10-05', TotalAmount: 499.00 }
          ]
        },
        {
          id: 't_items', name: 'OrderItems',
          fields: [
            { id: 'i1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'i2', name: 'OrderId', type: 'INTEGER' },
            { id: 'i3', name: 'ProductId', type: 'INTEGER' },
            { id: 'i4', name: 'Quantity', type: 'INTEGER', defaultValue: '1' }
          ],
          data: [
            { Id: 1, OrderId: 1001, ProductId: 1, Quantity: 1 },
            { Id: 2, OrderId: 1001, ProductId: 2, Quantity: 1 },
            { Id: 3, OrderId: 1002, ProductId: 2, Quantity: 1 }
          ]
        }
      ],
      relationships: [
        { id: 'r1', fromTableId: 't_cust', fromFieldId: 'c1', toTableId: 't_ord', toFieldId: 'o2', type: '1:n', referentialIntegrity: true },
        { id: 'r2', fromTableId: 't_ord', fromFieldId: 'o1', toTableId: 't_items', toFieldId: 'i2', type: '1:n', referentialIntegrity: true, onDelete: 'CASCADE' },
        { id: 'r3', fromTableId: 't_prod', fromFieldId: 'p1', toTableId: 't_items', toFieldId: 'i3', type: '1:n', referentialIntegrity: true }
      ],
      queries: [
        {
          id: 'q_revenue', type: 'SELECT', name: 'Umsatz pro Kunde',
          nodes: [
            { id: 'n1', tableId: 't_cust', x: 50, y: 50 },
            { id: 'n2', tableId: 't_ord', x: 300, y: 50 }
          ],
          columns: [
            { id: 'qc1', tableId: 't_cust', fieldId: 'c2', tableName: 'Customers', fieldName: 'CompanyName', sort: 'ASC', show: true, criteria: [''], aggregate: 'GROUP_BY' },
            { id: 'qc2', tableId: 't_ord', fieldId: 'o4', tableName: 'Orders', fieldName: 'TotalAmount', sort: 'DESC', show: true, criteria: [''], aggregate: 'SUM', alias: 'Gesamtumsatz' }
          ]
        }
      ],
      forms: [
        {
          id: 'f_orders', name: 'Auftragserfassung', sourceType: 'table', sourceId: 't_ord',
          layout: {
            id: 'root', type: 'container', className: 'space-y-4',
            children: [
              { id: 'l1', type: 'label', label: 'Auftragsdaten', className: 'text-lg font-bold border-b pb-2' },
              { 
                id: 'c_header', type: 'container', className: 'grid grid-cols-2 gap-4',
                children: [
                  { id: 'f_cust', type: 'field', fieldId: 'o2', label: 'Kunde', widgetType: 'select', lookup: { tableId: 't_cust', valueFieldId: 'c1', labelFields: ['c2'], allowQuickCreate: true } },
                  { id: 'f_date', type: 'field', fieldId: 'o3', label: 'Datum', widgetType: 'date' }
                ]
              },
              { id: 'f_total', type: 'field', fieldId: 'o4', label: 'Gesamtbetrag', widgetType: 'number' },
              { 
                id: 'sub_items', type: 'subform', label: 'Positionen', 
                subform: { formId: 'f_items_sub', masterLinkFieldId: 'o1', childLinkFieldId: 'i2', canAdd: true, canEdit: true, canDelete: true } 
              }
            ]
          }
        },
        {
          id: 'f_items_sub', name: 'Positions-Subform', sourceType: 'table', sourceId: 't_items',
          layout: {
            id: 'sub_root', type: 'container', className: 'grid grid-cols-2 gap-2 p-2 bg-slate-50',
            children: [
              { id: 'f_prod', type: 'field', fieldId: 'i3', label: 'Produkt', widgetType: 'select', lookup: { tableId: 't_prod', valueFieldId: 'p1', labelFields: ['p2'] } },
              { id: 'f_qty', type: 'field', fieldId: 'i4', label: 'Menge', widgetType: 'number' }
            ]
          }
        }
      ],
      reports: [
        {
          id: 'r_cust_list', name: 'Kundenliste', sourceType: 'table', sourceId: 't_cust',
          groupingFieldId: 'c6', // Status
          summaries: [{ fieldId: 'c1', fieldName: 'Id', calculation: 'COUNT' }],
          columns: [
            { fieldId: 'c2', label: 'Firma', visible: true, order: 0 },
            { fieldId: 'c3', label: 'Ansprechpartner', visible: true, order: 1 },
            { fieldId: 'c4', label: 'E-Mail', visible: true, order: 2 },
            { fieldId: 'c6', label: 'Status', visible: true, order: 3, formattingRules: [{ operator: 'eq', value: 'Active', style: { color: 'green', fontWeight: 'bold' } }] }
          ]
        }
      ]
    }
};
