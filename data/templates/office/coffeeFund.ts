
import { ProjectTemplate, DbType } from '../../../types/index';

const dict: Record<string, any> = {
    de: {
        name: 'Kaffeekasse & Abrechnung',
        desc: 'Verwaltung von Getränkekonsum im Büro. Mit Benutzerkonten, Produktliste, Buchungsjournal und automatischer Abrechnung.',
        t_users: 'Kollegen', f_name: 'Name', f_dept: 'Abteilung', f_balance: 'Kontostand',
        t_prod: 'Produkte', f_pname: 'Produkt', f_price: 'Preis', f_cat: 'Kategorie',
        t_journal: 'Buchungen', f_amount: 'Betrag', f_date: 'Zeitstempel',
        q_neg: 'Offene Rechnungen (Minus)', q_top: 'Top Konsumenten',
        r_bill: 'Monatsabrechnung',
        f_book: 'Kaffee buchen', f_deposit: 'Guthaben aufladen',
        cat_hot: 'Heissgetränk', cat_cold: 'Kaltgetränk', cat_snack: 'Snack'
    },
    en: {
        name: 'Coffee Fund & Billing',
        desc: 'Office beverage management. User accounts, product list, booking journal and billing reports.',
        t_users: 'Colleagues', f_name: 'Name', f_dept: 'Department', f_balance: 'Balance',
        t_prod: 'Products', f_pname: 'Product', f_price: 'Price', f_cat: 'Category',
        t_journal: 'Journal', f_amount: 'Amount', f_date: 'Timestamp',
        q_neg: 'Negative Balances', q_top: 'Top Consumers',
        r_bill: 'Monthly Bill',
        f_book: 'Book Coffee', f_deposit: 'Deposit Funds',
        cat_hot: 'Hot Drink', cat_cold: 'Cold Drink', cat_snack: 'Snack'
    }
};

export const getCoffeeFund = (lang: string): ProjectTemplate => {
    const t = dict[lang] || dict['de'];

    return {
        id: 'coffee_fund',
        name: t.name,
        description: t.desc,
        icon: 'Coffee', // Lucide icon name (mapped dynamically if available, else fallback)
        category: 'Office',
        data: {
          backendConfig: {
            language: 'nodejs',
            dbType: DbType.SQLite,
            projectName: 'CoffeeFund',
            port: 3000,
            dbConnection: 'Data Source=coffee.db',
            useSwagger: false,
            frontendFramework: 'react',
            authConfig: { useUserLogin: false, useWindowsAuth: false, useAdGroups: false, devBypass: true, isMobileReady: false }
          },
          tables: [
            {
              id: 't_users', name: t.t_users,
              fields: [
                { id: 'u1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'u2', name: t.f_name, type: 'VARCHAR', length: 100 },
                { id: 'u3', name: 'Email', type: 'VARCHAR', length: 100 },
                { id: 'u4', name: t.f_dept, type: 'VARCHAR', length: 50 }
              ],
              data: [
                { Id: 1, [t.f_name]: 'Anna Admin', Email: 'anna@firma.de', [t.f_dept]: 'IT' },
                { Id: 2, [t.f_name]: 'Bernd Buchhalter', Email: 'bernd@firma.de', [t.f_dept]: 'Finance' },
                { Id: 3, [t.f_name]: 'Clara Coder', Email: 'clara@firma.de', [t.f_dept]: 'Dev' }
              ]
            },
            {
              id: 't_prod', name: t.t_prod,
              fields: [
                { id: 'p1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'p2', name: t.f_pname, type: 'VARCHAR', length: 50 },
                { id: 'p3', name: t.f_price, type: 'DECIMAL', precision: 10, scale: 2 },
                { id: 'p4', name: t.f_cat, type: 'VARCHAR', length: 50 }
              ],
              data: [
                { Id: 1, [t.f_pname]: 'Kaffee (Schwarz)', [t.f_price]: 0.50, [t.f_cat]: t.cat_hot },
                { Id: 2, [t.f_pname]: 'Cappuccino', [t.f_price]: 0.80, [t.f_cat]: t.cat_hot },
                { Id: 3, [t.f_pname]: 'Espresso', [t.f_price]: 0.40, [t.f_cat]: t.cat_hot },
                { Id: 4, [t.f_pname]: 'Cola', [t.f_price]: 1.50, [t.f_cat]: t.cat_cold },
                { Id: 5, [t.f_pname]: 'Schoko-Riegel', [t.f_price]: 1.00, [t.f_cat]: t.cat_snack }
              ]
            },
            {
              id: 't_journal', name: t.t_journal,
              fields: [
                { id: 'j1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'j2', name: 'UserId', type: 'INTEGER' },
                { id: 'j3', name: 'ProductId', type: 'INTEGER', allowNull: true }, // Nullable for cash deposits
                { id: 'j4', name: t.f_amount, type: 'DECIMAL', precision: 10, scale: 2 }, // Positive = Deposit, Negative = Consumption
                { id: 'j5', name: t.f_date, type: 'DATETIME', defaultValue: 'NOW' }
              ],
              data: [
                { Id: 1, UserId: 1, ProductId: null, [t.f_amount]: 20.00, [t.f_date]: '2023-11-01 09:00:00' }, // Deposit
                { Id: 2, UserId: 1, ProductId: 2, [t.f_amount]: -0.80, [t.f_date]: '2023-11-01 10:30:00' }, // Buy
                { Id: 3, UserId: 2, ProductId: 1, [t.f_amount]: -0.50, [t.f_date]: '2023-11-01 11:00:00' },
                { Id: 4, UserId: 3, ProductId: 4, [t.f_amount]: -1.50, [t.f_date]: '2023-11-01 14:00:00' }
              ]
            }
          ],
          relationships: [
            { id: 'r1', fromTableId: 't_users', fromFieldId: 'u1', toTableId: 't_journal', toFieldId: 'j2', type: '1:n', referentialIntegrity: true },
            { id: 'r2', fromTableId: 't_prod', fromFieldId: 'p1', toTableId: 't_journal', toFieldId: 'j3', type: '1:n', referentialIntegrity: true }
          ],
          queries: [
            {
                // Calculating Balance: Sum of Journal Entries grouped by User
                id: 'q_balance', type: 'SELECT', name: t.q_neg,
                nodes: [
                    { id: 'n1', tableId: 't_users', x: 50, y: 50 },
                    { id: 'n2', tableId: 't_journal', x: 300, y: 50 }
                ],
                columns: [
                    { id: 'c1', tableId: 't_users', fieldId: 'u2', tableName: t.t_users, fieldName: t.f_name, show: true, criteria: [''], aggregate: 'GROUP_BY' },
                    { id: 'c2', tableId: 't_journal', fieldId: 'j4', tableName: t.t_journal, fieldName: t.f_amount, show: true, criteria: ['< 0'], aggregate: 'SUM', alias: 'Saldo' }
                ]
            }
          ],
          forms: [
            {
              id: 'f_book', name: t.f_book, sourceType: 'table', sourceId: 't_journal',
              fields: [],
              layout: {
                id: 'root', type: 'container', className: 'p-6 space-y-6 bg-slate-50',
                children: [
                  { id: 'l1', type: 'label', label: '☕ ' + t.f_book, className: 'text-2xl font-bold text-slate-800' },
                  { 
                      id: 'c1', type: 'container', className: 'bg-white p-4 rounded shadow-sm border border-slate-200 space-y-4',
                      children: [
                          { id: 'f_user', type: 'field', fieldId: 'j2', label: 'Wer bist du?', widgetType: 'select', lookup: { tableId: 't_users', valueFieldId: 'u1', labelFields: ['u2'] } },
                          { id: 'f_prod', type: 'field', fieldId: 'j3', label: 'Was möchtest du?', widgetType: 'select', lookup: { tableId: 't_prod', valueFieldId: 'p1', labelFields: ['p2', 'p3'], displayFormat: [{fieldId:'p2'}, {prefix:' (', fieldId:'p3', suffix:' €)'}] } },
                          { id: 'f_date', type: 'field', fieldId: 'j5', label: 'Zeitpunkt', widgetType: 'date' }
                      ]
                  },
                  // Hidden Logic Hint: Real app would need logic to auto-set Amount based on Product Price * -1
                  { id: 'l2', type: 'label', label: 'Hinweis: Der Preis wird automatisch vom Guthaben abgezogen (Logik im Backend).', className: 'text-xs text-slate-500' }
                ]
              }
            }
          ],
          reports: [
            {
                id: 'r_bill', name: t.r_bill, sourceType: 'table', sourceId: 't_journal',
                groupingFieldId: 'j2', // Group by User
                summaries: [{ fieldId: 'j4', fieldName: t.f_amount, calculation: 'SUM' }],
                columns: [
                    { fieldId: 'j5', label: t.f_date, visible: true, order: 0 },
                    { fieldId: 'j3', label: t.t_prod, visible: true, order: 1 },
                    { fieldId: 'j4', label: 'Betrag (€)', visible: true, order: 2, formattingRules: [{ operator: 'lt', value: '0', style: { color: 'red' } }, { operator: 'gt', value: '0', style: { color: 'green' } }] }
                ]
            }
          ],
          layout: []
        }
    };
};
