
import { ProjectTemplate, DbType } from '../../../types/index';

const dict: Record<string, any> = {
    de: { name: 'Geräte-Verleih', desc: 'Verleihsystem für IT-Geräte inkl. Status-Tracking.', t_pers: 'Personen', t_dev: 'Geraete', t_rent: 'Verleih', f_first: 'Vorname', f_last: 'Nachname', f_model: 'Modell', f_rent_form: 'Verleihvorgang', f_dev_form: 'Gerät', f_pers_form: 'Person', r_active: 'Aktive Ausleihen' },
    en: { name: 'Device Rental', desc: 'Rental system for IT devices incl. status tracking.', t_pers: 'Persons', t_dev: 'Devices', t_rent: 'Rentals', f_first: 'FirstName', f_last: 'LastName', f_model: 'Model', f_rent_form: 'Rental Process', f_dev_form: 'Device', f_pers_form: 'Person', r_active: 'Active Rentals' },
    fr: { name: 'Location Matériel', desc: 'Système de location pour équipement IT.', t_pers: 'Personnes', t_dev: 'Appareils', t_rent: 'Locations', f_first: 'Prénom', f_last: 'Nom', f_model: 'Modèle', f_rent_form: 'Processus Location', f_dev_form: 'Appareil', f_pers_form: 'Personne', r_active: 'Locations Actives' },
    it: { name: 'Noleggio Attrezzature', desc: 'Sistema di noleggio per apparecchiature IT.', t_pers: 'Persone', t_dev: 'Dispositivi', t_rent: 'Noleggi', f_first: 'Nome', f_last: 'Cognome', f_model: 'Modello', f_rent_form: 'Processo Noleggio', f_dev_form: 'Dispositivo', f_pers_form: 'Persona', r_active: 'Noleggi Attivi' },
    no: { name: 'Utlånssystem', desc: 'System for utlån av IT-utstyr.', t_pers: 'Personer', t_dev: 'Utstyr', t_rent: 'Utlån', f_first: 'Fornavn', f_last: 'Etternavn', f_model: 'Modell', f_rent_form: 'Utlånsprosess', f_dev_form: 'Utstyr', f_pers_form: 'Person', r_active: 'Aktive Utlån' },
    bs: { name: 'Iznajmljivanje Opreme', desc: 'Sistem za iznajmljivanje IT opreme.', t_pers: 'Osobe', t_dev: 'Uredjaji', t_rent: 'Iznajmljivanje', f_first: 'Ime', f_last: 'Prezime', f_model: 'Model', f_rent_form: 'Proces Iznajmljivanja', f_dev_form: 'Uredjaj', f_pers_form: 'Osoba', r_active: 'Aktivna Iznajmljivanja' }
};

export const getDeviceRental = (lang: string): ProjectTemplate => {
    const t = dict[lang] || dict['en'];
    return {
        id: 'device_rental',
        name: t.name,
        description: t.desc,
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
            authConfig: { useUserLogin: true, useWindowsAuth: false, useAdGroups: false, devBypass: true, isMobileReady: false }
          },
          tables: [
            {
              id: 't_person', name: t.t_pers,
              fields: [
                { id: 'p1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'p2', name: t.f_first, type: 'VARCHAR', length: 50 },
                { id: 'p3', name: t.f_last, type: 'VARCHAR', length: 50 },
                { id: 'p4', name: 'Email', type: 'VARCHAR', length: 100 }
              ],
              data: [
                { Id: 1, [t.f_first]: 'Max', [t.f_last]: 'Mustermann', Email: 'max@firma.de' },
                { Id: 2, [t.f_first]: 'Erika', [t.f_last]: 'Musterfrau', Email: 'erika@firma.de' }
              ]
            },
            {
              id: 't_devices', name: t.t_dev,
              fields: [
                { id: 'd1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'd3', name: t.f_model, type: 'VARCHAR', length: 100 },
                { id: 'd8', name: 'Status', type: 'VARCHAR', length: 20, defaultValue: 'Available' }
              ],
              data: [
                { Id: 1, [t.f_model]: 'NB-001', Status: 'Rented' },
                { Id: 2, [t.f_model]: 'NB-002', Status: 'Available' }
              ]
            },
            {
              id: 't_rentals', name: t.t_rent,
              fields: [
                { id: 'r1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'r2', name: 'DeviceId', type: 'INTEGER' },
                { id: 'r3', name: 'PersonId', type: 'INTEGER' },
                { id: 'r4', name: 'DateFrom', type: 'DATETIME' },
                { id: 'r5', name: 'DateTo', type: 'DATETIME' }
              ],
              data: [
                { Id: 1, DeviceId: 1, PersonId: 1, DateFrom: '2023-10-01 09:00:00', DateTo: '2023-10-05 17:00:00' }
              ]
            }
          ],
          relationships: [
            { id: 'rel_dev_rent', fromTableId: 't_devices', fromFieldId: 'd1', toTableId: 't_rentals', toFieldId: 'r2', type: '1:n', referentialIntegrity: true },
            { id: 'rel_pers_rent', fromTableId: 't_person', fromFieldId: 'p1', toTableId: 't_rentals', toFieldId: 'r3', type: '1:n', referentialIntegrity: true }
          ],
          queries: [],
          forms: [
              {
                  id: 'f_rent', name: t.f_rent_form, sourceType: 'table', sourceId: 't_rentals',
                  fields: [],
                  layout: {
                      id: 'root', type: 'container', className: 'p-4 space-y-4 bg-white',
                      children: [
                          { id: 'l1', type: 'label', label: t.f_rent_form, className: 'text-xl font-bold border-b pb-2' },
                          { 
                              id: 'c1', type: 'container', className: 'grid grid-cols-2 gap-4',
                              children: [
                                  { id: 'f1', type: 'field', fieldId: 'r3', label: t.t_pers, widgetType: 'select', lookup: { tableId: 't_person', valueFieldId: 'p1', labelFields: ['p2', 'p3'], displayFormat: [{fieldId:'p3', suffix: ', '}, {fieldId:'p2'}] } },
                                  { id: 'f2', type: 'field', fieldId: 'r2', label: t.t_dev, widgetType: 'select', lookup: { tableId: 't_devices', valueFieldId: 'd1', labelFields: ['d3'] } }
                              ]
                          },
                          { 
                              id: 'c2', type: 'container', className: 'grid grid-cols-2 gap-4',
                              children: [
                                  { id: 'f3', type: 'field', fieldId: 'r4', label: 'Von', widgetType: 'date' },
                                  { id: 'f4', type: 'field', fieldId: 'r5', label: 'Bis', widgetType: 'date' }
                              ]
                          }
                      ]
                  }
              }
          ],
          reports: [
              {
                  id: 'r_active', name: t.r_active, sourceType: 'table', sourceId: 't_rentals',
                  summaries: [],
                  columns: [
                      { fieldId: 'r3', label: t.t_pers, visible: true, order: 0 },
                      { fieldId: 'r2', label: t.t_dev, visible: true, order: 1 },
                      { fieldId: 'r4', label: 'Datum', visible: true, order: 2 }
                  ]
              }
          ]
        }
    };
};
