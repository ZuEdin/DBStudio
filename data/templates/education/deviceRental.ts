
import { ProjectTemplate, DbType } from '../../../types/index';

export const deviceRental: ProjectTemplate = {
    id: 'device_rental',
    name: 'Geräte-Manager & Verleih',
    description: 'Verleihsystem für IT-Geräte, Bücher oder Maschinen inkl. Status-Tracking (Reserviert, Verliehen, Reparatur).',
    icon: 'Monitor',
    category: 'Business',
    data: {
      backendConfig: {
        language: 'dotnet',
        dbType: DbType.SQLite,
        projectName: 'DeviceRental',
        port: 5005,
        dbConnection: 'Data Source=rentals.db',
        useSwagger: true,
        frontendFramework: 'blazor',
        authConfig: { useUserLogin: true, useWindowsAuth: false, useAdGroups: false, devBypass: true }
      },
      tables: [
        // 1. Personenlisten (Entleiher)
        {
          id: 't_person', name: 'Personen',
          fields: [
            { id: 'p1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'p2', name: 'Vorname', type: 'VARCHAR', length: 50 },
            { id: 'p3', name: 'Nachname', type: 'VARCHAR', length: 50 },
            { id: 'p4', name: 'Email', type: 'VARCHAR', length: 100 },
            { id: 'p5', name: 'Abteilung', type: 'VARCHAR', length: 50, allowNull: true }
          ],
          data: [
            { Id: 1, Vorname: 'Max', Nachname: 'Mustermann', Email: 'max@firma.de', Abteilung: 'IT' },
            { Id: 2, Vorname: 'Erika', Nachname: 'Musterfrau', Email: 'erika@firma.de', Abteilung: 'HR' }
          ]
        },
        // 2. Gerätetypen (Subtabelle)
        {
          id: 't_types', name: 'Geraetetypen',
          fields: [
            { id: 'ty1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'ty2', name: 'Bezeichnung', type: 'VARCHAR', length: 100 },
            { id: 'ty3', name: 'Beschreibung', type: 'TEXT', allowNull: true }
          ],
          data: [
            { Id: 1, Bezeichnung: 'Notebook', Beschreibung: 'Standard Arbeitslaptops' },
            { Id: 2, Bezeichnung: 'Beamer', Beschreibung: 'Projektoren für Meetingräume' },
            { Id: 3, Bezeichnung: 'Fachbuch', Beschreibung: 'Literatur und Handbücher' }
          ]
        },
        // 3. Verleihliste / Gerätebestand
        {
          id: 't_devices', name: 'Geraete',
          fields: [
            { id: 'd1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'd2', name: 'TypId', type: 'INTEGER' }, // FK
            { id: 'd3', name: 'InterneBezeichnung', type: 'VARCHAR', length: 100 },
            { id: 'd4', name: 'Anlagennummer', type: 'VARCHAR', length: 50, allowNull: true },
            { id: 'd5', name: 'SonstigeNummer', type: 'VARCHAR', length: 50, allowNull: true }, // z.B. ISBN
            { id: 'd6', name: 'Seriennummer', type: 'VARCHAR', length: 100, allowNull: true },
            { id: 'd7', name: 'Zustand', type: 'VARCHAR', length: 50, defaultValue: 'Neu' },
            { id: 'd8', name: 'Status', type: 'VARCHAR', length: 20, defaultValue: 'Verfügbar' }, // Reserviert; Verliehen; Reparatur; Ausgeschieden
            { id: 'd9', name: 'Kommentar', type: 'TEXT', allowNull: true }
          ],
          data: [
            { Id: 1, TypId: 1, InterneBezeichnung: 'NB-001', Anlagennummer: 'A-1001', Seriennummer: 'SN-998877', Zustand: 'Gut', Status: 'Verliehen' },
            { Id: 2, TypId: 1, InterneBezeichnung: 'NB-002', Anlagennummer: 'A-1002', Seriennummer: 'SN-554433', Zustand: 'Neu', Status: 'Verfügbar' },
            { Id: 3, TypId: 2, InterneBezeichnung: 'Beamer Raum A', Anlagennummer: 'A-2001', Zustand: 'Gebraucht', Status: 'Reparatur' },
            { Id: 4, TypId: 3, InterneBezeichnung: 'Clean Code Buch', SonstigeNummer: 'ISBN-978-3', Zustand: 'Gebraucht', Status: 'Reserviert' }
          ]
        },
        // 4. Verleihkalender
        {
          id: 't_rentals', name: 'Verleihvorgang',
          fields: [
            { id: 'r1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'r2', name: 'GeraeteId', type: 'INTEGER' },
            { id: 'r3', name: 'PersonenId', type: 'INTEGER' },
            { id: 'r4', name: 'Von', type: 'DATETIME' },
            { id: 'r5', name: 'Bis', type: 'DATETIME' },
            { id: 'r6', name: 'RetourniertAm', type: 'DATETIME', allowNull: true },
            { id: 'r7', name: 'Kommentar', type: 'TEXT', allowNull: true }
          ],
          data: [
            { Id: 1, GeraeteId: 1, PersonenId: 1, Von: '2023-10-01 09:00:00', Bis: '2023-10-05 17:00:00', Kommentar: 'Projekt X' },
            { Id: 2, GeraeteId: 4, PersonenId: 2, Von: '2023-11-01 00:00:00', Bis: '2023-11-15 00:00:00', Status: 'Reserviert' }
          ]
        }
      ],
      relationships: [
        { id: 'rel_type_device', fromTableId: 't_types', fromFieldId: 'ty1', toTableId: 't_devices', toFieldId: 'd2', type: '1:n', referentialIntegrity: true },
        { id: 'rel_dev_rent', fromTableId: 't_devices', fromFieldId: 'd1', toTableId: 't_rentals', toFieldId: 'r2', type: '1:n', referentialIntegrity: true },
        { id: 'rel_pers_rent', fromTableId: 't_person', fromFieldId: 'p1', toTableId: 't_rentals', toFieldId: 'r3', type: '1:n', referentialIntegrity: true }
      ],
      queries: [
        {
          id: 'q_active_rentals', type: 'SELECT', name: 'Aktuelle Verleihungen',
          nodes: [
            { id: 'n1', tableId: 't_rentals', x: 250, y: 50 },
            { id: 'n2', tableId: 't_devices', x: 50, y: 50 },
            { id: 'n3', tableId: 't_person', x: 450, y: 50 }
          ],
          columns: [
            { id: 'c1', tableId: 't_devices', fieldId: 'd3', tableName: 'Geraete', fieldName: 'InterneBezeichnung', sort: '', show: true, criteria: [''] },
            { id: 'c2', tableId: 't_person', fieldId: 'p3', tableName: 'Personen', fieldName: 'Nachname', sort: '', show: true, criteria: [''] },
            { id: 'c3', tableId: 't_rentals', fieldId: 'r4', tableName: 'Verleihvorgang', fieldName: 'Von', sort: 'DESC', show: true, criteria: [''] },
            { id: 'c4', tableId: 't_rentals', fieldId: 'r5', tableName: 'Verleihvorgang', fieldName: 'Bis', sort: '', show: true, criteria: [''] },
            { id: 'c5', tableId: 't_rentals', fieldId: 'r6', tableName: 'Verleihvorgang', fieldName: 'RetourniertAm', sort: '', show: false, criteria: ['IS NULL'] } // Nur nicht zurückgegebene
          ]
        },
        {
            id: 'q_overdue', type: 'SELECT', name: 'Überfällige Geräte',
            nodes: [{ id: 'n1', tableId: 't_rentals', x: 50, y: 50 }],
            columns: [
                { id: 'oc1', tableId: 't_rentals', fieldId: 'r2', tableName: 'Verleihvorgang', fieldName: 'GeraeteId', show: true, sort: '', criteria: [''] },
                { id: 'oc2', tableId: 't_rentals', fieldId: 'r5', tableName: 'Verleihvorgang', fieldName: 'Bis', show: true, sort: 'ASC', criteria: ['< DATE("now")'] }, // SQL Lite syntax assumption
                { id: 'oc3', tableId: 't_rentals', fieldId: 'r6', tableName: 'Verleihvorgang', fieldName: 'RetourniertAm', show: false, sort: '', criteria: ['IS NULL'] }
            ]
        }
      ],
      forms: [
          {
              id: 'f_rental_capture', name: 'Gerät ausleihen', sourceType: 'table', sourceId: 't_rentals',
              layout: {
                  id: 'root', type: 'container', className: 'p-4 bg-white space-y-4',
                  children: [
                      { id: 'l1', type: 'label', label: 'Neuer Verleihvorgang', className: 'text-xl font-bold text-blue-800 border-b pb-2' },
                      { 
                          id: 'c1', type: 'container', className: 'grid grid-cols-2 gap-6',
                          children: [
                              { id: 'f_dev', type: 'field', fieldId: 'r2', label: 'Gerät wählen', widgetType: 'select', lookup: { tableId: 't_devices', valueFieldId: 'd1', labelFields: ['d3', 'd6'], displayFormat: [{fieldId: 'd3'}, {fieldId: 'd6', prefix: ' (SN: ', suffix: ')'}], sort: { fieldId: 'd3', direction: 'ASC' } } },
                              { id: 'f_pers', type: 'field', fieldId: 'r3', label: 'Person', widgetType: 'select', lookup: { tableId: 't_person', valueFieldId: 'p1', labelFields: ['p2', 'p3'], displayFormat: [{fieldId: 'p3', suffix: ', '}, {fieldId: 'p2'}], allowQuickCreate: true } }
                          ]
                      },
                      {
                          id: 'c2', type: 'container', className: 'grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded',
                          children: [
                              { id: 'f_start', type: 'field', fieldId: 'r4', label: 'Ausgabe am', widgetType: 'date' },
                              { id: 'f_end', type: 'field', fieldId: 'r5', label: 'Rückgabe geplant', widgetType: 'date' }
                          ]
                      },
                      { id: 'f_comment', type: 'field', fieldId: 'r7', label: 'Bemerkung / Zubehör', widgetType: 'textarea' }
                  ]
              }
          }
      ],
      reports: [
          {
              id: 'r_device_status', name: 'Geräte Statusbericht', sourceType: 'table', sourceId: 't_devices',
              groupingFieldId: 'd8', // Status
              summaries: [{ fieldId: 'd1', fieldName: 'Id', calculation: 'COUNT' }],
              columns: [
                  { fieldId: 'd3', label: 'Bezeichnung', visible: true, order: 0 },
                  { fieldId: 'd6', label: 'Seriennr.', visible: true, order: 1 },
                  { fieldId: 'd8', label: 'Status', visible: true, order: 2, formattingRules: [
                      { operator: 'eq', value: 'Verfügbar', style: { color: 'green' } },
                      { operator: 'eq', value: 'Reparatur', style: { color: 'red', fontWeight: 'bold' } },
                      { operator: 'eq', value: 'Verliehen', style: { color: 'orange' } }
                  ]}
              ]
          }
      ]
    }
};
