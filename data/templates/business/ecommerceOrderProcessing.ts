import { ProjectTemplate, DbType } from '../../../types/index';
import { getEcommercePages } from '../pages/index';

const dict: Record<string, any> = {
  de: {
    name: 'E-Commerce & Auftragsabwicklung',
    desc: 'Enterprise-Vorlage mit 1:n/n:m Relationen, Positionsberechnungen (MwSt./Summen), Bestandsabzug und Master-Detail-Order-Management.',
    badge: 'ENTERPRISE ORM',
    cat_hardware: 'Hardware & Werkzeuge',
    cat_material: 'Baumaterial & Zement',
    cat_service: 'Montage & Service',
  },
  en: {
    name: 'E-Commerce & Order Fulfillment',
    desc: 'Enterprise template with 1:n/n:m relations, line item math (VAT/totals), inventory transactions, and Master-Detail order handling.',
    badge: 'ENTERPRISE ORM',
    cat_hardware: 'Hardware & Tools',
    cat_material: 'Building Material',
    cat_service: 'Assembly & Service',
  }
};

export const getEcommerceOrderProcessing = (lang: string): ProjectTemplate => {
  const t = dict[lang] || dict['de'];

  return {
    id: 'ecommerce_orders',
    name: t.name,
    description: t.desc,
    icon: 'ShoppingCart',
    category: 'Business',
    data: {
      backendConfig: {
        language: 'dotnet',
        dbType: DbType.SQL,
        projectName: 'EnterpriseEcommerce',
        port: 5001,
        frontendPort: 3001,
        dbConnection: 'Server=localhost;Database=EnterpriseEcommerce;Trusted_Connection=True;',
        useSwagger: true,
        frontendFramework: 'react',
        authConfig: { useUserLogin: true, useWindowsAuth: false, useAdGroups: false, devBypass: true, isMobileReady: true }
      },
      tables: [
        {
          id: 'tbl_customer',
          name: 'Customer',
          fields: [
            { id: 'c_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'c_num', name: 'CustomerNumber', type: 'VARCHAR', length: 30 },
            { id: 'c_comp', name: 'CompanyName', type: 'VARCHAR', length: 120 },
            { id: 'c_contact', name: 'ContactName', type: 'VARCHAR', length: 100 },
            { id: 'c_email', name: 'Email', type: 'VARCHAR', length: 120 },
            { id: 'c_phone', name: 'Phone', type: 'VARCHAR', length: 30 },
            { id: 'c_addr', name: 'BillingAddress', type: 'TEXT' },
            { id: 'c_vat', name: 'VatId', type: 'VARCHAR', length: 50 },
            { id: 'c_limit', name: 'CreditLimit', type: 'DECIMAL', precision: 12, scale: 2 },
            { id: 'c_created', name: 'CreatedAt', type: 'DATETIME' }
          ],
          data: [
            { Id: 1, CustomerNumber: 'KD-2026-001', CompanyName: 'Alpen Bau AG', ContactName: 'Markus Weber', Email: 'weber@alpenbau.de', Phone: '+49 89 234567', BillingAddress: 'Baustraße 12, 80331 München', VatId: 'DE123456789', CreditLimit: 50000.00, CreatedAt: '2026-01-15 08:30:00' },
            { Id: 2, CustomerNumber: 'KD-2026-002', CompanyName: 'Nordic Holz & Bau', ContactName: 'Birgit Hansen', Email: 'hansen@nordic-holz.de', Phone: '+49 40 876543', BillingAddress: 'Hafenallee 88, 20457 Hamburg', VatId: 'DE987654321', CreditLimit: 35000.00, CreatedAt: '2026-02-01 09:15:00' },
            { Id: 3, CustomerNumber: 'KD-2026-003', CompanyName: 'Metropol Fassadenbau', ContactName: 'Christian König', Email: 'koenig@metropol-bau.com', Phone: '+49 30 554433', BillingAddress: 'Friedrichstr. 40, 10117 Berlin', VatId: 'DE456123789', CreditLimit: 80000.00, CreatedAt: '2026-02-20 14:00:00' }
          ]
        },
        {
          id: 'tbl_category',
          name: 'Category',
          fields: [
            { id: 'cat_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'cat_name', name: 'Name', type: 'VARCHAR', length: 80 },
            { id: 'cat_slug', name: 'Slug', type: 'VARCHAR', length: 80 },
            { id: 'cat_desc', name: 'Description', type: 'TEXT' },
            { id: 'cat_active', name: 'IsActive', type: 'BOOLEAN', defaultValue: 'true' }
          ],
          data: [
            { Id: 1, Name: t.cat_hardware, Slug: 'hardware-tools', Description: 'Profi-Bohrhämmer, Schleifer und Messtechnik', IsActive: true },
            { Id: 2, Name: t.cat_material, Slug: 'building-materials', Description: 'Mörtel, Dämmstoffe, Zement und Bindemittel', IsActive: true },
            { Id: 3, Name: t.cat_service, Slug: 'assembly-services', Description: 'Geräteprüfung nach DGUV V3 & Vor-Ort-Kalibrierung', IsActive: true }
          ]
        },
        {
          id: 'tbl_product',
          name: 'Product',
          fields: [
            { id: 'p_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'p_cat_id', name: 'CategoryId', type: 'INTEGER' },
            { id: 'p_sku', name: 'Sku', type: 'VARCHAR', length: 50 },
            { id: 'p_name', name: 'Name', type: 'VARCHAR', length: 120 },
            { id: 'p_desc', name: 'Description', type: 'TEXT' },
            { id: 'p_price', name: 'UnitPrice', type: 'DECIMAL', precision: 10, scale: 2 },
            { id: 'p_tax', name: 'TaxRate', type: 'DECIMAL', precision: 5, scale: 2, defaultValue: '19.00' },
            { id: 'p_avail', name: 'IsAvailable', type: 'BOOLEAN', defaultValue: 'true' }
          ],
          data: [
            { Id: 1, CategoryId: 1, Sku: 'PRO-HAM-01', Name: 'Schlagbohrhammer SDS-Max 1500W', Description: 'Robuster Abbruchhammer mit Anti-Vibrations-System', UnitPrice: 649.00, TaxRate: 19.00, IsAvailable: true },
            { Id: 2, CategoryId: 1, Sku: 'LAS-DIST-02', Name: 'Präzisions-Laser-Distanzmesser 80m', Description: 'Bluetooth-Übertragung & Schutzklasse IP65', UnitPrice: 189.50, TaxRate: 19.00, IsAvailable: true },
            { Id: 3, CategoryId: 2, Sku: 'CEM-SACK-25', Name: 'Schnellzement Express 25kg', Description: 'Hochfester Schnellabbinde-Zement für Fundamente', UnitPrice: 18.90, TaxRate: 19.00, IsAvailable: true },
            { Id: 4, CategoryId: 3, Sku: 'SRV-DGUV-01', Name: 'DGUV V3 Jahresinspektion Elektrowerkzeuge', Description: 'Prüfplakette und digitales Messprotokoll je Gerät', UnitPrice: 35.00, TaxRate: 19.00, IsAvailable: true }
          ]
        },
        {
          id: 'tbl_inventory',
          name: 'Inventory',
          fields: [
            { id: 'inv_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'inv_prod_id', name: 'ProductId', type: 'INTEGER' },
            { id: 'inv_stock', name: 'StockQuantity', type: 'INTEGER', defaultValue: '0' },
            { id: 'inv_res', name: 'ReservedQuantity', type: 'INTEGER', defaultValue: '0' },
            { id: 'inv_reorder', name: 'ReorderLevel', type: 'INTEGER', defaultValue: '5' },
            { id: 'inv_loc', name: 'WarehouseLocation', type: 'VARCHAR', length: 50 },
            { id: 'inv_restocked', name: 'LastRestockedAt', type: 'DATETIME' }
          ],
          data: [
            { Id: 1, ProductId: 1, StockQuantity: 42, ReservedQuantity: 3, ReorderLevel: 10, WarehouseLocation: 'Regal-A-04', LastRestockedAt: '2026-02-18 10:00:00' },
            { Id: 2, ProductId: 2, StockQuantity: 85, ReservedQuantity: 5, ReorderLevel: 15, WarehouseLocation: 'Regal-B-12', LastRestockedAt: '2026-02-25 15:30:00' },
            { Id: 3, ProductId: 3, StockQuantity: 320, ReservedQuantity: 40, ReorderLevel: 50, WarehouseLocation: 'Palettenzone-C', LastRestockedAt: '2026-03-01 07:00:00' },
            { Id: 4, ProductId: 4, StockQuantity: 999, ReservedQuantity: 0, ReorderLevel: 0, WarehouseLocation: 'Dienstleistung-Virtuell', LastRestockedAt: '2026-01-01 00:00:00' }
          ]
        },
        {
          id: 'tbl_order',
          name: 'Order',
          fields: [
            { id: 'o_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'o_num', name: 'OrderNumber', type: 'VARCHAR', length: 40 },
            { id: 'o_cust_id', name: 'CustomerId', type: 'INTEGER' },
            { id: 'o_date', name: 'OrderDate', type: 'DATETIME' },
            { id: 'o_status', name: 'OrderStatus', type: 'VARCHAR', length: 30, defaultValue: 'Pending', enumValues: ['Draft', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] },
            { id: 'o_subtotal', name: 'Subtotal', type: 'DECIMAL', precision: 12, scale: 2 },
            { id: 'o_tax', name: 'TaxAmount', type: 'DECIMAL', precision: 12, scale: 2 },
            { id: 'o_shipping', name: 'ShippingCost', type: 'DECIMAL', precision: 8, scale: 2, defaultValue: '14.90' },
            { id: 'o_total', name: 'TotalAmount', type: 'DECIMAL', precision: 12, scale: 2 },
            { id: 'o_pay_status', name: 'PaymentStatus', type: 'VARCHAR', length: 30, defaultValue: 'Unpaid', enumValues: ['Unpaid', 'Authorized', 'Paid', 'Refunded'] }
          ],
          data: [
            { Id: 1001, OrderNumber: 'AUF-2026-0089', CustomerId: 1, OrderDate: '2026-02-26 11:20:00', OrderStatus: 'Processing', Subtotal: 1676.50, TaxAmount: 318.54, ShippingCost: 14.90, TotalAmount: 2009.94, PaymentStatus: 'Paid' },
            { Id: 1002, OrderNumber: 'AUF-2026-0090', CustomerId: 2, OrderDate: '2026-02-28 16:45:00', OrderStatus: 'Shipped', Subtotal: 756.00, TaxAmount: 143.64, ShippingCost: 29.00, TotalAmount: 928.64, PaymentStatus: 'Paid' },
            { Id: 1003, OrderNumber: 'AUF-2026-0091', CustomerId: 3, OrderDate: '2026-03-02 09:10:00', OrderStatus: 'Pending', Subtotal: 1298.00, TaxAmount: 246.62, ShippingCost: 14.90, TotalAmount: 1559.52, PaymentStatus: 'Authorized' }
          ]
        },
        {
          id: 'tbl_order_item',
          name: 'OrderItem',
          fields: [
            { id: 'oi_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'oi_order_id', name: 'OrderId', type: 'INTEGER' },
            { id: 'oi_prod_id', name: 'ProductId', type: 'INTEGER' },
            { id: 'oi_qty', name: 'Quantity', type: 'INTEGER', defaultValue: '1' },
            { id: 'oi_unit_price', name: 'UnitPrice', type: 'DECIMAL', precision: 10, scale: 2 },
            { id: 'oi_tax_rate', name: 'TaxRate', type: 'DECIMAL', precision: 5, scale: 2, defaultValue: '19.00' },
            { id: 'oi_line_total', name: 'LineTotal', type: 'DECIMAL', precision: 12, scale: 2 }
          ],
          data: [
            { Id: 1, OrderId: 1001, ProductId: 1, Quantity: 2, UnitPrice: 649.00, TaxRate: 19.00, LineTotal: 1298.00 },
            { Id: 2, OrderId: 1001, ProductId: 2, Quantity: 2, UnitPrice: 189.50, TaxRate: 19.00, LineTotal: 379.00 },
            { Id: 3, OrderId: 1002, ProductId: 3, Quantity: 40, UnitPrice: 18.90, TaxRate: 19.00, LineTotal: 756.00 },
            { Id: 4, OrderId: 1003, ProductId: 1, Quantity: 2, UnitPrice: 649.00, TaxRate: 19.00, LineTotal: 1298.00 }
          ]
        }
      ],
      relationships: [
        { id: 'rel_cat_prod', fromTableId: 'tbl_category', fromFieldId: 'cat_id', toTableId: 'tbl_product', toFieldId: 'p_cat_id', type: '1:n', referentialIntegrity: true },
        { id: 'rel_prod_inv', fromTableId: 'tbl_product', fromFieldId: 'p_id', toTableId: 'tbl_inventory', toFieldId: 'inv_prod_id', type: '1:1', referentialIntegrity: true, onDelete: 'CASCADE' },
        { id: 'rel_cust_ord', fromTableId: 'tbl_customer', fromFieldId: 'c_id', toTableId: 'tbl_order', toFieldId: 'o_cust_id', type: '1:n', referentialIntegrity: true },
        { id: 'rel_ord_items', fromTableId: 'tbl_order', fromFieldId: 'o_id', toTableId: 'tbl_order_item', toFieldId: 'oi_order_id', type: '1:n', referentialIntegrity: true, onDelete: 'CASCADE' },
        { id: 'rel_prod_items', fromTableId: 'tbl_product', fromFieldId: 'p_id', toTableId: 'tbl_order_item', toFieldId: 'oi_prod_id', type: '1:n', referentialIntegrity: true }
      ],
      queries: [
        {
          id: 'q_customer_turnover',
          type: 'SELECT',
          name: 'Kundenumsatz & Auftragsvolumen',
          nodes: [
            { id: 'qn_cust', tableId: 'tbl_customer', x: 50, y: 50 },
            { id: 'qn_ord', tableId: 'tbl_order', x: 300, y: 50 }
          ],
          columns: [
            { id: 'qc_cnum', tableId: 'tbl_customer', fieldId: 'c_num', tableName: 'Customer', fieldName: 'CustomerNumber', sort: 'ASC', show: true, criteria: [''], aggregate: 'GROUP_BY' },
            { id: 'qc_comp', tableId: 'tbl_customer', fieldId: 'c_comp', tableName: 'Customer', fieldName: 'CompanyName', sort: '', show: true, criteria: [''], aggregate: 'GROUP_BY' },
            { id: 'qc_total', tableId: 'tbl_order', fieldId: 'o_total', tableName: 'Order', fieldName: 'TotalAmount', sort: 'DESC', show: true, criteria: [''], aggregate: 'SUM', alias: 'TotalRevenue' }
          ]
        },
        {
          id: 'q_inventory_reorder_alerts',
          type: 'SELECT',
          name: 'Kritische Lagerbestände (Nachbestell-Trigger)',
          nodes: [
            { id: 'qn_p', tableId: 'tbl_product', x: 50, y: 50 },
            { id: 'qn_i', tableId: 'tbl_inventory', x: 280, y: 50 }
          ],
          columns: [
            { id: 'qc_sku', tableId: 'tbl_product', fieldId: 'p_sku', tableName: 'Product', fieldName: 'Sku', sort: 'ASC', show: true, criteria: [''] },
            { id: 'qc_pname', tableId: 'tbl_product', fieldId: 'p_name', tableName: 'Product', fieldName: 'Name', sort: '', show: true, criteria: [''] },
            { id: 'qc_stock', tableId: 'tbl_inventory', fieldId: 'inv_stock', tableName: 'Inventory', fieldName: 'StockQuantity', sort: 'ASC', show: true, criteria: ['<= 15'] },
            { id: 'qc_loc', tableId: 'tbl_inventory', fieldId: 'inv_loc', tableName: 'Inventory', fieldName: 'WarehouseLocation', sort: '', show: true, criteria: [''] }
          ]
        }
      ],
      forms: [
        {
          id: 'form_order_entry',
          name: 'Master-Detail Auftragserfassung',
          sourceType: 'table',
          sourceId: 'tbl_order',
          fields: [],
          layout: {
            id: 'root_order',
            type: 'container',
            className: 'p-4 space-y-4 bg-slate-900/60 rounded-xl border border-slate-700',
            children: [
              { id: 'lbl_head', type: 'label', label: 'Auftragsbearbeitung mit Positionserfassung', className: 'text-base font-bold text-emerald-400' },
              {
                id: 'cnt_order_top',
                type: 'container',
                className: 'grid grid-cols-3 gap-3',
                children: [
                  { id: 'fld_ord_num', type: 'field', fieldId: 'o_num', label: 'Auftragsnummer', widgetType: 'text' },
                  { id: 'fld_ord_cust', type: 'field', fieldId: 'o_cust_id', label: 'Kunde', widgetType: 'select', lookup: { tableId: 'tbl_customer', valueFieldId: 'c_id', labelFields: ['c_comp', 'c_num'], allowQuickCreate: true } },
                  { id: 'fld_ord_date', type: 'field', fieldId: 'o_date', label: 'Bestelldatum', widgetType: 'date' }
                ]
              },
              {
                id: 'subform_items',
                type: 'subform',
                label: 'Auftragspositionen (Dynamische Zeilen mit Live-Summen)',
                subform: {
                  formId: 'form_order_item_sub',
                  masterLinkFieldId: 'o_id',
                  childLinkFieldId: 'oi_order_id',
                  canAdd: true,
                  canEdit: true,
                  canDelete: true
                }
              },
              {
                id: 'cnt_order_totals',
                type: 'container',
                className: 'grid grid-cols-4 gap-3 pt-3 border-t border-slate-800',
                children: [
                  { id: 'fld_ord_status', type: 'field', fieldId: 'o_status', label: 'Auftragsstatus', widgetType: 'select' },
                  { id: 'fld_subtotal', type: 'field', fieldId: 'o_subtotal', label: 'Zwischensumme (€)', widgetType: 'number' },
                  { id: 'fld_tax', type: 'field', fieldId: 'o_tax', label: 'MwSt. 19% (€)', widgetType: 'number' },
                  { id: 'fld_total', type: 'field', fieldId: 'o_total', label: 'Gesamtbetrag Brutto (€)', widgetType: 'number' }
                ]
              }
            ]
          }
        },
        {
          id: 'form_order_item_sub',
          name: 'OrderItem Subform',
          sourceType: 'table',
          sourceId: 'tbl_order_item',
          fields: [],
          layout: {
            id: 'sub_root',
            type: 'container',
            className: 'grid grid-cols-4 gap-2 p-2 bg-slate-800/80 rounded-lg',
            children: [
              { id: 'fld_sub_prod', type: 'field', fieldId: 'oi_prod_id', label: 'Artikel', widgetType: 'select', lookup: { tableId: 'tbl_product', valueFieldId: 'p_id', labelFields: ['p_sku', 'p_name'] } },
              { id: 'fld_sub_qty', type: 'field', fieldId: 'oi_qty', label: 'Menge', widgetType: 'number' },
              { id: 'fld_sub_price', type: 'field', fieldId: 'oi_unit_price', label: 'Hist. Einzelpreis (€)', widgetType: 'number' },
              { id: 'fld_sub_linetot', type: 'field', fieldId: 'oi_line_total', label: 'Zeilensumme (€)', widgetType: 'number' }
            ]
          }
        }
      ],
      reports: [
        {
          id: 'rep_order_logistics',
          name: 'Kommissionier- & Versandliste',
          sourceType: 'table',
          sourceId: 'tbl_order',
          groupingFieldId: 'o_status',
          summaries: [{ fieldId: 'o_id', fieldName: 'Id', calculation: 'COUNT' }, { fieldId: 'o_total', fieldName: 'TotalAmount', calculation: 'SUM' }],
          columns: [
            { fieldId: 'o_num', label: 'Auftragsnummer', visible: true, order: 0 },
            { fieldId: 'o_cust_id', label: 'Kunden-ID', visible: true, order: 1 },
            { fieldId: 'o_date', label: 'Datum', visible: true, order: 2 },
            { fieldId: 'o_status', label: 'Status', visible: true, order: 3 },
            { fieldId: 'o_total', label: 'Gesamtbetrag (€)', visible: true, order: 4 }
          ]
        }
      ],
      pages: getEcommercePages(t),
      layout: [
        { id: 'tbl_customer', tableId: 'tbl_customer', x: 40, y: 60 },
        { id: 'tbl_order', tableId: 'tbl_order', x: 380, y: 60 },
        { id: 'tbl_order_item', tableId: 'tbl_order_item', x: 720, y: 60 },
        { id: 'tbl_product', tableId: 'tbl_product', x: 720, y: 380 },
        { id: 'tbl_category', tableId: 'tbl_category', x: 380, y: 380 },
        { id: 'tbl_inventory', tableId: 'tbl_inventory', x: 1040, y: 380 }
      ],
      tableGroups: [
        { id: 'grp_ecom', name: 'E-Commerce & Orders Domain', color: 'emerald' }
      ]
    }
  };
};
