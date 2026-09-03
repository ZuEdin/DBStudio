import { CustomPage } from '../../../types';

export function getAgilePmPages(t: any): CustomPage[] {
  return [
    {
      id: 'page_agile_sprint_board',
      name: t.name ? `${t.name} - Cockpit` : 'Agile Sprint & Velocity Cockpit',
      description: 'Sprint-Übersicht, Story-Points, Burndown-Fortschritt und Backlog',
      layout: {
        id: 'agile_root',
        type: 'container',
        props: { className: 'p-6 max-w-7xl mx-auto space-y-6' },
        children: [
          {
            id: 'agile_kpis',
            type: 'grid_layout',
            props: { columns: 3, gap: 4 },
            children: [
              {
                id: 'kpi_sprint_pts',
                type: 'kpi_widget',
                props: { label: 'Sprint Velocity', value: '42', unit: 'Story Points', accentColor: 'indigo', icon: 'Zap' }
              },
              {
                id: 'kpi_tasks_done',
                type: 'kpi_widget',
                props: { label: 'Erledigte Aufgaben', value: '18 / 24', unit: 'Tasks', accentColor: 'emerald', icon: 'CheckSquare' }
              },
              {
                id: 'kpi_blockers',
                type: 'kpi_widget',
                props: { label: 'Blockaden / Impediments', value: '1', unit: 'Blocker', accentColor: 'rose', icon: 'AlertOctagon' }
              }
            ]
          },
          {
            id: 'card_stories',
            type: 'card',
            props: { title: 'Aktive User Stories & Aufgaben', className: 'p-4 bg-white border border-slate-200 rounded-xl shadow-xs' },
            children: [
              {
                id: 'tbl_stories_view',
                type: 'table_view',
                props: { tableId: 'tbl_stories', limit: 8, showActions: true }
              }
            ]
          }
        ]
      }
    }
  ];
}

export function getDbstudioSelfHostPages(t: any): CustomPage[] {
  return [
    {
      id: 'page_cluster_ops',
      name: t.name ? `${t.name} - Cluster Operations` : 'DBStudio Server & Node Leitstand',
      description: 'Zentrale Verwaltung von gehosteten Datenbankinstanzen, Knoten und Replikation',
      layout: {
        id: 'cluster_root',
        type: 'container',
        props: { className: 'p-6 max-w-7xl mx-auto space-y-6' },
        children: [
          {
            id: 'cluster_kpis',
            type: 'grid_layout',
            props: { columns: 3, gap: 4 },
            children: [
              {
                id: 'kpi_nodes_online',
                type: 'kpi_widget',
                props: { label: 'Aktive Server-Knoten', value: '4', unit: 'Nodes', accentColor: 'emerald', icon: 'Server' }
              },
              {
                id: 'kpi_active_dbs',
                type: 'kpi_widget',
                props: { label: 'Gehostete Datenbanken', value: '16', unit: 'Instanzen', accentColor: 'cyan', icon: 'Database' }
              },
              {
                id: 'kpi_cluster_load',
                type: 'kpi_widget',
                props: { label: 'Cluster CPU & Memory', value: '28%', unit: 'Auslastung', accentColor: 'indigo', icon: 'Activity' }
              }
            ]
          },
          {
            id: 'card_nodes',
            type: 'card',
            props: { title: 'Instanzen- und Knotenübersicht', className: 'p-4 bg-white border border-slate-200 rounded-xl shadow-xs' },
            children: [
              {
                id: 'tbl_instances_view',
                type: 'table_view',
                props: { tableId: 'tbl_instances', limit: 6, showActions: true }
              }
            ]
          }
        ]
      }
    }
  ];
}

export function getPmTaskBoardPages(t: any): CustomPage[] {
  return [
    {
      id: 'page_pm_command',
      name: t.name ? `${t.name} - Leitstand` : 'Projekt-Leitstand & Meilensteine',
      description: 'Projektfortschritt, Fristen, Aufgabenpriorisierung und Team-Kapazitäten',
      layout: {
        id: 'pm_root',
        type: 'container',
        props: { className: 'p-6 max-w-7xl mx-auto space-y-6' },
        children: [
          {
            id: 'pm_kpis',
            type: 'grid_layout',
            props: { columns: 4, gap: 4 },
            children: [
              {
                id: 'kpi_active_proj',
                type: 'kpi_widget',
                props: { label: 'Laufende Projekte', value: '6', unit: 'Projekte', accentColor: 'indigo', icon: 'Folder' }
              },
              {
                id: 'kpi_open_tasks',
                type: 'kpi_widget',
                props: { label: 'Offene Aufgaben', value: '38', unit: 'Tasks', accentColor: 'amber', icon: 'CheckSquare' }
              },
              {
                id: 'kpi_critical_milestones',
                type: 'kpi_widget',
                props: { label: 'Meilensteine fällig', value: '2', unit: 'in 7 Tagen', accentColor: 'rose', icon: 'Flag' }
              },
              {
                id: 'kpi_tracked_hours',
                type: 'kpi_widget',
                props: { label: 'Erfasste Stunden', value: '240', unit: 'Std.', accentColor: 'emerald', icon: 'Clock' }
              }
            ]
          },
          {
            id: 'card_tasks',
            type: 'card',
            props: { title: 'Aufgaben- & Projektportfolio', className: 'p-4 bg-white border border-slate-200 rounded-xl shadow-xs' },
            children: [
              {
                id: 'tbl_tasks_view',
                type: 'table_view',
                props: { tableId: 'tbl_tasks', limit: 8, showActions: true }
              }
            ]
          }
        ]
      }
    }
  ];
}

export function getIotTelemetryPages(t: any): CustomPage[] {
  return [
    {
      id: 'page_iot_dashboard',
      name: t.name ? `${t.name} - Telemetrie-Leitstand` : 'IoT Telemetrie & Sensor-Cockpit',
      description: 'Maschinenlaufzeiten, Sensor-Grenzwerte, Temperatur- und Schwingungstelemetrie',
      layout: {
        id: 'iot_root',
        type: 'container',
        props: { className: 'p-6 max-w-7xl mx-auto space-y-6' },
        children: [
          {
            id: 'iot_kpis',
            type: 'grid_layout',
            props: { columns: 4, gap: 4 },
            children: [
              {
                id: 'kpi_machines_live',
                type: 'kpi_widget',
                props: { label: 'Maschinen Online', value: '12 / 12', unit: 'Geräte', accentColor: 'emerald', icon: 'Cpu' }
              },
              {
                id: 'kpi_avg_temp',
                type: 'kpi_widget',
                props: { label: 'Durchschnittstemp.', value: '64.2', unit: '°C', accentColor: 'amber', icon: 'Thermometer' }
              },
              {
                id: 'kpi_vibration',
                type: 'kpi_widget',
                props: { label: 'Vibrationsindex', value: '0.82', unit: 'g-force', accentColor: 'cyan', icon: 'Activity' }
              },
              {
                id: 'kpi_active_alerts',
                type: 'kpi_widget',
                props: { label: 'Telemetrie-Warnungen', value: '0', unit: 'Alarme', accentColor: 'emerald', icon: 'ShieldCheck' }
              }
            ]
          },
          {
            id: 'card_telemetry',
            type: 'card',
            props: { title: 'Echtzeit-Telemetriewerte & Maschinenstatus', className: 'p-4 bg-white border border-slate-200 rounded-xl shadow-xs' },
            children: [
              {
                id: 'tbl_telemetry_view',
                type: 'table_view',
                props: { tableId: 'tbl_telemetry', limit: 8, showActions: true }
              }
            ]
          }
        ]
      }
    }
  ];
}
