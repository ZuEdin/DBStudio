
import { ProjectTemplate, DbType } from '../../../types/index';

export const inventoryApp: ProjectTemplate = {
    id: 'inventory_app',
    name: 'Warenwirtschaft Light',
    description: 'Einfache Lagerverwaltung mit Lieferanten, Artikeln und Lagerbestands-Warnungen.',
    icon: 'Package',
    category: 'Business',
    data: {
      backendConfig: {
        language: 'nodejs',
        dbType: DbType.SQLite,
        projectName: 'InventoryApp',
        port: 3000,
        dbConnection: 'Data Source=inventory.db',
        useSwagger: false,
        frontendFramework: 'react',
        authConfig: { useUserLogin: false, useWindowsAuth: false, useAdGroups: false, devBypass: true }
      },
      tables: [
        {
          id: 't_supp', name: 'Lieferanten',
          fields: [
            { id: 's1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 's2', name: 'Name', type: 'VARCHAR', length: 100 },
            { id: 's3', name: 'City', type: 'VARCHAR', length: 50 }
          ],
          data: [{ Id: 1, Name: 'MegaParts Ltd', City: 'Berlin' }, { Id: 2, Name: 'Global Imports', City: 'Hamburg' }]
        },
        {
          id: 't_art', name: 'Artikel',
          fields: [
            { id: 'a1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'a2', name: 'LieferantenId', type: 'INTEGER' },
            { id: 'a3', name: 'Bezeichnung', type: 'VARCHAR', length: 100 },
            { id: 'a4', name: 'Bestand', type: 'INTEGER' },
            { id: 'a5', name: 'MinBestand', type: 'INTEGER', defaultValue: '10' }
          ],
          data: [
            { Id: 1, LieferantenId: 1, Bezeichnung: 'Schraube M4', Bestand: 500, MinBestand: 100 },
            { Id: 2, LieferantenId: 1, Bezeichnung: 'Mutter M4', Bestand: 50, MinBestand: 100 }, // Low stock
            { Id: 3, LieferantenId: 2, Bezeichnung: 'Karton XL', Bestand: 200, MinBestand: 20 }
          ]
        }
      ],
      relationships: [
        { id: 'r1', fromTableId: 't_supp', fromFieldId: 's1', toTableId: 't_art', toFieldId: 'a2', type: '1:n', referentialIntegrity: true }
      ],
      reports: [
        {
          id: 'r_reorder', name: 'Nachbestell-Liste', sourceType: 'table', sourceId: 't_art',
          summaries: [],
          columns: [
            { fieldId: 'a3', label: 'Artikel', visible: true, order: 0 },
            { fieldId: 'a4', label: 'Aktueller Bestand', visible: true, order: 1, formattingRules: [{ operator: 'lte', value: '100', style: { color: 'red', fontWeight: 'bold' } }] },
            { fieldId: 'a5', label: 'Min. Bestand', visible: true, order: 2 }
          ]
        }
      ],
      queries: [],
      forms: []
    }
};
