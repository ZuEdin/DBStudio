import { ProjectTemplate, DbType } from '../../../types/index';
import { getIotTelemetryPages } from '../pages/index';

const dict: Record<string, any> = {
  de: {
    name: 'IoT & Maschinen-Telemetrie (Time-Series)',
    desc: 'Zeitreihen-Vorlage für Sensordaten, Schwellenwert-Alarme (AlertThreshold), Maschinenzustände und KPI-Analytics.',
    badge: 'TIME-SERIES & IOT',
    dev_crane: 'Turmdrehkran Liebherr 280 EC-H',
    dev_excavator: 'Kettenbagger CAT 336',
    dev_generator: 'Notstromaggregat Pramac 60kVA'
  },
  en: {
    name: 'IoT & Machine Telemetry (Time-Series)',
    desc: 'Time-series template for sensor logs, threshold alerts (AlertThreshold), equipment health, and KPI analytics.',
    badge: 'TIME-SERIES & IOT',
    dev_crane: 'Tower Crane Liebherr 280 EC-H',
    dev_excavator: 'Crawler Excavator CAT 336',
    dev_generator: 'Diesel Generator Pramac 60kVA'
  }
};

export const getIotMachineTelemetry = (lang: string): ProjectTemplate => {
  const t = dict[lang] || dict['de'];

  return {
    id: 'iot_telemetry',
    name: t.name,
    description: t.desc,
    icon: 'Activity',
    category: 'IT & Software',
    data: {
      backendConfig: {
        language: 'dotnet',
        dbType: DbType.SQL,
        projectName: 'EnterpriseTelemetry',
        port: 5004,
        frontendPort: 3004,
        dbConnection: 'Server=localhost;Database=EnterpriseTelemetry;Trusted_Connection=True;',
        useSwagger: true,
        frontendFramework: 'react',
        authConfig: { useUserLogin: true, useWindowsAuth: false, useAdGroups: false, devBypass: true, isMobileReady: true }
      },
      tables: [
        {
          id: 'tbl_device_type',
          name: 'DeviceType',
          fields: [
            { id: 'dt_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'dt_model', name: 'ModelName', type: 'VARCHAR', length: 100 },
            { id: 'dt_mfr', name: 'Manufacturer', type: 'VARCHAR', length: 80 },
            { id: 'dt_proto', name: 'Protocol', type: 'VARCHAR', length: 30, enumValues: ['MQTT', 'OPC-UA', 'Modbus', 'HTTP'] },
            { id: 'dt_firmware', name: 'FirmwareVersion', type: 'VARCHAR', length: 30 }
          ],
          data: [
            { Id: 1, ModelName: 'Liebherr 280 EC-H 12', Manufacturer: 'Liebherr Werk Biberach', Protocol: 'OPC-UA', FirmwareVersion: 'v4.2.8' },
            { Id: 2, ModelName: 'CAT 336 Next Gen', Manufacturer: 'Caterpillar Inc.', Protocol: 'MQTT', FirmwareVersion: 'v2.1.0' },
            { Id: 3, ModelName: 'Pramac GSW65P', Manufacturer: 'Pramac Power Systems', Protocol: 'Modbus', FirmwareVersion: 'v1.0.4' }
          ]
        },
        {
          id: 'tbl_device',
          name: 'Device',
          fields: [
            { id: 'd_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'd_type_id', name: 'DeviceTypeId', type: 'INTEGER' },
            { id: 'd_serial', name: 'SerialNumber', type: 'VARCHAR', length: 60 },
            { id: 'd_name', name: 'Name', type: 'VARCHAR', length: 100 },
            { id: 'd_install_date', name: 'InstallationDate', type: 'DATE' },
            { id: 'd_location', name: 'Location', type: 'VARCHAR', length: 120 },
            { id: 'd_ip', name: 'IpAddress', type: 'VARCHAR', length: 45 },
            { id: 'd_status', name: 'Status', type: 'VARCHAR', length: 30, defaultValue: 'Online', enumValues: ['Online', 'Warning', 'Critical', 'Offline'] },
            { id: 'd_last_ping', name: 'LastPingAt', type: 'DATETIME' }
          ],
          data: [
            { Id: 1, DeviceTypeId: 1, SerialNumber: 'LH-CRANE-98124', Name: t.dev_crane, InstallationDate: '2025-06-10', Location: 'Baustelle A8 Albaufstieg', IpAddress: '10.240.12.5', Status: 'Online', LastPingAt: '2026-03-03 10:14:22' },
            { Id: 2, DeviceTypeId: 2, SerialNumber: 'CAT-EXC-44219', Name: t.dev_excavator, InstallationDate: '2025-08-01', Location: 'Baustelle Flughafen MUC T3', IpAddress: '10.240.14.8', Status: 'Warning', LastPingAt: '2026-03-03 10:13:50' },
            { Id: 3, DeviceTypeId: 3, SerialNumber: 'PRM-GEN-10492', Name: t.dev_generator, InstallationDate: '2026-01-15', Location: 'Baustelle Hafencity Hamburg', IpAddress: '10.240.20.19', Status: 'Online', LastPingAt: '2026-03-03 10:15:01' }
          ]
        },
        {
          id: 'tbl_alert_threshold',
          name: 'AlertThreshold',
          fields: [
            { id: 'at_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'at_type_id', name: 'DeviceTypeId', type: 'INTEGER' },
            { id: 'at_metric', name: 'MetricKey', type: 'VARCHAR', length: 50, enumValues: ['temperature_celsius', 'vibration_hz', 'hydraulic_pressure_bar', 'motor_rpm', 'battery_pct'] },
            { id: 'at_warn_min', name: 'WarningMin', type: 'DECIMAL', precision: 8, scale: 2 },
            { id: 'at_warn_max', name: 'WarningMax', type: 'DECIMAL', precision: 8, scale: 2 },
            { id: 'at_crit_min', name: 'CriticalMin', type: 'DECIMAL', precision: 8, scale: 2 },
            { id: 'at_crit_max', name: 'CriticalMax', type: 'DECIMAL', precision: 8, scale: 2 },
            { id: 'at_window', name: 'EvaluationWindowSec', type: 'INTEGER', defaultValue: '60' }
          ],
          data: [
            { Id: 1, DeviceTypeId: 1, MetricKey: 'vibration_hz', WarningMin: 0.0, WarningMax: 45.0, CriticalMin: 0.0, CriticalMax: 70.0, EvaluationWindowSec: 30 },
            { Id: 2, DeviceTypeId: 2, MetricKey: 'hydraulic_pressure_bar', WarningMin: 80.0, WarningMax: 320.0, CriticalMin: 50.0, CriticalMax: 360.0, EvaluationWindowSec: 15 },
            { Id: 3, DeviceTypeId: 3, MetricKey: 'temperature_celsius', WarningMin: 20.0, WarningMax: 92.0, CriticalMin: 10.0, CriticalMax: 105.0, EvaluationWindowSec: 60 }
          ]
        },
        {
          id: 'tbl_telemetry_log',
          name: 'TelemetryLog',
          fields: [
            { id: 'tl_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'tl_dev_id', name: 'DeviceId', type: 'INTEGER' },
            { id: 'tl_timestamp', name: 'Timestamp', type: 'DATETIME' },
            { id: 'tl_metric', name: 'MetricKey', type: 'VARCHAR', length: 50 },
            { id: 'tl_value', name: 'MetricValue', type: 'DECIMAL', precision: 10, scale: 3 },
            { id: 'tl_unit', name: 'Unit', type: 'VARCHAR', length: 20 },
            { id: 'tl_quality', name: 'QualityCode', type: 'VARCHAR', length: 20, defaultValue: 'GOOD' }
          ],
          data: [
            { Id: 1, DeviceId: 1, Timestamp: '2026-03-03 10:00:00', MetricKey: 'vibration_hz', MetricValue: 18.420, Unit: 'Hz', QualityCode: 'GOOD' },
            { Id: 2, DeviceId: 1, Timestamp: '2026-03-03 10:05:00', MetricKey: 'vibration_hz', MetricValue: 22.150, Unit: 'Hz', QualityCode: 'GOOD' },
            { Id: 3, DeviceId: 2, Timestamp: '2026-03-03 10:00:00', MetricKey: 'hydraulic_pressure_bar', MetricValue: 334.800, Unit: 'bar', QualityCode: 'WARN' },
            { Id: 4, DeviceId: 2, Timestamp: '2026-03-03 10:05:00', MetricKey: 'hydraulic_pressure_bar', MetricValue: 341.200, Unit: 'bar', QualityCode: 'WARN' },
            { Id: 5, DeviceId: 3, Timestamp: '2026-03-03 10:00:00', MetricKey: 'temperature_celsius', MetricValue: 84.500, Unit: '°C', QualityCode: 'GOOD' }
          ]
        },
        {
          id: 'tbl_incident',
          name: 'Incident',
          fields: [
            { id: 'inc_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'inc_dev_id', name: 'DeviceId', type: 'INTEGER' },
            { id: 'inc_thresh_id', name: 'ThresholdId', type: 'INTEGER' },
            { id: 'inc_sev', name: 'Severity', type: 'VARCHAR', length: 30, defaultValue: 'Warning', enumValues: ['Info', 'Warning', 'Critical', 'Fatal'] },
            { id: 'inc_title', name: 'Title', type: 'VARCHAR', length: 150 },
            { id: 'inc_desc', name: 'Description', type: 'TEXT' },
            { id: 'inc_trigger_val', name: 'TriggerValue', type: 'DECIMAL', precision: 10, scale: 3 },
            { id: 'inc_status', name: 'Status', type: 'VARCHAR', length: 30, defaultValue: 'Open', enumValues: ['Open', 'Acknowledged', 'Resolved', 'FalseAlarm'] },
            { id: 'inc_rep_at', name: 'ReportedAt', type: 'DATETIME' },
            { id: 'inc_res_at', name: 'ResolvedAt', type: 'DATETIME' }
          ],
          data: [
            { Id: 1, DeviceId: 2, ThresholdId: 2, Severity: 'Warning', Title: 'Hydraulikdruck überschreitet Warnschwelle 320 bar', Description: 'Hydraulikpumpe 2 meldete 341.2 bar bei Grabvorgang im Erdreich.', TriggerValue: 341.200, Status: 'Open', ReportedAt: '2026-03-03 10:05:12', ResolvedAt: null }
          ]
        }
      ],
      relationships: [
        { id: 'rel_dt_dev', fromTableId: 'tbl_device_type', fromFieldId: 'dt_id', toTableId: 'tbl_device', toFieldId: 'd_type_id', type: '1:n', referentialIntegrity: true },
        { id: 'rel_dt_thresh', fromTableId: 'tbl_device_type', fromFieldId: 'dt_id', toTableId: 'tbl_alert_threshold', toFieldId: 'at_type_id', type: '1:n', referentialIntegrity: true, onDelete: 'CASCADE' },
        { id: 'rel_dev_log', fromTableId: 'tbl_device', fromFieldId: 'd_id', toTableId: 'tbl_telemetry_log', toFieldId: 'tl_dev_id', type: '1:n', referentialIntegrity: true, onDelete: 'CASCADE' },
        { id: 'rel_dev_inc', fromTableId: 'tbl_device', fromFieldId: 'd_id', toTableId: 'tbl_incident', toFieldId: 'inc_dev_id', type: '1:n', referentialIntegrity: true },
        { id: 'rel_thresh_inc', fromTableId: 'tbl_alert_threshold', fromFieldId: 'at_id', toTableId: 'tbl_incident', toFieldId: 'inc_thresh_id', type: '1:n', referentialIntegrity: false }
      ],
      queries: [
        {
          id: 'q_telemetry_aggregates',
          type: 'SELECT',
          name: 'Sensor-Durchschnitte & Spitzenwerte je Maschine',
          nodes: [
            { id: 'qn_dev', tableId: 'tbl_device', x: 50, y: 50 },
            { id: 'qn_log', tableId: 'tbl_telemetry_log', x: 300, y: 50 }
          ],
          columns: [
            { id: 'qc_dname', tableId: 'tbl_device', fieldId: 'd_name', tableName: 'Device', fieldName: 'Name', sort: 'ASC', show: true, criteria: [''], aggregate: 'GROUP_BY' },
            { id: 'qc_metric', tableId: 'tbl_telemetry_log', fieldId: 'tl_metric', tableName: 'TelemetryLog', fieldName: 'MetricKey', sort: 'ASC', show: true, criteria: [''], aggregate: 'GROUP_BY' },
            { id: 'qc_avg', tableId: 'tbl_telemetry_log', fieldId: 'tl_value', tableName: 'TelemetryLog', fieldName: 'MetricValue', sort: '', show: true, criteria: [''], aggregate: 'AVG', alias: 'Durchschnitt' },
            { id: 'qc_max', tableId: 'tbl_telemetry_log', fieldId: 'tl_value', tableName: 'TelemetryLog', fieldName: 'MetricValue', sort: 'DESC', show: true, criteria: [''], aggregate: 'MAX', alias: 'Spitze' }
          ]
        },
        {
          id: 'q_open_incidents',
          type: 'SELECT',
          name: 'Offene Maschinen-Störungen & Alarme',
          nodes: [
            { id: 'qn_inc', tableId: 'tbl_incident', x: 50, y: 50 },
            { id: 'qn_d2', tableId: 'tbl_device', x: 280, y: 50 }
          ],
          columns: [
            { id: 'qc_sev', tableId: 'tbl_incident', fieldId: 'inc_sev', tableName: 'Incident', fieldName: 'Severity', sort: 'DESC', show: true, criteria: [''] },
            { id: 'qc_tit', tableId: 'tbl_incident', fieldId: 'inc_title', tableName: 'Incident', fieldName: 'Title', sort: '', show: true, criteria: [''] },
            { id: 'qc_dloc', tableId: 'tbl_device', fieldId: 'd_location', tableName: 'Device', fieldName: 'Location', sort: '', show: true, criteria: [''] },
            { id: 'qc_repat', tableId: 'tbl_incident', fieldId: 'inc_rep_at', tableName: 'Incident', fieldName: 'ReportedAt', sort: 'DESC', show: true, criteria: [''] }
          ]
        }
      ],
      forms: [
        {
          id: 'form_device_cockpit',
          name: 'Maschinen-Cockpit & Sensor-Details',
          sourceType: 'table',
          sourceId: 'tbl_device',
          fields: [],
          layout: {
            id: 'root_dev',
            type: 'container',
            className: 'p-4 space-y-4 bg-slate-900/60 rounded-xl border border-slate-700',
            children: [
              { id: 'lbl_dev_h', type: 'label', label: 'Maschinen-Status & Telemetrie-Stream', className: 'text-base font-bold text-cyan-400' },
              {
                id: 'cnt_dev_row1',
                type: 'container',
                className: 'grid grid-cols-3 gap-3',
                children: [
                  { id: 'f_dev_name', type: 'field', fieldId: 'd_name', label: 'Gerätename', widgetType: 'text' },
                  { id: 'f_dev_ser', type: 'field', fieldId: 'd_serial', label: 'Seriennummer', widgetType: 'text' },
                  { id: 'f_dev_stat', type: 'field', fieldId: 'd_status', label: 'Online-Zustand', widgetType: 'select' }
                ]
              },
              {
                id: 'subform_inc',
                type: 'subform',
                label: 'Aktive Alarme & Störungsmeldungen (Incidents)',
                subform: {
                  formId: 'form_incident_sub',
                  masterLinkFieldId: 'd_id',
                  childLinkFieldId: 'inc_dev_id',
                  canAdd: true,
                  canEdit: true,
                  canDelete: false
                }
              }
            ]
          }
        },
        {
          id: 'form_incident_sub',
          name: 'Incident Subform',
          sourceType: 'table',
          sourceId: 'tbl_incident',
          fields: [],
          layout: {
            id: 'sub_inc_root',
            type: 'container',
            className: 'grid grid-cols-3 gap-2 p-2 bg-slate-800/80 rounded-lg',
            children: [
              { id: 'f_inc_sev', type: 'field', fieldId: 'inc_sev', label: 'Schweregrad', widgetType: 'select' },
              { id: 'f_inc_tit', type: 'field', fieldId: 'inc_title', label: 'Fehlertext', widgetType: 'text' },
              { id: 'f_inc_stat', type: 'field', fieldId: 'inc_status', label: 'Status', widgetType: 'select' }
            ]
          }
        }
      ],
      reports: [
        {
          id: 'rep_fleet_status',
          name: 'Flottenstatus & Maschinen-Health Report',
          sourceType: 'table',
          sourceId: 'tbl_device',
          groupingFieldId: 'd_status',
          summaries: [{ fieldId: 'd_id', fieldName: 'Id', calculation: 'COUNT' }],
          columns: [
            { fieldId: 'd_name', label: 'Maschine', visible: true, order: 0 },
            { fieldId: 'd_serial', label: 'Seriennummer', visible: true, order: 1 },
            { fieldId: 'd_location', label: 'Einsatzort', visible: true, order: 2 },
            { fieldId: 'd_status', label: 'Zustand', visible: true, order: 3 },
            { fieldId: 'd_last_ping', label: 'Letzter Ping', visible: true, order: 4 }
          ]
        }
      ],
      pages: getIotTelemetryPages(t),
      layout: [
        { id: 'tbl_device_type', tableId: 'tbl_device_type', x: 40, y: 60 },
        { id: 'tbl_device', tableId: 'tbl_device', x: 380, y: 60 },
        { id: 'tbl_alert_threshold', tableId: 'tbl_alert_threshold', x: 40, y: 380 },
        { id: 'tbl_telemetry_log', tableId: 'tbl_telemetry_log', x: 740, y: 60 },
        { id: 'tbl_incident', tableId: 'tbl_incident', x: 740, y: 380 }
      ],
      tableGroups: [
        { id: 'grp_iot', name: 'IoT Telemetry & Edge Analytics Domain', color: 'cyan' }
      ]
    }
  };
};
