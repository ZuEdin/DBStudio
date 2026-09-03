import { CustomPage } from '../../../types';

export function getCoffeeFundPages(t: any): CustomPage[] {
  return [
    {
      id: 'page_coffee_counter',
      name: t.name ? `${t.name} - Guthaben-Terminal` : 'Kaffeekassen-Terminal & Saldo',
      description: 'Guthabenübersicht der Mitglieder, getrunkene Kaffees und Kassenbestand',
      layout: {
        id: 'coffee_root',
        type: 'container',
        props: { className: 'p-6 max-w-7xl mx-auto space-y-6' },
        children: [
          {
            id: 'coffee_kpis',
            type: 'grid_layout',
            props: { columns: 3, gap: 4 },
            children: [
              {
                id: 'kpi_cash_balance',
                type: 'kpi_widget',
                props: { label: 'Aktueller Kassenstand', value: '142,50', unit: '€', accentColor: 'emerald', icon: 'DollarSign' }
              },
              {
                id: 'kpi_beans_stock',
                type: 'kpi_widget',
                props: { label: 'Bohnenvorrat', value: '4.5', unit: 'kg', accentColor: 'amber', icon: 'Coffee' }
              },
              {
                id: 'kpi_coffees_month',
                type: 'kpi_widget',
                props: { label: 'Kaffees getrunken (Monat)', value: '385', unit: 'Tassen', accentColor: 'rose', icon: 'Smile' }
              }
            ]
          },
          {
            id: 'card_members',
            type: 'card',
            props: { title: 'Kaffeekasse Mitglieder & Saldo', className: 'p-4 bg-white border border-slate-200 rounded-xl shadow-xs' },
            children: [
              {
                id: 'tbl_members_view',
                type: 'table_view',
                props: { tableId: 't_users', limit: 8, showActions: true }
              }
            ]
          }
        ]
      }
    }
  ];
}

export function getDeviceRentalPages(t: any): CustomPage[] {
  return [
    {
      id: 'page_rental_station',
      name: t.name ? `${t.name} - Verleih-Station` : 'Geräteverleih & Ausleihstation',
      description: 'Verfügbare Geräte, aktive Ausleihen und fällige Rückgabetermine',
      layout: {
        id: 'rental_root',
        type: 'container',
        props: { className: 'p-6 max-w-7xl mx-auto space-y-6' },
        children: [
          {
            id: 'rental_kpis',
            type: 'grid_layout',
            props: { columns: 3, gap: 4 },
            children: [
              {
                id: 'kpi_devices_avail',
                type: 'kpi_widget',
                props: { label: 'Verfügbare Geräte', value: '28', unit: 'Geräte', accentColor: 'emerald', icon: 'CheckCircle' }
              },
              {
                id: 'kpi_rented_now',
                type: 'kpi_widget',
                props: { label: 'Aktuell verliehen', value: '14', unit: 'Geräte', accentColor: 'indigo', icon: 'Laptop' }
              },
              {
                id: 'kpi_overdue_returns',
                type: 'kpi_widget',
                props: { label: 'Überfällige Rückgaben', value: '2', unit: 'Vorgänge', accentColor: 'rose', icon: 'AlertTriangle' }
              }
            ]
          },
          {
            id: 'card_devices',
            type: 'card',
            props: { title: 'Gerätebestand & Status', className: 'p-4 bg-white border border-slate-200 rounded-xl shadow-xs' },
            children: [
              {
                id: 'tbl_dev_view',
                type: 'table_view',
                props: { tableId: 't_dev', limit: 8, showActions: true }
              }
            ]
          }
        ]
      }
    }
  ];
}

export function getCourseBookingPages(t: any): CustomPage[] {
  return [
    {
      id: 'page_course_scheduler',
      name: t.name ? `${t.name} - Kurs-Portal` : 'Kurs- & Raumbelegungs-Portal',
      description: 'Seminarübersicht, Raumkapazitäten, Dozenten und Teilnehmerlisten',
      layout: {
        id: 'course_root',
        type: 'container',
        props: { className: 'p-6 max-w-7xl mx-auto space-y-6' },
        children: [
          {
            id: 'course_kpis',
            type: 'grid_layout',
            props: { columns: 3, gap: 4 },
            children: [
              {
                id: 'kpi_courses_active',
                type: 'kpi_widget',
                props: { label: 'Geplante Kurse', value: '18', unit: 'Seminare', accentColor: 'indigo', icon: 'BookOpen' }
              },
              {
                id: 'kpi_rooms_util',
                type: 'kpi_widget',
                props: { label: 'Raumauslastung', value: '76%', unit: 'Belegung', accentColor: 'emerald', icon: 'Calendar' }
              },
              {
                id: 'kpi_participants_total',
                type: 'kpi_widget',
                props: { label: 'Eingeschriebene Teilnehmer', value: '210', unit: 'Personen', accentColor: 'cyan', icon: 'Users' }
              }
            ]
          },
          {
            id: 'card_courses',
            type: 'card',
            props: { title: 'Kursangebot & Raumzuteilung', className: 'p-4 bg-white border border-slate-200 rounded-xl shadow-xs' },
            children: [
              {
                id: 'tbl_courses_view',
                type: 'table_view',
                props: { tableId: 't_courses', limit: 8, showActions: true }
              }
            ]
          }
        ]
      }
    }
  ];
}
