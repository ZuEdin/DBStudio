import { CustomPage } from '../../../types';

export function getCrmPages(t: any): CustomPage[] {
  return [
    {
      id: 'page_crm_cockpit',
      name: t.name ? `${t.name} - Cockpit` : 'CRM 360° Cockpit',
      description: 'Zentrales Vertriebs- und Kunden-Dashboard mit Umsatz-KPIs und Schnellzugriff',
      layout: {
        id: 'crm_root',
        type: 'container',
        props: { className: 'p-6 max-w-7xl mx-auto space-y-6' },
        children: [
          {
            id: 'crm_alert',
            type: 'alert_box',
            props: {
              alertType: 'info',
              title: 'Vertriebs-Status aktiv',
              message: 'Pipeline-Synchronisation und Kundenabschlüsse sind auf aktuellem Stand.'
            }
          },
          {
            id: 'crm_kpis',
            type: 'grid_layout',
            props: { columns: 3, gap: 4 },
            children: [
              {
                id: 'kpi_cust_active',
                type: 'kpi_widget',
                props: {
                  label: 'Aktive Kunden',
                  value: '48',
                  unit: 'Kunden',
                  trend: '+12%',
                  trendDirection: 'up',
                  accentColor: 'indigo',
                  icon: 'Users'
                }
              },
              {
                id: 'kpi_revenue',
                type: 'kpi_widget',
                props: {
                  label: 'Monatsumsatz',
                  value: '94.500',
                  unit: '€',
                  trend: '+8.2%',
                  trendDirection: 'up',
                  accentColor: 'emerald',
                  icon: 'DollarSign'
                }
              },
              {
                id: 'kpi_orders_open',
                type: 'kpi_widget',
                props: {
                  label: 'Offene Aufträge',
                  value: '14',
                  unit: 'Aufträge',
                  trend: '2 dringend',
                  trendDirection: 'neutral',
                  accentColor: 'amber',
                  icon: 'ShoppingCart'
                }
              }
            ]
          },
          {
            id: 'crm_grid_content',
            type: 'grid_layout',
            props: { columns: 2, gap: 6 },
            children: [
              {
                id: 'card_cust_list',
                type: 'card',
                props: { title: 'Kundenstamm & Accounts', className: 'p-4 bg-white border border-slate-200 rounded-xl shadow-xs' },
                children: [
                  {
                    id: 'tbl_cust_view',
                    type: 'table_view',
                    props: { tableId: 't_cust', limit: 8, showActions: true }
                  }
                ]
              },
              {
                id: 'card_orders_recent',
                type: 'card',
                props: { title: 'Auftragseingänge & Positionen', className: 'p-4 bg-white border border-slate-200 rounded-xl shadow-xs' },
                children: [
                  {
                    id: 'tbl_ord_view',
                    type: 'table_view',
                    props: { tableId: 't_ord', limit: 8, showActions: true }
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  ];
}

export function getCmsPages(t: any): CustomPage[] {
  return [
    {
      id: 'page_cms_editorial',
      name: t.name ? `${t.name} - Redaktion` : 'CMS Editorial & Redaktions-Hub',
      description: 'Zentrale Redaktionsübersicht mit Artikel-Status, Kategorien und Veröffentlichungen',
      layout: {
        id: 'cms_root',
        type: 'container',
        props: { className: 'p-6 max-w-7xl mx-auto space-y-6' },
        children: [
          {
            id: 'cms_kpis',
            type: 'grid_layout',
            props: { columns: 3, gap: 4 },
            children: [
              {
                id: 'kpi_posts_pub',
                type: 'kpi_widget',
                props: {
                  label: 'Veröffentlichte Artikel',
                  value: '34',
                  unit: 'Beiträge',
                  trend: '+4 diese Woche',
                  accentColor: 'purple',
                  icon: 'FileText'
                }
              },
              {
                id: 'kpi_drafts',
                type: 'kpi_widget',
                props: {
                  label: 'Entwürfe in Bearbeitung',
                  value: '8',
                  unit: 'Entwürfe',
                  accentColor: 'amber',
                  icon: 'Edit3'
                }
              },
              {
                id: 'kpi_views',
                type: 'kpi_widget',
                props: {
                  label: 'Monatliche Leser',
                  value: '142.800',
                  unit: 'Visits',
                  trend: '+18.5%',
                  accentColor: 'emerald',
                  icon: 'TrendingUp'
                }
              }
            ]
          },
          {
            id: 'card_posts',
            type: 'card',
            props: { title: 'Aktuelle Beiträge & Artikel', className: 'p-4 bg-white border border-slate-200 rounded-xl shadow-xs' },
            children: [
              {
                id: 'tbl_posts_view',
                type: 'table_view',
                props: { tableId: 'tbl_posts', limit: 10, showActions: true }
              }
            ]
          }
        ]
      }
    }
  ];
}

export function getInventoryPages(t: any): CustomPage[] {
  return [
    {
      id: 'page_inventory_hub',
      name: t.name ? `${t.name} - Lager-Cockpit` : 'Lager-Cockpit & Disposition',
      description: 'Bestandsüberwachung, Mindestmengenwarnungen und Lagerbewegungen',
      layout: {
        id: 'inv_root',
        type: 'container',
        props: { className: 'p-6 max-w-7xl mx-auto space-y-6' },
        children: [
          {
            id: 'inv_kpis',
            type: 'grid_layout',
            props: { columns: 3, gap: 4 },
            children: [
              {
                id: 'kpi_sku_count',
                type: 'kpi_widget',
                props: {
                  label: 'Geführte Artikel (SKUs)',
                  value: '1.240',
                  unit: 'Artikel',
                  accentColor: 'amber',
                  icon: 'Package'
                }
              },
              {
                id: 'kpi_critical_stock',
                type: 'kpi_widget',
                props: {
                  label: 'Kritischer Mindestbestand',
                  value: '5',
                  unit: 'Artikel',
                  trend: 'Nachbestellung nötig',
                  accentColor: 'rose',
                  icon: 'AlertTriangle'
                }
              },
              {
                id: 'kpi_total_value',
                type: 'kpi_widget',
                props: {
                  label: 'Gesamtlagerwert',
                  value: '286.400',
                  unit: '€',
                  trend: 'Stabiler Umschlag',
                  accentColor: 'emerald',
                  icon: 'DollarSign'
                }
              }
            ]
          },
          {
            id: 'card_stock',
            type: 'card',
            props: { title: 'Lagerbestand & Einlagerungsorte', className: 'p-4 bg-white border border-slate-200 rounded-xl shadow-xs' },
            children: [
              {
                id: 'tbl_stock_view',
                type: 'table_view',
                props: { tableId: 'tbl_stock', limit: 10, showActions: true }
              }
            ]
          }
        ]
      }
    }
  ];
}

export function getEcommercePages(t: any): CustomPage[] {
  return [
    {
      id: 'page_ecom_fulfillment',
      name: t.name ? `${t.name} - Leitstand` : 'E-Commerce Fulfillment Center',
      description: 'Bestellabwicklung, Versandstatus und Kundenumsätze in Echtzeit',
      layout: {
        id: 'ecom_root',
        type: 'container',
        props: { className: 'p-6 max-w-7xl mx-auto space-y-6' },
        children: [
          {
            id: 'ecom_kpis',
            type: 'grid_layout',
            props: { columns: 4, gap: 4 },
            children: [
              {
                id: 'kpi_ord_today',
                type: 'kpi_widget',
                props: { label: 'Bestellungen heute', value: '42', unit: 'Aufträge', accentColor: 'emerald', icon: 'ShoppingCart' }
              },
              {
                id: 'kpi_pending_ship',
                type: 'kpi_widget',
                props: { label: 'Versandbereit', value: '18', unit: 'Pakete', accentColor: 'amber', icon: 'Truck' }
              },
              {
                id: 'kpi_order_vol',
                type: 'kpi_widget',
                props: { label: 'Tagesumsatz', value: '12.450', unit: '€', accentColor: 'indigo', icon: 'DollarSign' }
              },
              {
                id: 'kpi_return_rate',
                type: 'kpi_widget',
                props: { label: 'Retourenquote', value: '2.1%', trend: '-0.4%', accentColor: 'cyan', icon: 'RotateCcw' }
              }
            ]
          },
          {
            id: 'card_orders',
            type: 'card',
            props: { title: 'Aktuelle Bestellungen & Fulfillment', className: 'p-4 bg-white border border-slate-200 rounded-xl shadow-xs' },
            children: [
              {
                id: 'tbl_orders_view',
                type: 'table_view',
                props: { tableId: 'tbl_orders', limit: 8, showActions: true }
              }
            ]
          }
        ]
      }
    }
  ];
}

export function getHrPages(t: any): CustomPage[] {
  return [
    {
      id: 'page_hr_directory',
      name: t.name ? `${t.name} - Portal` : 'HR & Personal-Portal',
      description: 'Mitarbeiterverzeichnis, Abteilungsübersicht und Urlaubsanträge',
      layout: {
        id: 'hr_root',
        type: 'container',
        props: { className: 'p-6 max-w-7xl mx-auto space-y-6' },
        children: [
          {
            id: 'hr_kpis',
            type: 'grid_layout',
            props: { columns: 3, gap: 4 },
            children: [
              {
                id: 'kpi_headcount',
                type: 'kpi_widget',
                props: { label: 'Mitarbeiter gesamt', value: '64', unit: 'Personen', accentColor: 'indigo', icon: 'Users' }
              },
              {
                id: 'kpi_on_leave',
                type: 'kpi_widget',
                props: { label: 'In Abwesenheit / Urlaub', value: '5', unit: 'Kollegen', accentColor: 'amber', icon: 'Calendar' }
              },
              {
                id: 'kpi_open_vacancies',
                type: 'kpi_widget',
                props: { label: 'Offene Stellen', value: '3', unit: 'Positionen', accentColor: 'emerald', icon: 'Briefcase' }
              }
            ]
          },
          {
            id: 'card_employees',
            type: 'card',
            props: { title: 'Mitarbeiterstamm & Abteilungen', className: 'p-4 bg-white border border-slate-200 rounded-xl shadow-xs' },
            children: [
              {
                id: 'tbl_emp_view',
                type: 'table_view',
                props: { tableId: 'tbl_employees', limit: 8, showActions: true }
              }
            ]
          }
        ]
      }
    }
  ];
}

export function getFakturierungPages(t: any): CustomPage[] {
  return [
    {
      id: 'page_invoice_dashboard',
      name: t.name ? `${t.name} - Finanz-Cockpit` : 'Rechnungswesen & Finanz-Cockpit',
      description: 'Zentrale Übersicht der offenen Posten, Rechnungen und Zahlungsströme',
      layout: {
        id: 'inv_root',
        type: 'container',
        props: { className: 'p-6 max-w-7xl mx-auto space-y-6' },
        children: [
          {
            id: 'inv_kpis',
            type: 'grid_layout',
            props: { columns: 4, gap: 4 },
            children: [
              {
                id: 'kpi_faktura_open',
                type: 'kpi_widget',
                props: { label: 'Offene Rechnungen', value: '23.400', unit: '€', accentColor: 'amber', icon: 'Clock' }
              },
              {
                id: 'kpi_faktura_paid',
                type: 'kpi_widget',
                props: { label: 'Eingegangen (Monat)', value: '68.900', unit: '€', accentColor: 'emerald', icon: 'CheckCircle' }
              },
              {
                id: 'kpi_faktura_overdue',
                type: 'kpi_widget',
                props: { label: 'Fällig / Mahnwesen', value: '4.200', unit: '€', accentColor: 'rose', icon: 'AlertCircle' }
              },
              {
                id: 'kpi_faktura_count',
                type: 'kpi_widget',
                props: { label: 'Gestellte Rechnungen', value: '87', unit: 'Belege', accentColor: 'indigo', icon: 'FileText' }
              }
            ]
          },
          {
            id: 'card_invoices',
            type: 'card',
            props: { title: 'Ausgangsrechnungen & Zahlungsstatus', className: 'p-4 bg-white border border-slate-200 rounded-xl shadow-xs' },
            children: [
              {
                id: 'tbl_inv_view',
                type: 'table_view',
                props: { tableId: 'tbl_rechnungen', limit: 8, showActions: true }
              }
            ]
          }
        ]
      }
    }
  ];
}
