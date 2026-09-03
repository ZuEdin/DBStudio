import { ProjectTemplate, DbType } from '../types';

// Fallback high-value schemas for community & enterprise presets when offline or in demo mode
export function getBuiltInFallbackTemplates(
  providerId: string, 
  providerName: string, 
  providerUrl: string
): ProjectTemplate[] {
  if (providerId.includes('enterprise')) {
    return [
      {
        id: 'ext_healthcare_iso27799',
        name: 'Praxis- & Patientensystem (ISO 27799)',
        description: 'Standardisiertes Datenschema für Kliniken, Arztpraxen, digitale Patientenakten und Rezeptierung.',
        icon: 'Activity',
        category: 'Enterprise / Health',
        isExternal: true,
        providerId,
        providerName,
        providerUrl,
        data: {
          tables: [
            {
              id: 'tbl_patient',
              name: 'Patienten',
              description: 'Stammdaten der Patienten & Versicherten',
              fields: [
                { id: 'pat_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'pat_versnr', name: 'Versicherungsnummer', type: 'VARCHAR', length: 30 },
                { id: 'pat_name', name: 'Nachname', type: 'VARCHAR', length: 100 },
                { id: 'pat_fname', name: 'Vorname', type: 'VARCHAR', length: 100 },
                { id: 'pat_dob', name: 'Geburtsdatum', type: 'DATE' },
                { id: 'pat_blood', name: 'Blutgruppe', type: 'VARCHAR', length: 10, enumValues: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'] },
                { id: 'pat_phone', name: 'Notfallkontakt', type: 'PHONE' },
                { id: 'pat_active', name: 'IstAktiv', type: 'BOOLEAN', defaultValue: 'true' }
              ],
              data: [
                { Id: 1, Versicherungsnummer: 'K-982144', Nachname: 'Weber', Vorname: 'Claudia', Geburtsdatum: '1984-05-12', Blutgruppe: 'A+', Notfallkontakt: '+49 171 992211', IstAktiv: true },
                { Id: 2, Versicherungsnummer: 'K-771203', Nachname: 'Lindner', Vorname: 'Maximilian', Geburtsdatum: '1991-11-23', Blutgruppe: '0+', Notfallkontakt: '+49 176 443322', IstAktiv: true }
              ]
            },
            {
              id: 'tbl_termin',
              name: 'Behandlungstermine',
              description: 'Terminplanung und Konsultationen',
              fields: [
                { id: 'term_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'term_pat_id', name: 'PatientId', type: 'INTEGER' },
                { id: 'term_doctor', name: 'BehandelnderArzt', type: 'VARCHAR', length: 100 },
                { id: 'term_date', name: 'Terminzeit', type: 'DATETIME' },
                { id: 'term_diag', name: 'DiagnoseKurz', type: 'VARCHAR', length: 255 },
                { id: 'term_status', name: 'Status', type: 'VARCHAR', length: 30, enumValues: ['Geplant', 'InBehandlung', 'Abgeschlossen', 'Abgesagt'], defaultValue: 'Geplant' }
              ],
              data: [
                { Id: 1, PatientId: 1, BehandelnderArzt: 'Dr. med. Vogel', Terminzeit: '2026-09-10 10:30:00', DiagnoseKurz: 'Vorsorgeuntersuchung Stufe II', Status: 'Geplant' }
              ]
            }
          ],
          relationships: [
            {
              id: 'rel_pat_term',
              sourceTableId: 'tbl_patient',
              sourceFieldId: 'pat_id',
              targetTableId: 'tbl_termin',
              targetFieldId: 'term_pat_id',
              type: '1:N'
            }
          ],
          forms: [],
          reports: [],
          pages: [],
          queries: [],
          layout: [
            { id: 'tbl_patient', tableId: 'tbl_patient', x: 40, y: 60 },
            { id: 'tbl_termin', tableId: 'tbl_termin', x: 440, y: 60 }
          ],
          tableGroups: [{ id: 'grp_health', name: 'Healthcare Core', color: 'teal' }],
          backendConfig: {
            dbType: DbType.SQL,
            language: 'dotnet',
            projectName: 'Healthcare Patient Management (ISO 27799)',
            port: 5000,
            dbConnection: '',
            useSwagger: true,
            frontendFramework: 'react'
          }
        }
      }
    ];
  }

  return [
    {
      id: 'ext_fleet_logistics',
      name: 'Fuhrpark & Logistik Disposition (VDA)',
      description: 'Telematik-fähige Flotten- und Tourenplanung mit Fahrzeugstatus, Frachten und Fahrerkontingenten.',
      icon: 'Truck',
      category: 'Community / Logistik',
      isExternal: true,
      providerId,
      providerName,
      providerUrl,
      data: {
        tables: [
          {
            id: 'tbl_vehicle',
            name: 'Fahrzeuge',
            description: 'Flottenbestand und Servicezyklen',
            fields: [
              { id: 'veh_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
              { id: 'veh_plate', name: 'Kennzeichen', type: 'VARCHAR', length: 20 },
              { id: 'veh_model', name: 'Fahrzeugtyp', type: 'VARCHAR', length: 100 },
              { id: 'veh_capacity', name: 'NutzlastKg', type: 'INTEGER', defaultValue: '3500' },
              { id: 'veh_odometer', name: 'Kilometerstand', type: 'INTEGER', defaultValue: '125000' },
              { id: 'veh_status', name: 'Status', type: 'VARCHAR', length: 30, enumValues: ['Einsatzbereit', 'AufTour', 'Werkstatt', 'Stillgelegt'], defaultValue: 'Einsatzbereit' }
            ],
            data: [
              { Id: 1, Kennzeichen: 'B-FL 2040', Fahrzeugtyp: 'Mercedes Sprinter Maxi 316', NutzlastKg: 3500, Kilometerstand: 142000, Status: 'Einsatzbereit' },
              { Id: 2, Kennzeichen: 'M-LG 7701', Fahrzeugtyp: 'MAN TGM 18t Koffer', NutzlastKg: 18000, Kilometerstand: 310500, Status: 'AufTour' }
            ]
          },
          {
            id: 'tbl_tour',
            name: 'Tourenliste',
            description: 'Liefertouren und Routenverfolgung',
            fields: [
              { id: 'tour_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
              { id: 'tour_veh_id', name: 'FahrzeugId', type: 'INTEGER' },
              { id: 'tour_driver', name: 'FahrerName', type: 'VARCHAR', length: 100 },
              { id: 'tour_dest', name: 'Zielort', type: 'VARCHAR', length: 150 },
              { id: 'tour_eta', name: 'GeplanteAnkunft', type: 'DATETIME' },
              { id: 'tour_state', name: 'TourStatus', type: 'VARCHAR', length: 30, enumValues: ['Disponiert', 'Unterwegs', 'Geliefert', 'Reklamiert'], defaultValue: 'Disponiert' }
            ],
            data: [
              { Id: 1, FahrzeugId: 2, FahrerName: 'Stefan Krause', Zielort: 'Frankfurt Logistik Hub', GeplanteAnkunft: '2026-09-08 16:00:00', TourStatus: 'Unterwegs' }
            ]
          }
        ],
        relationships: [
          {
            id: 'rel_veh_tour',
            sourceTableId: 'tbl_vehicle',
            sourceFieldId: 'veh_id',
            targetTableId: 'tbl_tour',
            targetFieldId: 'tour_veh_id',
            type: '1:N'
          }
        ],
        forms: [],
        reports: [],
        pages: [],
        queries: [],
        layout: [
          { id: 'tbl_vehicle', tableId: 'tbl_vehicle', x: 50, y: 60 },
          { id: 'tbl_tour', tableId: 'tbl_tour', x: 450, y: 60 }
        ],
        tableGroups: [{ id: 'grp_fleet', name: 'Fleet & Logistics', color: 'blue' }],
        backendConfig: {
          dbType: DbType.SQL,
          language: 'dotnet',
          projectName: 'Fuhrpark & Logistik Disposition (VDA)',
          port: 5000,
          dbConnection: '',
          useSwagger: true,
          frontendFramework: 'react'
        }
      }
    }
  ];
}
